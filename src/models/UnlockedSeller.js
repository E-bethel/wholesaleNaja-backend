const mongoose = require('mongoose');
const unlockedSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  createdAt: { type: Date, default: Date.now }
});
unlockedSchema.index({ buyerId: 1, sellerId: 1 }, { unique: true });
module.exports = mongoose.model('UnlockedSeller', unlockedSchema);