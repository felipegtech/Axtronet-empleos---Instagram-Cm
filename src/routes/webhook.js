const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhookService');
const config = require('../config');

/**
 * Webhook verification endpoint
 * Instagram sends a GET request to verify the webhook
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.instagram.verifyToken) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * Webhook event receiver
 * Instagram sends POST requests with events (comments, reactions, mentions)
 */
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received webhook event');
    
    const body = req.body;

    // Acknowledge receipt immediately
    res.sendStatus(200);

    // Process webhook asynchronously
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        await webhookService.processEntry(entry);
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

module.exports = router;
