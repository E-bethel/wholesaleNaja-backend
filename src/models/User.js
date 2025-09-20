const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, lowercase: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  googleId: { type: String }, // for Google login
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  isVerifiedSeller: { type: Boolean, default: false },
  sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerVerification' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
