const axios = require('axios');
const config = require('../config');

/**
 * Instagram Service
 * Handles all Instagram API interactions
 */
class InstagramService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = config.instagram.accessToken;
  }

  /**
   * Reply to a comment
   */
  async replyToComment(commentId, message) {
    try {
      console.log(`📤 Replying to comment ${commentId}: "${message}"`);

      const url = `${this.baseUrl}/${commentId}/replies`;
      const response = await axios.post(url, {
        message,
        access_token: this.accessToken
      });

      console.log('✅ Reply sent successfully');
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send direct message
   */
  async sendDirectMessage(userId, message) {
    try {
      console.log(`📧 Sending DM to user ${userId}`);

      const url = `${this.baseUrl}/me/messages`;
      const response = await axios.post(url, {
        recipient: { id: userId },
        message: { text: message },
        access_token: this.accessToken
      });

      console.log('✅ DM sent successfully');
      return response.data;
    } catch (error) {
      console.error('Error sending DM:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Post a job offer to Instagram
   */
  async postJobOffer(message, imageUrl = null) {
    try {
      console.log('📸 Posting job offer to Instagram');

      const accountId = config.instagram.businessAccountId;
      const url = `${this.baseUrl}/${accountId}/media`;

      let mediaData = {
        caption: message,
        access_token: this.accessToken
      };

      // Add image if provided
      if (imageUrl) {
        mediaData.image_url = imageUrl;
      }

      // Create media object
      const mediaResponse = await axios.post(url, mediaData);
      const creationId = mediaResponse.data.id;

      // Publish media
      const publishUrl = `${this.baseUrl}/${accountId}/media_publish`;
      const publishResponse = await axios.post(publishUrl, {
        creation_id: creationId,
        access_token: this.accessToken
      });

      console.log('✅ Job offer posted successfully');
      return publishResponse.data;
    } catch (error) {
      console.error('Error posting job offer:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get media insights
   */
  async getMediaInsights(mediaId) {
    try {
      const url = `${this.baseUrl}/${mediaId}/insights`;
      const response = await axios.get(url, {
        params: {
          metric: 'engagement,impressions,reach',
          access_token: this.accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting media insights:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId) {
    try {
      const url = `${this.baseUrl}/${userId}`;
      const response = await axios.get(url, {
        params: {
          fields: 'id,username,name,profile_picture_url',
          access_token: this.accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get comments on a media post
   */
  async getMediaComments(mediaId) {
    try {
      const url = `${this.baseUrl}/${mediaId}/comments`;
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting comments:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new InstagramService();
