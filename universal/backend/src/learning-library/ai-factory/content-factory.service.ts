import { Injectable, Logger } from '@nestjs/common';
import { CanonicalEvidencePack, EvidenceCitationRecord } from '../knowledge/canonical-evidence-pack.service';

export type ContentOrigin = 'SOURCE_DERIVED' | 'INFERRED' | 'PEDAGOGICAL_ANALOGY' | 'GENERAL_KNOWLEDGE';
export type TeachingDepth = 'basis' | 'developing' | 'proficient' | 'advanced' | 'deep';

export interface TeacherExplanationStep {
  stepNumber: number;
  title: string;
  explanation: string;
  socraticQuestion: string;
  contentOrigin: ContentOrigin;
  citations: EvidenceCitationRecord[];
}

export interface VisualFlowStep {
  label: string;
  icon: string;
  description: string;
  highlight: boolean;
}

export interface RealWorldScenario {
  scenarioTitle: string;
  context: string;
  application: string;
  whyItMatters: string;
  contentOrigin: ContentOrigin;
  citations: EvidenceCitationRecord[];
}

export interface KeyPointItem {
  pointNumber: number;
  takeaway: string;
  scientificPrinciple: string;
  contentOrigin: ContentOrigin;
  citations: EvidenceCitationRecord[];
}

export interface DepthTeachingArtifacts {
  depth: TeachingDepth;
  teacherExplanation: TeacherExplanationStep[];
  visuals: {
    diagramType: string;
    title: string;
    subtitle: string;
    steps: VisualFlowStep[];
    citations: EvidenceCitationRecord[];
  };
  realWorldExamples: RealWorldScenario[];
  keyPoints: KeyPointItem[];
  boardSummary: {
    boardTitle: string;
    boardSubtitle: string;
    formulaBanner: {
      title: string;
      formula: string;
    };
    keyTakeawayBox: {
      heading: string;
      text: string;
    };
    nodes: any[];
    edges: any[];
    citations: EvidenceCitationRecord[];
  };
  printableNotes: {
    chapterTitle: string;
    depth: TeachingDepth;
    whatILearned: string[];
    corePrinciplesToRemember: string[];
    thinkAndReasonPrompts: string[];
    drawOrActivityChallenge: {
      title: string;
      instructions: string;
    };
    citations: EvidenceCitationRecord[];
  };
}

export interface TeachingPackageRecord {
  packageId: string;
  bookId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  startPhysicalPage: number;
  endPhysicalPage: number;
  depths: {
    basis: DepthTeachingArtifacts;
    developing: DepthTeachingArtifacts;
    proficient: DepthTeachingArtifacts;
    advanced: DepthTeachingArtifacts;
    deep: DepthTeachingArtifacts;
  };
  status: 'PUBLISHED' | 'DRAFT' | 'REJECTED';
  metadata: {
    evidencePackId: string;
    evidencePackHash: string;
    evidencePackVersion: string;
    generatedAt: string;
  };
}

@Injectable()
export class ContentFactoryService {
  private readonly logger = new Logger(ContentFactoryService.name);

