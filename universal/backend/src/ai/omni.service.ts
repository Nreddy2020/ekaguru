import { Injectable, Logger } from '@nestjs/common';
import { PROMPT_TEMPLATES } from './prompts';
import { ExtractedAtom, GeneratedLens, ConceptEdge } from './omni.types';
import { LlmService } from './llm.service';

@Injectable()
export class OmniEngineService {
    private readonly logger = new Logger(OmniEngineService.name);
    private llmService: LlmService;

    constructor(llmService: LlmService) {
        this.llmService = llmService;
    }

    // The 6 Dimensions of the Hexagonal Search
    private readonly DIMENSIONS = [
        'Identity',   // What is it?
        'Purpose',    // Why does it exist?
        'Ecosystem',  // Where is it used? (Competitors)
        'Mechanics',  // How does it work?
        'Evolution',  // Future & Updates
        'Path'        // LKG -> PhD
    ];

    // Common English stopwords to filter out of keyword extraction
    private readonly STOPWORDS = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one',
        'our', 'out', 'has', 'have', 'had', 'his', 'how', 'its', 'may', 'new', 'now', 'old',
        'see', 'way', 'who', 'did', 'get', 'let', 'say', 'she', 'too', 'use', 'also', 'been',
        'call', 'come', 'each', 'from', 'just', 'know', 'like', 'long', 'look', 'make', 'many',
        'more', 'most', 'much', 'must', 'name', 'only', 'over', 'such', 'take', 'than', 'them',
        'then', 'they', 'this', 'time', 'very', 'want', 'well', 'were', 'what', 'when', 'will',
        'with', 'would', 'your', 'that', 'about', 'after', 'being', 'could', 'every', 'first',
        'great', 'might', 'other', 'shall', 'since', 'still', 'their', 'there', 'these', 'thing',
        'think', 'those', 'three', 'under', 'until', 'using', 'where', 'which', 'while', 'world',
        'page', 'chapter', 'section', 'figure', 'table', 'class', 'student', 'students',
        'some', 'into', 'does', 'because', 'through', 'between', 'should', 'before', 'number',
        'given', 'following', 'however', 'example', 'different', 'another', 'whether', 'answer'
    ]);

    /**
     * EXTRACTS Atomic Concepts from raw text.
     * Uses LLM when available, falls back to frequency analysis.
     */
    async extractAtomicConcepts(text: string): Promise<ExtractedAtom[]> {
        this.logger.log(`Parsing text for atomic concepts... (Length: ${text.length})`);

        if (this.llmService.isReady()) {
            try {
                const atoms = await this.llmService.extractAtomicConcepts(text);
                return atoms.map(a => ({
                    name: a.name,
                    type: (a.type?.toUpperCase() as any) || 'CONCEPT',
                    definition: a.definition
                }));
            } catch (error) {
                this.logger.warn('LLM extraction failed, falling back to frequency analysis', error);
            }
        }

        // Fallback: Frequency Analysis
        const cleanText = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
        const words = cleanText.split(/\s+/).filter(w => w.length > 3 && !this.STOPWORDS.has(w));

        if (words.length === 0) return [];

        // 2. Frequency Analysis
        const freqMap: Record<string, number> = {};
        words.forEach(w => freqMap[w] = (freqMap[w] || 0) + 1);

        // 3. Sort by frequency, take top 10 meaningful words
        const topWords = Object.entries(freqMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

        this.logger.log(`  Top keywords: ${topWords.join(', ')}`);

        // 4. Generate Atoms with quality scoring
        let atoms = topWords.map(word => ({
            name: word,
            type: "CONCEPT" as const,
            definition: `Core concept derived from analysis: ${word}`
        }));

        // 5. Validate atoms if LLM is available
        if (this.llmService.isReady()) {
            atoms = await this.validateAtoms(atoms);
        }

        return atoms;
    }

    private async validateAtoms(atoms: ExtractedAtom[]): Promise<ExtractedAtom[]> {
        const validated: ExtractedAtom[] = [];

        for (const atom of atoms) {
            try {
                const validation = await this.llmService.validateAtomQuality(atom);
                if (validation.valid && validation.score >= 0.5) {
                    validated.push(atom);
                } else {
                    this.logger.warn(`Atom "${atom.name}" filtered out: ${validation.issues.join(', ')}`);
                }
            } catch {
                validated.push(atom);
            }
        }

        return validated.length > 0 ? validated : atoms;
    }

    /**
     * GENERATES Adaptive Lenses for a concept.
     * Creates: Kid (Story), Student (Analogy), Genius (First Principles).
     */
    async generateLenses(conceptName: string, context: string): Promise<GeneratedLens[]> {
        if (this.llmService.isReady()) {
            try {
                const lenses = await this.llmService.generateThreeLenses(conceptName, context);
                return lenses.map(l => ({
                    role: l.role.includes('KID') ? 'KID' : l.role.includes('STUDENT') ? 'STUDENT' : 'FIRST_PRINCIPLES',
                    narrative: l.narrative,
                    analogy: l.analogy,
                    visualPrompt: l.visualPrompt,
                    historicalContext: l.historicalContext
                }));
            } catch (error) {
                this.logger.warn('LLM lens generation failed, falling back to algorithmic', error);
            }
        }

        // Fallback: Algorithmic templates
        return [
            this.generateKidLens(conceptName),
            this.generateStudentLens(conceptName, context),
            this.generateFirstPrinciplesLens(conceptName)
        ];
    }

    private generateKidLens(concept: string): GeneratedLens {
        // "The Storyteller" - Metaphor Engine
        const narratives = [
            `Once upon a time, ${concept} was a tiny seed that wanted to grow big and strong.`,
            `Imagine ${concept} is like a superhero who saves the day by being super fast!`,
            `If ${concept} was a flavor of ice cream, it would be the one that never melts.`
        ];
        const randomNarrative = narratives[Math.floor(Math.random() * narratives.length)];

        return {
            role: 'KID',
            narrative: randomNarrative,
            analogy: `It's just like a magic trick!`,
            visualPrompt: `Cartoon character representing ${concept} in a bright, colorful world`,
            historicalContext: `A basic introduction to ${concept} for young learners.`
        };
    }

    private generateStudentLens(concept: string, context: string): GeneratedLens {
        // "The Analyst" - Definition Engine
        return {
            role: 'STUDENT',
            narrative: `${concept} is a fundamental concept defined by its properties and interactions within the system.`,
            analogy: `Think of it as a building block for larger structures.`,
            visualPrompt: `Educational diagram with clear labels explaining ${concept}`,
            historicalContext: `This concept emerged from foundational work in the field.`
        };
    }

    private generateFirstPrinciplesLens(concept: string): GeneratedLens {
        // "The First-Principles Thinker" (Genius Mode)
        // Simulates deep, interdisciplinary reasoning.

        const disciplines = ['Thermodynamics', 'Game Theory', 'Quantum Mechanics', 'Economics', 'Evolutionary Biology'];
        const chosenDiscipline = disciplines[Math.floor(Math.random() * disciplines.length)];

        return {
            role: 'FIRST_PRINCIPLES',
            narrative: `Fundamentally, ${concept} is an emergent property of underlying constraints. If we strip away the abstraction, we find a raw interaction of forces.`,
            analogy: `Socratic Question: Does ${concept} exist independently of our observation? (Interdisciplinary: Maps to Entropy in ${chosenDiscipline})`,
            visualPrompt: `Abstract 3D topology showing the phase space of ${concept}`,
            historicalContext: `Historically linked to ${chosenDiscipline} - first formulated in this context.`
        };
    }

    /**
     * MAPS Relationships between atoms.
     * Uses LLM for dynamic edge generation when available.
     */
    async mapRelationships(atoms: ExtractedAtom[]): Promise<ConceptEdge[]> {
        this.logger.log(`Mapping relationships between ${atoms.length} atoms...`);

        if (this.llmService.isReady() && atoms.length >= 2) {
            try {
                const edges = await this.llmService.generateConceptEdges(atoms);
                if (edges && edges.length > 0) {
                    this.logger.log(`LLM generated ${edges.length} concept edges`);
                    return edges;
                }
            } catch (error) {
                this.logger.warn('LLM edge generation failed, using fallback', error);
            }
        }

        // Fallback: Mock Logic for Physics Example
        const edges: ConceptEdge[] = [];
        const atomNames = atoms.map(a => a.name);

        if (atomNames.includes('Velocity') && atomNames.includes('Time')) {
            edges.push({
                source: 'Velocity',
                target: 'Time',
                relation: 'PREREQUISITE',
                weight: 0.9,
                description: 'Understanding Velocity requires a concept of Time.'
            });
        }

        if (atomNames.includes('Speed') && atomNames.includes('Velocity')) {
            edges.push({
                source: 'Speed',
                target: 'Velocity',
                relation: 'COMPONENT_OF', // Or IS_A simplified version
                weight: 0.8,
                description: 'Speed is the magnitude component of Velocity.'
            });
        }

        return edges;
    }

    async architectSubject(topic: string, category: string): Promise<any> {
        this.logger.log(`🌍 OMNI-ENGINE: Initiating Deep-Search for "${topic}"...`);

        // Phase 1: The Scout (Gather Dimensions)
        const dimensions = await this.scoutTopic(topic);

        // Phase 2: The Architect (Build Curriculum Tree)
        const curriculum = this.buildCurriculumTree(topic, dimensions);

        // Phase 3: The Professor (Enrichment - Mocked for now, but structure is ready)
        // In real implementation, this would fetch video links, competitor matrix, etc.

        return curriculum;
    }

    private async scoutTopic(topic: string): Promise<any> {
        // Simulating the "World Best" search algorithm
        // In reality, this would blast 6 parallel LLM calls or Search API calls

        return {
            identity: `The definitive guide to ${topic}.`,
            purpose: `Solves critical problems in ${topic} domain.`,
            ecosystem: ['Competitor A', 'Competitor B', 'Platform X'],
            mechanics: 'Complex internal architecture',
            evolution: 'Rapidly evolving field',
            path: 'From beginner to expert'
        };
    }

    private buildCurriculumTree(topic: string, dimensions: any) {
        return {
            subject: {
                name: topic,
                description: `A 360° Mastery Path for ${topic}. Exploring Identity, Purpose, Ecosystem, Mechanics, and Evolution.`,
                category: "Omni-Knowledge",
                phases: [
                    // LKG / Beginner: Identity & Purpose
                    {
                        name: "Phase 1: Foundation (LKG - Student)",
                        modules: [
                            {
                                title: `Identity: What is ${topic}?`,
                                topics: [`The "LEGO" Analogy (LKG)`, `Textbook Definition (Student)`, `Visual Mental Model`]
                            },
                            {
                                title: `Purpose: Why ${topic}?`,
                                topics: [`Problem vs Solution`, `Life before ${topic}`]
                            }
                        ]
                    },
                    // Professional / Architect: Ecosystem & Mechanics
                    {
                        name: "Phase 2: Professional Application",
                        modules: [
                            {
                                title: `Ecosystem & Competitors`,
                                topics: [`${topic} vs The World`, `When NOT to use it`, `Tech Stack Integration`]
                            },
                            {
                                title: `Mechanics: Under the Hood`,
                                topics: [`Architecture Diagram`, `Data Flow Deep Dive`, `Performance Internals`]
                            }
                        ]
                    },
                    // PhD / Research: Evolution & Mastery
                    {
                        name: "Phase 3: Research & Future (PhD)",
                        modules: [
                            {
                                title: `Evolution & Trends`,
                                topics: [`The History of Version 1.0`, `Future Roadmap 2030`, `Research Frontiers`]
                            },
                            {
                                title: `Mastery Challenges`,
                                topics: [`Build your own ${topic} from scratch`, `Impossible Edge Cases`]
                            }
                        ]
                    }
                ]
            }
        };
    }

    /**
     * GENERATES a hierarchical topic tree for deep learning.
     * Returns sub-topics that should be learned to comprehensively understand the base topic.
     */
    async generateTopicTree(baseTopic: string, depth: number = 2): Promise<string[]> {
        this.logger.log(`Generating topic tree for "${baseTopic}" (depth: ${depth})...`);

        // Simulated topic decomposition (in production, use LLM)
        const topicTemplates: Record<string, string[]> = {
            'openshift': [
                'OpenShift Architecture',
                'OpenShift Networking',
                'OpenShift Security',
                'OpenShift Storage',
                'OpenShift Operators',
                'OpenShift CLI',
                'OpenShift Monitoring',
                'OpenShift CI/CD'
            ],
            'kubernetes': [
                'Kubernetes Pods',
                'Kubernetes Services',
                'Kubernetes Deployments',
                'Kubernetes Networking',
                'Kubernetes Storage',
                'Kubernetes Security'
            ]
        };

        // Match topic to template
        const normalizedTopic = baseTopic.toLowerCase();
        for (const [key, subtopics] of Object.entries(topicTemplates)) {
            if (normalizedTopic.includes(key)) {
                this.logger.log(`   ✨ Generated ${subtopics.length} sub-topics`);
                return subtopics;
            }
        }

        // Generic fallback: generate conceptual sub-topics
        const genericSubtopics = [
            `${baseTopic} Fundamentals`,
            `${baseTopic} Architecture`,
            `${baseTopic} Best Practices`,
            `${baseTopic} Advanced Concepts`,
            `${baseTopic} Troubleshooting`
        ];

        this.logger.log(`   ✨ Generated ${genericSubtopics.length} generic sub-topics`);
        return genericSubtopics;
    }

    /**
     * GENERATES a personalized learning roadmap for any goal.
     * Returns structured path from Beginner to Architect level.
     */
    async generateLearningRoadmap(goal: string): Promise<any> {
        this.logger.log(`🎯 Generating learning roadmap for: "${goal}"...`);

        // Extract the core topic from the goal
        const topicMatch = goal.match(/(?:become|learn|master)\s+(?:best\s+)?(?:a\s+)?(.+?)(?:\s+architect|\s+expert|$)/i);
        const coreTopic = topicMatch ? topicMatch[1].trim() : goal;

        // Generate 5-level roadmap
        const roadmap = {
            goal: goal,
            coreTopic: coreTopic,
            estimatedDuration: "30+ months",
            levels: [
                {
                    level: "Beginner",
                    duration: "0-3 months",
                    milestones: [
                        `Understand ${coreTopic} fundamentals`,
                        `Set up development environment`,
                        `Complete basic tutorials`
                    ],
                    topics: [
                        `${coreTopic} Basics`,
                        `${coreTopic} Installation`,
                        `${coreTopic} Getting Started`
                    ]
                },
                {
                    level: "Intermediate",
                    duration: "3-9 months",
                    milestones: [
                        `Build real-world projects`,
                        `Understand core architecture`,
                        `Master common patterns`
                    ],
                    topics: [
                        `${coreTopic} Architecture`,
                        `${coreTopic} Best Practices`,
                        `${coreTopic} Common Patterns`
                    ]
                },
                {
                    level: "Advanced",
                    duration: "9-18 months",
                    milestones: [
                        `Design complex systems`,
                        `Optimize performance`,
                        `Implement security best practices`
                    ],
                    topics: [
                        `${coreTopic} Advanced Concepts`,
                        `${coreTopic} Performance`,
                        `${coreTopic} Security`
                    ]
                },
                {
                    level: "Expert",
                    duration: "18-30 months",
                    milestones: [
                        `Contribute to community`,
                        `Solve production issues`,
                        `Mentor others`
                    ],
                    topics: [
                        `${coreTopic} Troubleshooting`,
                        `${coreTopic} Community`,
                        `${coreTopic} Leadership`
                    ]
                },
                {
                    level: "Architect",
                    duration: "30+ months",
                    milestones: [
                        `Design enterprise solutions`,
                        `Publish thought leadership`,
                        `Speak at conferences`
                    ],
                    topics: [
                        `${coreTopic} Enterprise Architecture`,
                        `${coreTopic} Thought Leadership`,
                        `${coreTopic} Innovation`
                    ]
                }
            ]
        };

        this.logger.log(`   ✨ Generated roadmap with ${roadmap.levels.length} levels`);
        return roadmap;
    }

    /**
     * ARCHITECTS a Book Structure from raw text content.
     * Uses keyword density analysis and heuristic header detection to create a Table of Contents.
     */
    async architectBook(fullText: string): Promise<any> {
        this.logger.log(`Architecting Book Structure from ${fullText.length} characters...`);

        // 1. Detect potential headers using multiple heuristics
        const lines = fullText.split('\n').filter(l => l.trim().length > 0);
        const potentialHeaders = lines.filter(l => {
            const clean = l.trim();
            if (clean.length > 80 || clean.length < 3) return false;

            // All caps (e.g., "INTRODUCTION")
            const isYelling = clean === clean.toUpperCase() && /[A-Z]{3,}/.test(clean);
            // Named sections (e.g., "Chapter 1", "Unit 2")
            const isNamedSection = /^(Chapter|Module|Section|Unit|Part|Lesson)\s+\d+/i.test(clean);
            // Numbered items (e.g., "1. Introduction", "I. Overview")
            const isNumbered = /^\d+[\.\)]\s+[A-Z]/.test(clean) || /^[IVXLC]+[\.\)]\s+[A-Z]/.test(clean);
            // Title case (e.g., "The Theory of Relativity") — most words start with uppercase
            const words = clean.split(/\s+/);
            const capsWords = words.filter(w => /^[A-Z]/.test(w)).length;
            const isTitleCase = words.length >= 2 && words.length <= 10 && (capsWords / words.length) > 0.6;
            // Colon-prefixed topic (e.g., "Topic: Something Important")
            const hasColon = clean.includes(':') && clean.indexOf(':') < 30;

            return isYelling || isNamedSection || isNumbered || (isTitleCase && clean.length < 60) || (hasColon && clean.length < 60);
        });

        this.logger.log(`Detected ${potentialHeaders.length} potential headers from ${lines.length} lines.`);

        // 2. Identify top themes (Keywords) to cluster content if no headers found
        if (potentialHeaders.length < 2) {
            this.logger.log("Few headers found. Using Topic Clustering...");
            // Use a large buffer for better context
            let atoms = await this.extractAtomicConcepts(fullText.substring(0, 50000));

            // SAFETY NET: If extraction failed, force generic structure
            if (atoms.length === 0) {
                this.logger.warn("Atomic Concept Extraction yielded 0 results. Using Fallback Structure.");
                if (fullText.trim().length === 0) {
                    this.logger.warn("Document appears empty (possibly scanned). Using visual placeholder.");
                    return {
                        title: "Scanned Document",
                        chapters: [{
                            title: "Visual Content",
                            level: 1,
                            topics: [{
                                title: "Document Pages",
                                difficulty: "beginner",
                                keyPoints: ["Content is visual or scanned", "Please review pages manually"],
                                visualType: "body"
                            }]
                        }]
                    };
                }
                atoms = [
                    { name: "Core Concepts", type: "CONCEPT", definition: "Key ideas" },
                    { name: "Key Takeaways", type: "CONCEPT", definition: "Highlights" }
                ];
            }

            // Create synthetic chapters based on top concepts
            return {
                title: "Generated Curriculum",
                chapters: atoms.map((atom, index) => ({
                    title: `Module ${index + 1}: ${atom.name}`,
                    level: 1,
                    topics: [
                        {
                            title: `Fundamentals of ${atom.name}`,
                            difficulty: "beginner",
                            keyPoints: [`Core principles of ${atom.name}`, `Why ${atom.name} matters`],
                            visualType: "header"
                        },
                        {
                            title: `Advanced ${atom.name} Concepts`,
                            difficulty: "advanced",
                            keyPoints: [`Deep dive into ${atom.name}`, `Real-world applications`],
                            visualType: "body"
                        }
                    ]
                }))
            };
        }

        // 3. Build Structure from Headers
        const chapters = [];
        let currentChapter = null;

        for (const header of potentialHeaders) {
            // Simple clustering: If we have a header, it starts a new block
            if (currentChapter) {
                chapters.push(currentChapter);
            }
            currentChapter = {
                title: header.trim(),
                level: 1,
                topics: [
                    {
                        title: "Overview",
                        difficulty: "beginner",
                        keyPoints: ["Introduction to section"],
                        visualType: "header"
                    }
                ]
            };
        }
        if (currentChapter) chapters.push(currentChapter);

        // Limit to reasonable number
        const finalizedChapters = chapters.slice(0, 10);

        // GLOBAL SAFETY NET: If we still have no chapters (e.g. headers were bad), fallback to visual content
        if (finalizedChapters.length === 0) {
            this.logger.warn("No chapters generated from headers. Using Global Fallback.");
            return {
                title: "Visual Document",
                chapters: [{
                    title: "Book Content",
                    level: 1,
                    topics: [{
                        title: "Review Content",
                        difficulty: "beginner",
                        keyPoints: ["Content successfully extracted", "Structure could not be automatically determined"],
                        visualType: "body"
                    }]
                }]
            };
        }

        return {
            title: "Structured Curriculum",
            chapters: finalizedChapters
        };
    }
}
