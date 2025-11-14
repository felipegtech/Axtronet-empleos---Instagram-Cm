// Servicio de NLP avanzado para análisis de sentimiento y extracción de información

class NLPService {
  // Palabras clave para análisis de sentimiento
  positiveWords = [
    'gracias', 'excelente', 'bueno', 'genial', 'perfecto', 'me encanta', 'interesado',
    'vacante', 'empleo', 'trabajo', 'sueldo', 'salario', 'beneficios', 'oportunidad',
    'quiero', 'me gusta', 'fascinante', 'impresionante', 'increíble', 'fantástico',
    'sí', 'por favor', 'contactar', 'información', 'detalles', 'proceso', 'entrevista'
  ];

  negativeWords = [
    'malo', 'horrible', 'no', 'rechazo', 'problema', 'error', 'mal', 'terrible',
    'descontento', 'insatisfecho', 'cancelar', 'no quiero', 'no me interesa',
    'spam', 'molesto', 'cansado', 'aburrido'
  ];

  jobKeywords = [
    'vacante', 'empleo', 'trabajo', 'puesto', 'cargo', 'oportunidad laboral',
    'contrato', 'sueldo', 'salario', 'beneficios', 'horario', 'remoto', 'presencial',
    'tiempo completo', 'medio tiempo', 'freelance', 'proyecto', 'equipo', 'empresa'
  ];

  interestKeywords = [
    'interesado', 'quiero', 'me gusta', 'información', 'detalles', 'más info',
    'contactar', 'hablar', 'conversar', 'aplicar', 'postular', 'candidato'
  ];

  // Análisis de sentimiento avanzado
  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    // Contar palabras positivas
    this.positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        positiveCount += matches.length;
        score += matches.length;
      }
    });

    // Contar palabras negativas
    this.negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        negativeCount += matches.length;
        score -= matches.length;
      }
    });

    // Determinar sentimiento
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  // Extraer palabras clave relacionadas con trabajo
  extractJobKeywords(text) {
    const lowerText = text.toLowerCase();
    const found = [];

    this.jobKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        found.push(keyword);
      }
    });

    return found;
  }

  // Detectar si hay interés en trabajo
  detectJobInterest(text) {
    const lowerText = text.toLowerCase();
    const interestKeywords = this.interestKeywords;
    
    for (const keyword of interestKeywords) {
      if (lowerText.includes(keyword)) {
        return true;
      }
    }

    // Verificar combinaciones comunes
    const patterns = [
      /quiero\s+(aplicar|postular|trabajar)/i,
      /me\s+interesa\s+(el|la|este)/i,
      /más\s+información/i,
      /cómo\s+aplicar/i,
      /dónde\s+enviar/i
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  // Extraer información demográfica e interés
  extractDemographicInfo(text) {
    const lowerText = text.toLowerCase();
    const info = {
      age: null,
      location: null,
      interests: [],
      experience: null
    };

    // Detectar edad (patrones simples)
    const agePattern = /(\d{2})\s*(años|año)/i;
    const ageMatch = text.match(agePattern);
    if (ageMatch) {
      info.age = parseInt(ageMatch[1]);
    }

    // Detectar ubicación (ciudades comunes en México)
    const cities = ['cdmx', 'ciudad de méxico', 'guadalajara', 'monterrey', 'puebla', 'tijuana'];
    cities.forEach(city => {
      if (lowerText.includes(city)) {
        info.location = city;
      }
    });

    // Detectar áreas de interés
    const areas = ['desarrollo', 'programación', 'diseño', 'marketing', 'ventas', 'rrhh', 'recursos humanos'];
    areas.forEach(area => {
      if (lowerText.includes(area)) {
        info.interests.push(area);
      }
    });

    // Detectar experiencia
    const experiencePattern = /(\d+)\s*(años|año)\s*(de\s*)?(experiencia|experiencia laboral)/i;
    const expMatch = text.match(experiencePattern);
    if (expMatch) {
      info.experience = parseInt(expMatch[1]);
    }

    return info;
  }

  // Detectar temas mencionados
  extractTopics(text) {
    const lowerText = text.toLowerCase();
    const topics = [];

    const topicMap = {
      'salario': ['sueldo', 'salario', 'pago', 'remuneración'],
      'beneficios': ['beneficios', 'prestaciones', 'seguro', 'vacaciones'],
      'horario': ['horario', 'jornada', 'tiempo', 'flexible'],
      'remoto': ['remoto', 'home office', 'trabajo desde casa', 'teletrabajo'],
      'equipo': ['equipo', 'trabajo en equipo', 'colaboración'],
      'cultura': ['cultura', 'ambiente', 'empresa', 'organización']
    };

    Object.keys(topicMap).forEach(topic => {
      topicMap[topic].forEach(keyword => {
        if (lowerText.includes(keyword)) {
          topics.push(topic);
        }
      });
    });

    return [...new Set(topics)]; // Eliminar duplicados
  }

  // Generar respuesta inteligente basada en contexto
  generateSmartResponse(text, sentiment, context = {}) {
    const lowerText = text.toLowerCase();
    
    // Respuestas para interés en trabajo
    if (this.detectJobInterest(text)) {
      if (sentiment === 'positive') {
        return {
          message: '¡Hola! 👋 Nos encanta que estés interesado en nuestra oferta. Nuestro equipo revisará tu perfil y te contactaremos pronto. ¿Tienes alguna pregunta específica? 💼',
          shouldMoveToDM: true,
          priority: 'high'
        };
      }
    }

    // Respuestas para preguntas sobre salario
    if (lowerText.includes('sueldo') || lowerText.includes('salario')) {
      return {
        message: 'Gracias por tu interés. El salario se discute según el perfil y experiencia. ¿Te gustaría que te contactemos por DM para más detalles? 💰',
        shouldMoveToDM: true,
        priority: 'medium'
      };
    }

    // Respuestas para preguntas sobre beneficios
    if (lowerText.includes('beneficios') || lowerText.includes('prestaciones')) {
      return {
        message: 'Ofrecemos un paquete completo de beneficios. Te enviaré más información por DM. 📋',
        shouldMoveToDM: true,
        priority: 'medium'
      };
    }

    // Respuestas según sentimiento
    if (sentiment === 'positive') {
      return {
        message: '¡Gracias por tu comentario! 😊 Si tienes interés en nuestras oportunidades, déjanos un DM. 🚀',
        shouldMoveToDM: false,
        priority: 'low'
      };
    }

    if (sentiment === 'negative') {
      return {
        message: 'Lamentamos tu experiencia. Por favor, contáctanos por DM para resolver esto de manera personalizada. 🙏',
        shouldMoveToDM: true,
        priority: 'high'
      };
    }

    // Respuesta por defecto
    return {
      message: '¡Hola @usuario! 😊 Gracias por tu interés en el proceso. Nuestro equipo te contactará pronto.',
      shouldMoveToDM: false,
      priority: 'medium'
    };
  }

  // Analizar interacción completa
  analyzeInteraction(interaction) {
    const text = interaction.message || '';
    const sentiment = this.analyzeSentiment(text);
    const jobInterest = this.detectJobInterest(text);
    const jobKeywords = this.extractJobKeywords(text);
    const topics = this.extractTopics(text);
    const demographic = this.extractDemographicInfo(text);
    const smartResponse = this.generateSmartResponse(text, sentiment, { jobInterest, topics });

    return {
      sentiment,
      jobInterest,
      jobKeywords,
      topics,
      demographic,
      smartResponse,
      priority: smartResponse.priority
    };
  }
}

export default new NLPService();

