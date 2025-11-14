// Servicio especializado para manejar webhooks de Instagram
import Interaction from '../models/Interaction.js';
import Candidate from '../models/Candidate.js';
import autoReplyService from './autoReplyService.js';
import nlpService from './nlpService.js';

class WebhookHandler {
  // Procesar comentario desde webhook
  async processComment(commentData, postId) {
    try {
      const timestamp = commentData.created_time 
        ? new Date(commentData.created_time * 1000) 
        : new Date();
      
      const username = commentData.from?.username || commentData.from?.id || 'unknown';
      const message = commentData.text || 'No text';
      
      // Obtener el ID del comentario de Instagram (esencial para responder y evitar duplicados)
      const instagramCommentId = commentData.id || 
                                 commentData.comment_id || 
                                 commentData.comment?.id ||
                                 null;
      
      // ⚠️ PREVENIR LOOP: Verificar si este comentario ya fue procesado
      if (instagramCommentId) {
        const existingInteraction = await Interaction.findOne({
          'metadata.instagramCommentId': instagramCommentId
        });
        
        if (existingInteraction) {
          console.log(`\n⏸️ Comentario ya procesado anteriormente (evitando loop)`);
          console.log(`   Comment ID: ${instagramCommentId}`);
          console.log(`   Interaction ID existente: ${existingInteraction._id}`);
          console.log(`   Ya respondido: ${existingInteraction.replied}`);
          return existingInteraction; // Retornar sin procesar de nuevo
        }
      }
      
      // ⚠️ PREVENIR LOOP: Verificar si el mensaje es una de nuestras respuestas automáticas
      const autoReplyMessages = [
        '¡Gracias por comentar! 😊',
        'Gracias por comentar',
        'Hola @',
        'Lamentamos tu experiencia'
      ];
      
      const isAutoReply = autoReplyMessages.some(autoMsg => 
        message.includes(autoMsg) || message.toLowerCase().includes(autoMsg.toLowerCase())
      );
      
      if (isAutoReply) {
        console.log(`\n⏸️ Ignorando comentario: parece ser una respuesta automática del bot`);
        console.log(`   Mensaje: "${message.substring(0, 50)}..."`);
        return null; // No procesar respuestas del bot
      }
      
      // ⚠️ PREVENIR LOOP: Obtener el username del bot desde Settings para comparar
      try {
        const Settings = (await import('../models/Settings.js')).default;
        const settings = await Settings.getSettings();
        const botUsername = settings.instagram?.username || settings.company?.name?.toLowerCase();
        
        // Si el comentario es del mismo usuario del bot, ignorarlo
        if (botUsername && username.toLowerCase() === botUsername.toLowerCase()) {
          console.log(`\n⏸️ Ignorando comentario: es del propio bot`);
          console.log(`   Usuario: @${username}`);
          return null;
        }
      } catch (error) {
        // Si no se puede obtener, continuar
      }
      
      if (!instagramCommentId) {
        console.warn('⚠️ No se encontró ID del comentario en el webhook');
        console.warn('   Estructura recibida:', JSON.stringify(commentData, null, 2));
      } else {
        console.log(`✅ Comment ID encontrado: ${instagramCommentId}`);
      }
      
      // Analizar con NLP
      const analysis = nlpService.analyzeInteraction({ message, type: 'comment' });

      // Crear interacción
      const interaction = new Interaction({
        type: 'comment',
        message: message,
        user: username,
        postId: postId || 'unknown',
        timestamp: timestamp,
        sentiment: analysis.sentiment,
        source: 'post',
        metadata: {
          jobInterest: analysis.jobInterest,
          topics: analysis.topics,
          jobKeywords: analysis.jobKeywords,
          demographic: analysis.demographic,
          instagramCommentId: instagramCommentId
        }
      });
      
      await interaction.save();
      
      // Crear o actualizar candidato
      await this.createOrUpdateCandidate(username, message, analysis.sentiment, 'comment', null, analysis);
      
      // Procesar auto-reply INMEDIATAMENTE después de guardar (SÍNCRONO para asegurar ejecución)
      console.log(`\n🔄 ========== INICIANDO AUTO-REPLY ==========`);
      console.log(`   Usuario: @${username}`);
      console.log(`   Mensaje: "${message.substring(0, 50)}..."`);
      console.log(`   Comment ID: ${instagramCommentId}`);
      console.log(`   Interaction ID: ${interaction._id}`);
      
      try {
        const autoReplyResult = await autoReplyService.processInteraction(interaction);
        
        console.log(`\n📊 RESULTADO DEL AUTO-REPLY:`);
        console.log(`   shouldReply: ${autoReplyResult.shouldReply}`);
        console.log(`   reason: ${autoReplyResult.reason || 'N/A'}`);
        console.log(`   method: ${autoReplyResult.method || 'N/A'}`);
        
        if (autoReplyResult.shouldReply) {
          console.log(`\n✅ AUTO-REPLY ENVIADO EXITOSAMENTE!`);
          console.log(`   Método: ${autoReplyResult.method}`);
          console.log(`   Mensaje: "${autoReplyResult.message}"`);
          console.log(`   Usuario: @${username}`);
        } else {
          console.log(`\n⏸️ AUTO-REPLY NO ENVIADO`);
          console.log(`   Razón: ${autoReplyResult.reason}`);
          if (autoReplyResult.requiresManualReview) {
            console.log(`   ⚠️ Requiere revisión manual`);
          }
        }
        console.log(`🔄 ========== FIN AUTO-REPLY ==========\n`);
      } catch (error) {
        console.error(`\n❌ ERROR CRÍTICO EN AUTO-REPLY:`);
        console.error(`   Mensaje: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        if (error.response) {
          console.error(`   API Status: ${error.response.status}`);
          console.error(`   API Data:`, JSON.stringify(error.response.data, null, 2));
        }
        console.error(`🔄 ========== FIN AUTO-REPLY (ERROR) ==========\n`);
        // No lanzar el error para que el webhook se procese correctamente
      }
      
      return interaction;
    } catch (error) {
      console.error('Error processing comment:', error);
      throw error;
    }
  }

  // Crear o actualizar candidato
  async createOrUpdateCandidate(username, message, sentiment, type, reactionType = null, analysis = null) {
    try {
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
    } catch (error) {
      console.error('Error creating/updating candidate:', error);
    }
  }
}

export default new WebhookHandler();

