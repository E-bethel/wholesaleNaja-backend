const Setting = require('../models/Setting');
const { DEFAULT_SIGNUP_BONUS, DEFAULT_NAIRA_PER_COIN, DEFAULT_UNLOCK_COST } = require('../config/coins');

// Set admin-only settings
async function setSetting(req, res, next) {
  const { key, value } = req.body;
  const allowed = ['nairaPerCoin', 'signupBonus', 'unlockCost'];
  if (!allowed.includes(key)) {
    return res.status(400).json({ error: 'Invalid setting key.' });
  }
  try {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, setting });
  } catch (err) {
    next(err);
  }
}

// Seed default settings
async function seedDefaults(req, res, next) {
  try {
    const defaults = [
      { key: 'nairaPerCoin', value: DEFAULT_NAIRA_PER_COIN },
      { key: 'signupBonus', value: DEFAULT_SIGNUP_BONUS },
      { key: 'unlockCost', value: DEFAULT_UNLOCK_COST }
    ];
    for (const d of defaults) {
      await Setting.findOneAndUpdate(
        { key: d.key },
        { value: d.value, updatedAt: new Date() },
        { upsert: true }
      );
    }
    res.json({ success: true, seeded: defaults });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  setSetting,
  seedDefaults
};