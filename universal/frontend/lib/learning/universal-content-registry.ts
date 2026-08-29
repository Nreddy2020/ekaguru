/**
 * ============================================================================
 * EKAGURU UNIVERSAL CONTENT REGISTRY (STEP 4)
 * ============================================================================
 * 
 * Declarative configuration for multi-subject learning domains:
 * 1. EVS: Festivals & Harvest Celebrations
 * 2. SCIENCE: Plant Growth, Photosynthesis & Solar Energy
 * 3. MATHEMATICS: Fractions, Division, Ratio & Percentages
 * 4. HISTORY: Indus Valley Civilization, Urban Drainage & Modern Civil Engineering
 * 
 * Invariant: The learning engine kernel contains ZERO domain-specific code.
 */

import {
  CurriculumPosition,
  TextbookPage,
  KnowledgeNode,
  LearningObjective,
  ShowMeExperience,
  TeachMeExperience,
  TryItExperience,
  GoDeeperExperience,
} from './personal-learning-engine.contracts';

export interface SubjectModuleDefinition {
  subjectId: string;
  subjectTitle: string;
  domain: 'BIOLOGY' | 'PHYSICS' | 'ASTRONOMY' | 'EARTH_SCIENCE' | 'MATHEMATICS' | 'CULTURE_HISTORY' | 'COMMUNITY_LIFE_SKILLS';
  gradeLevel: number;
  bookId: string;
  bookTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  printedPage: number;
  pdfPage: number;
  sequenceIndex: number;
  rawTextExcerpt: string;
  sourceAnchorText: string;
  primaryConcept: KnowledgeNode;
  learningObjectives: LearningObjective[];
  showMe: ShowMeExperience;
  teachMe: TeachMeExperience;
  tryIt: TryItExperience;
  goDeeper: GoDeeperExperience;
}

export class UniversalContentRegistry {
  private static modules: Map<string, SubjectModuleDefinition> = new Map();

