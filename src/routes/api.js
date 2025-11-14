const express = require('express');
const router = express.Router();
const candidateService = require('../services/candidateService');
const instagramService = require('../services/instagramService');

/**
 * Get all candidates
 */
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await candidateService.getAllCandidates();
    res.json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get candidate by ID
 */
router.get('/candidates/:id', async (req, res) => {
  try {
    const candidate = await candidateService.getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Manually invite a candidate
 */
router.post('/candidates/:id/invite', async (req, res) => {
  try {
    const result = await candidateService.inviteCandidate(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Post a job offer to Instagram
 */
router.post('/jobs/post', async (req, res) => {
  try {
    const { message, imageUrl } = req.body;
    const result = await instagramService.postJobOffer(message, imageUrl);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get engagement statistics
 */
router.get('/stats/engagement', async (req, res) => {
  try {
    const stats = await candidateService.getEngagementStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
