const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/wallet:
 *   get:
 *     summary: Get wallet and recent transactions
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet and transactions
 */
router.get('/', protect, walletController.getWallet);

/**
 * @openapi
 * /api/wallet/transactions:
 *   get:
 *     summary: Get paginated wallet transactions
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: Paginated transactions
 */
router.get('/transactions', protect, walletController.getWallet);

/**
 * @openapi
 * /api/wallet/unlock/{sellerId}:
 *   post:
 *     summary: Unlock seller contact (spend coins)
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller user ID
 *     responses:
 *       200:
 *         description: Seller contact unlocked
 *       402:
 *         description: Insufficient coins
 */
router.post('/unlock/:sellerId', protect, walletController.unlockSellerContact);

/**
 * @openapi
 * /api/wallet/webhook/payment:
 *   post:
 *     summary: Payment provider webhook for coin purchase
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reference:
 *                 type: string
 *               status:
 *                 type: string
 *               userId:
 *                 type: string
 *               amountPaid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/payment', walletController.paymentWebhook);

module.exports = router;
