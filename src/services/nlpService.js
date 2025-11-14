const natural = require('natural');
const Sentiment = require('sentiment');
const config = require('../config');

/**
 * NLP Service
 * Provides natural language processing capabilities for analyzing comments and messages
 */
class NLPService {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    
    // Spanish language support (stemmer available but not required for basic functionality)
    this.stemmer = config.nlp.language === 'es' ? natural.PorterStemmerEs : natural.PorterStemmer;

    // Job-related keywords in Spanish
    this.jobKeywords = [
      'trabajo', 'empleo', 'vacante', 'oportunidad', 'puesto',
      'contratar', 'aplicar', 'postular', 'cv', 'curriculum',
      'experiencia', 'requisitos', 'salario', 'sueldo', 'horario',
      'interes', 'interesado', 'interesada', 'disponible', 'busco'
    ];

    // Question indicators
    this.questionIndicators = [
      'cómo', 'como', 'qué', 'que', 'cuál', 'cual', 'dónde', 'donde',
      'cuándo', 'cuando', 'por qué', 'porque', 'puedo', 'podría'
    ];
  }

  /**
   * Analyze text for sentiment and intent
   */
  async analyzeText(text) {
    if (!text) {
      return this.getDefaultAnalysis();
    }

    const lowerText = text.toLowerCase();
    
    // Sentiment analysis
    const sentimentResult = this.sentiment.analyze(text);
    
    // Tokenize text
    const tokens = this.tokenizer.tokenize(lowerText);

    // Intent detection
    const intent = this.detectIntent(lowerText, tokens);

    return {
      text,
      tokens,
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        positive: sentimentResult.positive,
        negative: sentimentResult.negative,
        isPositive: sentimentResult.score > 0,
        isNegative: sentimentResult.score < 0,
        isNeutral: sentimentResult.score === 0
      },
      intent,
      language: config.nlp.language
    };
  }

  /**
   * Detect user intent from text
   */
  detectIntent(text, _tokens) {
    const intent = {
      includesInterest: false,
      includesQuestion: false,
      isJobRelated: false,
      topics: []
    };

    // Check for job-related keywords
    const jobKeywordMatches = this.jobKeywords.filter(keyword => 
      text.includes(keyword)
    );
    intent.isJobRelated = jobKeywordMatches.length > 0;
    intent.topics = jobKeywordMatches;

    // Check for questions
    intent.includesQuestion = this.questionIndicators.some(indicator =>
      text.includes(indicator)
    );

    // Check for interest expressions
    const interestPhrases = [
      'me interesa', 'estoy interesado', 'estoy interesada',
      'quiero aplicar', 'quiero postular', 'deseo aplicar',
      'me gustaría', 'quisiera', 'enviar cv', 'mandar cv'
    ];
    intent.includesInterest = interestPhrases.some(phrase =>
      text.includes(phrase)
    );

    return intent;
  }

  /**
   * Extract entities from text
   */
  extractEntities(text) {
    // Simple entity extraction
    const entities = {
      emails: this.extractEmails(text),
      phones: this.extractPhones(text)
    };

    return entities;
  }

  /**
   * Extract email addresses
   */
  extractEmails(text) {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Extract phone numbers
   */
  extractPhones(text) {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
    return text.match(phoneRegex) || [];
  }

  /**
   * Default analysis for empty text
   */
  getDefaultAnalysis() {
    return {
      text: '',
      tokens: [],
      sentiment: {
        score: 0,
        comparative: 0,
        positive: [],
        negative: [],
        isPositive: false,
        isNegative: false,
        isNeutral: true
      },
      intent: {
        includesInterest: false,
        includesQuestion: false,
        isJobRelated: false,
        topics: []
      },
      language: config.nlp.language
    };
  }
}

module.exports = new NLPService();
