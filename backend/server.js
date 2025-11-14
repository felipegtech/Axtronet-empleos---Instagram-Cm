import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import crypto from 'crypto';
import path from 'path';
import { cleanEnv, str, num, bool } from 'envalid';
import Interaction from './models/Interaction.js';
import JobOffer from './models/JobOffer.js';
import Candidate from './models/Candidate.js';

// Import routes
import jobOffersRoutes from './routes/jobOffers.js';
import candidatesRoutes from './routes/candidates.js';
import surveysRoutes from './routes/surveys.js';
import autoReplyRoutes from './routes/autoReply.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';

// Import services
import autoReplyService from './services/autoReplyService.js';
import nlpService from './services/nlpService.js';
import publishingService from './services/publishingService.js';
import instagramService from './services/instagramService.js';
import webhookHandler from './services/webhookHandler.js';

// Load environment variables
const envResult = dotenv.config();

if (envResult.error) {
  console.warn('⚠️ Warning loading .env file:', envResult.error.message);
} else {
  console.log('✅ Environment variables loaded from .env');
}

const env = cleanEnv(process.env, {
  PORT: num({ default: 5000 }),
  FRONTEND_URL: str({ default: 'http://localhost:5173' }),
  FRONTEND_PORT: num({ default: 5173 }),
  MONGODB_URI: str({ default: 'mongodb://127.0.0.1:27017/axtronet-cm-prod' }),
  VERIFY_TOKEN: str({ default: '' }),
  INSTAGRAM_APP_SECRET: str({ default: '' }),
  AUTO_REPLY_ENABLED: bool({ default: true })
}, {
  strict: false
});

const app = express();

// Configuration from .env (lines 7-15)
// Line 8-9: Server Configuration
const PORT = env.PORT;

// Line 11-12: CORS Configuration
const FRONTEND_URL = env.FRONTEND_URL;
const FRONTEND_PORT = env.FRONTEND_PORT;

// Instagram Webhook Secret (legacy name, kept for compatibility)
const INSTAGRAM_WEBHOOK_SECRET = process.env.INSTAGRAM_WEBHOOK_SECRET;

// Verify Token for webhook verification (preferred)
const VERIFY_TOKEN = env.VERIFY_TOKEN || INSTAGRAM_WEBHOOK_SECRET;

// MongoDB and other configurations
const MONGODB_URI = env.MONGODB_URI;

// Instagram Page Access Token (optional, for sending messages)
const INSTAGRAM_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;

// Auto Reply Configuration
const AUTO_REPLY_ENABLED = env.AUTO_REPLY_ENABLED;

const INSTAGRAM_APP_SECRET = env.INSTAGRAM_APP_SECRET || INSTAGRAM_WEBHOOK_SECRET || '';
if (!INSTAGRAM_APP_SECRET) {
  console.warn('⚠️ INSTAGRAM_APP_SECRET not configured. Webhook signature verification is disabled.');
}

// Middleware
const allowedOrigins = FRONTEND_URL.split(',').map(origin => origin.trim()).filter(Boolean);
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173');
}

// Agregar orígenes comunes para Docker
allowedOrigins.push('http://localhost:80');
allowedOrigins.push('http://localhost:3000');
if (FRONTEND_PORT) {
  allowedOrigins.push(`http://localhost:${FRONTEND_PORT}`);
}

