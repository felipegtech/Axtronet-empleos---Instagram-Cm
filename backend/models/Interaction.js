import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['comment', 'reaction'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  postId: {
    type: String,
    default: null
  },
  reactionType: {
    type: String,
    default: null
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  source: {
    type: String,
    enum: ['post', 'story', 'dm'],
    default: 'post'
  },
  replied: {
    type: Boolean,
    default: false
  },
  replyMessage: {
    type: String,
    default: null
  },
  movedToDM: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
interactionSchema.index({ timestamp: -1 });
interactionSchema.index({ type: 1, timestamp: -1 });
interactionSchema.index({ postId: 1 });
interactionSchema.index({ 'metadata.instagramCommentId': 1 }); // Para evitar duplicados y loops
interactionSchema.index({ replied: 1 }); // Para buscar comentarios no respondidos

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;

