import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    
    await settings.save();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

// Update Instagram settings
router.put('/instagram', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    settings.instagram = {
      ...settings.instagram,
      ...req.body
    };
    
    await settings.save();
    
    res.json({
      success: true,
      data: settings.instagram
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating Instagram settings',
      error: error.message
    });
  }
});

// Update notification settings
router.put('/notifications', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    settings.notifications = {
      ...settings.notifications,
      ...req.body
    };
    
    await settings.save();
    
    res.json({
      success: true,
      data: settings.notifications
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating notification settings',
      error: error.message
    });
  }
});

// Add team member
router.post('/team/members', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    settings.team.members.push({
      ...req.body,
      addedAt: new Date()
    });
    
    await settings.save();
    
    res.json({
      success: true,
      data: settings.team.members
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding team member',
      error: error.message
    });
  }
});

// Remove team member
router.delete('/team/members/:email', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    settings.team.members = settings.team.members.filter(
      member => member.email !== req.params.email
    );
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing team member',
      error: error.message
    });
  }
});

// Update auto-reply settings
router.put('/auto-reply', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    console.log('📝 Actualizando auto-reply settings...');
    console.log('   Valores recibidos:', req.body);
    console.log('   Estado actual:', settings.autoReply);
    
    // Asegurar que autoReply existe
    if (!settings.autoReply) {
      settings.autoReply = {};
    }
    
    // Actualizar solo los campos enviados
    if (req.body.enabled !== undefined) {
      settings.autoReply.enabled = req.body.enabled === true || req.body.enabled === 'true';
    }
    if (req.body.defaultTemplate !== undefined) {
      settings.autoReply.defaultTemplate = req.body.defaultTemplate;
    }
    
    await settings.save();
    
    console.log('✅ Auto-reply settings actualizados:');
    console.log('   enabled:', settings.autoReply.enabled);
    
    res.json({
      success: true,
      data: settings.autoReply,
      message: `Auto-reply ${settings.autoReply.enabled ? 'habilitado' : 'deshabilitado'} exitosamente`
    });
  } catch (error) {
    console.error('❌ Error updating auto-reply settings:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating auto-reply settings',
      error: error.message
    });
  }
});

export default router;

