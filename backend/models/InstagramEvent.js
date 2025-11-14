import mongoose from 'mongoose';

const instagramEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['comment', 'reaction', 'dm', 'mention', 'story_reply', 'story_reaction']
  },
  object: {
    type: String,
    default: 'instagram'
  },
  entry: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date,
    default: null
  },
  // Referencia a la interacción creada
  interactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interaction',
    default: null
  },
  // Metadata adicional
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Para debugging
  signature: {
    type: String,
    default: null
  },
  signatureValid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

instagramEventSchema.index({ eventType: 1, createdAt: -1 });
instagramEventSchema.index({ processed: 1, createdAt: -1 });
instagramEventSchema.index({ interactionId: 1 });

const InstagramEvent = mongoose.model('InstagramEvent', instagramEventSchema);

export default InstagramEvent;

