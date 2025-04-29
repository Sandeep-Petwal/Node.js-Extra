
const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working',
    timestamp: new Date(),
  });
});

// Mount routes
router.use('/auth', authRoutes);

module.exports = router;