  static {
    // ------------------------------------------------------------------------
    // 1. EVS: Festivals & Harvest Celebrations
    // ------------------------------------------------------------------------
    UniversalContentRegistry.register({
      subjectId: 'evs-festivals',
      subjectTitle: 'Environmental Studies (EVS)',
      domain: 'CULTURE_HISTORY',
      gradeLevel: 5,
      bookId: 'Class5EVS',
      bookTitle: 'Class 5 Environmental Studies (EVS)',
      chapterNumber: 1,
      chapterTitle: 'Festivals of India & Community Life',
      printedPage: 1,
      pdfPage: 2,
      sequenceIndex: 1,
      rawTextExcerpt: 'India is a land of festivals... Sankranthi is a popular harvest festival. Many people make colourful muggu at the entrance of their houses and fly colourful kites.',
      sourceAnchorText: 'Class 5 EVS Page 1 (Spread 2)',
      primaryConcept: {
        id: 'c-festivals-india',
        title: 'Sankranthi & Harvest Celebrations',
        domain: 'CULTURE_HISTORY',
        tagline: 'Connecting solar transit, farming harvest, and human gratitude',
        shortDefinition: 'A major harvest festival celebrating the bounty of crops and the movement of the sun.',
        detailedExplanation: 'Sankranthi marks the transition of the Sun into warmer northern skies and celebrates months of farming labor yielding food to sustain communities.',
        provenance: {
          type: 'TEXTBOOK_SOURCE',
          sourceName: 'Class 5 EVS Page 1 (Spread 2)',
          confidence: 1.0,
          retrievedAt: new Date().toISOString(),
          ageAppropriateRating: 'CLASS_4_5',
        },
        gradeLevel: 5,
        complexityLevel: 'FOUNDATIONAL',
        tags: ['harvest', 'sun', 'agriculture', 'community'],
      },
      learningObjectives: [
        {
          id: 'obj-evs-5-01',
          code: 'EVS-5-HARVEST-01',
          statement: 'Understand the connection between solar seasons, agriculture harvest, and cultural celebrations',
          bloomLevel: 'UNDERSTAND',
          prerequisiteObjectiveIds: [],
        },
      ],
      showMe: {
        title: 'The Seed-to-Harvest Growth Chain',
        visualMechanismSteps: [
          { icon: '🌱', label: 'Seed in Soil', detail: 'Sprouts roots to absorb water and minerals' },
          { icon: '🌿', label: 'Green Leaves', detail: 'Captures radiant sunlight energy (Photosynthesis)' },
          { icon: '🌾', label: 'Golden Grain', detail: 'Stores solar energy as nutritious food' },
          { icon: '👨‍🌾', label: 'Harvest Day', detail: 'Farmers reap the bounty with community gratitude' },
        ],
        interactiveDiagramType: 'SEED_GROWTH',
      },
      teachMe: {
        socraticStepIndex: 0,
        totalSocraticSteps: 5,
        stageName: 'MEET_IDEA',
        groundedExplanation: 'When crops like rice and wheat ripen under the winter sun, farmers harvest the food that took months of sunlight and care to grow. Sankranthi is the joyful celebration of this harvest!',
        childAnalogy: 'Imagine baking a huge cake together—harvest festival is the moment everyone gets to taste the slice!',
        remediationMode: false,
      },
      tryIt: {
        activityType: 'PANTRY_OBSERVATION',
        question: {
          text: 'Why do farming communities celebrate during harvest time rather than during seed planting time?',
          options: [
            'Because months of hard labor have successfully yielded food to feed the community',
            'Because farmers want to stop farming forever',
            'Because crops grow with zero water or care',
            'Because planting seeds is too noisy',
          ],
          correctIndex: 0,
          explanation: 'Harvest marks the joyous culmination of months of farming effort, providing abundance and food security.',
        },
        handsOnExperiment: {
          title: '🍚 Spot 3 Harvest Grains in Your Kitchen',
          objective: 'Discover the real foods harvested by farmers in your own home pantry',
          rewardBadge: '🌾 Master Harvester',
          steps: [
            { stepNumber: 1, action: 'OBSERVE', instruction: 'Find Rice grains, Sesame seeds (Til), or Jaggery (Gur).' },
            { stepNumber: 2, action: 'EXPLAIN', instruction: 'Where did the energy inside these foods come from?' },
          ],
        },
      },
      goDeeper: {
        currentConceptId: 'c-festivals-india',
        universeConstellation: [
          { realmId: 'node-harvest-crops', realmName: '🌾 Harvest & Agriculture', icon: '🌾', provenance: 'CURRICULUM_DERIVED', tagline: 'Seed to crop growth biology', shortDescription: 'How plants turn water and soil minerals into human nourishment.', targetNodeId: 'c-harvest-crops' },
          { realmId: 'node-sun-seasons', realmName: '☀️ Sun & Earth Cycles', icon: '☀️', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Solar transit and seasonal warmth', shortDescription: 'How Earth orbiting the Sun ripens crops across hemispheres.', targetNodeId: 'c-sun-seasons' },
          { realmId: 'node-muggu-rangoli', realmName: '🎨 Muggu / Rangoli Art', icon: '🎨', provenance: 'TEXTBOOK_SOURCE', tagline: 'Geometric symmetry and nature harmony', shortDescription: 'Drawing 4x4 matrix dot loops using rice flour to feed ants.', targetNodeId: 'c-muggu-rangoli' },
          { realmId: 'node-kite-wind', realmName: '🪁 Kites & Aerodynamics', icon: '🪁', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Air pressure and aerodynamic lift', shortDescription: 'How winter thermals keep light bamboo frames soaring high.', targetNodeId: 'c-kite-wind' },
        ],
        cosmicTelescope: {
          question: 'Where did the energy inside the rice grain originally come from?',
          answer: 'From the SUN! Nuclear fusion at 15 million °C in our nearest star traveled 150 million km to power the plant leaves.',
          cosmicDomain: 'ASTROPHYSICS & NUCLEAR PHYSICS',
        },
      },
    });

    // ------------------------------------------------------------------------
    // 2. SCIENCE: Plant Biology & Photosynthesis
    // ------------------------------------------------------------------------
    UniversalContentRegistry.register({
      subjectId: 'science-plants',
      subjectTitle: 'General Science',
      domain: 'BIOLOGY',
      gradeLevel: 5,
      bookId: 'Class5Science',
      bookTitle: 'Class 5 General Science',
      chapterNumber: 2,
      chapterTitle: 'How Plants Make Food & Generate Energy',
      printedPage: 12,
      pdfPage: 13,
      sequenceIndex: 12,
      rawTextExcerpt: 'Green plants make their own food through photosynthesis using sunlight, chlorophyll, water, and carbon dioxide from the air.',
      sourceAnchorText: 'Class 5 Science Page 12 (Spread 7)',
      primaryConcept: {
        id: 'c-photosynthesis',
        title: 'Photosynthesis & Solar Energy Conversion',
        domain: 'BIOLOGY',
        tagline: 'Converting solar photons into chemical glucose energy',
        shortDefinition: 'The biological process by which chlorophyll in leaves captures radiant sunlight to synthesize glucose food.',
        detailedExplanation: 'Water drawn by roots meets carbon dioxide absorbed by leaves; photons of sunlight trigger the chemical conversion into glucose and oxygen.',
        provenance: {
          type: 'TEXTBOOK_SOURCE',
          sourceName: 'Class 5 Science Page 12',
          confidence: 1.0,
          retrievedAt: new Date().toISOString(),
          ageAppropriateRating: 'CLASS_4_5',
        },
        gradeLevel: 5,
        complexityLevel: 'FOUNDATIONAL',
        tags: ['photosynthesis', 'chlorophyll', 'sunlight', 'energy'],
      },
      learningObjectives: [
        {
          id: 'obj-sci-5-02',
          code: 'SCI-5-PHOTO-01',
          statement: 'Explain the role of chlorophyll and sunlight in synthesizing chemical energy',
          bloomLevel: 'UNDERSTAND',
          prerequisiteObjectiveIds: [],
        },
      ],
      showMe: {
        title: 'The Photosynthesis Engine in Green Leaves',
        visualMechanismSteps: [
          { icon: '☀️', label: 'Sunlight Photons', detail: 'Travels 150M km to strike green leaves' },
          { icon: '🌿', label: 'Chlorophyll Traps Light', detail: 'Green pigment absorbs photon energy' },
          { icon: '💧', label: 'Water + CO2 React', detail: 'Molecules split and recombine' },
          { icon: '🍎', label: 'Glucose + Oxygen Made', detail: 'Plant food synthesized and fresh O2 released' },
        ],
      },
      teachMe: {
        socraticStepIndex: 0,
        totalSocraticSteps: 5,
        stageName: 'MEET_IDEA',
        groundedExplanation: 'Unlike humans who eat cooked food, green leaves are miniature solar-powered kitchen factories that bake food using pure sunlight!',
        childAnalogy: 'Leaves are like solar panels that store sunlight energy into sweet edible batteries called glucose!',
        remediationMode: false,
      },
      tryIt: {
        activityType: 'HANDS_ON_EXPERIMENT',
        question: {
          text: 'What would happen to a healthy green plant if it was kept inside a dark cupboard for two weeks?',
          options: [
            'It will turn pale yellow and stop growing because it cannot make food without sunlight',
            'It will grow much faster into a huge tree',
            'It will start eating rocks from the soil',
            'Nothing will happen because plants dislike the sun',
          ],
          correctIndex: 0,
          explanation: 'Without photon light energy, chlorophyll cannot synthesize glucose, causing the plant to starve and lose its green pigment.',
        },
        handsOnExperiment: {
          title: '🌿 Spot Stomata & Chlorophyll on a Leaf',
          objective: 'Observe leaf veins and sunlight transparency',
          rewardBadge: '🔬 Junior Botanist',
          steps: [
            { stepNumber: 1, action: 'OBSERVE', instruction: 'Hold a green leaf against the sunlight window. See the microscopic vein network!' },
          ],
        },
      },
      goDeeper: {
        currentConceptId: 'c-photosynthesis',
        universeConstellation: [
          { realmId: 'node-chlorophyll', realmName: '🟢 Chlorophyll Molecules', icon: '🟢', provenance: 'CURRICULUM_DERIVED', tagline: 'Light-absorbing pigment chemistry', shortDescription: 'How magnesium atoms in chlorophyll absorb red and blue wavelengths.', targetNodeId: 'c-chlorophyll' },
          { realmId: 'node-solar-radiation', realmName: '☀️ Solar Radiation & Photons', icon: '☀️', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Electromagnetic spectrum waves', shortDescription: 'How energy travels in wave-packets across the vacuum of space.', targetNodeId: 'c-solar-radiation' },
          { realmId: 'node-oxygen-cycle', realmName: '🌍 Planetary Oxygen Cycle', icon: '🌍', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Ecosystem atmospheric balance', shortDescription: 'How plant photosynthesis generates the air breathed by all animals.', targetNodeId: 'c-oxygen-cycle' },
        ],
        cosmicTelescope: {
          question: 'Where do sunlight photons originally come from before hitting the leaf?',
          answer: 'From thermonuclear fusion in the Sun’s core! 600 million tons of hydrogen fuse into helium every second, emitting pure light energy.',
          cosmicDomain: 'STELLAR ASTROPHYSICS',
        },
      },
    });

    // ------------------------------------------------------------------------
    // 3. MATHEMATICS: Fractions, Division & Proportions
    // ------------------------------------------------------------------------
    UniversalContentRegistry.register({
      subjectId: 'math-fractions',
      subjectTitle: 'Elementary Mathematics',
      domain: 'MATHEMATICS',
      gradeLevel: 5,
      bookId: 'Class5Math',
      bookTitle: 'Class 5 Mathematics: Shapes & Numbers',
      chapterNumber: 4,
      chapterTitle: 'Parts and Wholes: The World of Fractions',
      printedPage: 24,
      pdfPage: 25,
      sequenceIndex: 24,
      rawTextExcerpt: 'A fraction represents equal parts of a whole. When a circle is divided into 4 equal slices, each slice is 1/4 of the total.',
      sourceAnchorText: 'Class 5 Math Page 24 (Spread 13)',
      primaryConcept: {
        id: 'c-fractions-division',
        title: 'Fractions as Equal Partitions of a Whole',
        domain: 'MATHEMATICS',
        tagline: 'Numerator parts over denominator equal partitions',
        shortDefinition: 'A mathematical expression representing equal parts of a unit whole or quantity.',
        detailedExplanation: 'The denominator defines how many equal slices the whole is split into; the numerator counts how many of those equal slices you have.',
        provenance: {
          type: 'TEXTBOOK_SOURCE',
          sourceName: 'Class 5 Math Page 24',
          confidence: 1.0,
          retrievedAt: new Date().toISOString(),
          ageAppropriateRating: 'CLASS_4_5',
        },
        gradeLevel: 5,
        complexityLevel: 'FOUNDATIONAL',
        tags: ['fractions', 'numerator', 'denominator', 'division', 'proportions'],
      },
      learningObjectives: [
        {
          id: 'obj-math-5-01',
          code: 'MATH-5-FRAC-01',
          statement: 'Identify, model, and compare fractional parts of a geometric whole',
          bloomLevel: 'APPLY',
          prerequisiteObjectiveIds: [],
        },
      ],
      showMe: {
        title: 'Visual Partitioning of a Whole Pizza / Circle',
        visualMechanismSteps: [
          { icon: '🍕', label: '1 Whole Unit', detail: 'Complete undivided shape (1/1)' },
          { icon: '✂️', label: 'Divide into 4 Equal Slices', detail: 'Denominator becomes 4' },
          { icon: '🍽️', label: 'Select 3 Slices (3/4)', detail: 'Numerator counts 3 parts' },
          { icon: '⚖️', label: 'Compare with 2/4 (Half)', detail: '3/4 is strictly greater than 2/4' },
        ],
      },
      teachMe: {
        socraticStepIndex: 0,
        totalSocraticSteps: 5,
        stageName: 'MEET_IDEA',
        groundedExplanation: 'Fractions are fair-sharing numbers! If 4 friends share a chocolate bar equally, each friend gets exactly 1 out of 4 parts (1/4).',
        childAnalogy: 'Think of denominator as the team size, and numerator as your share of the trophy!',
        remediationMode: false,
      },
      tryIt: {
        activityType: 'PREDICTION_CHALLENGE',
        question: {
          text: 'If you have a pizza cut into 8 equal slices, and you eat 6 slices, what fraction of the pizza did you eat?',
          options: [
            '6/8 (which equals 3/4 of the pizza)',
            '8/6 (more than a whole pizza)',
            '1/8 (only one single slice)',
            '4/8 (exactly half the pizza)',
          ],
          correctIndex: 0,
          explanation: 'Eating 6 slices out of 8 equal pieces is written as 6/8, which reduces to the equivalent fraction 3/4.',
        },
        handsOnExperiment: {
          title: '📐 Fold a Paper Square into 8ths',
          objective: 'Prove fraction equivalence by physical folding',
          rewardBadge: '📐 Master of Fractions',
        },
      },
      goDeeper: {
        currentConceptId: 'c-fractions-division',
        universeConstellation: [
          { realmId: 'node-ratios', realmName: '⚖️ Ratios & Proportions', icon: '⚖️', provenance: 'CURRICULUM_DERIVED', tagline: 'Comparing two relative quantities', shortDescription: 'How 3:4 ratio expresses proportional recipes and scale models.', targetNodeId: 'c-ratios' },
          { realmId: 'node-percentages', realmName: '💯 Percentages (Out of 100)', icon: '💯', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Standardized fractions per hundred', shortDescription: 'How 3/4 converts directly to 75% in shopping discounts and statistics.', targetNodeId: 'c-percentages' },
          { realmId: 'node-music-rhythm', realmName: '🎵 Musical Rhythms & Time Signatures', icon: '🎵', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Fractional beat divisions', shortDescription: 'How quarter notes (1/4) and eighth notes (1/8) create musical tempo.', targetNodeId: 'c-music-rhythm' },
        ],
        cosmicTelescope: {
          question: 'How do NASA scientists use fractions to navigate spacecraft across the Solar System?',
          answer: 'Orbital mechanics uses precise fractional ratios and trigonometry to calculate gravitational slingshots between Earth and Mars!',
          cosmicDomain: 'AEROSPACE MATHEMATICS',
        },
      },
    });

    // ------------------------------------------------------------------------
    // 4. HISTORY: Indus Valley Civilization & Urban Engineering
    // ------------------------------------------------------------------------
    UniversalContentRegistry.register({
      subjectId: 'history-indus',
      subjectTitle: 'Ancient History & Civics',
      domain: 'CULTURE_HISTORY',
      gradeLevel: 6,
      bookId: 'Class6History',
      bookTitle: 'Class 6 Our Pasts: Ancient Civilizations',
      chapterNumber: 3,
      chapterTitle: 'In the Earliest Cities: Harappa & Mohenjo-Daro',
      printedPage: 8,
      pdfPage: 9,
      sequenceIndex: 8,
      rawTextExcerpt: 'The cities of the Indus Valley Civilization, built 4500 years ago, had sophisticated covered drainage systems, baked brick houses, and planned grid streets.',
      sourceAnchorText: 'Class 6 History Page 8 (Spread 5)',
      primaryConcept: {
        id: 'c-indus-urban-planning',
        title: 'Indus Valley Urban Planning & Drainage Systems',
        domain: 'CULTURE_HISTORY',
        tagline: 'Planned grid cities, public hygiene, and civil engineering 4500 years ago',
        shortDefinition: 'The ancient Bronze Age urban civil engineering mastery of Harappa and Mohenjo-Daro.',
        detailedExplanation: 'Houses built with uniform baked bricks connected directly into street drains covered with inspection slabs—demonstrating advanced civil hygiene.',
        provenance: {
          type: 'TEXTBOOK_SOURCE',
          sourceName: 'Class 6 History Page 8',
          confidence: 1.0,
          retrievedAt: new Date().toISOString(),
          ageAppropriateRating: 'CLASS_6_8',
        },
        gradeLevel: 6,
        complexityLevel: 'FOUNDATIONAL',
        tags: ['indus-valley', 'harappa', 'urban-planning', 'drainage', 'civilization'],
      },
      learningObjectives: [
        {
          id: 'obj-hist-6-01',
          code: 'HIST-6-INDUS-01',
          statement: 'Analyze the architectural and hygienic advancements of ancient Indus urban planning',
          bloomLevel: 'ANALYZE',
          prerequisiteObjectiveIds: [],
        },
      ],
      showMe: {
        title: 'The 4,500-Year-Old Harappan City Grid',
        visualMechanismSteps: [
          { icon: '🧱', label: 'Baked Brick Houses', detail: 'Standardized 4:2:1 ratio burnt bricks' },
          { icon: '📐', label: 'Orthogonal Grid Streets', detail: 'Roads intersecting at strict 90° right angles' },
          { icon: '🚰', label: 'Covered Street Drains', detail: 'Inspection traps for waste water management' },
          { icon: '🏛️', label: 'The Great Bath', detail: 'Waterproof bitumen-lined public reservoir' },
        ],
      },
      teachMe: {
        socraticStepIndex: 0,
        totalSocraticSteps: 5,
        stageName: 'MEET_IDEA',
        groundedExplanation: '4,500 years before modern cities, ancient engineers in the Indus Valley designed covered underground drains and street grids more advanced than Europe had millennia later!',
        childAnalogy: 'Harappan cities were planned like modern computer motherboards—every house had its own designated connection to the main grid!',
        remediationMode: false,
      },
      tryIt: {
        activityType: 'SOCRATIC_QUESTION',
        question: {
          text: 'Why did Harappan engineers place removable stone slabs along their covered street drains?',
          options: [
            'To allow municipal workers to open inspection traps and clean the drainage pipes',
            'Because they did not have enough bricks to finish the road',
            'To trap wild animals inside the sewer',
            'To hide treasures from invading armies',
          ],
          correctIndex: 0,
          explanation: 'Inspection slabs prove the Indus Valley civilization had planned municipal sanitation protocols to prevent blockages.',
        },
      },
      goDeeper: {
        currentConceptId: 'c-indus-urban-planning',
        universeConstellation: [
          { realmId: 'node-civil-engineering', realmName: '🏗️ Modern Civil Engineering', icon: '🏗️', provenance: 'CURRICULUM_DERIVED', tagline: 'Urban storm-water and sewage networks', shortDescription: 'How Harappan gravity drainage principles power modern smart cities.', targetNodeId: 'c-civil-engineering' },
          { realmId: 'node-bronze-metallurgy', realmName: '🥉 Bronze Age Metallurgy & Trade', icon: '🥉', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Copper-tin alloy tools and maritime seals', shortDescription: 'Trade routes connecting Indus seals to ancient Mesopotamia and Oman.', targetNodeId: 'c-bronze-metallurgy' },
          { realmId: 'node-river-ecosystems', realmName: '🌊 River Systems & Climate Shifts', icon: '🌊', provenance: 'EXTERNAL_KNOWLEDGE', tagline: 'Ghaggar-Hakra and Indus river dynamics', shortDescription: 'How monsoon shifts and drying rivers led to urban de-densification.', targetNodeId: 'c-river-ecosystems' },
        ],
        cosmicTelescope: {
          question: 'How do modern satellites in orbit discover buried ancient cities?',
          answer: 'Synthetic Aperture Radar (SAR) on orbit satellites penetrates surface sand to map ancient buried river beds and stone foundations from space!',
          cosmicDomain: 'SATELLITE REMOTE SENSING & ARCHAEOLOGY',
        },
      },
    });
  }

  public static register(module: SubjectModuleDefinition) {
    this.modules.set(module.subjectId, module);
    this.modules.set(module.bookId, module);
    this.modules.set(module.primaryConcept.id, module);
  }

  public static getBySubjectOrBook(key: string): SubjectModuleDefinition {
    const found = this.modules.get(key);
    if (found) return found;
    return this.modules.get('evs-festivals')!;
  }

  public static getAllModules(): SubjectModuleDefinition[] {
    return Array.from(new Set(Array.from(this.modules.values())));
  }
}
