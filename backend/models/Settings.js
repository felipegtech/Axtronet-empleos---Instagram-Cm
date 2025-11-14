import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  instagram: {
    apiToken: {
      type: String,
      default: null
    },
    pageAccessToken: {
      type: String,
      default: null
    },
    webhookUrl: {
      type: String,
      default: null
    },
    webhookSecret: {
      type: String,
      default: null
    },
    verifyToken: {
      type: String,
      default: null
    },
    connected: {
      type: Boolean,
      default: false
    }
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    types: {
      dms: {
        type: Boolean,
        default: true
      },
      comments: {
        type: Boolean,
        default: true
      },
      reactions: {
        type: Boolean,
        default: true
      },
      flagged: {
        type: Boolean,
        default: true
      }
    },
    email: {
      type: String,
      default: null
    }
  },
  autoReply: {
    enabled: {
      type: Boolean,
      default: false
    },
    defaultTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutoReplyTemplate',
      default: null
    }
  },
  team: {
    members: [{
      email: String,
      role: {
        type: String,
        enum: ['admin', 'manager', 'viewer'],
        default: 'viewer'
      },
      permissions: {
        canManageJobs: Boolean,
        canManageSurveys: Boolean,
        canReplyToMessages: Boolean,
        canViewAnalytics: Boolean
      },
      addedAt: Date
    }]
  },
  company: {
    name: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

