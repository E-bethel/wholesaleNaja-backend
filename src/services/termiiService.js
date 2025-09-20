const axios = require("axios");

async function sendSmsOtp(phone, otp) {
  try {
    const url = "https://v3.api.termii.com/sms/send";
    const payload = {
      to: phone,
      from: process.env.TERMII_SENDER_NAME || "MYAPP",
      sms: `Your verification code is ${otp}. It expires in 5 minutes.`,
      type: "plain",
      api_key: process.env.TERMII_API_KEY,
      channel: "generic"
    };
    const resp = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });
    console.log("Termii response:", resp.data);
    if (resp.data && resp.data.success) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Termii sendSmsOtp error:", error.response?.data || error.message);
    return false;
  }
}

module.exports = { sendSmsOtp };
