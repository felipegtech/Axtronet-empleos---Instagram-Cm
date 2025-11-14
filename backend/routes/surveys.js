import express from 'express';
import Survey from '../models/Survey.js';

const router = express.Router();

// Get all surveys
router.get('/', async (req, res) => {
  try {
    const surveys = await Survey.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching surveys',
      error: error.message
    });
  }
});

// Get single survey
router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching survey',
      error: error.message
    });
  }
});

// Create survey
router.post('/', async (req, res) => {
  try {
    const survey = new Survey(req.body);
    await survey.save();
    
    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating survey',
      error: error.message
    });
  }
});

// Update survey
router.put('/:id', async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating survey',
      error: error.message
    });
  }
});

// Delete survey
router.delete('/:id', async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting survey',
      error: error.message
    });
  }
});

// Submit vote/response
router.post('/:id/vote', async (req, res) => {
  try {
    const { optionIndex, instagramHandle } = req.body;
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    if (optionIndex < 0 || optionIndex >= survey.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option index'
      });
    }
    
    // Check if user already voted
    const alreadyVoted = survey.options.some(option => 
      option.voters.some(voter => voter.instagramHandle === instagramHandle)
    );
    
    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: 'User already voted'
      });
    }
    
    // Add vote
    survey.options[optionIndex].votes += 1;
    survey.options[optionIndex].voters.push({
      instagramHandle,
      timestamp: new Date()
    });
    
    survey.totalResponses += 1;
    
    // Calculate results
    const totalVotes = survey.options.reduce((sum, opt) => sum + opt.votes, 0);
    survey.results = {
      totalVotes,
      percentages: survey.options.map(opt => ({
        text: opt.text,
        votes: opt.votes,
        percentage: totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(2) : 0
      }))
    };
    
    await survey.save();
    
    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting vote',
      error: error.message
    });
  }
});

// Get results
router.get('/:id/results', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    const totalVotes = survey.options.reduce((sum, opt) => sum + opt.votes, 0);
    const results = {
      totalVotes,
      percentages: survey.options.map(opt => ({
        text: opt.text,
        votes: opt.votes,
        percentage: totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(2) : 0
      }))
    };
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching results',
      error: error.message
    });
  }
});

// Export data (CSV format)
router.get('/:id/export', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    // Generate CSV
    let csv = 'Option,Votes,Percentage\n';
    const totalVotes = survey.options.reduce((sum, opt) => sum + opt.votes, 0);
    
    survey.options.forEach(opt => {
      const percentage = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(2) : 0;
      csv += `"${opt.text}",${opt.votes},${percentage}%\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=survey-${survey._id}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
});

// Publish survey (simple version - use /publish-instagram for full functionality)
router.post('/:id/publish', async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      {
        published: true,
        publishedAt: new Date(),
        instagramPostId: req.body.instagramPostId || null
      },
      { new: true }
    );
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing survey',
      error: error.message
    });
  }
});

export default router;

