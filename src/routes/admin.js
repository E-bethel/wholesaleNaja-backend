const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/admin/settings:
 *   post:
 *     summary: Set business settings (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 */
router.post('/settings', protect, isAdmin, adminController.setSetting);

/**
 * @openapi
 * /api/admin/seed-defaults:
 *   post:
 *     summary: Seed default settings (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Defaults seeded
 */
router.post('/seed-defaults', protect, isAdmin, adminController.seedDefaults);

module.exports = router;
