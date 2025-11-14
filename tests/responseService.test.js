const responseService = require('../src/services/responseService');

describe('Response Service', () => {
  describe('generateResponse', () => {
    test('should generate interest response', async () => {
      const analysis = {
        sentiment: { score: 1, isPositive: true },
        intent: { includesInterest: true, isJobRelated: true }
      };

      const response = await responseService.generateResponse(analysis, 'testuser');

      expect(response).toContain('testuser');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should generate question response', async () => {
      const analysis = {
        sentiment: { score: 0, isNeutral: true },
        intent: { includesQuestion: true, isJobRelated: false }
      };

      const response = await responseService.generateResponse(analysis, 'testuser');

      expect(response).toContain('testuser');
    });

    test('should generate job-related response', async () => {
      const analysis = {
        sentiment: { score: 1, isPositive: true },
        intent: { isJobRelated: true, includesInterest: false }
      };

      const response = await responseService.generateResponse(analysis, 'testuser');

      expect(response).toContain('testuser');
    });

    test('should generate positive response', async () => {
      const analysis = {
        sentiment: { score: 2, isPositive: true },
        intent: { isJobRelated: false, includesInterest: false }
      };

      const response = await responseService.generateResponse(analysis, 'testuser');

      expect(response).toContain('testuser');
    });
  });

  describe('generateDMResponse', () => {
    test('should generate invitation DM for interested users', async () => {
      const analysis = {
        intent: { includesInterest: true }
      };

      const response = await responseService.generateDMResponse(analysis);

      expect(response).toContain('Excelente noticia');
    });

    test('should generate job inquiry DM', async () => {
      const analysis = {
        intent: { isJobRelated: true, includesQuestion: true }
      };

      const response = await responseService.generateDMResponse(analysis);

      expect(response).toContain('oportunidades');
    });
  });

  describe('generateInvitationMessage', () => {
    test('should generate personalized invitation', () => {
      const message = responseService.generateInvitationMessage('Juan');

      expect(message).toContain('Juan');
      expect(message).toContain('invitarte');
    });
  });

  describe('generateJobPosting', () => {
    test('should generate complete job posting', () => {
      const jobData = {
        title: 'Desarrollador Full Stack',
        description: 'Buscamos desarrollador con experiencia',
        requirements: ['JavaScript', 'Node.js', 'React'],
        location: 'Remote',
        type: 'Tiempo Completo'
      };

      const posting = responseService.generateJobPosting(jobData);

      expect(posting).toContain('Desarrollador Full Stack');
      expect(posting).toContain('JavaScript');
      expect(posting).toContain('Remote');
    });
  });
});
