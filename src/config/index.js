module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Instagram API
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
    verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || 'axtronet_verify_token',
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  },

  // NLP configuration
  nlp: {
    language: process.env.NLP_LANGUAGE || 'es',
    sentimentThreshold: parseFloat(process.env.SENTIMENT_THRESHOLD) || 0.5
  },

  // Recruitment configuration
  recruitment: {
    autoInviteEnabled: process.env.AUTO_INVITE_ENABLED === 'true',
    minEngagementScore: parseInt(process.env.MIN_ENGAGEMENT_SCORE) || 7,
    responseDelayMs: parseInt(process.env.RESPONSE_DELAY_MS) || 2000
  }
};
