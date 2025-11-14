import express from 'express';
import AutoReplyTemplate from '../models/AutoReplyTemplate.js';
import Settings from '../models/Settings.js';

const router = express.Router();

const normalizeTemplatePayload = (body = {}) => {
  const smartRulesBody = body.smartRules || {};

  const keywords = Array.isArray(smartRulesBody.keywords)
    ? smartRulesBody.keywords
        .map((keyword) => (typeof keyword === 'string' ? keyword.trim().toLowerCase() : ''))
        .filter(Boolean)
    : [];

  return {
    name: body.name,
    template: body.template,
    category: body.category || 'general',
    isActive: body.isActive !== undefined ? body.isActive : true,
    isDefault: body.isDefault === true,
    variables: Array.isArray(body.variables) ? body.variables : [],
    smartRules: {
      keywords,
      sentiment: smartRulesBody.sentiment || 'any',
      triggerOn: smartRulesBody.triggerOn || 'always',
    },
  };
};

const ensureDefaultTemplateConsistency = async (templateDoc) => {
  if (!templateDoc) return;

  const settings = await Settings.getSettings();
  if (!settings.autoReply) {
    settings.autoReply = { enabled: true, defaultTemplate: null };
  }

  if (templateDoc.isDefault) {
    await AutoReplyTemplate.updateMany(
      { _id: { $ne: templateDoc._id } },
      { $set: { isDefault: false } },
    );

    settings.autoReply.defaultTemplate = templateDoc._id;
    if (settings.autoReply.enabled === undefined || settings.autoReply.enabled === null) {
      settings.autoReply.enabled = true;
    }
    await settings.save();
    return;
  }

  if (
    settings.autoReply.defaultTemplate &&
    settings.autoReply.defaultTemplate.toString() === templateDoc._id.toString()
  ) {
    settings.autoReply.defaultTemplate = null;
    await settings.save();
  }
};

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await AutoReplyTemplate.find()
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching templates',
      error: error.message
    });
  }
});

// Get single template
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await AutoReplyTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching template',
      error: error.message
    });
  }
});

// Create template
router.post('/templates', async (req, res) => {
  try {
    const payload = normalizeTemplatePayload(req.body);
    const template = new AutoReplyTemplate(payload);
    await template.save();

    await ensureDefaultTemplateConsistency(template);
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating template',
      error: error.message
    });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const template = await AutoReplyTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const payload = normalizeTemplatePayload({ ...template.toObject(), ...req.body });
    template.set(payload);
    await template.save();

    await ensureDefaultTemplateConsistency(template);
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating template',
      error: error.message
    });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await AutoReplyTemplate.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const settings = await Settings.getSettings();
    const shouldReplaceDefault =
      template.isDefault ||
      (settings.autoReply?.defaultTemplate &&
        settings.autoReply.defaultTemplate.toString() === template._id.toString());

    if (shouldReplaceDefault) {
      const nextDefault = await AutoReplyTemplate.findOne({ isActive: true }).sort({ createdAt: 1 });

      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
        settings.autoReply = {
          ...(settings.autoReply || {}),
          enabled:
            settings.autoReply?.enabled === undefined
              ? true
              : settings.autoReply.enabled,
          defaultTemplate: nextDefault._id,
        };
      } else {
        settings.autoReply = {
          ...(settings.autoReply || {}),
          defaultTemplate: null,
        };
      }

      await settings.save();
    }
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting template',
      error: error.message
    });
  }
});

// Preview template with variables
router.post('/templates/:id/preview', async (req, res) => {
  try {
    const template = await AutoReplyTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const {
      username,
      post_title,
      sentiment,
      company_name,
      smart_reply,
      original_comment,
      topics,
      job_keywords,
      priority,
    } = req.body;
    
    let preview = template.template;
    preview = preview.replace(/{username}/g, username || '@username');
    preview = preview.replace(/{post_title}/g, post_title || 'Post Title');
    preview = preview.replace(/{sentiment}/g, sentiment || 'neutral');
    preview = preview.replace(/{company_name}/g, company_name || 'Company');
    preview = preview.replace(/{smart_reply}/g, smart_reply || 'Respuesta inteligente generada automáticamente');
    preview = preview.replace(/{original_comment}/g, original_comment || 'Comentario original del usuario');
    preview = preview.replace(
      /{topics}/g,
      Array.isArray(topics)
        ? topics.join(', ')
        : topics || ''
    );
    preview = preview.replace(
      /{job_keywords}/g,
      Array.isArray(job_keywords)
        ? job_keywords.join(', ')
        : job_keywords || ''
    );
    preview = preview.replace(/{priority}/g, priority || 'medium');
    
    res.json({
      success: true,
      data: {
        original: template.template,
        preview
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating preview',
      error: error.message
    });
  }
});

// Get active templates
router.get('/templates/active', async (req, res) => {
  try {
    const templates = await AutoReplyTemplate.find({ isActive: true })
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active templates',
      error: error.message
    });
  }
});

export default router;

