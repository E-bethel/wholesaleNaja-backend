const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
// Removed firebaseOtpService, using Twilio for SMS OTP
const { sendEmailOtp, sendWelcomeEmail } = require("../services/mailerService");

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
  return token;
};

exports.login = async (req, res) => {
  const { email, phone, password } = req.body;
  let user;
  if (email) {
    user = await User.findOne({ email }).select("+password");
  } else if (phone) {
    user = await User.findOne({ phone }).select("+password");
  } else {
    return res.status(400).json({ message: "Email or phone is required" });
  }
  if (!user || !(await user.correctPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = sendTokenWithCookie(res, user);
  res.status(200).json({ message: "Login successful", token });
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
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
      return res.status(400).json({ message: "Provide either email or phoneNumber" });
    }
    let key, sessionInfo, otp, otpHash, expires;
    if (email) {
      key = email;
      // Rate limit: max 3 OTPs per hour per email
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOtps = await Otp.countDocuments({ key, createdAt: { $gte: oneHourAgo } });
      if (recentOtps >= 3) {
        return res.status(429).json({ message: "Too many OTP requests for this email. Try again later." });
      }
      // Generate OTP and hash
      const otpObj = generateOtp();
      otp = otpObj.otp;
      otpHash = otpObj.otpHash;
      expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
      sessionInfo = await sendEmailOtp(email, otp); // Pass OTP to email sender
      await Otp.create({ key, otpHash, expires, sessionInfo, createdAt: new Date() });
      return res.status(200).json({ message: "OTP sent via email", sessionInfo });
    } else {
      key = phoneNumber;
      // Rate limit: max 3 OTPs per hour per phoneNumber
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOtps = await Otp.countDocuments({ key, createdAt: { $gte: oneHourAgo } });
      if (recentOtps >= 3) {
        return res.status(429).json({ message: "Too many OTP requests for this phone number. Try again later." });
      }
      // Generate OTP and hash
      const otpObj = generateOtp();
      otp = otpObj.otp;
      otpHash = otpObj.otpHash;
      expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
      const { sendSmsOtp } = require('../services/twilioService');
      const smsResult = await sendSmsOtp(phoneNumber, otp);
      if (!smsResult.success) {
        return res.status(500).json({ message: `Failed to send SMS OTP: ${smsResult.error}` });
      }
      sessionInfo = smsResult.sid;
      await Otp.create({ key, otpHash, expires, sessionInfo, createdAt: new Date() });
      return res.status(200).json({ message: "OTP sent via SMS", sessionInfo });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

// ✅ Verify OTP using hash comparison (Twilio for SMS, mailer for email)
exports.verifyOtp = async (req, res) => {
  try {
    const { key, code } = req.body;
    if (email) {
      key = email;
      // Rate limit: max 3 OTPs per hour per email
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOtps = await Otp.countDocuments({ key, createdAt: { $gte: oneHourAgo } });
      if (recentOtps >= 3) {
        return res.status(429).json({ message: "Too many OTP requests for this email. Try again later." });
      }
      // Generate OTP and hash
      const otpObj = generateOtp();
      otp = otpObj.otp;
      otpHash = otpObj.otpHash;
      expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
      sessionInfo = null; // No messageId returned, set to null
      await Otp.create({ key, otpHash, expires, sessionInfo, createdAt: new Date() });
      // Send email in background
      setImmediate(() => {
        sendEmailOtp(email, otp).then(emailSent => {
          if (!emailSent) {
            console.error(`Failed to send OTP email to ${email}`);
          }
        }).catch(err => {
          console.error(`Error sending OTP email to ${email}:`, err);
        });
      });
      return res.status(200).json({ message: "OTP is being sent via email" });
    } else {
      key = phoneNumber;
      // Rate limit: max 3 OTPs per hour per phoneNumber
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOtps = await Otp.countDocuments({ key, createdAt: { $gte: oneHourAgo } });
      if (recentOtps >= 3) {
        return res.status(429).json({ message: "Too many OTP requests for this phone number. Try again later." });
      }
      // Generate OTP and hash
      const otpObj = generateOtp();
      otp = otpObj.otp;
      otpHash = otpObj.otpHash;
      expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
      const { sendSmsOtp } = require('../services/twilioService');
      const smsResult = await sendSmsOtp(phoneNumber, otp);
      if (!smsResult.success) {
        return res.status(500).json({ message: `Failed to send SMS OTP: ${smsResult.error}` });
      }
      sessionInfo = smsResult.sid;
      await Otp.create({ key, otpHash, expires, sessionInfo, createdAt: new Date() });
      return res.status(200).json({ message: "OTP sent via SMS", sessionInfo });
    }
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

// ✅ Complete profile after OTP verified
exports.completeProfile = async (req, res) => {
  try {
  const { key, fullName, password, role, address } = req.body;
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
      address
    });
    // Optionally delete OTP record
    await Otp.deleteMany({ key });
    // Send welcome email if email exists
    if (user.email) {
      await sendWelcomeEmail(user.email, user.fullName);
    }
    const token = sendTokenWithCookie(res, user);
    res.status(201).json({
      message: "Profile created successfully",
      user: { id: user._id, email: user.email, phone: user.phone, role: user.role },
      token
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
