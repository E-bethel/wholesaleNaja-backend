const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  reason: { type: String, enum: ['SIGNUP_BONUS','COIN_PURCHASE','UNLOCK_SELLER','ADMIN_ADJUSTMENT','REFUND'], required: true },
  amount: { type: Number, required: true },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});
transactionSchema.index({ 'meta.reference': 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Transaction', transactionSchema);