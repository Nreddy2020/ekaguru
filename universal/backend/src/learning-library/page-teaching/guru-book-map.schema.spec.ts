import {
  validateBookKnowledgeMap,
  queryTopicDependencies,
  BookKnowledgeMap,
} from './guru-book-map.schema';

describe('guru-book-map.schema', () => {
  const sampleMap: BookKnowledgeMap = {
    version: 'book-map-v1',
    bookId: 'evs-class-5',
    title: 'Environmental Studies Class 5',
    totalPages: 116,
    generatedAt: new Date().toISOString(),
    chapters: [
      {
        chapterNumber: 1,
        title: 'Super Senses & Growth',
        pageStart: 1,
        pageEnd: 10,
        topics: [
          {
            topicId: 't-growth-stages',
            title: 'Stages of Plant Growth',
            physicalPage: 3,
            summary: 'Seeds germinate into sprouts before growing into adult plants.',
            keyTerms: ['Germination', 'Seedling'],
          },
          {
            topicId: 't-water-light',
            title: 'Water and Sunlight for Growth',
            physicalPage: 4,
            summary: 'Plants require moisture and sunlight to photosynthesize.',
            keyTerms: ['Photosynthesis', 'Moisture'],
          },
        ],
      },
      {
        chapterNumber: 2,
        title: 'Community Living',
        pageStart: 44,
        pageEnd: 55,
        topics: [
          {
            topicId: 't-public-services',
            title: 'Public Services in Neighborhood',
            physicalPage: 46,
            summary: 'Public services provide emergency safety, healthcare, and mail.',
            keyTerms: ['Post Office', 'Hospital', 'Police Station'],
          },
        ],
      },
    ],
    keyTerms: [
      {
        term: 'Germination',
        definition: 'Process by which an organism grows from a seed',
        introducedOnPage: 3,
        page: 3,
        chapterNumber: 1,
      },
    ],
    dependencies: [
      {
        id: 'dep-1',
        sourceTopicId: 't-growth-stages',
        sourceTopicTitle: 'Stages of Plant Growth',
        sourcePage: 3,
        targetTopicId: 't-water-light',
        targetTopicTitle: 'Water and Sunlight for Growth',
        targetPage: 4,
        reason: 'Understanding basic seed sprouting is required before learning photosynthesis.',
        strength: 'essential',
      },
    ],
  };

  it('validates a correct BookKnowledgeMap', () => {
    const result = validateBookKnowledgeMap(sampleMap);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects invalid version and missing fields', () => {
    const result = validateBookKnowledgeMap({
      ...sampleMap,
      version: 'invalid-v2',
      bookId: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
    expect(result.errors.some((e) => e.includes('bookId'))).toBe(true);
  });

  it('rejects inverted chapter page intervals', () => {
    const invalidInterval: BookKnowledgeMap = {
      ...sampleMap,
      chapters: [
        {
          chapterNumber: 1,
          title: 'Inverted',
          pageStart: 25,
          pageEnd: 10,
          topics: [],
        },
      ],
    };
    const result = validateBookKnowledgeMap(invalidInterval);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid page interval'))).toBe(true);
  });

  it('rejects duplicate topic IDs', () => {
    const duplicateMap: BookKnowledgeMap = {
      ...sampleMap,
      chapters: [
        {
          chapterNumber: 1,
          title: 'Ch 1',
          pageStart: 1,
          pageEnd: 5,
          topics: [
            {
              topicId: 'dup-1',
              title: 'First',
              physicalPage: 2,
              summary: '',
              keyTerms: [],
            },
            {
              topicId: 'dup-1',
              title: 'Duplicate',
              physicalPage: 3,
              summary: '',
              keyTerms: [],
            },
          ],
        },
      ],
    };
    const result = validateBookKnowledgeMap(duplicateMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate topicId'))).toBe(true);
  });

  it('rejects dependency links with non-existent topics', () => {
    const badDepMap: BookKnowledgeMap = {
      ...sampleMap,
      dependencies: [
        {
          id: 'bad-dep',
          sourceTopicId: 't-growth-stages',
          sourceTopicTitle: '',
          sourcePage: 3,
          targetTopicId: 'non-existent-topic',
          targetTopicTitle: '',
          targetPage: 15,
          reason: 'Reason',
          strength: 'essential',
        },
      ],
    };
    const result = validateBookKnowledgeMap(badDepMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('unknown targetTopicId'))).toBe(true);
  });

  it('rejects self-loops (source == target)', () => {
    const selfLoopMap: BookKnowledgeMap = {
      ...sampleMap,
      dependencies: [
        {
          id: 'self-loop',
          sourceTopicId: 't-growth-stages',
          sourceTopicTitle: '',
          sourcePage: 3,
          targetTopicId: 't-growth-stages',
          targetTopicTitle: '',
          targetPage: 3,
          reason: 'Self dependency',
          strength: 'essential',
        },
      ],
    };
    const result = validateBookKnowledgeMap(selfLoopMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('self-dependency loop'))).toBe(true);
  });

  it('rejects reverse page prerequisites (source page > target page)', () => {
    const backwardsMap: BookKnowledgeMap = {
      ...sampleMap,
      dependencies: [
        {
          id: 'backwards',
          sourceTopicId: 't-public-services',
          sourceTopicTitle: '',
          sourcePage: 46,
          targetTopicId: 't-growth-stages',
          targetTopicTitle: '',
          targetPage: 3,
          reason: 'Future concept cannot be prerequisite for earlier concept',
          strength: 'essential',
        },
      ],
    };
    const result = validateBookKnowledgeMap(backwardsMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('violates prerequisite ordering'))).toBe(true);
  });

  it('detects cycles in concept dependency graph (DAG enforcement)', () => {
    const cyclicMap: BookKnowledgeMap = {
      ...sampleMap,
      chapters: [
        {
          chapterNumber: 1,
          title: 'Cycle Chapter',
          pageStart: 1,
          pageEnd: 10,
          topics: [
            { topicId: 't1', title: 'T1', physicalPage: 2, summary: '', keyTerms: [] },
            { topicId: 't2', title: 'T2', physicalPage: 2, summary: '', keyTerms: [] },
            { topicId: 't3', title: 'T3', physicalPage: 2, summary: '', keyTerms: [] },
          ],
        },
      ],
      dependencies: [
        {
          id: 'd1',
          sourceTopicId: 't1',
          sourceTopicTitle: '',
          sourcePage: 2,
          targetTopicId: 't2',
          targetTopicTitle: '',
          targetPage: 2,
          reason: '',
          strength: 'essential',
        },
        {
          id: 'd2',
          sourceTopicId: 't2',
          sourceTopicTitle: '',
          sourcePage: 2,
          targetTopicId: 't3',
          targetTopicTitle: '',
          targetPage: 2,
          reason: '',
          strength: 'essential',
        },
        {
          id: 'd3',
          sourceTopicId: 't3',
          sourceTopicTitle: '',
          sourcePage: 2,
          targetTopicId: 't1',
          targetTopicTitle: '',
          targetPage: 2,
          reason: '',
          strength: 'essential',
        },
      ],
    };
    const result = validateBookKnowledgeMap(cyclicMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
  });

  describe('queryTopicDependencies', () => {
    it('returns prerequisites, downstream impacts, and revisit recommendation', () => {
      const view = queryTopicDependencies(sampleMap, 't-water-light');
      expect(view).not.toBeNull();
      expect(view?.topicTitle).toBe('Water and Sunlight for Growth');
      expect(view?.prerequisites.length).toBe(1);
      expect(view?.prerequisites[0].topicId).toBe('t-growth-stages');
      expect(view?.prerequisites[0].page).toBe(3);
      expect(view?.revisitRecommendation?.page).toBe(3);
      expect(view?.revisitRecommendation?.topicId).toBe('t-growth-stages');
    });

    it('returns empty prerequisites for root topic and lists its dependents', () => {
      const view = queryTopicDependencies(sampleMap, 't-growth-stages');
      expect(view).not.toBeNull();
      expect(view?.prerequisites.length).toBe(0);
      expect(view?.dependents.length).toBe(1);
      expect(view?.dependents[0].topicId).toBe('t-water-light');
      expect(view?.revisitRecommendation).toBeUndefined();
    });

    it('returns null for unknown topic ID', () => {
      const view = queryTopicDependencies(sampleMap, 'unknown-id');
      expect(view).toBeNull();
    });
  });
});
