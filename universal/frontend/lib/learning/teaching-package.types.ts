/**
 * ============================================================================
 * EKAGURU CANONICAL TEACHING PACKAGE & DOCUMENT INTELLIGENCE TYPES
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CORE ARCHITECTURAL INVARIANTS
// ----------------------------------------------------------------------------
export const INVARIANT_SOURCE_PRESERVATION =
  'No OCR, AI-generated text, chapter structure, concept, or teaching artifact may replace the original physical page scan.';

export const INVARIANT_HARD_SAFETY_EVIDENCE =
  '100% of factual source-grounded claims must have evidence linked to an immutable physical page region with bounding box. No evidence = do not publish the claim.';

// ----------------------------------------------------------------------------
// 2. PHYSICAL PAGE IDENTITY & PROVENANCE
// ----------------------------------------------------------------------------
export interface BoundingBox {
  x: number;      // normalized 0..1000 or pixels
  y: number;
  width: number;
  height: number;
}

export interface PageIdentity {
  bookId: string;
  physicalPageNumber: number;  // 1..116 (immutable sequential physical scan)
  printedPageNumber?: string;   // e.g. "1", "28", "Cover"
  pdfPageIndex: number;        // 0-indexed original PDF spread/page
  imageHash: string;
  sourceScanUrl: string;       // e.g. /textbooks/evs-class-5/page-1.png
  width: number;
  height: number;
  orientationAngle: number;    // 0, 90, 180, 270
}

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list_item'
  | 'figure'
  | 'table'
  | 'caption'
  | 'activity'
  | 'learning_outcome'
  | 'exercise_question'
  | 'footnote';

export interface DocumentVisionBlock {
  blockId: string;
  regionId: string;
  physicalPageNumber: number;
  type: BlockType;
  text: string;
  bbox: BoundingBox;
  confidence: number;
  readingOrderIndex: number;
}

// ----------------------------------------------------------------------------
// 3. SOURCE QUALITY REPORT
// ----------------------------------------------------------------------------
export interface PageQualityReport {
  physicalPage: number;
  ocrConfidence: number;              // 0..1
  textDensity: number;                // 0..1
  orientationScore: number;           // 0..1
  layoutConfidence: number;           // 0..1
  headingDetectionConfidence: number; // 0..1
  tableDetectionConfidence: number;   // 0..1
  figureDetectionConfidence: number;  // 0..1
  sourceAlignmentScore: number;       // 0..1
  overallQualityScore: number;        // 0..1
  status: 'VERIFIED' | 'NEEDS_RETRY' | 'REJECTED';
  issues: string[];
}

// ----------------------------------------------------------------------------
// 4. STRUCTURE HIERARCHY (ZERO ORPHAN PAGES)
// ----------------------------------------------------------------------------
export interface SubsectionNode {
  id: string;
  title: string;
  startPhysicalPage: number;
  endPhysicalPage: number;
}

export interface SectionNode {
  id: string;
  sectionNumber: string;
  title: string;
  startPhysicalPage: number;
  endPhysicalPage: number;
  subsections?: SubsectionNode[];
}

export interface ChapterStructureNode {
  chapterId: string;
  chapterNumber: number;
  unitName: string;
  title: string;
  startPhysicalPage: number;
  endPhysicalPage: number;
  printedPageRange: string;
  sections: SectionNode[];
  headingEvidenceBlockId?: string;
}

export interface CanonicalBookManifest {
  bookId: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string;
  totalPages: number;
  units: {
    unitNumber: number;
    unitName: string;
    startPhysicalPage: number;
    endPhysicalPage: number;
    chapterIds: string[];
  }[];
  chapters: ChapterStructureNode[];
  frontMatterPages: number[];
  backMatterPages: number[];
  unassignedPages: number[]; // MUST BE EMPTY (Invariant: Zero Orphan Pages)
  manifestHash: string;
  generatedAt: string;
}

// ----------------------------------------------------------------------------
// 5. KNOWLEDGE GRAPH & EVIDENCE PACK
// ----------------------------------------------------------------------------
export interface EvidenceCitation {
  bookId: string;
  chapterNumber: number;
  physicalPage: number;
  blockId: string;
  regionId?: string;
  bbox: BoundingBox;
  confidence: number;
  sourceTextSnippet: string;
}

export interface ConceptNode {
  id: string;              // e.g. C001
  name: string;
  definition: string;
  category: string;
  primaryPhysicalPage: number;
  citations: EvidenceCitation[];
}

export interface KeyIdeaNode {
  id: string;              // e.g. K001
  statement: string;
  conceptIds: string[];
  citations: EvidenceCitation[];
}

export interface MisconceptionNode {
  id: string;              // e.g. M001
  commonBelief: string;
  scientificCorrection: string;
  socraticDiagnosticProbe: string;
  conceptIds: string[];
  citations: EvidenceCitation[];
}

export interface SocraticQuestionNode {
  id: string;              // e.g. Q001
  question: string;
  expectedInsight: string;
  difficulty: 'basis' | 'developing' | 'proficient' | 'advanced' | 'deep';
  conceptIds: string[];
  citations: EvidenceCitation[];
}

export interface ChapterEvidencePack {
  chapterId: string;
  chapterNumber: number;
  title: string;
  physicalPages: number[];
  blocks: DocumentVisionBlock[];
  concepts: ConceptNode[];
  keyIdeas: KeyIdeaNode[];
  misconceptions: MisconceptionNode[];
  questions: SocraticQuestionNode[];
}

// ----------------------------------------------------------------------------
// 6. 5 × 6 CONTENT FACTORY MATRIX
// ----------------------------------------------------------------------------
export type TeachingDepth =
  | 'basis'
  | 'developing'
  | 'proficient'
  | 'advanced'
  | 'deep';

export interface DepthDescriptor {
  depth: TeachingDepth;
  label: string;
  subtitle: string;
  cognitiveTarget: string;
  icon: string;
}

// 6 Artifact Types:
export interface TeacherExplanationItem {
  stepNumber: number;
  title: string;
  explanation: string;
  socraticQuestion: string;
  citations: EvidenceCitation[];
}

export interface VisualDiagramItem {
  diagramType: 'process_chain' | 'comparison' | 'cycle' | 'cause_effect' | 'classification';
  title: string;
  subtitle: string;
  steps: {
    label: string;
    icon: string;
    description: string;
    highlight?: boolean;
  }[];
  citations: EvidenceCitation[];
}

export interface RealWorldExampleItem {
  scenarioTitle: string;
  context: string;
  application: string;
  whyItMatters: string;
  citations: EvidenceCitation[];
}

export interface KeyPointItem {
  pointNumber: number;
  takeaway: string;
  scientificPrinciple: string;
  citations: EvidenceCitation[];
}

export interface ChalkboardNode {
  id: string;
  label: string;
  subLabel?: string;
  icon?: string;
  x: number;
  y: number;
}

export interface ChalkboardEdge {
  from: string;
  to: string;
  label?: string;
}

export interface BoardSummaryPlan {
  boardTitle: string;
  boardSubtitle: string;
  formulaBanner?: {
    title: string;
    formula: string;
  };
  keyTakeawayBox: {
    heading: string;
    text: string;
  };
  nodes: ChalkboardNode[];
  edges: ChalkboardEdge[];
  citations: EvidenceCitation[];
}

export interface PrintableNotesDocument {
  chapterTitle: string;
  depth: TeachingDepth;
  whatILearned: string[];
  corePrinciplesToRemember: string[];
  thinkAndReasonPrompts: string[];
  drawOrActivityChallenge: {
    title: string;
    instructions: string;
  };
  citations: EvidenceCitation[];
}

// Single Depth Package (Contains all 6 artifacts)
export interface DepthTeachingArtifacts {
  depth: TeachingDepth;
  teacherExplanation: TeacherExplanationItem[];
  visuals: VisualDiagramItem;
  realWorldExamples: RealWorldExampleItem[];
  keyPoints: KeyPointItem[];
  boardSummary: BoardSummaryPlan;
  printableNotes: PrintableNotesDocument;
  misconceptionAlerts: MisconceptionNode[];
  socraticQuestions: SocraticQuestionNode[];
}

// Complete 5-Depth Teaching Package for a Chapter
export interface ChapterTeachingPackage {
  packageId: string;
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
  // Metadata & Audit
  metadata: {
    sourceVersion: string;
    ocrVersion: string;
    structureVersion: string;
    knowledgeVersion: string;
    contentFactoryVersion: string;
    modelVersion: string;
    generatedAt: string;
    validationScore: number;
    citationCoverageRate: number; // Must be 1.0 (100%)
  };
}

// ----------------------------------------------------------------------------
// 7. MODEL ORCHESTRATION & QUALITY GATE
// ----------------------------------------------------------------------------
export interface ModelProviderConfig {
  visionModel: string;
  reasoningModel: string;
  generationModel: string;
  validationModel: string;
  embeddingModel: string;
}

export interface ContentQualityValidationReport {
  chapterId: string;
  citationCompleteness: number; // 1.0 = 100%
  evidencePrecision: number;    // > 0.95
  evidenceRelevance: number;    // > 0.95
  gradeAppropriateness: number; // > 0.95
  depthConsistency: number;     // > 0.95
  structureIntegrity: number;   // 1.0 = 100%
  pageCoverage: number;         // 1.0 = 100%
  unsupportedClaimsCount: number; // Must be 0
  overallPass: boolean;
  timestamp: string;
}
