require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('../src/models/Setting');
const { DEFAULT_SIGNUP_BONUS, DEFAULT_NAIRA_PER_COIN, DEFAULT_UNLOCK_COST } = require('../src/config/coins');

let mongoUri;
if (process.env.NODE_ENV === 'production') {
  mongoUri = process.env.MONGO_URI_PROD;
} else if (process.env.NODE_ENV === 'staging') {
  mongoUri = process.env.MONGO_URI_STAGING;
} else {
  mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/wholesalenaija-dev';
}

async function seed() {
  if (!mongoUri) {
    console.error('Error: No MongoDB URI found for current environment.');
    process.exit(1);
  }
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
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
    console.log(`Seeded ${d.key} = ${d.value}`);
  }
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});