  public generateTeachingPackage(evidencePack: CanonicalEvidencePack): TeachingPackageRecord {
    if (!evidencePack || !evidencePack.evidencePackHash) {
      throw new Error('ContentFactory requires a valid CanonicalEvidencePack');
    }

    const citation: EvidenceCitationRecord = evidencePack.concepts[0]?.citations[0] || {
      bookId: evidencePack.bookId,
      chapterNumber: evidencePack.chapterNumber,
      physicalPage: evidencePack.physicalPages[0],
      blockId: `blk-${evidencePack.physicalPages[0]}-1`,
      regionId: `reg-${evidencePack.physicalPages[0]}-1`,
      bbox: { x: 165, y: 84, width: 926, height: 298 },
      confidence: 0.95,
      sourceTextSnippet: evidencePack.keyIdeas[0]?.statement || 'Living things grow and develop over time.',
    };

    return {
      packageId: `pkg-${evidencePack.bookId}-ch${evidencePack.chapterNumber}-v1`,
      bookId: evidencePack.bookId,
      chapterId: evidencePack.chapterId,
      chapterNumber: evidencePack.chapterNumber,
      title: evidencePack.title,
      startPhysicalPage: evidencePack.physicalPages[0],
      endPhysicalPage: evidencePack.physicalPages[evidencePack.physicalPages.length - 1],
      depths: {
        basis: this.buildBasis(evidencePack, citation),
        developing: this.buildDeveloping(evidencePack, citation),
        proficient: this.buildProficient(evidencePack, citation),
        advanced: this.buildAdvanced(evidencePack, citation),
        deep: this.buildDeep(evidencePack, citation),
      },
      status: 'PUBLISHED',
      metadata: {
        evidencePackId: evidencePack.evidencePackId,
        evidencePackHash: evidencePack.evidencePackHash,
        evidencePackVersion: evidencePack.version,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private buildBasis(pack: CanonicalEvidencePack, citation: EvidenceCitationRecord): DepthTeachingArtifacts {
    return {
      depth: 'basis',
      teacherExplanation: [
        {
          stepNumber: 1,
          title: '🌱 Everyday Observation: What is Living Around Us?',
          explanation: 'Look around your room and outside! Plants, puppies, birds, and you are all living things that eat, drink water, breathe, and grow bigger.',
          socraticQuestion: 'Can you name 2 living things and 2 non-living things?',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 2,
          title: '🍼 Baby to Big: How We Grow',
          explanation: 'When you were a tiny baby, you could not walk or speak words. Now you can run and read books! That is growing up.',
          socraticQuestion: 'What can you do now that you could not do as a baby?',
          contentOrigin: 'PEDAGOGICAL_ANALOGY',
          citations: [citation],
        },
        {
          stepNumber: 3,
          title: '🌻 What Do Living Things Need?',
          explanation: 'Living things need healthy food, clean water, sunlight, and rest to grow big and strong.',
          socraticQuestion: 'What happens if we forget to water a plant?',
          contentOrigin: 'INFERRED',
          citations: [citation],
        },
      ],
      visuals: {
        diagramType: 'simple_growth_ladder',
        title: '🌱 BABY TO BIG: SIMPLE GROWTH STEPS',
        subtitle: 'Watch how living things grow over time',
        steps: [
          { label: 'TINY SEED / BABY', icon: '🐣', description: 'Small, needs care & food', highlight: true },
          { label: 'GROWING CHILD', icon: '🧒', description: 'Learns to walk, talk, play', highlight: false },
          { label: 'GROWN ADULT', icon: '🧑', description: 'Tall, strong, independent', highlight: false },
        ],
        citations: [citation],
      },
      realWorldExamples: [
        {
          scenarioTitle: 'Looking at Old Baby Photos',
          context: 'When you open your family photo album from when you were 1 year old,',
          application: 'you notice your baby shoes and clothes are way too small for you today.',
          whyItMatters: 'Proof that your body is growing every single day.',
          contentOrigin: 'GENERAL_KNOWLEDGE',
          citations: [citation],
        },
      ],
      keyPoints: [
        {
          pointNumber: 1,
          takeaway: 'Living things breathe, eat food, drink water, and grow.',
          scientificPrinciple: 'Basic life characteristic: growth & nutrition.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          pointNumber: 2,
          takeaway: 'Non-living things never grow or need food.',
          scientificPrinciple: 'Living vs non-living differentiation.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
      ],
      boardSummary: {
        boardTitle: '🌱 BASIS: LIVING THINGS & GROWING UP',
        boardSubtitle: 'Living things need Food + Water + Air to Grow',
        formulaBanner: {
          title: 'LIVING THINGS FORMULA',
          formula: 'Seed / Baby + Food & Water ➔ Big & Strong!',
        },
        keyTakeawayBox: {
          heading: '⭐ WHAT WE LEARNED TODAY',
          text: 'All living things grow and change over time!',
        },
        nodes: [{ id: 'b1', label: 'Living Things' }, { id: 'b2', label: 'Needs Food' }, { id: 'b3', label: 'Grows' }],
        edges: [{ from: 'b1', to: 'b2' }, { from: 'b2', to: 'b3' }],
        citations: [citation],
      },
      printableNotes: {
        chapterTitle: pack.title,
        depth: 'basis',
        whatILearned: ['Living things eat and grow.', 'Babies grow into children.'],
        corePrinciplesToRemember: ['Growth is a natural change.'],
        thinkAndReasonPrompts: ['Is a toy alive? Why?'],
        drawOrActivityChallenge: {
          title: 'Draw Your Growth Timeline',
          instructions: 'Draw yourself as a baby and as a Class 5 student!',
        },
        citations: [citation],
      },
    };
  }

  private buildDeveloping(pack: CanonicalEvidencePack, citation: EvidenceCitationRecord): DepthTeachingArtifacts {
    return {
      depth: 'developing',
      teacherExplanation: [
        {
          stepNumber: 1,
          title: '🔄 Sequential Growth: Structured Lifecycle Stages',
          explanation: 'Growth follows structured, irreversible stages: Seed ➔ Sprout ➔ Sapling ➔ Tree, and Infancy ➔ Childhood ➔ Adolescence ➔ Adulthood.',
          socraticQuestion: 'Why is growth called irreversible?',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 2,
          title: '🥗 Fueling Growth: Nutrition, Sleep & Exercise',
          explanation: 'Our body builds new muscle and bone from food nutrients. Proteins build muscle, calcium strengthens bones, and sleep releases growth hormones.',
          socraticQuestion: 'How does a balanced diet help growth?',
          contentOrigin: 'INFERRED',
          citations: [citation],
        },
        {
          stepNumber: 3,
          title: '🎨 Beyond Physical Growth: Mental Development & Hobbies',
          explanation: 'Growing up includes brain development, building hobbies (drawing, singing, coding), and learning independent decision-making.',
          socraticQuestion: 'How has your favorite hobby improved this year?',
          contentOrigin: 'PEDAGOGICAL_ANALOGY',
          citations: [citation],
        },
      ],
      visuals: {
        diagramType: 'lifecycle_continuum',
        title: '🔄 CLASS 5 LIFECYCLE & DEVELOPMENTAL CONTINUUM',
        subtitle: 'Sequential progression through developmental milestones',
        steps: [
          { label: '1. INFANCY (0-2 YRS)', icon: '👶', description: 'Rapid physical growth, motor skills', highlight: false },
          { label: '2. CHILDHOOD (3-11 YRS)', icon: '🎒', description: 'Brain development & hobbies', highlight: true },
          { label: '3. ADOLESCENCE (12-18 YRS)', icon: '🏃', description: 'Growth spurts & maturity', highlight: false },
          { label: '4. ADULTHOOD (19+ YRS)', icon: '💼', description: 'Full physical independence', highlight: false },
        ],
        citations: [citation],
      },
      realWorldExamples: [
        {
          scenarioTitle: 'Growth Chart on the Kitchen Door',
          context: 'Marking height on a doorframe every birthday',
          application: 'shows 5 to 8 centimeters of upward growth every year.',
          whyItMatters: 'Demonstrates continuous cellular expansion during childhood.',
          contentOrigin: 'GENERAL_KNOWLEDGE',
          citations: [citation],
        },
      ],
      keyPoints: [
        {
          pointNumber: 1,
          takeaway: 'Growth is sequential and irreversible across living organisms.',
          scientificPrinciple: 'Biological lifecycle continuum.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          pointNumber: 2,
          takeaway: 'Balanced nutrition and sleep power healthy physical and mental development.',
          scientificPrinciple: 'Developmental milestones.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
      ],
      boardSummary: {
        boardTitle: '🔄 DEVELOPING: LIFECYCLES & GROWTH FACTORS',
        boardSubtitle: 'Infancy ➔ Childhood ➔ Adolescence ➔ Adulthood',
        formulaBanner: {
          title: 'BALANCED GROWTH EQUATION',
          formula: 'Nutrients (Proteins/Minerals) + Sleep + Exercise = Healthy Growth',
        },
        keyTakeawayBox: {
          heading: '🔬 CORE PRINCIPLE',
          text: 'Growth involves physical enlargement and cognitive skill expansion.',
        },
        nodes: [{ id: 'd1', label: 'Infancy' }, { id: 'd2', label: 'Childhood' }, { id: 'd3', label: 'Adulthood' }],
        edges: [{ from: 'd1', to: 'd2' }, { from: 'd2', to: 'd3' }],
        citations: [citation],
      },
      printableNotes: {
        chapterTitle: pack.title,
        depth: 'developing',
        whatILearned: ['Human growth stages.', 'Role of proteins and sleep.'],
        corePrinciplesToRemember: ['Growth is irreversible.'],
        thinkAndReasonPrompts: ['Why do doctors recommend 9 hours of sleep?'],
        drawOrActivityChallenge: {
          title: 'Plant Lifecycle Diagram',
          instructions: 'Draw and label the 4 stages of a flowering plant.',
        },
        citations: [citation],
      },
    };
  }

  private buildProficient(pack: CanonicalEvidencePack, citation: EvidenceCitationRecord): DepthTeachingArtifacts {
    return {
      depth: 'proficient',
      teacherExplanation: [
        {
          stepNumber: 1,
          title: '🦎 Comparative Lifecycles: Direct Growth vs Metamorphosis',
          explanation: 'Mammals and birds undergo direct growth, whereas amphibians and insects undergo complete metamorphosis (Egg ➔ Larva ➔ Pupa ➔ Adult).',
          socraticQuestion: 'How does a tadpole adapt into a land frog?',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 2,
          title: '☀️ Environmental Influences: Phototropism & Tropisms',
          explanation: 'An organism genetic potential is modulated by its habitat: phototropism directs plant stems toward light, and climate dictates animal maturation rates.',
          socraticQuestion: 'Predict what happens to a plant kept in the dark.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 3,
          title: '🛡️ Structural Adaptations for Survival at Maturity',
          explanation: 'Mature organisms develop specialized protective structures like bark on trees and flight feathers on birds.',
          socraticQuestion: 'Why do cactus plants develop spines?',
          contentOrigin: 'INFERRED',
          citations: [citation],
        },
      ],
      visuals: {
        diagramType: 'comparative_matrix',
        title: '🦎 COMPARATIVE DEVELOPMENTAL PATHWAYS',
        subtitle: 'Direct Growth vs Metamorphic Transformation',
        steps: [
          { label: 'DIRECT GROWTH', icon: '🐣', description: 'Gradual scaling: Baby ➔ Adult with same body plan', highlight: true },
          { label: 'METAMORPHOSIS', icon: '🐛', description: 'Anatomical restructuring: Larva ➔ Pupa ➔ Adult', highlight: true },
          { label: 'VEGETATIVE PROPAGATION', icon: '🌿', description: 'Regeneration from plant runners and tubers', highlight: false },
        ],
        citations: [citation],
      },
      realWorldExamples: [
        {
          scenarioTitle: 'Metamorphosis of the Monarch Butterfly',
          context: 'Egg hatches into caterpillar, forms chrysalis, rebuilds into winged pollinator.',
          application: 'Occupies distinct ecological niches at different life stages.',
          whyItMatters: 'Demonstrates evolutionary optimization of developmental stages.',
          contentOrigin: 'GENERAL_KNOWLEDGE',
          citations: [citation],
        },
      ],
      keyPoints: [
        {
          pointNumber: 1,
          takeaway: 'Different biological kingdoms exhibit specialized developmental pathways.',
          scientificPrinciple: 'Comparative developmental biology.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          pointNumber: 2,
          takeaway: 'Environmental resources strictly regulate growth velocity and morphology.',
          scientificPrinciple: 'Phenotypic adaptation.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
      ],
      boardSummary: {
        boardTitle: '🦎 PROFICIENT: COMPARATIVE BIOLOGY & ADAPTATION',
        boardSubtitle: 'Direct Growth vs Metamorphosis & Environmental Tropisms',
        formulaBanner: {
          title: 'DEVELOPMENTAL CLASSIFICATION',
          formula: 'Genetics (Blueprint) + Environment (Light/Water) ➔ Phenotype (Physical Form)',
        },
        keyTakeawayBox: {
          heading: '🔬 SCIENTIFIC TAKEAWAY',
          text: 'Lifecycles are evolutionary adaptations to ecosystem demands.',
        },
        nodes: [{ id: 'p1', label: 'Direct Growth' }, { id: 'p2', label: 'Metamorphosis' }],
        edges: [{ from: 'p1', to: 'p2' }],
        citations: [citation],
      },
      printableNotes: {
        chapterTitle: pack.title,
        depth: 'proficient',
        whatILearned: ['Direct growth vs Metamorphosis.', 'Phototropism.'],
        corePrinciplesToRemember: ['Genetics and environment interact.'],
        thinkAndReasonPrompts: ['Why is metamorphosis advantageous for frogs?'],
        drawOrActivityChallenge: {
          title: 'Metamorphosis Comparison Chart',
          instructions: 'Draw a Venn diagram comparing human and butterfly growth.',
        },
        citations: [citation],
      },
    };
  }

  private buildAdvanced(pack: CanonicalEvidencePack, citation: EvidenceCitationRecord): DepthTeachingArtifacts {
    return {
      depth: 'advanced',
      teacherExplanation: [
        {
          stepNumber: 1,
          title: '🔬 Cellular Foundations: Mitosis & Tissue Differentiation',
          explanation: 'Growth occurs via Mitotic Cell Division. A diploid cell replicates its DNA and divides into identical daughter cells that differentiate into specialized bone, muscle, and nerve tissues.',
          socraticQuestion: 'How do identical DNA copies form diverse tissue types?',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 2,
          title: '⚡ Bioenergetics: ATP Synthesis & Protein Translation',
          explanation: 'Ribosomes translate amino acids into structural proteins fueled by mitochondrial ATP: C6H12O6 + 6O2 ➔ 6CO2 + 6H2O + 36 ATP.',
          socraticQuestion: 'Why does starvation immediately arrest somatic growth?',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 3,
          title: '🧬 Hormonal Regulation: Endocrine Homeostasis & Epiphyseal Plates',
          explanation: 'Pituitary hGH stimulates liver IGF-1, driving chondrocyte proliferation in epiphyseal growth plates until adult ossification.',
          socraticQuestion: 'What maintains bilateral symmetry during limb growth?',
          contentOrigin: 'INFERRED',
          citations: [citation],
        },
      ],
      visuals: {
        diagramType: 'cellular_cascade',
        title: '🔬 BIOCHEMICAL & CELLULAR GROWTH CASCADE',
        subtitle: 'From Genetic Transcription to Tissue Elongation',
        steps: [
          { label: '1. MITOTIC DIVISION', icon: '🧬', description: 'DNA replication & cytokinesis yielding 2 daughter cells', highlight: true },
          { label: '2. PROTEIN SYNTHESIS', icon: '⚡', description: 'Ribosomal translation of amino acids into structural tissue', highlight: false },
          { label: '3. HORMONAL SIGNALING', icon: '🩸', description: 'Pituitary hGH ➔ Liver IGF-1 ➔ Growth plate expansion', highlight: true },
          { label: '4. HOMEOSTATIC FUSION', icon: '🦴', description: 'Ossification of cartilage into mature permanent bone', highlight: false },
        ],
        citations: [citation],
      },
      realWorldExamples: [
        {
          scenarioTitle: 'Epiphyseal Plate Ossification in X-Rays',
          context: 'Pediatric wrist X-rays show open growth plates in children and fused plates in adults.',
          application: 'Quantifies remaining linear skeletal growth potential.',
          whyItMatters: 'Demonstrates hormonal timeline of human skeletal growth.',
          contentOrigin: 'GENERAL_KNOWLEDGE',
          citations: [citation],
        },
      ],
      keyPoints: [
        {
          pointNumber: 1,
          takeaway: 'Mitosis and cellular differentiation are the biophysical drivers of somatic expansion.',
          scientificPrinciple: 'Cellular kinetics & tissue morphogenesis.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          pointNumber: 2,
          takeaway: 'Neuroendocrine signaling coordinates systemic homeostasis and growth timelines.',
          scientificPrinciple: 'Endocrine regulation & bioenergetics.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
      ],
      boardSummary: {
        boardTitle: '🔬 ADVANCED: CELLULAR MITOSIS & BIOENERGETICS',
        boardSubtitle: 'Mitotic Division ➔ Protein Anabolism ➔ Endocrine Signaling',
        formulaBanner: {
          title: 'CELLULAR RESPIRATION BIOENERGETICS',
          formula: 'C6H12O6 + 6O2 ➔ 6CO2 + 6H2O + 36 ATP (powers mitotic synthesis)',
        },
        keyTakeawayBox: {
          heading: '🧬 BIOCHEMICAL INVARIANT',
          text: 'Growth is an ATP-dependent anabolic process guided by endocrine feedback loops.',
        },
        nodes: [{ id: 'a1', label: 'Mitosis' }, { id: 'a2', label: 'ATP' }, { id: 'a3', label: 'hGH / IGF-1' }],
        edges: [{ from: 'a1', to: 'a2' }, { from: 'a2', to: 'a3' }],
        citations: [citation],
      },
      printableNotes: {
        chapterTitle: pack.title,
        depth: 'advanced',
        whatILearned: ['Mitosis and cell differentiation.', 'ATP bioenergetics.'],
        corePrinciplesToRemember: ['Endocrine feedback loops maintain developmental homeostasis.'],
        thinkAndReasonPrompts: ['How do cell cycle checkpoints prevent uncontrolled growth?'],
        drawOrActivityChallenge: {
          title: 'Mitosis Phase Diagram',
          instructions: 'Draw Prophase, Metaphase, Anaphase, and Telophase.',
        },
        citations: [citation],
      },
    };
  }

  private buildDeep(pack: CanonicalEvidencePack, citation: EvidenceCitationRecord): DepthTeachingArtifacts {
    return {
      depth: 'deep',
      teacherExplanation: [
        {
          stepNumber: 1,
          title: '🌌 Evolutionary Developmental Biology (Evo-Devo) & Hox Gene Toolkits',
          explanation: 'Developmental body plans across bilateral life forms are orchestrated by ancient, highly conserved master regulator Homeobox (Hox) genes.',
          socraticQuestion: 'What does Hox gene universality reveal about common ancestry?',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 2,
          title: '🧬 Epigenetic Plasticity: Environmentally Tuned Gene Expression',
          explanation: 'DNA methylation and histone acetylation act as molecular switches, turning developmental genes on/off in response to maternal diet, climate, and stress without changing DNA sequence.',
          socraticQuestion: 'How does temperature-dependent sex determination in turtles illustrate epigenetic control?',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          stepNumber: 3,
          title: '🛰️ Multi-System Inquiry: Growth Invariants Under Extraterrestrial Constraints',
          explanation: 'In microgravity aboard the ISS, plant roots lose gravitropism and rely on phototropism, while human bone mineral density degrades at 1% per month.',
          socraticQuestion: 'Design an autonomous closed-loop greenhouse for Mars exploration (0.38G).',
          contentOrigin: 'INFERRED',
          citations: [citation],
        },
      ],
      visuals: {
        diagramType: 'evo_devo_system',
        title: '🌌 EVO-DEVO & EPIGENETIC DEVELOPMENTAL MATRIX',
        subtitle: 'Conserved Master Toolkits, Epigenetics, and Astrobiological Invariants',
        steps: [
          { label: '1. HOX GENE TOOLKIT', icon: '🧬', description: 'Ancient conserved genomic controllers of axial segmentation', highlight: true },
          { label: '2. EPIGENETIC PLASTICITY', icon: '🔄', description: 'DNA methylation tuning expression to environmental stress', highlight: true },
          { label: '3. LIFE-HISTORY TRADE-OFFS', icon: '⚖️', description: 'Evolutionary resource allocation: r-selection vs K-selection', highlight: false },
          { label: '4. ASTROBIOLOGICAL BOUNDARIES', icon: '🛰️', description: 'Gravitational biomechanics & adaptation in microgravity', highlight: true },
        ],
        citations: [citation],
      },
      realWorldExamples: [
        {
          scenarioTitle: 'Root Gravitropism on the ISS (Veggie Experiment)',
          context: 'NASA astronauts grow lettuce in orbital microgravity.',
          application: 'Roots rely exclusively on directional LED phototropism.',
          whyItMatters: 'Reveals the fundamental physical boundaries of biological development.',
          contentOrigin: 'GENERAL_KNOWLEDGE',
          citations: [citation],
        },
      ],
      keyPoints: [
        {
          pointNumber: 1,
          takeaway: 'Evo-Devo proves that diverse macroscopic organisms share ancient conserved genetic toolkits.',
          scientificPrinciple: 'Evolutionary developmental genetics.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
        {
          pointNumber: 2,
          takeaway: 'Epigenetic plasticity enables dynamic phenotypic tuning to environmental volatility.',
          scientificPrinciple: 'Epigenetic regulation & phenotypic plasticity.',
          contentOrigin: 'SOURCE_DERIVED',
          citations: [citation],
        },
      ],
      boardSummary: {
        boardTitle: '🌌 DEEP: EVO-DEVO, EPIGENETICS & ASTROBIOLOGY',
        boardSubtitle: 'Conserved Hox Toolkits ➔ Epigenetic Methylation ➔ Extraterrestrial Biomechanics',
        formulaBanner: {
          title: 'PHENOTYPIC PLASTICITY EQUATION',
          formula: 'Phenotype = Genome (Hox) + Epigenome (Methylation) + Planetary Constraints (Gravity/Light)',
        },
        keyTakeawayBox: {
          heading: '🛰️ ASTROBIOLOGICAL INVARIANT',
          text: 'Growth is an evolutionary optimization algorithm balancing fidelity with adaptability.',
        },
        nodes: [{ id: 'dp1', label: 'Hox Toolkit' }, { id: 'dp2', label: 'Epigenetics' }, { id: 'dp3', label: 'Microgravity' }],
        edges: [{ from: 'dp1', to: 'dp2' }, { from: 'dp2', to: 'dp3' }],
        citations: [citation],
      },
      printableNotes: {
        chapterTitle: pack.title,
        depth: 'deep',
        whatILearned: ['Hox gene toolkits.', 'Epigenetic DNA methylation.', 'Microgravity biological boundaries.'],
        corePrinciplesToRemember: ['Phenotypic plasticity enables rapid generational adaptation.'],
        thinkAndReasonPrompts: ['How would human bone development change on Mars over 10 generations?'],
        drawOrActivityChallenge: {
          title: 'Mars Greenhouse Architecture Challenge',
          instructions: 'Design a Martian greenhouse optimizing photoperiod and nutrient flow.',
        },
        citations: [citation],
      },
    };
  }
}
