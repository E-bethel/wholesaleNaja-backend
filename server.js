// Automatically send test emails on server startup
if (process.env.TEST_EMAIL) {
  const { sendEmailOtp, sendWelcomeEmail } = require('./src/services/mailerService');
  (async () => {
    try {
      const otpResult = await sendEmailOtp(process.env.TEST_EMAIL, '123456');
      if (otpResult) {
        console.log(`✅ Test OTP email sent to ${process.env.TEST_EMAIL}`);
      } else {
        console.error(`❌ Failed to send test OTP email to ${process.env.TEST_EMAIL}`);
      }
      const welcomeResult = await sendWelcomeEmail(process.env.TEST_EMAIL, process.env.TEST_NAME || 'Test User');
      if (welcomeResult) {
        console.log(`✅ Test welcome email sent to ${process.env.TEST_EMAIL}`);
      } else {
        console.error(`❌ Failed to send test welcome email to ${process.env.TEST_EMAIL}`);
      }
    } catch (err) {
      console.error('❌ Error sending test emails:', err);
    }
  })();
}
// --- Test endpoints for mailerService ---
// --- Test endpoints for mailerService ---
const { sendEmailOtp, sendWelcomeEmail } = require('./src/services/mailerService');


// Entry point for wholesalenaija-backend
require('dotenv').config();
const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require('mongoose');
const swaggerJSDoc = require('swagger-jsdoc');
const redoc = require('redoc-express');
const path = require('path');

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'favicon.ico')));

const PORT = process.env.PORT || 5050;

const MONGO_URI = process.env.NODE_ENV === 'production'
  ? process.env.MONGO_URI_PROD
  : process.env.NODE_ENV === 'staging'
    ? process.env.MONGO_URI_STAGING
    : 'mongodb://localhost:27017/wholesalenaija-dev';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Wholesalenaija API',
    version: '1.0.0',
    description: 'API documentation for Wholesalenaija',
  },
  servers: [
    { url: `http://localhost:${PORT}` },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
// Place test endpoints after app is defined

// Test: Send OTP email
app.get('/test/send-otp', async (req, res) => {
  const email = req.query.email || process.env.TEST_EMAIL;
  const otp = req.query.otp || '123456';
  if (!email) return res.status(400).json({ message: 'Missing email param' });
  const result = await sendEmailOtp(email, otp);
  if (result) {
    res.json({ message: 'OTP email sent', email, otp });
  } else {
    res.status(500).json({ message: 'Failed to send OTP email', email });
  }
});

// Test: Send Welcome email
app.get('/test/send-welcome', async (req, res) => {
  const email = req.query.email || process.env.TEST_EMAIL;
  const name = req.query.name || 'Test User';
  if (!email) return res.status(400).json({ message: 'Missing email param' });
  const result = await sendWelcomeEmail(email, name);
  if (result) {
    res.json({ message: 'Welcome email sent', email, name });
  } else {
    res.status(500).json({ message: 'Failed to send welcome email', email });
  }
});
// Docs routes should be first
app.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/docs', redoc({
  title: 'Wholesalenaija API Docs',
  specUrl: '/docs/swagger.json',
  favicon: '/favicon.ico',
}));


const authRoutes = require('./src/routes/auth');
const walletRoutes = require('./src/routes/wallet');
const adminRoutes = require('./src/routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
