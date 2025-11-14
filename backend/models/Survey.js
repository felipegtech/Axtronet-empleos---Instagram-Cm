import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['poll', 'survey'],
    default: 'poll'
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    votes: {
      type: Number,
      default: 0
    },
    voters: [{
      instagramHandle: String,
      timestamp: Date
    }]
  }],
  audienceTarget: {
    type: String,
    enum: ['all', 'candidates', 'followers', 'custom'],
    default: 'all'
  },
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  instagramPostId: {
    type: String,
    default: null
  },
  totalResponses: {
    type: Number,
    default: 0
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  nlpInsights: {
    topics: [String],
    sentimentTrend: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    commonKeywords: [String]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

surveySchema.index({ createdAt: -1 });
surveySchema.index({ published: 1, createdAt: -1 });

const Survey = mongoose.model('Survey', surveySchema);

export default Survey;

