import { GuruBookMapService } from './guru-book-map.service';
import { PrismaService } from '../prisma.service';

describe('GuruBookMapService', () => {
  let service: GuruBookMapService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      guruBookMap: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
      },
      guruPageNotes: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new GuruBookMapService(mockPrisma as PrismaService);
  });

  it('builds a structured knowledge map for evs-class-5 with chapters and dependencies', async () => {
    const map = await service.getOrBuildBookMap('evs-class-5');

    expect(map.version).toBe('book-map-v1');
    expect(map.bookId).toBe('evs-class-5');
    expect(map.title).toContain('Environmental Studies');
    expect(map.chapters.length).toBeGreaterThanOrEqual(2);
    expect(map.keyTerms.length).toBeGreaterThanOrEqual(2);
    expect(map.dependencies.length).toBeGreaterThanOrEqual(1);

    // Verify upsert was called to persist
    expect(mockPrisma.guruBookMap.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookId: 'evs-class-5' },
      })
    );
  });

  it('returns cached book map without recalculation when available', async () => {
    const cachedPayload = {
      version: 'book-map-v1',
      bookId: 'evs-class-5',
      title: 'Cached Title',
      totalPages: 116,
      chapters: [],
      keyTerms: [],
      dependencies: [],
      generatedAt: new Date().toISOString(),
    };

    mockPrisma.guruBookMap.findUnique.mockResolvedValueOnce({
      bookId: 'evs-class-5',
      payload: cachedPayload,
    });

    const result = await service.getOrBuildBookMap('evs-class-5');
    expect(result.title).toBe('Cached Title');
    expect(mockPrisma.guruBookMap.upsert).not.toHaveBeenCalled();
  });

  it('queries dependencies for a specific topic', async () => {
    const depView = await service.getTopicDependencies('evs-class-5', 't-evs-p3-growth');

    expect(depView).toBeDefined();
    expect(depView.topicId).toBe('t-evs-p3-growth');
    expect(depView.prerequisites.length).toBeGreaterThanOrEqual(1);
    expect(depView.prerequisites[0].topicId).toBe('t-evs-p2-senses');
    expect(depView.revisitRecommendation?.page).toBe(2);
  });

  it('provides diagnostic revisit guidance when a student struggles on page 3', async () => {
    const guidance = await service.getRevisitGuidance('evs-class-5', 3);

    expect(guidance.currentPage).toBe(3);
    expect(guidance.hasPrerequisite).toBe(true);
    expect(guidance.recommendedPage).toBe(2);
    expect(guidance.prerequisiteTopicTitle).toBe('How Animals Use Their Senses');
    expect(guidance.reason).toContain('Foundational knowledge');
  });

  it('provides foundational guidance for root page with no earlier prerequisite', async () => {
    const guidance = await service.getRevisitGuidance('evs-class-5', 2);

    expect(guidance.currentPage).toBe(2);
    expect(guidance.hasPrerequisite).toBe(false);
    expect(guidance.recommendedPage).toBe(2);
    expect(guidance.reason).toContain('foundational concepts');
  });
});
