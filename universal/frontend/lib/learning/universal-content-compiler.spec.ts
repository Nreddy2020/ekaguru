import { UniversalContentCompiler, RawTextbookInput } from './universal-content-compiler';
import { EkaguruMindOrchestrator } from './ekaguru-mind.orchestrator';
import { PersonalLearningEngineKernel } from './personal-learning-engine.kernel';

describe('Universal Content Compiler & Zero-Code Ingestion Pipeline (Step 6)', () => {
  let mind: EkaguruMindOrchestrator;
  let kernel: PersonalLearningEngineKernel;

  beforeEach(() => {
    mind = new EkaguruMindOrchestrator();
    kernel = new PersonalLearningEngineKernel();
  });

  // ==========================================================================
  // Gates 6.0 - 6.5: Ingestion, Grounding, Validation, and Declarative Packaging
  // ==========================================================================
  it('Gates 6.0 - 6.5: Ingests brand new Class 6 Geography textbook through validation pipeline', () => {
    const rawInput: RawTextbookInput = {
      bookId: 'Class6Geography',
      bookTitle: 'Class 6 Earth Our Habitat: Geography',
      subjectName: 'Physical Geography & Earth Systems',
      domain: 'EARTH_SCIENCE',
      gradeLevel: 6,
      chapterNumber: 4,
      chapterTitle: 'Air: Atmosphere Layers & Weather Dynamics',
      printedPage: 34,
      pdfPage: 36,
      sequenceIndex: 34,
      rawText:
        'Our earth is surrounded by a huge blanket of air called atmosphere. All living beings depend on this atmosphere for their survival. The Troposphere is the most important layer where almost all weather phenomena like rainfall, fog and hailstorm occur.',
      pageBoundingBox: { x: 50, y: 120, width: 700, height: 950 },
    };

    const pkg = UniversalContentCompiler.compileAndPublish({
      raw: rawInput,
      conceptCandidate: {
        conceptId: 'c-atmosphere-layers',
        title: 'Atmospheric Layers & Weather Protection',
        tagline: 'The multi-layered gaseous shield sustaining terrestrial life',
        shortDefinition: 'The envelope of gases surrounding Earth, stratified into temperature layers.',
        detailedExplanation:
          'From the troposphere where weather brews to the stratosphere holding the ozone shield and the thermosphere stopping cosmic solar flares.',
        tags: ['atmosphere', 'troposphere', 'stratosphere', 'weather', 'ozone'],
        complexityLevel: 'FOUNDATIONAL',
        provenanceType: 'TEXTBOOK_SOURCE',
        sourceConfidence: 1.0,
      },
      learningObjectives: [
        {
          id: 'obj-geo-6-04',
          code: 'GEO-6-AIR-01',
          statement: 'Identify the layers of the atmosphere and understand why weather is confined to the troposphere',
          bloomLevel: 'UNDERSTAND',
          prerequisiteObjectiveIds: [],
        },
      ],
      showMe: {
        title: 'The 5 Thermal Blankets of Earth',
        visualMechanismSteps: [
          { icon: '☁️', label: '1. Troposphere (0-12 km)', detail: 'Dense air where 99% of clouds, rain, and storms brew' },
          { icon: '✈️', label: '2. Stratosphere (12-50 km)', detail: 'Calm air where jets cruise; contains the Ozone Layer' },
          { icon: '☄️', label: '3. Mesosphere (50-80 km)', detail: 'Friction burns incoming meteors into shooting stars' },
          { icon: '🌌', label: '4. Thermosphere (80-400 km)', detail: 'Home of the International Space Station & Auroras' },
        ],
      },
      teachMe: {
        socraticStepIndex: 0,
        totalSocraticSteps: 5,
        stageName: 'MEET_IDEA',
        groundedExplanation:
          'Think of the atmosphere as a 5-layer thermal jacket! The lowest layer keeps you breathing and brings rain, while the middle layers shield us from space meteors and harsh UV rays.',
        childAnalogy: 'Like diving into a pool, the deepest part (ground) has the thickest pressure, while high up it fades into space!',
        remediationMode: false,
      },
      tryIt: {
        activityType: 'HANDS_ON_EXPERIMENT',
        question: {
          text: 'Why do commercial jet aircraft fly in the lower Stratosphere rather than the Troposphere?',
          options: [
            'Because the stratosphere has no stormy weather or strong turbulence, allowing smooth flight',
            'Because airplanes cannot fly where there is gravity',
            'Because birds push airplanes out of the troposphere',
            'Because the troposphere is too hot for airplane metal',
          ],
          correctIndex: 0,
          explanation: 'The Stratosphere is above the turbulent troposphere clouds, providing smooth, fuel-efficient cruising conditions.',
        },
        handsOnExperiment: {
          title: '🚰 The Inverted Cup Air Pressure Trick',
          objective: 'Prove that invisible atmospheric air exerts immense upward pressure',
          rewardBadge: '🌪️ Atmospheric Physicist',
        },
      },
      goDeeper: {
        currentConceptId: 'c-atmosphere-layers',
        universeConstellation: [
          {
            realmId: 'node-ozone-shield',
            realmName: '🛡️ Stratospheric Ozone Shield',
            icon: '🛡️',
            provenance: 'CURRICULUM_DERIVED',
            tagline: 'UV-C radiation filtration',
            shortDescription: 'How 3-atom oxygen molecules block lethal ultraviolet radiation.',
            targetNodeId: 'c-ozone-shield',
          },
          {
            realmId: 'node-aurora-borealis',
            realmName: '🌌 Auroras & Solar Wind',
            icon: '🌌',
            provenance: 'EXTERNAL_KNOWLEDGE',
            tagline: 'Solar magnetospheric collisions',
            shortDescription: 'How Earth magnetic poles channel energetic particles into glowing green curtains.',
            targetNodeId: 'c-aurora-solar-wind',
          },
        ],
        cosmicTelescope: {
          question: 'Why does Mars have almost no atmosphere while Venus is crushed by super-dense gas?',
          answer:
            'Mars lost its core magnetic field billion years ago, allowing the Solar Wind to strip its air away. Venus has immense volcanic CO2 creating a runaway 460 °C greenhouse!',
          cosmicDomain: 'COMPARATIVE PLANETARY SCIENCE',
        },
      },
    });

    expect(pkg.stage).toBe('PUBLISHED');
    expect(pkg.validationReport.isValid).toBe(true);
    expect(pkg.sourceAnchor.printedPage).toBe(34);
    expect(pkg.sourceAnchor.pdfPage).toBe(36);
    expect(pkg.primaryConcept.provenance.type).toBe('TEXTBOOK_SOURCE');
  });

  // ==========================================================================
  // Gate 6.6 & 6.7: Zero-Code Execution on Universal Kernel & Mind
  // ==========================================================================
  it('Gates 6.6 & 6.7: Executes new Class 6 Geography book on Universal Mind & Kernel with ZERO engine changes', () => {
    const learnerId = 'learner-geo-006';

    // 1. Mind assembles context dynamically for newly registered book
    const { page, experience, decisionTrace } = mind.assembleLearnerContext(
      'Class6Geography',
      34,
      learnerId
    );

    expect(page.position.bookTitle).toContain('Geography');
    expect(page.position.printedPage).toBe(34);
    expect(page.position.pdfPage).toBe(36);
    expect(experience.concept.id).toBe('c-atmosphere-layers');
    expect(experience.showMe.visualMechanismSteps).toHaveLength(4);
    expect(decisionTrace.curriculumContext).toContain('Chapter 4, Printed Page 34');

    // 2. Submit multi-dimensional interactions to achieve empirical mastery
    mind.submitInteraction(learnerId, 'c-atmosphere-layers', { dimension: 'RECALL', isCorrect: true });
    mind.submitInteraction(learnerId, 'c-atmosphere-layers', { dimension: 'APPLICATION', isCorrect: true });
    const r3 = mind.submitInteraction(learnerId, 'c-atmosphere-layers', { dimension: 'REASONING', isCorrect: true });

    expect(r3.updatedMastery.status).toBe('MASTERED');
    expect(r3.nextAction.actionType).toBe('ADVANCE_CURRICULUM_PAGE');

    // 3. Dual-Spine Exploration into Planetary Science & Safe Return
    const { session } = mind.startExploration(learnerId, 'c-aurora-solar-wind');
    expect(session.status).toBe('ACTIVE');
    expect(session.originCurriculumPosition.printedPage).toBe(34);
    expect(session.nextCurriculumPageOnComplete).toBe(35);

    const returnResult = mind.returnToCurriculum(session.sessionId);
    expect(returnResult.session.status).toBe('COMPLETED');
    expect(returnResult.nextPageToLoad).toBe(35);
    expect(returnResult.restoredPosition.printedPage).toBe(35);
  });
});
