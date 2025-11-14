const nlpService = require('./nlpService');
const instagramService = require('./instagramService');
const candidateService = require('./candidateService');
const responseService = require('./responseService');
const config = require('../config');

/**
 * Webhook Service
 * Processes incoming Instagram webhook events
 */
class WebhookService {
  /**
   * Process a webhook entry
   */
  async processEntry(entry) {
    try {
      console.log(`📨 Processing entry for ID: ${entry.id}`);

      // Process changes (comments, mentions, reactions)
      if (entry.changes) {
        for (const change of entry.changes) {
          await this.processChange(change);
        }
      }

      // Process messaging events (DMs)
      if (entry.messaging) {
        for (const message of entry.messaging) {
          await this.processMessage(message);
        }
      }
    } catch (error) {
      console.error('Error processing entry:', error);
    }
  }

  /**
   * Process a change event (comment, mention, reaction)
   */
  async processChange(change) {
    try {
      const { field, value } = change;

      console.log(`🔄 Processing change - Field: ${field}`);

      switch (field) {
      case 'comments':
        await this.handleComment(value);
        break;
      case 'mentions':
        await this.handleMention(value);
        break;
      case 'story_insights':
        await this.handleStoryInsight(value);
        break;
      default:
        console.log(`ℹ️  Unhandled field type: ${field}`);
      }
    } catch (error) {
      console.error('Error processing change:', error);
    }
  }

  /**
   * Handle comment events
   */
  async handleComment(value) {
    try {
      const { id, from, text, media } = value;

      console.log(`💬 New comment from ${from.username}: "${text}"`);

      // Analyze comment with NLP
      const analysis = await nlpService.analyzeText(text);

      // Track interaction
      await candidateService.trackInteraction({
        userId: from.id,
        username: from.username,
        type: 'comment',
        text: text,
        sentiment: analysis.sentiment,
        intent: analysis.intent,
        mediaId: media?.id
      });

      // Determine appropriate response
      const shouldRespond = this.shouldRespondToComment(analysis);
      
      if (shouldRespond) {
        // Add delay to make responses feel more natural
        await this.delay(config.recruitment.responseDelayMs);

        const response = await responseService.generateResponse(analysis, from.username);
        
        // Send reply to Instagram
        await instagramService.replyToComment(id, response);

        // Check if candidate should be invited
        if (analysis.intent.includesInterest && config.recruitment.autoInviteEnabled) {
          const candidate = await candidateService.getCandidateByUsername(from.username);
          if (candidate && candidate.engagementScore >= config.recruitment.minEngagementScore) {
            await candidateService.inviteCandidate(candidate.id);
          }
        }
      }
    } catch (error) {
      console.error('Error handling comment:', error);
    }
  }

  /**
   * Handle mention events
   */
  async handleMention(value) {
    try {
      const { from, text, media_id } = value;

      console.log(`🏷️  Mentioned by ${from.username}`);

      // Track mention
      await candidateService.trackInteraction({
        userId: from.id,
        username: from.username,
        type: 'mention',
        text: text,
        mediaId: media_id
      });

      // Mentions show high interest - boost engagement score
      const candidate = await candidateService.getCandidateByUsername(from.username);
      if (candidate) {
        await candidateService.updateEngagementScore(candidate.id, 3);
      }
    } catch (error) {
      console.error('Error handling mention:', error);
    }
  }

  /**
   * Handle story insights (reactions)
   */
  async handleStoryInsight(value) {
    try {
      console.log('📊 Story insight received');

      // Track story engagement
      await candidateService.trackInteraction({
        type: 'story_view',
        data: value
      });
    } catch (error) {
      console.error('Error handling story insight:', error);
    }
  }

  /**
   * Process direct messages
   */
  async processMessage(message) {
    try {
      const { sender, message: messageContent } = message;

      console.log(`💌 DM from ${sender.id}`);

      // Analyze message
      const analysis = await nlpService.analyzeText(messageContent.text);

      // Track DM interaction
      await candidateService.trackInteraction({
        userId: sender.id,
        type: 'dm',
        text: messageContent.text,
        sentiment: analysis.sentiment,
        intent: analysis.intent
      });

      // Generate and send response
      const response = await responseService.generateDMResponse(analysis);
      await instagramService.sendDirectMessage(sender.id, response);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  /**
   * Determine if we should respond to a comment
   */
  shouldRespondToComment(analysis) {
    // Respond to positive sentiment and job-related intents
    if (analysis.sentiment.score > config.nlp.sentimentThreshold) {
      return true;
    }

    // Respond to job-related questions
    if (analysis.intent.includesInterest || analysis.intent.includesQuestion) {
      return true;
    }

    return false;
  }

  /**
   * Delay utility for natural response timing
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WebhookService();
