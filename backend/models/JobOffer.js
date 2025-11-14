import mongoose from 'mongoose';

const jobOfferSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  hashtags: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    default: null
  },
  imagePath: {
    type: String,
    default: null
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
  autoPublish: {
    type: Boolean,
    default: false
  },
  analytics: {
    reactions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    interestedCandidates: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

jobOfferSchema.index({ createdAt: -1 });
jobOfferSchema.index({ published: 1, createdAt: -1 });

const JobOffer = mongoose.model('JobOffer', jobOfferSchema);

export default JobOffer;

