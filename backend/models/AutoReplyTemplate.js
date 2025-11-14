import mongoose from 'mongoose';

const autoReplyTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  template: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'job_interest', 'thanks', 'inquiry', 'custom'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  variables: [{
    type: String,
    enum: ['username', 'post_title', 'sentiment', 'company_name']
  }],
  smartRules: {
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'any'],
      default: 'any'
    },
    triggerOn: {
      type: String,
      enum: ['keyword', 'sentiment', 'both', 'always'],
      default: 'always'
    }
  },
  usageCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

autoReplyTemplateSchema.index({ isActive: 1, category: 1 });
autoReplyTemplateSchema.index({ 'smartRules.keywords': 1 });

const AutoReplyTemplate = mongoose.model('AutoReplyTemplate', autoReplyTemplateSchema);

export default AutoReplyTemplate;

