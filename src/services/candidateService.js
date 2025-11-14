const fs = require('fs').promises;
const path = require('path');

/**
 * Candidate Service
 * Manages candidate data and recruitment processes
 */
class CandidateService {
  constructor() {
    this.dataFile = path.join(__dirname, '../../data/candidates.json');
    this.candidates = new Map();
    this.loadCandidates();
  }

  /**
   * Load candidates from file
   */
  async loadCandidates() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const candidates = JSON.parse(data);
      candidates.forEach(candidate => {
        this.candidates.set(candidate.id, candidate);
      });
      console.log(`📂 Loaded ${this.candidates.size} candidates`);
    } catch (error) {
      // File doesn't exist yet, start with empty data
      console.log('📂 No existing candidate data, starting fresh');
      await this.saveCandidates();
    }
  }

  /**
   * Save candidates to file
   */
  async saveCandidates() {
    try {
      const candidates = Array.from(this.candidates.values());
      await fs.writeFile(this.dataFile, JSON.stringify(candidates, null, 2));
    } catch (error) {
      console.error('Error saving candidates:', error);
    }
  }

  /**
   * Track an interaction with a user
   */
  async trackInteraction(interaction) {
    try {
      const { userId, username, type, text, sentiment, intent, mediaId } = interaction;

      let candidate = await this.getCandidateByUserId(userId);

      if (!candidate) {
        // Create new candidate
        candidate = {
          id: userId || this.generateId(),
          userId: userId,
          username: username,
          engagementScore: 0,
          interactions: [],
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Add interaction
      candidate.interactions.push({
        type,
        text,
        sentiment,
        intent,
        mediaId,
        timestamp: new Date().toISOString()
      });

      // Update engagement score
      const scoreIncrement = this.calculateScoreIncrement(type, sentiment, intent);
      candidate.engagementScore += scoreIncrement;
      candidate.updatedAt = new Date().toISOString();

      this.candidates.set(candidate.id, candidate);
      await this.saveCandidates();

      console.log(`📊 Tracked ${type} interaction for ${username} (score: ${candidate.engagementScore})`);

      return candidate;
    } catch (error) {
      console.error('Error tracking interaction:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement score increment based on interaction
   */
  calculateScoreIncrement(type, sentiment, intent) {
    let score = 0;

    // Base score by type
    const typeScores = {
      comment: 2,
      mention: 3,
      dm: 4,
      story_view: 1
    };
    score += typeScores[type] || 1;

    // Sentiment bonus
    if (sentiment?.isPositive) {
      score += 1;
    }

    // Intent bonus
    if (intent?.includesInterest) {
      score += 3;
    }
    if (intent?.isJobRelated) {
      score += 2;
    }

    return score;
  }

  /**
   * Get candidate by user ID
   */
  async getCandidateByUserId(userId) {
    return this.candidates.get(userId);
  }

  /**
   * Get candidate by username
   */
  async getCandidateByUsername(username) {
    const candidates = Array.from(this.candidates.values());
    return candidates.find(c => c.username === username);
  }

  /**
   * Get candidate by ID
   */
  async getCandidateById(id) {
    return this.candidates.get(id);
  }

  /**
   * Get all candidates
   */
  async getAllCandidates() {
    return Array.from(this.candidates.values());
  }

  /**
   * Update engagement score
   */
  async updateEngagementScore(candidateId, increment) {
    const candidate = this.candidates.get(candidateId);
    if (candidate) {
      candidate.engagementScore += increment;
      candidate.updatedAt = new Date().toISOString();
      this.candidates.set(candidateId, candidate);
      await this.saveCandidates();
    }
  }

  /**
   * Invite candidate to selection process
   */
  async inviteCandidate(candidateId) {
    try {
      const candidate = this.candidates.get(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      if (candidate.status === 'invited') {
        console.log(`ℹ️  Candidate ${candidate.username} already invited`);
        return candidate;
      }

      candidate.status = 'invited';
      candidate.invitedAt = new Date().toISOString();
      candidate.updatedAt = new Date().toISOString();

      this.candidates.set(candidateId, candidate);
      await this.saveCandidates();

      console.log(`🎉 Invited candidate ${candidate.username} to selection process`);

      // Here you could send an invitation via DM
      // await instagramService.sendDirectMessage(candidate.userId, invitationMessage);

      return candidate;
    } catch (error) {
      console.error('Error inviting candidate:', error);
      throw error;
    }
  }

  /**
   * Get engagement statistics
   */
  async getEngagementStats() {
    const candidates = Array.from(this.candidates.values());

    const stats = {
      totalCandidates: candidates.length,
      newCandidates: candidates.filter(c => c.status === 'new').length,
      invitedCandidates: candidates.filter(c => c.status === 'invited').length,
      averageEngagementScore: 0,
      topCandidates: [],
      totalInteractions: 0
    };

    if (candidates.length > 0) {
      const totalScore = candidates.reduce((sum, c) => sum + c.engagementScore, 0);
      stats.averageEngagementScore = totalScore / candidates.length;

      stats.topCandidates = candidates
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10)
        .map(c => ({
          username: c.username,
          engagementScore: c.engagementScore,
          status: c.status,
          interactionCount: c.interactions.length
        }));

      stats.totalInteractions = candidates.reduce((sum, c) => sum + c.interactions.length, 0);
    }

    return stats;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new CandidateService();
