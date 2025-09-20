const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmailOtp(email, otp) {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "MyApp"}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your verification code is ${otp}. It expires in 5 minutes.`,
      html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
}

module.exports = { sendEmailOtp };
