const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendSmsOtp } = require("../services/termiiService");
const { sendEmailOtp } = require("../services/mailerService");

const sendTokenWithCookie = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  sendTokenWithCookie(res, user);
  res.status(200).json({ message: "Login successful" });
};

exports.logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out" });
};

// ✅ Utility: generate and hash OTP
function generateOtp() {
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  return { otp, otpHash };
}

// ✅ Send OTP (email or SMS)
exports.sendOtp = async (req, res) => {
  try {
    const { phone, email } = req.body;
    const key = phone || email;
    if (!key) {
      return res.status(400).json({ message: "Phone or email required" });
    }
    // Rate limit: max 3 OTPs per hour per key
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await Otp.countDocuments({ key, createdAt: { $gte: oneHourAgo } });
    if (recentOtps >= 3) {
      return res.status(429).json({ message: "Too many OTP requests. Try again later." });
    }
    // generate OTP
    const { otp, otpHash } = generateOtp();
    // store in MongoDB
    await Otp.create({ key, otpHash, expires: new Date(Date.now() + 5 * 60 * 1000) });
    // send via SMS if phone given, else email
    let sent = false;
    if (phone) {
      sent = await sendSmsOtp(phone, otp);
      if (!sent && email) {
        sent = await sendEmailOtp(email, otp);
      }
    } else {
      sent = await sendEmailOtp(email, otp);
    }
    if (!sent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }
    return res.status(200).json({ message: "OTP sent", key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

// ✅ Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { key, otp } = req.body;
    // Find latest unexpired OTP for key
    const record = await Otp.findOne({ key, expires: { $gte: new Date() }, verified: false }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ message: "No valid OTP found" });
    // Check attempts
    if (record.attempts >= 5) {
      return res.status(429).json({ message: "Too many invalid attempts. Request a new OTP." });
    }
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }
    // Mark as verified
    record.verified = true;
    await record.save();
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

// ✅ Complete profile after OTP verified
exports.completeProfile = async (req, res) => {
  try {
    const { key, fullName, password, role } = req.body;
    // Find verified OTP
    const record = await Otp.findOne({ key, verified: true }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ message: "OTP not verified" });
    }
    const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined;
    const user = await User.create({
      fullName,
      password: hashedPassword,
      email: key.includes("@") ? key : undefined,
      phone: !key.includes("@") ? key : undefined,
      role,
    });
    // Optionally delete OTP record
    await Otp.deleteMany({ key });
    res.status(201).json({
      message: "Profile created successfully",
      user: { id: user._id, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error completing profile" });
  }
};

// ✅ Get user profile
exports.getProfile = async (req, res) => {
  try {
    // Assumes req.user is set by auth middleware
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};