const rawBodySaver = (req, res, buf) => {
  if (buf && buf.length) {
    req.rawBody = Buffer.from(buf);
  }
};

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*')
    ) {
      return callback(null, true);
    }
    console.warn(`⚠️ Rejected CORS origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));

const morganFormat = env.isProduction ? 'combined' : 'dev';
app.use(morgan(morganFormat));

app.use(express.json({ limit: '1mb', verify: rawBodySaver }));
app.use(express.urlencoded({ extended: true, limit: '1mb', verify: rawBodySaver }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many webhook requests, please try again later.'
});

app.use('/api', apiLimiter);
app.use('/webhook', webhookLimiter);

// MongoDB Connection
mongoose.set('strictQuery', false);

// Función para conectar a MongoDB con reintentos
async function connectToMongoDB() {
  const maxRetries = 10;
  const retryDelay = 5000; // 5 segundos
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000
      });
      console.log('✅ Connected to MongoDB successfully');
      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection error (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('❌ Failed to connect to MongoDB after all retries');
        return false;
      }
    }
  }
  return false;
}

// Conectar a MongoDB
connectToMongoDB();

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Retrying...');
  // Reconectar automáticamente
  setTimeout(() => {
    connectToMongoDB();
  }, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: isConnected ? 'connected' : 'disconnected'
  });
});

// Get all interactions endpoint with filters
app.get('/api/interactions', async (req, res) => {
  try {
    const { 
      type, 
      source, 
      sentiment, 
      postId,
      limit = 100 
    } = req.query;
    
    const query = {};
    
    if (type) query.type = type;
    if (source) query.source = source;
    if (sentiment) query.sentiment = sentiment;
    if (postId) query.postId = postId;
    
    const interactions = await Interaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interactions',
      error: error.message
    });
  }
});

// Reply to interaction
app.post('/api/interactions/:id/reply', async (req, res) => {
  try {
    const { message, moveToDM } = req.body;
    const interaction = await Interaction.findById(req.params.id);
    
    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }
    
    interaction.replied = true;
    interaction.replyMessage = message;
    interaction.movedToDM = moveToDM || false;
    
    await interaction.save();
    
    // Create or update candidate
    const candidate = await Candidate.findOne({ 
      instagramHandle: interaction.user.toLowerCase() 
    });
    
    if (candidate) {
      candidate.conversations.push({
        message: message,
        type: moveToDM ? 'dm' : 'reply',
        timestamp: new Date(),
        sentiment: interaction.sentiment
      });
      candidate.engagementScore = Math.min(100, candidate.engagementScore + 1);
      await candidate.save();
    }
    
    res.json({
      success: true,
      data: interaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error replying to interaction',
      error: error.message
    });
  }
});

// Get interaction statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalInteractions = await Interaction.countDocuments();
    const comments = await Interaction.countDocuments({ type: 'comment' });
    const reactions = await Interaction.countDocuments({ type: 'reaction' });
    
    // Get interactions from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentInteractions = await Interaction.countDocuments({
      timestamp: { $gte: yesterday }
    });
    
    // Sentiment analysis
    const positive = await Interaction.countDocuments({ sentiment: 'positive' });
    const neutral = await Interaction.countDocuments({ sentiment: 'neutral' });
    const negative = await Interaction.countDocuments({ sentiment: 'negative' });
    
    // DMs sent (simulated - would be actual count from Instagram API)
    const dmsSent = await Candidate.countDocuments({ 
      'conversations.type': 'dm' 
    });
    
    res.json({
      success: true,
      data: {
        total: totalInteractions,
        comments,
        reactions,
        last24Hours: recentInteractions,
        sentiment: {
          positive,
          neutral,
          negative
        },
        dmsSent
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Webhook endpoint for Instagram
function verifyInstagramSignature(req) {
  if (!INSTAGRAM_APP_SECRET) {
    return true; // If not configured, skip verification but log
  }

  const signatureHeader = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];

  if (!signatureHeader) {
    console.warn('⚠️ Missing X-Hub-Signature header');
    return false;
  }

  const [scheme, providedSignature] = signatureHeader.split('=');
  const algorithm = scheme === 'sha1' ? 'sha1' : 'sha256';

  if (!providedSignature) {
    console.warn('⚠️ Invalid X-Hub-Signature header format');
    return false;
  }

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body ?? {}));

  const expectedSignature = crypto
    .createHmac(algorithm, INSTAGRAM_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  const providedBuffer = Buffer.from(providedSignature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (providedBuffer.length !== expectedBuffer.length) {
    console.warn('⚠️ Signature length mismatch');
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

app.post('/webhook', async (req, res) => {
  try {
    // Log del webhook en la base de datos
    const InstagramEvent = (await import('./models/InstagramEvent.js')).default;
    const signatureValid = verifyInstagramSignature(req);
    
    const instagramEvent = new InstagramEvent({
      eventType: 'comment', // Se actualizará según el tipo real
      object: req.body.object || 'instagram',
      entry: req.body.entry || [],
      rawPayload: req.body,
      signature: req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'] || null,
      signatureValid
    });
    await instagramEvent.save();

    if (!signatureValid) {
      console.warn('❌ Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    console.log('📥 Webhook received:', req.body);
    
    // Handle different types of Instagram interactions
    const { object, entry } = req.body;
    
    if (object === 'instagram' && entry) {
      for (const item of entry) {
        if (item.messaging) {
          // Handle direct messaging (DMs entrantes)
          console.log('\n📩 ========== PROCESANDO MENSAJES DIRECTOS ==========');
          for (const event of item.messaging) {
            if (event.message) {
              try {
                // Ensure timestamp is always a valid date
                const timestamp = event.timestamp 
                  ? new Date(event.timestamp * 1000)  // Instagram usa timestamp en segundos
                  : new Date();
                
                const senderId = event.sender?.id || 'unknown';
                const messageText = event.message.text || 'Media message';
                const messageId = event.message.mid || `msg_${Date.now()}`;
                
                console.log(`   📩 DM recibido:`);
                console.log(`      De: ${senderId}`);
                console.log(`      Mensaje: "${messageText.substring(0, 50)}..."`);
                console.log(`      Message ID: ${messageId}`);
                
                // Validación: verificar que tenemos datos mínimos
                if (!senderId || senderId === 'unknown') {
                  console.warn('   ⚠️ Mensaje ignorado: remitente desconocido');
                  continue;
                }
                
                // Buscar candidato por sender ID o crear uno nuevo
                const Candidate = (await import('./models/Candidate.js')).default;
                let candidate = await Candidate.findOne({ 
                  $or: [
                    { instagramHandle: senderId.toLowerCase() },
                    { 'metadata.instagramUserId': senderId }
                  ]
                });
                
                if (!candidate) {
                  // Crear nuevo candidato desde el DM
                  candidate = new Candidate({
                    instagramHandle: senderId.toLowerCase(),
                    name: senderId,
                    engagementScore: 5, // DM = mayor engagement
                    conversations: [{
                      message: messageText,
                      type: 'dm',
                      timestamp: timestamp,
                      sentiment: 'neutral'
                    }],
                    status: 'active',
                    metadata: {
                      instagramUserId: senderId,
                      lastDMReceived: timestamp
                    }
                  });
                  await candidate.save();
                  console.log(`   ✅ Nuevo candidato creado desde DM: ${candidate._id}`);
                } else {
                  // Agregar DM a conversación existente
                  candidate.conversations.push({
                    message: messageText,
                    type: 'dm',
                    timestamp: timestamp,
                    sentiment: 'neutral'
                  });
                  candidate.engagementScore = Math.min(100, candidate.engagementScore + 5);
                  candidate.metadata = {
                    ...candidate.metadata,
                    instagramUserId: senderId,
                    lastDMReceived: timestamp
                  };
                  await candidate.save();
                  console.log(`   ✅ DM agregado a conversación de candidato: ${candidate._id}`);
                }
                
                // Crear interacción para el dashboard
                const interaction = new Interaction({
                  type: 'comment', // Usamos 'comment' para DMs también en el dashboard
                  message: messageText,
                  user: senderId,
                  timestamp: timestamp,
                  source: 'dm',
                  metadata: {
                    messageId: messageId,
                    senderId: senderId,
                    isDM: true
                  }
                });
                
                await interaction.save();
                
                // Actualizar InstagramEvent con la interacción creada
                instagramEvent.interactionId = interaction._id;
                instagramEvent.eventType = 'dm';
                instagramEvent.processed = true;
                instagramEvent.processedAt = new Date();
                await instagramEvent.save();
                
                // Validación segura antes de acceder a _id
                if (interaction && interaction._id) {
                  console.log(`   💾 Interacción guardada: ${interaction._id}`);
                } else {
                  console.warn('   ⚠️ Interacción guardada pero sin _id válido');
                }
                
                console.log(`   ✅ DM procesado exitosamente`);
              } catch (error) {
                console.error(`   ❌ Error procesando mensaje directo:`, error);
                console.error(`   Mensaje:`, error.message);
                console.error(`   Stack:`, error.stack);
                // Continuar procesando otros eventos
              }
            }
          }
          console.log(`📩 ========== FIN PROCESAMIENTO DMs ==========\n`);
        }
        
        if (item.changes) {
          // Handle changes (comments, reactions, etc.)
          for (const change of item.changes) {
            const { field, value } = change;
            
            if (field === 'comments') {
              // Usar el webhook handler especializado para procesar comentarios
              try {
                const interaction = await webhookHandler.processComment(
                  value,
                  value.media?.id || 'unknown'
                );
                
                // Validación segura: verificar que interaction existe y no es null
                // IMPORTANTE: processComment puede retornar null cuando ignora comentarios
                if (!interaction) {
                  // Comentario ignorado por filtros (loop, duplicado, respuesta del bot)
                  console.log(`ℹ️ Comentario ignorado (evitando loop, duplicado o respuesta del bot)`);
                  instagramEvent.processed = true;
                  instagramEvent.processedAt = new Date();
                  instagramEvent.metadata = { reason: 'ignored' };
                  await instagramEvent.save();
                  // Continuar con el siguiente evento sin error - NO acceder a _id
                  continue;
                }
                
                // Actualizar InstagramEvent con la interacción creada
                instagramEvent.interactionId = interaction._id;
                instagramEvent.eventType = 'comment';
                instagramEvent.processed = true;
                instagramEvent.processedAt = new Date();
                await instagramEvent.save();
                
                // Ahora sabemos que interaction existe, pero aún verificamos _id de forma segura
                if (interaction && interaction._id) {
                  console.log(`💾 Comentario procesado y guardado: ${interaction._id}`);
                } else if (interaction) {
                  // Interaction existe pero no tiene _id (caso raro)
                  console.warn(`⚠️ Comentario procesado pero sin _id válido`);
                } else {
                  // Doble verificación (aunque ya debería estar cubierto arriba)
                  console.warn(`⚠️ Interaction es null/undefined después de verificación`);
                }
              } catch (error) {
                console.error(`❌ Error procesando comentario:`, error);
                console.error(`   Mensaje:`, error.message);
                console.error(`   Stack:`, error.stack);
                // Continuar procesando otros eventos sin romper el webhook
              }
            }
            
            if (field === 'reactions') {
              try {
                // Ensure timestamp is always a valid date
                const timestamp = value.created_time 
                  ? new Date(value.created_time * 1000) 
                  : new Date();
                
                const username = value.user?.username || value.user?.id || 'unknown';
                
                // Validación: verificar que tenemos datos mínimos
                if (!username || username === 'unknown') {
                  console.warn('⚠️ Reacción ignorada: usuario desconocido');
                  continue;
                }
                
                const interaction = new Interaction({
                  type: 'reaction',
                  message: `Reaction: ${value.reaction_type}`,
                  user: username,
                  postId: value.media?.id || 'unknown',
                  reactionType: value.reaction_type,
                  timestamp: timestamp,
                  sentiment: 'neutral',
                  source: 'post'
                });
                
                await interaction.save();
                
                // Actualizar InstagramEvent
                instagramEvent.interactionId = interaction._id;
                instagramEvent.eventType = 'reaction';
                instagramEvent.processed = true;
                instagramEvent.processedAt = new Date();
                await instagramEvent.save();
                
                // Validación segura antes de acceder a _id
                if (interaction && interaction._id) {
                  console.log('💾 Saved reaction:', interaction._id);
                } else {
                  console.warn('⚠️ Reacción guardada pero sin _id válido');
                }
                
                // Create or update candidate
                await createOrUpdateCandidate(username, `Reaction: ${value.reaction_type}`, 'neutral', 'reaction', value.reaction_type);
              } catch (error) {
                console.error(`❌ Error procesando reacción:`, error);
                console.error(`   Stack:`, error.stack);
                // Continuar procesando otros eventos
              }
            }
          }
        }
      }
    }
    
    // Send 200 OK to Instagram to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

// Webhook verification endpoint (for Instagram webhook setup)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Use VERIFY_TOKEN from environment (preferred) or fallback to INSTAGRAM_WEBHOOK_SECRET
  const verifyToken = VERIFY_TOKEN || INSTAGRAM_WEBHOOK_SECRET;
  
  console.log('\n🔍 === WEBHOOK VERIFICATION REQUEST ===');
  console.log('  Mode:', mode);
  console.log('  Received token (hub.verify_token):', token || 'NOT PROVIDED');
  console.log('  Expected token (VERIFY_TOKEN):', verifyToken || 'NOT SET IN .env');
  console.log('  Challenge:', challenge || 'NOT PROVIDED');
  console.log('  Tokens match?', token === verifyToken);
  console.log('=========================================\n');
  
  if (!verifyToken) {
    console.error('❌ ERROR: VERIFY_TOKEN or INSTAGRAM_WEBHOOK_SECRET not set in .env file!');
    console.error('   Please add to .env: VERIFY_TOKEN=your_token');
    return res.status(500).send('Server configuration error');
  }
  
  if (!mode || !token || !challenge) {
    console.warn('⚠️ Missing required parameters');
    console.warn('   Mode:', mode || 'MISSING');
    console.warn('   Token:', token || 'MISSING');
    console.warn('   Challenge:', challenge || 'MISSING');
    return res.status(400).send('Missing required parameters');
  }
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️ Webhook verification FAILED');
    if (mode !== 'subscribe') {
      console.warn('   Reason: Invalid mode. Expected "subscribe", got:', mode);
    }
    if (token !== verifyToken) {
      console.warn('   Reason: Token mismatch');
      console.warn('   Received:', token);
      console.warn('   Expected:', verifyToken);
    }
    res.sendStatus(403);
  }
});

// Helper function for sentiment analysis
function analyzeSentiment(text) {
  const positiveWords = ['gracias', 'excelente', 'bueno', 'genial', 'perfecto', 'me encanta', 'interesado', 'vacante', 'empleo'];
  const negativeWords = ['malo', 'horrible', 'no', 'rechazo', 'problema', 'error'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score--;
  });
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Helper function to create or update candidate
async function createOrUpdateCandidate(username, message, sentiment, type, reactionType = null, analysis = null) {
  try {
    // Validación: verificar que username es válido
    if (!username || username === 'unknown') {
      console.warn('⚠️ No se puede crear/actualizar candidato: username inválido');
      return null;
    }
    
    let candidate = await Candidate.findOne({ instagramHandle: username.toLowerCase() });
    
    if (!candidate) {
      candidate = new Candidate({
        instagramHandle: username.toLowerCase(),
        name: username,
        engagementScore: 1,
        conversations: [{
          message: message,
          type: type,
          timestamp: new Date(),
          sentiment: sentiment
        }]
      });

      // Agregar información demográfica si está disponible
      if (analysis && analysis.demographic) {
        candidate.interestAreas = analysis.jobKeywords || [];
        candidate.metadata = {
          ...candidate.metadata,
          location: analysis.demographic.location,
          age: analysis.demographic.age,
          experience: analysis.demographic.experience
        };
      }
    } else {
      candidate.conversations.push({
        message: message,
        type: type,
        timestamp: new Date(),
        sentiment: sentiment
      });
      candidate.engagementScore = Math.min(100, candidate.engagementScore + 1);

      // Actualizar información demográfica
      if (analysis && analysis.demographic) {
        if (analysis.jobKeywords && analysis.jobKeywords.length > 0) {
          candidate.interestAreas = [...new Set([...candidate.interestAreas, ...analysis.jobKeywords])];
        }
        if (analysis.demographic.location && !candidate.metadata.location) {
          candidate.metadata = {
            ...candidate.metadata,
            location: analysis.demographic.location
          };
        }
      }
    }
    
    if (reactionType) {
      candidate.reactions.push({
        reactionType: reactionType,
        timestamp: new Date()
      });
    }
    
    await candidate.save();
    
    // Validación segura: verificar que candidate se guardó correctamente
    if (candidate && candidate._id) {
      return candidate;
    } else {
      console.warn('⚠️ Candidato guardado pero sin _id válido');
      return candidate;
    }
  } catch (error) {
    console.error('❌ Error creating/updating candidate:', error);
    console.error('   Stack:', error.stack);
    // No lanzar el error para que el proceso continúe
    return null;
  }
}

// API Routes
app.use('/api/job-offers', jobOffersRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/surveys', surveysRoutes);
app.use('/api/auto-reply', autoReplyRoutes);
app.use('/api/settings', settingsRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// New endpoints for full functionality

// Publicar oferta laboral (post o story)
app.post('/api/job-offers/:id/publish-instagram', async (req, res) => {
  try {
    const { type = 'post' } = req.body; // 'post' or 'story'
    const result = await publishingService.publishJobOffer(req.params.id, type);
    
    // Identificar candidatos interesados automáticamente después de publicar
    setTimeout(async () => {
      try {
        await publishingService.identifyInterestedCandidates(
          result.jobOffer.instagramPostId,
          result.jobOffer._id
        );
      } catch (error) {
        console.error('Error identifying candidates:', error);
      }
    }, 5000); // Esperar 5 segundos para que haya interacciones
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing job offer',
      error: error.message
    });
  }
});

// Publicar encuesta (post o story)
app.post('/api/surveys/:id/publish-instagram', async (req, res) => {
  try {
    const { type = 'post' } = req.body;
    const result = await publishingService.publishSurvey(req.params.id, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing survey',
      error: error.message
    });
  }
});

// Continuar conversación por DM
app.post('/api/candidates/:id/continue-dm', async (req, res) => {
  try {
    const { message } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const result = await instagramService.sendDirectMessage(
      candidate.instagramHandle,
      message
    );

    // Agregar a historial de conversación
    candidate.conversations.push({
      message: message,
      type: 'dm',
      timestamp: new Date(),
      sentiment: 'neutral'
    });

    candidate.status = 'contacted';
    await candidate.save();

    res.json({
      success: true,
      ...result,
      candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending DM',
      error: error.message
    });
  }
});

// Identificar candidatos interesados en un post específico
app.post('/api/job-offers/:id/identify-candidates', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id);
    
    if (!jobOffer || !jobOffer.instagramPostId) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found or not published'
      });
    }

    const result = await publishingService.identifyInterestedCandidates(
      jobOffer.instagramPostId,
      jobOffer._id
    );

    // Actualizar analytics de la oferta
    jobOffer.analytics.interestedCandidates = result.count;
    await jobOffer.save();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error identifying candidates',
      error: error.message
    });
  }
});

// Recolectar información demográfica
app.get('/api/analytics/demographics', async (req, res) => {
  try {
    const demographics = await publishingService.collectDemographicData();
    res.json({
      success: true,
      data: demographics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error collecting demographic data',
      error: error.message
    });
  }
});

// Procesar auto-reply manualmente para una interacción
app.post('/api/interactions/:id/process-auto-reply', async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);
    
    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }

    const result = await autoReplyService.processInteraction(interaction);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing auto-reply',
      error: error.message
    });
  }
});

// Analizar interacción con NLP
app.post('/api/interactions/:id/analyze', async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);
    
    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }

    const analysis = nlpService.analyzeInteraction(interaction);
    
    // Actualizar interacción con análisis
    interaction.metadata = {
      ...interaction.metadata,
      jobInterest: analysis.jobInterest,
      topics: analysis.topics,
      jobKeywords: analysis.jobKeywords,
      demographic: analysis.demographic,
      priority: analysis.priority
    };
    await interaction.save();

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing interaction',
      error: error.message
    });
  }
});

// Obtener insights de un post de Instagram
app.get('/api/instagram/posts/:postId/insights', async (req, res) => {
  try {
    const { postId } = req.params;
    const { metrics } = req.query;
    
    const metricsArray = metrics ? metrics.split(',') : ['impressions', 'reach', 'likes', 'comments', 'saved', 'shares'];
    const result = await instagramService.getPostInsights(postId, metricsArray);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo insights',
      error: error.message
    });
  }
});

// Refrescar token de Instagram
app.post('/api/instagram/refresh-token', async (req, res) => {
  try {
    const { shortLivedToken } = req.body;
    
    if (!shortLivedToken) {
      return res.status(400).json({
        success: false,
        message: 'shortLivedToken es requerido'
      });
    }

    const result = await instagramService.refreshToken(shortLivedToken);
    
    // Guardar el token refrescado en Settings
    const Settings = (await import('./models/Settings.js')).default;
    const settings = await Settings.getSettings();
    settings.instagram.pageAccessToken = result.accessToken;
    settings.instagram.tokenExpiresAt = result.expiresAt;
    await settings.save();
    
    res.json({
      success: true,
      ...result,
      message: 'Token refrescado y guardado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refrescando token',
      error: error.message
    });
  }
});

// Obtener información del token
app.get('/api/instagram/token-info', async (req, res) => {
  try {
    const { token } = req.query;
    const result = await instagramService.getTokenInfo(token || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información del token',
      error: error.message
    });
  }
});

// Obtener Instagram Business Account ID
app.get('/api/instagram/business-account-id', async (req, res) => {
  try {
    const igBusinessAccountId = await instagramService.getInstagramBusinessAccountId();
    res.json({
      success: true,
      igBusinessAccountId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo Instagram Business Account ID',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Initialize default template on startup
async function initializeDefaultTemplate() {
  // Esperar a que MongoDB esté conectado
  const maxWaitTime = 60000; // 60 segundos
  const checkInterval = 1000; // 1 segundo
  let elapsedTime = 0;
  
  while (mongoose.connection.readyState !== 1 && elapsedTime < maxWaitTime) {
    console.log(`⏳ Esperando conexión a MongoDB... (${elapsedTime / 1000}s)`);
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    elapsedTime += checkInterval;
  }
  
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB no está conectado. No se puede inicializar el template por defecto.');
    console.error('   El template se creará cuando MongoDB esté disponible.');
    return;
  }
  
  try {
    const AutoReplyTemplate = (await import('./models/AutoReplyTemplate.js')).default;
    const Settings = (await import('./models/Settings.js')).default;
    
    // Crear template por defecto si no existe
    let defaultTemplate = await AutoReplyTemplate.findOne({ isDefault: true });
    if (!defaultTemplate) {
      defaultTemplate = new AutoReplyTemplate({
        name: 'Respuesta General por Defecto',
        template: '¡Gracias por comentar! 😊',
        category: 'general',
        isActive: true,
        isDefault: true,
        smartRules: {
          keywords: [],
          sentiment: 'any',
          triggerOn: 'always'
        }
      });
      await defaultTemplate.save();
      console.log('✅ Template de auto-reply por defecto creado');
    } else {
      console.log('✅ Template de auto-reply por defecto ya existe');
    }
    
    // HABILITAR auto-reply por defecto SIEMPRE si no está configurado o está deshabilitado
    const settings = await Settings.getSettings();
    const shouldEnable = settings.autoReply?.enabled === undefined || 
                         settings.autoReply?.enabled === null || 
                         settings.autoReply?.enabled === false;
    
    if (shouldEnable) {
      // Validación segura: verificar que defaultTemplate existe antes de acceder a _id
      if (defaultTemplate && defaultTemplate._id) {
        settings.autoReply = {
          enabled: true,  // FORZAR habilitado
          defaultTemplate: defaultTemplate._id
        };
      } else {
        console.warn('⚠️ Template por defecto no tiene _id, habilitando auto-reply sin template');
        settings.autoReply = {
          enabled: true,
          defaultTemplate: null
        };
      }
      await settings.save();
      console.log('✅ Auto-reply HABILITADO automáticamente por defecto');
      console.log(`   Estado guardado: enabled = ${settings.autoReply.enabled}`);
    } else {
      console.log(`ℹ️ Auto-reply ya está configurado: enabled = ${settings.autoReply?.enabled}`);
    }
  } catch (error) {
    console.error('⚠️ Error inicializando template por defecto:', error.message);
    console.error('   Stack:', error.stack);
    // No lanzar el error para que el servidor continúe funcionando
  }
}

// Start server
process.on('unhandledRejection', (error) => {
  console.error('🚨 Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught exception:', error);
});

app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🪝 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`\n📝 Environment variables (from .env lines 7-15):`);
  console.log(`   PORT (line 9): ${PORT}`);
  console.log(`   FRONTEND_URL (line 12): ${FRONTEND_URL}`);
  console.log(`   VERIFY_TOKEN: ${VERIFY_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   INSTAGRAM_WEBHOOK_SECRET (legacy): ${INSTAGRAM_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`\n📝 Other environment variables:`);
  console.log(`   MONGODB_URI: ${MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`   INSTAGRAM_PAGE_ACCESS_TOKEN: ${INSTAGRAM_PAGE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AUTO_REPLY_ENABLED: ${AUTO_REPLY_ENABLED}`);
  console.log('');
  
  // Initialize default template después de que el servidor esté corriendo
  // Esto se hace de forma asíncrona para no bloquear el inicio del servidor
  initializeDefaultTemplate().catch(error => {
    console.error('⚠️ Error en initializeDefaultTemplate:', error.message);
  });
});

export default app;


