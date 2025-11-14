require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const webhookRouter = require('./routes/webhook');
const apiRouter = require('./routes/api');
const config = require('./config');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/webhook', webhookRouter);
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Axtronet Instagram CM Agent',
    version: '1.0.0',
    description: 'Automatic Instagram Community Manager for recruitment',
    endpoints: {
      health: '/health',
      webhook: '/webhook',
      api: '/api'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Instagram CM Agent running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`✅ Auto-invite: ${config.recruitment.autoInviteEnabled ? 'enabled' : 'disabled'}`);
});

module.exports = app;
