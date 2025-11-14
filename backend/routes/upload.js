import express from 'express';
import { uploadSingleImage, uploadMultipleImages, uploadVideo, uploadMedia } from '../middleware/upload.js';
import MediaFile from '../models/MediaFile.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Upload de una sola imagen
router.post('/image', uploadSingleImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const fileUrl = `/uploads/${req.body.type || 'general'}/${req.file.filename}`;
    
    const mediaFile = new MediaFile({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: fileUrl,
      type: 'image',
      entityType: req.body.entityType || null,
      entityId: req.body.entityId || null
    });

    await mediaFile.save();

    res.json({
      success: true,
      data: {
        id: mediaFile._id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName,
        url: fileUrl,
        path: mediaFile.path,
        size: mediaFile.size,
        mimeType: mediaFile.mimeType
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo imagen',
      error: error.message
    });
  }
});

// Upload de múltiples imágenes (para carruseles)
router.post('/images', uploadMultipleImages, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos'
      });
    }

    const mediaFiles = [];
    for (const file of req.files) {
      const fileUrl = `/uploads/${req.body.type || 'general'}/${file.filename}`;
      
      const mediaFile = new MediaFile({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: fileUrl,
        type: 'image',
        entityType: req.body.entityType || null,
        entityId: req.body.entityId || null
      });

      await mediaFile.save();
      mediaFiles.push({
        id: mediaFile._id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName,
        url: fileUrl,
        path: mediaFile.path,
        size: mediaFile.size,
        mimeType: mediaFile.mimeType
      });
    }

    res.json({
      success: true,
      count: mediaFiles.length,
      data: mediaFiles
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo imágenes',
      error: error.message
    });
  }
});

// Upload de video
router.post('/video', uploadVideo, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo de video'
      });
    }

    const fileUrl = `/uploads/${req.body.type || 'general'}/${req.file.filename}`;
    
    const mediaFile = new MediaFile({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: fileUrl,
      type: 'video',
      entityType: req.body.entityType || null,
      entityId: req.body.entityId || null
    });

    await mediaFile.save();

    res.json({
      success: true,
      data: {
        id: mediaFile._id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName,
        url: fileUrl,
        path: mediaFile.path,
        size: mediaFile.size,
        mimeType: mediaFile.mimeType
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo video',
      error: error.message
    });
  }
});

// Servir archivos estáticos
router.get('/:type/:filename', (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', req.params.type, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error sirviendo archivo',
      error: error.message
    });
  }
});

export default router;

