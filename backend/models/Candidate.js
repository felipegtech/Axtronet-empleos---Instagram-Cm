import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  instagramHandle: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  interestAreas: [{
    type: String,
    trim: true
  }],
  interactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interaction'
  }],
  reactions: [{
    reactionType: String,
    postId: String,
    timestamp: Date
  }],
  conversations: [{
    message: String,
    type: {
      type: String,
      enum: ['comment', 'dm', 'reply']
    },
    timestamp: Date,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    }
  }],
  status: {
    type: String,
    enum: ['new', 'contacted', 'interviewed', 'hired', 'rejected'],
    default: 'new'
  },
  notes: {
    type: String,
    default: ''
  },
  jobOfferInterest: [{
    jobOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOffer'
    },
    interestLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    interactedAt: Date
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

candidateSchema.index({ instagramHandle: 1 });
candidateSchema.index({ engagementScore: -1 });
candidateSchema.index({ status: 1, createdAt: -1 });

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;

