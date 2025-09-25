const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, lowercase: true, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  googleId: { type: String }, // for Google login
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  isVerifiedSeller: { type: Boolean, default: false },
  sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerVerification' },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

// Password comparison method
userSchema.methods.correctPassword = async function(candidatePassword) {
  if (!this.password) return false;
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
