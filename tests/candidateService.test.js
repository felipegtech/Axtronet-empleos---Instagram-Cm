const candidateService = require('../src/services/candidateService');

describe('Candidate Service', () => {
  beforeEach(() => {
    // Clear candidates before each test
    candidateService.candidates.clear();
  });

  describe('trackInteraction', () => {
    test('should create new candidate on first interaction', async () => {
      const interaction = {
        userId: 'user123',
        username: 'testuser',
        type: 'comment',
        text: 'Me interesa el trabajo',
        sentiment: { score: 1, isPositive: true },
        intent: { includesInterest: true, isJobRelated: true }
      };

      const candidate = await candidateService.trackInteraction(interaction);

      expect(candidate).toBeDefined();
      expect(candidate.username).toBe('testuser');
      expect(candidate.interactions.length).toBe(1);
      expect(candidate.engagementScore).toBeGreaterThan(0);
    });

    test('should update existing candidate', async () => {
      // First interaction
      await candidateService.trackInteraction({
        userId: 'user123',
        username: 'testuser',
        type: 'comment',
        text: 'Hola',
        sentiment: { score: 0 },
        intent: { includesInterest: false }
      });

      // Second interaction
      const candidate = await candidateService.trackInteraction({
        userId: 'user123',
        username: 'testuser',
        type: 'mention',
        text: 'Me interesa',
        sentiment: { score: 1, isPositive: true },
        intent: { includesInterest: true, isJobRelated: true }
      });

      expect(candidate.interactions.length).toBe(2);
    });

    test('should calculate engagement score correctly', async () => {
      const interaction = {
        userId: 'user123',
        username: 'testuser',
        type: 'dm',
        text: 'Me interesa la vacante',
        sentiment: { isPositive: true },
        intent: { includesInterest: true, isJobRelated: true }
      };

      const candidate = await candidateService.trackInteraction(interaction);

      // DM (4) + positive sentiment (1) + interest (3) + job-related (2) = 10
      expect(candidate.engagementScore).toBe(10);
    });
  });

  describe('inviteCandidate', () => {
    test('should invite candidate successfully', async () => {
      // Create candidate
      await candidateService.trackInteraction({
        userId: 'user123',
        username: 'testuser',
        type: 'comment',
        text: 'Hola'
      });

      const candidate = await candidateService.getCandidateByUserId('user123');
      const invited = await candidateService.inviteCandidate(candidate.id);

      expect(invited.status).toBe('invited');
      expect(invited.invitedAt).toBeDefined();
    });

    test('should not invite already invited candidate', async () => {
      await candidateService.trackInteraction({
        userId: 'user123',
        username: 'testuser',
        type: 'comment',
        text: 'Hola'
      });

      const candidate = await candidateService.getCandidateByUserId('user123');
      await candidateService.inviteCandidate(candidate.id);
      const result = await candidateService.inviteCandidate(candidate.id);

      expect(result.status).toBe('invited');
    });
  });

  describe('getEngagementStats', () => {
    test('should return correct statistics', async () => {
      // Create multiple candidates
      await candidateService.trackInteraction({
        userId: 'user1',
        username: 'user1',
        type: 'comment',
        text: 'Hola'
      });

      await candidateService.trackInteraction({
        userId: 'user2',
        username: 'user2',
        type: 'dm',
        text: 'Me interesa',
        sentiment: { isPositive: true },
        intent: { includesInterest: true }
      });

      const stats = await candidateService.getEngagementStats();

      expect(stats.totalCandidates).toBe(2);
      expect(stats.averageEngagementScore).toBeGreaterThan(0);
      expect(stats.topCandidates.length).toBeLessThanOrEqual(10);
    });
  });
});
