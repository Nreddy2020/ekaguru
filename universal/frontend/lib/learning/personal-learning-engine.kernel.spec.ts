import { PersonalLearningEngineKernel } from './personal-learning-engine.kernel';

describe('EKAGURU Universal Personal Learning Engine (Step 4 Multi-Subject Verification)', () => {
  let kernel: PersonalLearningEngineKernel;

  beforeEach(() => {
    kernel = new PersonalLearningEngineKernel();
  });

  // --------------------------------------------------------------------------
  // 1. EVS Golden Path: Sankranthi & Harvest Celebrations
  // --------------------------------------------------------------------------
  it('EVS: Page 1 (Sankranthi) -> Show/Teach/Try -> Go Deeper -> Fusion -> Safe Return to Page 2', () => {
    const learnerId = 'learner-evs-001';
    const { page, experience, decisionTrace } = kernel.openPage('Class5EVS', 1, learnerId);

    expect(page.position.bookTitle).toContain('Environmental Studies');
    expect(experience.concept.id).toBe('c-festivals-india');
    expect(experience.showMe.title).toBe('The Seed-to-Harvest Growth Chain');
    expect(decisionTrace.actionType).toBe('REINFORCE_FOUNDATION');

    // Evidence progression to mastery
    kernel.submitInteraction(learnerId, 'c-festivals-india', { dimension: 'RECALL', isCorrect: true });
    kernel.submitInteraction(learnerId, 'c-festivals-india', { dimension: 'REASONING', isCorrect: true });
    const r3 = kernel.submitInteraction(learnerId, 'c-festivals-india', { dimension: 'APPLICATION', isCorrect: true });
    expect(r3.updatedMastery.status).toBe('MASTERED');
    expect(r3.nextAction.actionType).toBe('ADVANCE_CURRICULUM_PAGE');

    // Dual-spine exploration
    const { session } = kernel.startExploration(learnerId, 'c-sun-seasons');
    const returnResult = kernel.returnToCurriculum(session.sessionId);
    expect(returnResult.nextPageToLoad).toBe(2);
  });

  // --------------------------------------------------------------------------
  // 2. SCIENCE Golden Path: Photosynthesis & Solar Energy
  // --------------------------------------------------------------------------
  it('SCIENCE: Page 12 (Photosynthesis) -> Show/Teach/Try -> Go Deeper -> Cosmic Photons -> Safe Return to Page 13', () => {
    const learnerId = 'learner-sci-002';
    const { page, experience, decisionTrace } = kernel.openPage('Class5Science', 12, learnerId);

    expect(page.position.bookTitle).toContain('General Science');
    expect(experience.concept.id).toBe('c-photosynthesis');
    expect(experience.showMe.title).toBe('The Photosynthesis Engine in Green Leaves');
    expect(experience.tryIt.question?.text).toContain('dark cupboard for two weeks');

    // Submit Science Evidence
    const r1 = kernel.submitInteraction(learnerId, 'c-photosynthesis', { dimension: 'REASONING', isCorrect: true });
    const r2 = kernel.submitInteraction(learnerId, 'c-photosynthesis', { dimension: 'APPLICATION', isCorrect: true });
    const r3 = kernel.submitInteraction(learnerId, 'c-photosynthesis', { dimension: 'RECALL', isCorrect: true });
    expect(r3.updatedMastery.status).toBe('MASTERED');

    // Dual-spine exploration to stellar fusion
    const { session } = kernel.startExploration(learnerId, 'c-solar-radiation');
    const returnResult = kernel.returnToCurriculum(session.sessionId);
    expect(returnResult.nextPageToLoad).toBe(13);
    expect(returnResult.message).toContain('Class 5 General Science Page 13');
  });

  // --------------------------------------------------------------------------
  // 3. MATHEMATICS Golden Path: Fractions, Partitioning & Percentages
  // --------------------------------------------------------------------------
  it('MATH: Page 24 (Fractions) -> Pizza Partitioning -> Ratios -> Percentages -> Safe Return to Page 25', () => {
    const learnerId = 'learner-math-003';
    const { page, experience, decisionTrace } = kernel.openPage('Class5Math', 24, learnerId);

    expect(page.position.bookTitle).toContain('Mathematics');
    expect(experience.concept.id).toBe('c-fractions-division');
    expect(experience.showMe.title).toContain('Pizza / Circle');
    expect(experience.tryIt.question?.text).toContain('cut into 8 equal slices');

    // Submit Math Evidence
    kernel.submitInteraction(learnerId, 'c-fractions-division', { dimension: 'APPLICATION', isCorrect: true });
    kernel.submitInteraction(learnerId, 'c-fractions-division', { dimension: 'REASONING', isCorrect: true });
    const r3 = kernel.submitInteraction(learnerId, 'c-fractions-division', { dimension: 'RECALL', isCorrect: true });
    expect(r3.updatedMastery.status).toBe('MASTERED');

    // Dual-spine exploration to NASA orbital ratios
    const { session } = kernel.startExploration(learnerId, 'c-ratios');
    const returnResult = kernel.returnToCurriculum(session.sessionId);
    expect(returnResult.nextPageToLoad).toBe(25);
    expect(returnResult.message).toContain('Class 5 Mathematics: Shapes & Numbers Page 25');
  });

  // --------------------------------------------------------------------------
  // 4. HISTORY Golden Path: Indus Valley Civilization & Urban Civil Hygiene
  // --------------------------------------------------------------------------
  it('HISTORY: Page 8 (Harappa) -> Grid Drainage -> Modern Engineering -> Safe Return to Page 9', () => {
    const learnerId = 'learner-hist-004';
    const { page, experience, decisionTrace } = kernel.openPage('Class6History', 8, learnerId);

    expect(page.position.bookTitle).toContain('Ancient Civilizations');
    expect(experience.concept.id).toBe('c-indus-urban-planning');
    expect(experience.showMe.title).toContain('Harappan City Grid');
    expect(experience.tryIt.question?.text).toContain('removable stone slabs');

    // Submit History Evidence
    kernel.submitInteraction(learnerId, 'c-indus-urban-planning', { dimension: 'REASONING', isCorrect: true });
    kernel.submitInteraction(learnerId, 'c-indus-urban-planning', { dimension: 'APPLICATION', isCorrect: true });
    const r3 = kernel.submitInteraction(learnerId, 'c-indus-urban-planning', { dimension: 'RECALL', isCorrect: true });
    expect(r3.updatedMastery.status).toBe('MASTERED');

    // Dual-spine exploration to Satellite Remote Sensing
    const { session } = kernel.startExploration(learnerId, 'c-civil-engineering');
    const returnResult = kernel.returnToCurriculum(session.sessionId);
    expect(returnResult.nextPageToLoad).toBe(9);
    expect(returnResult.message).toContain('Class 6 Our Pasts: Ancient Civilizations Page 9');
  });
});
