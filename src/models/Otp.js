const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  key: { type: String, required: true }, // phone or email
  otpHash: { type: String, required: true },
  expires: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

otpSchema.index({ key: 1, createdAt: -1 });

module.exports = mongoose.model('Otp', otpSchema);
