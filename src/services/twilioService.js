const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/*console.log('Twilio ENV:', process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_PHONE_NUMBER);*/


function isE164(phone) {
  // E.164 format: +[country][number], e.g. +2348012345678
  return /^\+\d{10,15}$/.test(phone);
}

async function sendSmsOtp(phone, otp, customMessage) {
  if (!isE164(phone)) {
    console.error('Twilio sendSmsOtp error: Phone number must be in E.164 format.');
    return { success: false, error: 'Invalid phone format' };
  }
  try {
    const body = customMessage || `Your verification code is ${otp}. It expires in 5 minutes.`;
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    console.log('Twilio response:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('Twilio sendSmsOtp error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendSmsOtp };
