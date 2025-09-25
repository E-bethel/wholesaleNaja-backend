const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const UnlockedSeller = require('../models/UnlockedSeller');
const Setting = require('../models/Setting');
const User = require('../models/User');
const { DEFAULT_SIGNUP_BONUS, DEFAULT_NAIRA_PER_COIN, DEFAULT_UNLOCK_COST } = require('../config/coins');

// Helper to get setting or default
async function getSetting(key, fallback) {
  const s = await Setting.findOne({ key });
  return s ? s.value : fallback;
}

// Grant signup bonus (idempotent)
async function grantSignupBonus(userId, { idempotency = true } = {}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (idempotency) {
      const existingTx = await Transaction.findOne({ userId, reason: 'SIGNUP_BONUS' }).session(session);
      if (existingTx) {
        await session.endSession();
        return { wallet: await Wallet.findOne({ userId }), transaction: existingTx };
      }
    }
    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }
    const signupBonus = await getSetting('signupBonus', DEFAULT_SIGNUP_BONUS);
    wallet.balance += signupBonus;
    wallet.updatedAt = new Date();
    await wallet.save({ session });
    const transaction = new Transaction({
      userId,
      type: 'CREDIT',
      reason: 'SIGNUP_BONUS',
      amount: signupBonus,
      meta: {}
    });
    await transaction.save({ session });
    await session.commitTransaction();
    await session.endSession();
    return { wallet, transaction };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
}

// Get wallet and recent transactions
async function getWallet(req, res, next) {
  try {
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
      await wallet.save();
    }
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ wallet, transactions });
  } catch (err) {
    next(err);
  }
}

// Unlock seller contact
async function unlockSellerContact(req, res, next) {
  // TODO: Add express-rate-limit or Redis-based limiter (3 per hour)
  const buyerId = req.user._id;
  const sellerId = req.params.sellerId;
  if (buyerId.toString() === sellerId) {
    return res.status(400).json({ error: 'Cannot unlock yourself.' });
  }
  try {
    const unlocked = await UnlockedSeller.findOne({ buyerId, sellerId });
    if (unlocked) {
      const seller = await User.findById(sellerId);
      return res.json({ unlocked: true, contact: { phone: seller.phone, email: seller.email } });
    }
    const unlockCost = await getSetting('unlockCost', DEFAULT_UNLOCK_COST);
    const session = await mongoose.startSession();
    session.startTransaction();
    let wallet = await Wallet.findOne({ userId: buyerId }).session(session);
    if (!wallet || wallet.balance < unlockCost) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(402).json({ error: 'Insufficient coins.' });
    }
    wallet.balance -= unlockCost;
    wallet.updatedAt = new Date();
    await wallet.save({ session });
    const transaction = new Transaction({
      userId: buyerId,
      type: 'DEBIT',
      reason: 'UNLOCK_SELLER',
      amount: unlockCost,
      meta: { sellerId }
    });
    await transaction.save({ session });
    const unlockedSeller = new UnlockedSeller({
      buyerId,
      sellerId,
      transactionId: transaction._id
    });
    await unlockedSeller.save({ session });
    await session.commitTransaction();
    await session.endSession();
    const seller = await User.findById(sellerId);
    res.json({
      unlocked: true,
      balance: wallet.balance,
      contact: { phone: seller.phone, email: seller.email },
      transaction
    });
  } catch (err) {
    next(err);
  }
}

// Payment webhook (Paystack/Flutterwave)
async function paymentWebhook(req, res, next) {
  // Structured log: paymentWebhook received
  // TODO: Add Sentry/error monitoring
  try {
    // TODO: Verify signature header (see below for pseudo code)
    // Example:
    // const signature = req.headers['x-paystack-signature'];
    // if (!verifyPaystackSignature(signature, req.body, process.env.PAYSTACK_SECRET)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }
    const { reference, status, userId, amountPaid, provider = 'unknown', packId, paidCurrency = 'NGN' } = req.body;
    if (!reference || !userId || !amountPaid) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const existingTx = await Transaction.findOne({ 'meta.reference': reference });
    if (existingTx) {
      return res.status(200).json({ success: true, message: 'Already processed.' });
    }
    if (status !== 'success') {
      return res.status(200).json({ success: false, message: 'Payment not successful.' });
    }
    const nairaPerCoin = await getSetting('nairaPerCoin', DEFAULT_NAIRA_PER_COIN);
    // Math.floor: avoid fractional coins, clients must top-up to reach next coin
    const coins = Math.floor(amountPaid / nairaPerCoin);
    const session = await mongoose.startSession();
    session.startTransaction();
    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }
    let transaction;
    if (coins > 0) {
      wallet.balance += coins;
      wallet.updatedAt = new Date();
      await wallet.save({ session });
      transaction = new Transaction({
        userId,
        type: 'CREDIT',
        reason: 'COIN_PURCHASE',
        amount: coins,
        meta: { reference, provider, amountPaid, paidCurrency, packId }
      });
      await transaction.save({ session });
    } else {
      transaction = new Transaction({
        userId,
        type: 'CREDIT',
        reason: 'COIN_PURCHASE',
        amount: 0,
        meta: { reference, provider, amountPaid, paidCurrency, packId, insufficient_amount: true }
      });
      await transaction.save({ session });
      // TODO: Notify admin for refund/clarification
    }
    await session.commitTransaction();
    await session.endSession();
    res.status(200).json({ success: true, coins, transaction });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: 'Already processed.' });
    }
    next(err);
  }
}

module.exports = {
  grantSignupBonus,
  getWallet,
  unlockSellerContact,
  paymentWebhook
};