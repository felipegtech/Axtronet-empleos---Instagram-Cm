import express from 'express';
import JobOffer from '../models/JobOffer.js';
import Candidate from '../models/Candidate.js';
import Interaction from '../models/Interaction.js';

const router = express.Router();

// Get all job offers
router.get('/', async (req, res) => {
  try {
    const jobOffers = await JobOffer.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: jobOffers.length,
      data: jobOffers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job offers',
      error: error.message
    });
  }
});

// Get single job offer
router.get('/:id', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id);
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    res.json({
      success: true,
      data: jobOffer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job offer',
      error: error.message
    });
  }
});

// Create job offer
router.post('/', async (req, res) => {
  try {
    const jobOffer = new JobOffer(req.body);
    await jobOffer.save();
    
    res.status(201).json({
      success: true,
      data: jobOffer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating job offer',
      error: error.message
    });
  }
});

// Update job offer
router.put('/:id', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    res.json({
      success: true,
      data: jobOffer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating job offer',
      error: error.message
    });
  }
});

// Delete job offer
router.delete('/:id', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findByIdAndDelete(req.params.id);
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Job offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting job offer',
      error: error.message
    });
  }
});

// Get analytics for a job offer
router.get('/:id/analytics', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id);
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    // Get interactions related to this post
    const interactions = await Interaction.find({
      postId: jobOffer.instagramPostId || jobOffer._id.toString()
    });
    
    // Get interested candidates
    const candidates = await Candidate.find({
      'jobOfferInterest.jobOfferId': jobOffer._id
    });
    
    res.json({
      success: true,
      data: {
        jobOffer,
        interactions: {
          total: interactions.length,
          comments: interactions.filter(i => i.type === 'comment').length,
          reactions: interactions.filter(i => i.type === 'reaction').length
        },
        candidates: {
          total: candidates.length,
          list: candidates
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

// Publish job offer (simple version - use /publish-instagram for full functionality)
router.post('/:id/publish', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findByIdAndUpdate(
      req.params.id,
      {
        published: true,
        publishedAt: new Date(),
        instagramPostId: req.body.instagramPostId || null
      },
      { new: true }
    );
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    res.json({
      success: true,
      data: jobOffer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing job offer',
      error: error.message
    });
  }
});

export default router;

