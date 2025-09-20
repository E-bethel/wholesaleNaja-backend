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

// Docs routes should be first
app.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.get('/docs', redoc({
  title: 'Wholesalenaija API Docs',
  specUrl: '/docs/swagger.json',
  favicon: '/favicon.ico',
}));

const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
