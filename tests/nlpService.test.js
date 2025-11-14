const nlpService = require('../src/services/nlpService');

describe('NLP Service', () => {
  describe('analyzeText', () => {
    test('should detect positive sentiment', async () => {
      const result = await nlpService.analyzeText('This is great work opportunity!');
      
      expect(result.sentiment).toBeDefined();
      expect(result.sentiment.isPositive || result.sentiment.score >= 0).toBe(true);
    });

    test('should detect job-related intent', async () => {
      const result = await nlpService.analyzeText('Estoy interesado en la vacante de trabajo');
      
      expect(result.intent.isJobRelated).toBe(true);
      expect(result.intent.topics).toContain('interesado');
      expect(result.intent.topics).toContain('vacante');
    });

    test('should detect interest intent', async () => {
      const result = await nlpService.analyzeText('Me interesa esta oportunidad');
      
      expect(result.intent.includesInterest).toBe(true);
    });

    test('should detect questions', async () => {
      const result = await nlpService.analyzeText('¿Cuáles son los requisitos?');
      
      expect(result.intent.includesQuestion).toBe(true);
    });

    test('should handle empty text', async () => {
      const result = await nlpService.analyzeText('');
      
      expect(result.sentiment.isNeutral).toBe(true);
      expect(result.text).toBe('');
    });

    test('should tokenize text correctly', async () => {
      const result = await nlpService.analyzeText('Busco trabajo en tecnología');
      
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
    });
  });

  describe('extractEntities', () => {
    test('should extract email addresses', () => {
      const text = 'Mi email es candidato@ejemplo.com';
      const entities = nlpService.extractEntities(text);
      
      expect(entities.emails).toContain('candidato@ejemplo.com');
    });

    test('should extract phone numbers', () => {
      const text = 'Mi teléfono es 555-1234';
      const entities = nlpService.extractEntities(text);
      
      expect(entities.phones.length).toBeGreaterThan(0);
    });
  });
});
