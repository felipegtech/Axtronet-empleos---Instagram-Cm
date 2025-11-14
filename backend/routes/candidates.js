import express from 'express';
import Candidate from '../models/Candidate.js';
import Interaction from '../models/Interaction.js';

const router = express.Router();

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const { 
      interestArea, 
      reactionType, 
      sentiment, 
      status,
      sortBy = 'engagementScore',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (interestArea) {
      query.interestAreas = { $in: [interestArea] };
    }
    
    if (status) {
      query.status = status;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const candidates = await Candidate.find(query)
      .sort(sort)
      .populate('interactions')
      .populate('jobOfferInterest.jobOfferId');
    
    // Filter by sentiment if provided
    let filteredCandidates = candidates;
    if (sentiment) {
      filteredCandidates = candidates.filter(candidate => {
        const lastInteraction = candidate.conversations[candidate.conversations.length - 1];
        return lastInteraction?.sentiment === sentiment;
      });
    }
    
    // Filter by reaction type if provided
    if (reactionType) {
      filteredCandidates = filteredCandidates.filter(candidate => {
        return candidate.reactions.some(r => r.reactionType === reactionType);
      });
    }
    
    res.json({
      success: true,
      count: filteredCandidates.length,
      data: filteredCandidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates',
      error: error.message
    });
  }
});

// Get single candidate
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('interactions')
      .populate('jobOfferInterest.jobOfferId');
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    res.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidate',
      error: error.message
    });
  }
});

// Create or update candidate
router.post('/', async (req, res) => {
  try {
    const { instagramHandle } = req.body;
    
    let candidate = await Candidate.findOne({ instagramHandle: instagramHandle.toLowerCase() });
    
    if (candidate) {
      // Update existing candidate
      Object.assign(candidate, req.body);
      await candidate.save();
    } else {
      // Create new candidate
      candidate = new Candidate({
        ...req.body,
        instagramHandle: instagramHandle.toLowerCase()
      });
      await candidate.save();
    }
    
    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating/updating candidate',
      error: error.message
    });
  }
});

// Update candidate
router.put('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    res.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating candidate',
      error: error.message
    });
  }
});

// Delete candidate
router.delete('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting candidate',
      error: error.message
    });
  }
});

// Add interaction to candidate
router.post('/:id/interactions', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    candidate.conversations.push({
      ...req.body,
      timestamp: new Date()
    });
    
    // Update engagement score
    candidate.engagementScore = Math.min(100, candidate.engagementScore + 1);
    
    await candidate.save();
    
    res.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding interaction',
      error: error.message
    });
  }
});

// Send invitation
router.post('/:id/invite', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Here you would integrate with Instagram API to send DM
    // For now, we'll just mark it in the candidate record
    candidate.conversations.push({
      message: req.body.message || 'Invitation sent',
      type: 'dm',
      timestamp: new Date(),
      sentiment: 'neutral'
    });
    
    candidate.status = 'contacted';
    await candidate.save();
    
    res.json({
      success: true,
      message: 'Invitation sent (simulated)',
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending invitation',
      error: error.message
    });
  }
});

export default router;

