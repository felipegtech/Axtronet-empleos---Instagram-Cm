import mongoose from 'mongoose';

const mediaFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'carousel'],
    required: true
  },
  // Para carruseles, guardar múltiples archivos
  carouselItems: [{
    filename: String,
    path: String,
    url: String,
    mimeType: String
  }],
  // Referencia a la entidad que usa este archivo
  entityType: {
    type: String,
    enum: ['jobOffer', 'survey', 'story'],
    default: null
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Metadata de Instagram después de publicar
  instagramMediaId: {
    type: String,
    default: null
  },
  instagramPermalink: {
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
  }
}, {
  timestamps: true
});

mediaFileSchema.index({ entityType: 1, entityId: 1 });
mediaFileSchema.index({ published: 1, createdAt: -1 });

const MediaFile = mongoose.model('MediaFile', mediaFileSchema);

export default MediaFile;

