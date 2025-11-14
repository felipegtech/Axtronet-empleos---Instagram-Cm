/**
 * Response Service
 * Generates appropriate responses to Instagram interactions
 */
class ResponseService {
  constructor() {
    // Response templates in Spanish
    this.templates = {
      // Interest-based responses
      interest: [
        '¡Hola {username}! 😊 Nos encanta tu interés. Te enviaremos más información por mensaje directo.',
        'Gracias por tu interés, {username}! 🎉 Un miembro de nuestro equipo te contactará pronto.',
        '¡Excelente {username}! 🌟 Estamos emocionados de conocerte mejor. Revisa tus mensajes directos.'
      ],
      
      // Question responses
      question: [
        'Gracias por tu pregunta, {username}! 🤔 Te responderemos por mensaje directo.',
        'Buena pregunta, {username}! 💡 Te enviaremos la información completa por DM.',
        'Hola {username}, con gusto te ayudamos! 😊 Revisa tu bandeja de mensajes.'
      ],
      
      // Positive engagement
      positive: [
        '¡Gracias por tu comentario, {username}! 😊',
        'Nos alegra leerte, {username}! ✨',
        '¡Apreciamos tu participación, {username}! 🙌'
      ],
      
      // Job-related queries
      jobRelated: [
        '¡Hola {username}! 👋 Tenemos oportunidades que pueden interesarte. Te contactaremos pronto.',
        'Gracias por tu interés en nuestras vacantes, {username}! 💼 Revisaremos tu perfil.',
        '¡Genial {username}! 🚀 Estamos buscando talento como tú. Hablemos por mensaje directo.'
      ],
      
      // General acknowledgment
      general: [
        'Gracias por tu comentario, {username}! 😊',
        '¡Hola {username}! Gracias por interactuar con nosotros. 🌟',
        'Apreciamos tu participación, {username}! 👍'
      ]
    };

    // DM templates
    this.dmTemplates = {
      welcome: `¡Hola! 👋

Gracias por tu interés en Axtronet. Somos una empresa dedicada a conectar talento con oportunidades laborales.

¿En qué tipo de posición estás interesado/a?`,

      jobInquiry: `¡Gracias por tu interés! 💼

Actualmente tenemos varias oportunidades disponibles. Para brindarte la mejor información:

📝 ¿Podrías compartir tu área de experiencia?
⏰ ¿Estás buscando tiempo completo o medio tiempo?
📍 ¿Cuál es tu ubicación preferida?`,

      invitation: `¡Excelente noticia! 🎉

Hemos revisado tu perfil y creemos que podrías ser un gran candidato/a para nuestras oportunidades actuales.

¿Te gustaría que te enviemos más detalles sobre nuestro proceso de selección?`,

      general: `¡Gracias por contactarnos! 😊

Un miembro de nuestro equipo revisará tu mensaje y te responderá pronto.

Mientras tanto, síguenos para estar al tanto de nuestras ofertas laborales.`
    };
  }

  /**
   * Generate response based on NLP analysis
   */
  async generateResponse(analysis, username) {
    const { sentiment, intent } = analysis;

    // Select appropriate template category
    let category = 'general';

    if (intent.includesInterest) {
      category = 'interest';
    } else if (intent.includesQuestion) {
      category = 'question';
    } else if (intent.isJobRelated) {
      category = 'jobRelated';
    } else if (sentiment.isPositive) {
      category = 'positive';
    }

    // Get random template from category
    const templates = this.templates[category];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Replace username placeholder
    return template.replace('{username}', username);
  }

  /**
   * Generate DM response
   */
  async generateDMResponse(analysis) {
    const { intent } = analysis;

    if (intent.includesInterest) {
      return this.dmTemplates.invitation;
    } else if (intent.isJobRelated || intent.includesQuestion) {
      return this.dmTemplates.jobInquiry;
    }

    return this.dmTemplates.general;
  }

  /**
   * Generate invitation message
   */
  generateInvitationMessage(candidateName) {
    return `¡Hola ${candidateName}! 🎉

Hemos notado tu interés en Axtronet y nos gustaría invitarte a participar en nuestro proceso de selección.

Tu perfil y nivel de engagement demuestran que podrías ser un gran candidato/a.

¿Te gustaría conocer más detalles sobre las oportunidades disponibles?

📧 También puedes enviarnos tu CV a: rrhh@axtronet.com
🌐 O visitar: www.axtronet.com/empleos

¡Esperamos saber de ti pronto! 🚀`;
  }

  /**
   * Generate job posting message
   */
  generateJobPosting(jobData) {
    const { title, description, requirements, location, type } = jobData;

    return `🚀 ¡NUEVA OPORTUNIDAD LABORAL! 🚀

💼 Posición: ${title}
📍 Ubicación: ${location}
⏰ Tipo: ${type}

📝 Descripción:
${description}

✅ Requisitos:
${requirements.map(req => `• ${req}`).join('\n')}

¿Interesado/a? ¡Comenta "INFO" o envíanos un DM!

#Empleos #Trabajo #Oportunidad #${location.replace(/\s/g, '')}`;
  }

  /**
   * Generate follow-up message
   */
  generateFollowUpMessage(candidateName, daysInactive) {
    if (daysInactive <= 7) {
      return `Hola ${candidateName}! 👋

¿Aún estás interesado/a en nuestras oportunidades? Tenemos nuevas vacantes que podrían interesarte.`;
    } else {
      return `Hola ${candidateName}! 😊

Hace un tiempo mostraste interés en Axtronet. Queremos saber si aún estás en búsqueda activa de empleo.

Tenemos nuevas oportunidades que podrían ser perfectas para ti.`;
    }
  }
}

module.exports = new ResponseService();
