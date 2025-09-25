// Debug log to confirm env variables
console.log('[MailerService] EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('[MailerService] EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('[MailerService] EMAIL_USER:', process.env.EMAIL_USER);
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT),
  secure: true, // Always true for port 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed or Gmail certs
  }
});

async function sendEmailOtp(email, otp) {
  try {
    const logoPath = process.env.APP_LOGO_PATH || __dirname + '/../../public/logo.png';
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "MyApp"}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your verification code is ${otp}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #eee; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="cid:logo" alt="WholeSaleNaija Logo" style="height: 240px; margin-bottom: 16px;" />
              <h2 style="color: #1a202c; margin: 0;">Your OTP Code</h2>
            </div>
            <p style="font-size: 16px; color: #333;">Your verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 14px; color: #888; text-align: center;">WholeSaleNaija Team</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo'
      }]
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email OTP sent:", info.messageId);
    return true;
  } catch (err) {
    if (err && err.response) {
      console.error("Error sending email OTP:", err.response);
    } else {
      console.error("Error sending email OTP:", err);
    }
    return false;
  }
}

async function sendWelcomeEmail(email, fullName) {
  try {
    const logoPath = process.env.APP_LOGO_PATH || __dirname + '/../../public/logo.png';
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "WholeSaleNaija"}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to WholeSaleNaija!",
      text: `Hi ${fullName},\n\nWelcome to WholeSaleNaija! Your account has been created successfully.\n\nBest regards,\nThe WholeSaleNaija Team`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #eee; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="cid:logo" alt="WholeSaleNaija Logo" style="height: 240px; margin-bottom: 16px;" />
              <h2 style="color: #1a202c; margin: 0;">Welcome to WholeSaleNaija!</h2>
            </div>
            <p style="font-size: 16px; color: #333;">Hi <strong>${fullName}</strong>,</p>
            <p style="font-size: 16px; color: #333;">Your account has been created successfully. We're excited to have you join our marketplace!</p>
            <p style="font-size: 15px; color: #555;">If you have any questions, reply to this email or contact our support team.</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 14px; color: #888; text-align: center;">Best regards,<br>The WholeSaleNaija Team</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo'
      }]
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("Error sending welcome email:", err);
    return false;
  }
}

module.exports = { sendEmailOtp, sendWelcomeEmail };
