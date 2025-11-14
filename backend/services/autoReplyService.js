import Interaction from '../models/Interaction.js';
import Candidate from '../models/Candidate.js';
import AutoReplyTemplate from '../models/AutoReplyTemplate.js';
import instagramService from './instagramService.js';
import nlpService from './nlpService.js';

class AutoReplyService {
  // Procesar interacción y enviar auto-reply si aplica
  async processInteraction(interaction) {
    try {
      console.log(`\n🔍 [AUTO-REPLY] Verificando configuración...`);
      
      // Verificar si auto-reply está habilitado en Settings
      const Settings = (await import('../models/Settings.js')).default;
      const settings = await Settings.getSettings();
      
      console.log(`   Settings auto-reply enabled: ${settings.autoReply?.enabled}`);
      console.log(`   Settings completo:`, JSON.stringify(settings.autoReply, null, 2));
      
      // Si no está configurado, habilitarlo automáticamente
      if (settings.autoReply?.enabled === undefined || settings.autoReply?.enabled === null) {
        console.log(`   ⚠️ Auto-reply no configurado, habilitando automáticamente...`);
        settings.autoReply = {
          enabled: true,
          defaultTemplate: null
        };
        await settings.save();
        console.log(`   ✅ Auto-reply habilitado automáticamente`);
      }
      
      if (!settings.autoReply?.enabled) {
        console.log('⏸️ Auto-reply está deshabilitado en Settings');
        return { shouldReply: false, reason: 'auto-reply disabled' };
      }
      
      console.log(`   ✅ Auto-reply está HABILITADO`);
      const defaultTemplateId = settings.autoReply?.defaultTemplate
        ? settings.autoReply.defaultTemplate.toString()
        : null;

      // Solo procesar comentarios (no reacciones)
      console.log(`   Tipo de interacción: ${interaction.type}`);
      if (interaction.type !== 'comment') {
        console.log(`   ⏸️ No es un comentario, saltando auto-reply`);
        return { shouldReply: false, reason: 'not a comment' };
      }

      // Verificar si ya fue respondido (verificación adicional)
      console.log(`   Ya respondido: ${interaction.replied}`);
      if (interaction.replied) {
        console.log(`   ⏸️ Ya fue respondido, saltando auto-reply`);
        return { shouldReply: false, reason: 'already replied' };
      }
      
      // ⚠️ PREVENIR LOOP: Verificar si el mensaje es una respuesta automática
      const autoReplyPatterns = [
        '¡Gracias por comentar!',
        'Gracias por comentar',
        'Lamentamos tu experiencia',
        'contáctanos por DM'
      ];
      
      const messageLower = interaction.message.toLowerCase();
      const isAutoReplyMessage = autoReplyPatterns.some(pattern => 
        messageLower.includes(pattern.toLowerCase())
      );
      
      if (isAutoReplyMessage) {
        console.log(`   ⏸️ Ignorando: mensaje parece ser respuesta automática del bot`);
        return { shouldReply: false, reason: 'auto-reply message detected' };
      }
      
      // ⚠️ PREVENIR LOOP: Verificar duplicados por Comment ID
      if (interaction.metadata?.instagramCommentId) {
        const duplicateCount = await Interaction.countDocuments({
          'metadata.instagramCommentId': interaction.metadata.instagramCommentId,
          _id: { $ne: interaction._id } // Excluir el actual
        });
        
        if (duplicateCount > 0) {
          console.log(`   ⏸️ Comentario duplicado detectado (${duplicateCount} existentes), saltando auto-reply`);
          return { shouldReply: false, reason: 'duplicate comment detected' };
        }
      }
      
      console.log(`   ✅ Es un comentario nuevo, procesando...`);

      // Analizar interacción con NLP
      const analysis = nlpService.analyzeInteraction(interaction);
      
      // Verificar si hay auto-reply activo
      console.log(`   🔍 Buscando templates activos...`);
      let activeTemplates = await AutoReplyTemplate.find({ isActive: true });
      console.log(`   Templates encontrados: ${activeTemplates.length}`);
      
      if (activeTemplates.length === 0) {
        // Crear template por defecto si no existe
        console.log('   📝 No hay templates activos, creando template por defecto...');
        await this.createDefaultTemplate();
        activeTemplates = await AutoReplyTemplate.find({ isActive: true });
        console.log(`   Templates después de crear: ${activeTemplates.length}`);
        
        if (activeTemplates.length === 0) {
          console.error('   ❌ No se pudo crear template por defecto');
          return { shouldReply: false, reason: 'No active templates' };
        }
      }
      
      console.log(`   ✅ Templates disponibles: ${activeTemplates.map(t => t.name).join(', ')}`);

      // Buscar template apropiado
      let selectedTemplate = await this.selectTemplate(activeTemplates, {
        interaction,
        analysis,
        defaultTemplateId
      });

      // Si no hay template específico, usar fallback general
      if (!selectedTemplate && defaultTemplateId) {
        try {
          selectedTemplate = await AutoReplyTemplate.findById(defaultTemplateId);
        } catch (error) {
          console.error('Error obteniendo template por defecto:', error);
        }
      }

      if (!selectedTemplate) {
        selectedTemplate = activeTemplates.find(t => t.isDefault) || activeTemplates[0];
      }

      if (selectedTemplate) {
        console.log(`📝 Usando template: ${selectedTemplate.name}`);
      }

      // Generar mensaje personalizado
      let message = this.generatePersonalizedMessage(selectedTemplate, interaction, analysis);
      const smartResponseMessage = analysis.smartResponse?.message || '';
      
      if (!message || !message.trim()) {
        message = smartResponseMessage || `¡Gracias por comentar! 😊`;
      }

      if (
        smartResponseMessage &&
        message === selectedTemplate.template &&
        !selectedTemplate.template.includes('{smart_reply}')
      ) {
        message = smartResponseMessage;
      }

      if (!message.includes(`@${interaction.user}`)) {
        const userRegex = new RegExp(`\\b${interaction.user}\\b`, 'gi');
        if (userRegex.test(message)) {
          message = message.replace(userRegex, `@${interaction.user}`);
        } else {
          message = `@${interaction.user} ${message}`.trim();
        }
      }

      let finalMessage = message.trim();

      if (
        analysis.sentiment === 'negative' &&
        (!selectedTemplate || selectedTemplate.category !== 'inquiry') &&
        (!finalMessage || finalMessage === '¡Gracias por comentar! 😊')
      ) {
        console.log('⚠️ Comentario negativo detectado, aplicando mensaje de empatía por defecto');
        finalMessage = `Hola @${interaction.user}! 👋 Lamentamos tu experiencia. Por favor, contáctanos por DM para resolver esto de manera personalizada. 🙏`;
      }

      let shouldMoveToDM = Boolean(analysis.smartResponse?.shouldMoveToDM);
      if (
        shouldMoveToDM === false &&
        analysis.sentiment === 'negative' &&
        (!selectedTemplate || selectedTemplate.category === 'inquiry')
      ) {
        shouldMoveToDM = true;
      }

      try {
        console.log(`\n   📤 Enviando respuesta...`);
        console.log(`   Mensaje final: "${finalMessage}"`);
        console.log(`   Método: ${shouldMoveToDM ? 'DM' : 'Comentario'}`);
        
        // Enviar respuesta (SIEMPRE como comentario para garantizar respuesta)
        if (shouldMoveToDM) {
          // Mover a DM
          console.log(`   💬 Enviando DM...`);
          await this.sendDM(interaction.user, finalMessage, interaction);
          console.log(`   ✅ DM enviado a @${interaction.user}`);
        } else {
          // Responder como comentario (método principal)
          console.log(`   💬 Enviando respuesta como comentario...`);
          await this.replyAsComment(interaction, finalMessage);
          console.log(`   ✅ Respuesta automática enviada a @${interaction.user} como comentario en Instagram`);
        }

        // Actualizar template usage
        selectedTemplate.usageCount += 1;
        await selectedTemplate.save();

        // Actualizar interacción - MARCADO COMO RESPONDIDO INMEDIATAMENTE para evitar loop
        interaction.replied = true;
        interaction.replyMessage = finalMessage;
        interaction.movedToDM = shouldMoveToDM;
        // Agregar timestamp de respuesta
        interaction.metadata = {
          ...interaction.metadata,
          repliedAt: new Date(),
          replyMethod: shouldMoveToDM ? 'dm' : 'comment'
        };
        await interaction.save();
        
        console.log(`   ✅ Interacción marcada como respondida (ID: ${interaction._id})`);

        return {
          shouldReply: true,
          message: finalMessage,
          method: shouldMoveToDM ? 'dm' : 'comment',
          analysis
        };
      } catch (error) {
        console.error('Error enviando respuesta:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error processing auto-reply:', error);
      throw error;
    }
  }

  // Crear template por defecto si no existe
  async createDefaultTemplate() {
    try {
      const existingDefault = await AutoReplyTemplate.findOne({ isDefault: true });
      if (existingDefault) {
        return existingDefault;
      }

      const defaultTemplate = new AutoReplyTemplate({
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
      console.log('✅ Template por defecto creado');
      return defaultTemplate;
    } catch (error) {
      console.error('Error creating default template:', error);
      throw error;
    }
  }

  // Generar mensaje personalizado
  generatePersonalizedMessage(template, interaction, analysis) {
    let message = template.template;

    // Reemplazar variables
    message = message.replace(/{username}/g, interaction.user); // Sin @ porque Instagram lo agrega automáticamente
    message = message.replace(/@{username}/g, `@${interaction.user}`); // Si ya tiene @
    message = message.replace(/{sentiment}/g, analysis.sentiment);
    message = message.replace(/{company_name}/g, 'Axtronet');
    message = message.replace(
      /{post_title}/g,
      interaction.metadata?.postTitle || interaction.metadata?.post || interaction.postId || 'Publicación'
    );
    message = message.replace(
      /{smart_reply}/g,
      analysis.smartResponse?.message || ''
    );
    message = message.replace(
      /{original_comment}/g,
      interaction.message || ''
    );
    message = message.replace(
      /{topics}/g,
      (analysis.topics && analysis.topics.length > 0) ? analysis.topics.join(', ') : ''
    );
    message = message.replace(
      /{job_keywords}/g,
      (analysis.jobKeywords && analysis.jobKeywords.length > 0) ? analysis.jobKeywords.join(', ') : ''
    );
    message = message.replace(
      /{priority}/g,
      analysis.priority || 'medium'
    );

    // Limpiar dobles espacios resultantes de placeholders vacíos sin eliminar saltos de línea
    message = message
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Si el template no tiene variables, asegurar que tenga el mensaje básico
    if (message === template.template && !message.includes('@')) {
      // El template ya tiene el mensaje correcto, no necesita cambios
    }

    return message;
  }

  calculateTemplateScore(template, context) {
    if (!template) return Number.NEGATIVE_INFINITY;

    const rules = template.smartRules || {};
    const keywords = Array.isArray(rules.keywords) ? rules.keywords : [];
    const triggerOn = rules.triggerOn || 'always';
    const messageLower = context.messageLower || '';

    const matchedKeywords = keywords.filter(keyword =>
      keyword && messageLower.includes(keyword.toLowerCase())
    );

    if (
      (triggerOn === 'keyword' || triggerOn === 'both') &&
      keywords.length > 0 &&
      matchedKeywords.length === 0
    ) {
      return Number.NEGATIVE_INFINITY;
    }

    if (
      (triggerOn === 'sentiment' || triggerOn === 'both') &&
      rules.sentiment &&
      rules.sentiment !== 'any' &&
      rules.sentiment !== context.sentiment
    ) {
      return Number.NEGATIVE_INFINITY;
    }

    let score = 0;

    if (matchedKeywords.length > 0) {
      score += 6 + matchedKeywords.length * 2;
    } else if (keywords.length === 0) {
      score += 2;
    }

    if (rules.sentiment && rules.sentiment !== 'any' && rules.sentiment === context.sentiment) {
      score += 6;
    }

    const jobKeywordMatches = (context.jobKeywords || []).filter(keyword =>
      keywords.includes(keyword)
    );
    if (jobKeywordMatches.length > 0) {
      score += jobKeywordMatches.length * 2;
    }

    if (context.jobInterest && template.category === 'job_interest') {
      score += 8;
    }

    if (context.sentiment === 'positive' && template.category === 'thanks') {
      score += 3;
    }

    if (context.sentiment === 'negative' && template.category === 'inquiry') {
      score += 3;
    }

    if (context.requiresFollowup && template.category === 'inquiry') {
      score += 4;
    }

    if (context.containsQuestion && template.category === 'inquiry') {
      score += 2;
    }

    if (template.category === 'custom' && matchedKeywords.length > 0) {
      score += 2;
    }

    if (template.category === 'general') {
      score += 1;
    }

    if (
      context.defaultTemplateId &&
      template._id &&
      template._id.toString() === context.defaultTemplateId
    ) {
      score += 2;
    }

    if (template.isDefault) {
      score += 1;
    }

    if (triggerOn === 'always') {
      score += 1;
    }

    return score;
  }

  async selectTemplate(templates, { interaction, analysis, defaultTemplateId }) {
    if (!templates || templates.length === 0) {
      return null;
    }

    const scoringContext = {
      messageLower: (interaction.message || '').toLowerCase(),
      sentiment: analysis.sentiment,
      jobInterest: analysis.jobInterest,
      jobKeywords: analysis.jobKeywords || [],
      topics: analysis.topics || [],
      requiresFollowup: Boolean(analysis.smartResponse?.shouldMoveToDM),
      containsQuestion: /\?|¿/.test(interaction.message || ''),
      defaultTemplateId
    };

    const scoredTemplates = templates
      .map(template => ({
        template,
        score: this.calculateTemplateScore(template, scoringContext)
      }))
      .filter(entry => entry.score !== Number.NEGATIVE_INFINITY)
      .sort((a, b) => b.score - a.score);

    if (scoredTemplates.length > 0 && scoredTemplates[0].score !== Number.NEGATIVE_INFINITY) {
      return scoredTemplates[0].template;
    }

    if (defaultTemplateId) {
      const defaultInList = templates.find(
        template => template._id && template._id.toString() === defaultTemplateId
      );
      if (defaultInList) {
        return defaultInList;
      }

      try {
        const defaultTemplate = await AutoReplyTemplate.findById(defaultTemplateId);
        if (defaultTemplate) {
          return defaultTemplate;
        }
      } catch (error) {
        console.error('Error buscando template por defecto:', error.message);
      }
    }

    return templates.find(template => template.isDefault) || templates[0] || null;
  }

  // Enviar DM
  async sendDM(username, message, interaction) {
    try {
      console.log(`\n   📩 [AUTO-REPLY-DM] Enviando DM a @${username}...`);
      console.log(`   Mensaje: "${message.substring(0, 50)}..."`);
      
      const result = await instagramService.sendDirectMessage(username, message);
      
      if (!result.success) {
        console.warn(`   ⚠️ DM no pudo ser enviado: ${result.warning || result.error}`);
        console.warn(`   💡 Nota: Instagram requiere que el usuario inicie la conversación primero`);
        console.warn(`   💡 El sistema continuará funcionando, pero el DM no se envió`);
        // No lanzar error, solo registrar el warning y continuar
      } else {
        console.log(`   ✅ DM enviado exitosamente a @${username}`);
        console.log(`   Message ID: ${result.messageId}`);
      }
      
      // Crear o actualizar candidato (aunque el DM no se haya enviado)
      await this.updateCandidateFromInteraction(interaction, message, 'dm');
      
      return result;
    } catch (error) {
      console.error('   ❌ Error crítico enviando DM:', error.message);
      // No lanzar error para que el sistema no se rompa
      // Solo registrar el error y retornar un resultado simulado
      return {
        success: false,
        messageId: `msg_error_${Date.now()}`,
        recipientId: username,
        message,
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  // Responder como comentario
  async replyAsComment(interaction, message) {
    try {
      console.log(`\n   🔍 [REPLY-AS-COMMENT] Obteniendo Comment ID...`);
      
      // Obtener el ID real del comentario de Instagram desde los metadatos
      const commentId = interaction.metadata?.instagramCommentId;
      
      console.log(`   Comment ID desde metadata: ${commentId}`);
      console.log(`   Metadata completo:`, JSON.stringify(interaction.metadata, null, 2));
      
      if (!commentId || commentId === 'unknown' || commentId === null) {
        console.error(`\n   ❌ ERROR: Comment ID no disponible!`);
        console.error(`   Interaction ID: ${interaction._id}`);
        console.error(`   Post ID: ${interaction.postId}`);
        console.error(`   Metadata:`, JSON.stringify(interaction.metadata, null, 2));
        
        // Intentar obtener el ID desde el postId si es un formato válido
        if (interaction.postId && interaction.postId !== 'unknown') {
          console.log(`   ⚠️ Intentando usar postId como fallback: ${interaction.postId}`);
          // Esto no funcionará, pero al menos lo intentamos
        }
        
        throw new Error(`Comment ID no disponible. No se puede responder al comentario.`);
      }
      
      console.log(`   ✅ Comment ID válido: ${commentId}`);
      console.log(`   📤 Enviando mensaje: "${message}"`);
      console.log(`   📤 A Instagram Graph API...`);
      
      const result = await instagramService.replyToComment(commentId, message);
      
      console.log(`\n   ✅ RESPUESTA ENVIADA EXITOSAMENTE A INSTAGRAM!`);
      console.log(`   Comment ID: ${commentId}`);
      console.log(`   Reply ID: ${result.replyId || 'N/A'}`);
      console.log(`   Success: ${result.success}`);
      
      // Actualizar candidato
      await this.updateCandidateFromInteraction(interaction, message, 'reply');
      
      return result;
    } catch (error) {
      console.error(`\n   ❌ ERROR CRÍTICO EN REPLY-AS-COMMENT:`);
      console.error(`   Mensaje: ${error.message}`);
      console.error(`   Stack:`, error.stack);
      
      if (error.response) {
        console.error(`   API Response Status: ${error.response.status}`);
        console.error(`   API Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
      
      // Re-lanzar el error para que se capture en el nivel superior
      throw error;
    }
  }

  // Actualizar candidato desde interacción
  async updateCandidateFromInteraction(interaction, replyMessage, replyType) {
    try {
      let candidate = await Candidate.findOne({ 
        instagramHandle: interaction.user.toLowerCase() 
      });

      if (!candidate) {
        candidate = new Candidate({
          instagramHandle: interaction.user.toLowerCase(),
          name: interaction.user,
          engagementScore: 1
        });
      }

      // Agregar conversación
      candidate.conversations.push({
        message: replyMessage,
        type: replyType,
        timestamp: new Date(),
        sentiment: interaction.sentiment || 'neutral'
      });

      // Aumentar engagement
      candidate.engagementScore = Math.min(100, candidate.engagementScore + 2);

      await candidate.save();
    } catch (error) {
      console.error('Error updating candidate:', error);
    }
  }
}

export default new AutoReplyService();

