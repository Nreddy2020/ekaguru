import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from '../ai/template.service';
import { OmniEngineService } from '../ai/omni.service';
import { GeneratedLens } from '../ai/omni.types';

// Version Tracking Interfaces
interface AtomVersion {
    version: string;
    timestamp: Date;
    definition: string;
    lenses: GeneratedLens[];
    delta?: string; // What changed from previous version
}

interface VersionedAtom {
    baseName: string;
    currentVersion: string;
    versions: AtomVersion[]; // Last 5 versions (FIFO)
}

@Injectable()
export class SubjectService {
    private readonly logger = new Logger(SubjectService.name);

    private subjectsDb = new Map<string, any>(); // In-memory DB

    private atomStore = new Map<string, any>(); // Knowledge Graph Store
    // Track Student Mastery: Map<StudentId, Map<AtomName, MasteryLevel>>
    private studentState = new Map<string, Map<string, number>>();

    constructor(
        private templateService: TemplateService,
        private omniEngine: OmniEngineService,
    ) { }

    async createUniversalSubject(name: string, category: string) {
        this.logger.log(`INITIATING CREATION: ${name} (${category})`);

        // Step 1: Architect the Master Plan using Omni-Engine 🧠
        const curriculum = await this.omniEngine.architectSubject(name, category);

        // Generate a random ID

        // Generate a random ID
        const id = Math.random().toString(36).substring(7);
        curriculum.subject.id = id;

        this.logger.log(`Curriculum Generated: ${JSON.stringify(curriculum.subject.name)}`);

        // Step 2: Save to In-Memory DB
        this.subjectsDb.set(id, curriculum.subject);
        this.logger.log(`Saved Subject ID: ${id}`);

        return {
            status: 'CREATED',
            subjectId: id,
            data: curriculum.subject
        };
    }

    async getSubject(id: string) {
        if (!this.subjectsDb.has(id)) {
            return { error: 'Subject not found' };
        }
        return this.subjectsDb.get(id);
    }

    async findAll() {
        this.logger.log(`Fetching all subjects. Total: ${this.subjectsDb.size}`);
        return Array.from(this.subjectsDb.values());
    }
    /**
     * Step 3: THE COGNITIVE CORE - Orchestrator
     * Takes a Visual BookStructure and transforms it into a Knowledge Graph.
     */
    async processBookContent(structure: any): Promise<any> {
        this.logger.log(`🧠 COGNITIVE CORE: Processing "${structure.title}" into Knowledge Graph...`);

        const graphNodes = [];

        // 1. Traverse Structure
        if (structure.chapters) {
            for (const chapter of structure.chapters) {
                this.logger.debug(`  > Analyzing Chapter: ${chapter.title}`);

                if (chapter.topics) {
                    for (const topic of chapter.topics) {
                        // 2. Extract Text Context (Title + KeyPoints + Content)
                        const contextText = `${topic.title}. ${topic.keyPoints.join('. ')}. ${topic.contentPreview || ''}`;

                        // 3. AI Extraction (Omni-Engine)
                        const atoms = await this.omniEngine.extractAtomicConcepts(contextText);

                        // 4. Transform to Graph Nodes & Generate Lenses
                        for (const atom of atoms) {
                            const lenses = await this.omniEngine.generateLenses(atom.name, contextText);

                            const node = {
                                type: 'CONCEPT_ATOM',
                                name: atom.name,
                                definition: atom.definition,
                                lenses: lenses,
                                sourceTopic: topic.title
                            };

                            graphNodes.push(node);
                            this.atomStore.set(atom.name.toLowerCase(), node);
                        }

                        // 5. Map Relationships (Nodes -> Edges)
                        const topicAtoms = atoms; // For this topic context
                        const edges = await this.omniEngine.mapRelationships(topicAtoms);

                        // Add edges to graph (flat list for now)
                        if (edges.length > 0) {
                            (graphNodes as any).edges = (graphNodes as any).edges || [];
                            (graphNodes as any).edges.push(...edges);
                        }
                    }
                }
            }
        }

        this.logger.log(`✅ Knowledge Graph Built: ${graphNodes.length} Nodes, ${(graphNodes as any).edges?.length || 0} Edges.`);
        return {
            bookTitle: structure.title,
            graphSize: graphNodes.length,
            edgeCount: (graphNodes as any).edges?.length || 0,
            nodes: graphNodes,
            edges: (graphNodes as any).edges || []
        };
    }
    /**
     * UPDATES the Mastery Level for a specific student and atom.
     * Level: 0 (Unknown) -> 100 (Mastered)
     */
    async updateStudentMastery(studentId: string, atomName: string, level: number) {
        if (!this.studentState.has(studentId)) {
            this.studentState.set(studentId, new Map());
        }
        const state = this.studentState.get(studentId);
        state.set(atomName.toLowerCase(), level);
        this.logger.log(`📈 Student ${studentId} mastery updated: ${atomName} = ${level}%`);
    }

    /**
     * GETS the Mastery State for a student.
     */
    async getStudentMastery(studentId: string): Promise<Map<string, number>> {
        return this.studentState.get(studentId) || new Map();
    }

    /**
     * Retrieves an Atomic Concept by name.
     * Used by TutorService to answer questions dynamically.
     */
    async getAtom(name: string): Promise<any> {
        this.logger.log(`Fetching Atom: ${name}`);
        const stored = this.atomStore.get(name.toLowerCase());

        // Handle versioned atoms (new format)
        if (stored && 'versions' in stored) {
            const versionedAtom = stored as VersionedAtom;
            const currentVersion = versionedAtom.versions[versionedAtom.versions.length - 1];

            // Return in old format for backward compatibility with TutorService
            return {
                type: 'CONCEPT_ATOM',
                name: versionedAtom.baseName,
                definition: currentVersion.definition,
                lenses: currentVersion.lenses,
                sourceTopic: versionedAtom.baseName,
                // Include version metadata
                version: currentVersion.version,
                versionCount: versionedAtom.versions.length
            };
        }

        // Handle old format atoms (backward compatibility)
        return stored;
    }

    /**
     * SELF-EVOLVE: Learns a new topic on the fly.
     * 1. Architects the Subject
     * 2. Extracts Atoms
     * 3. Stores in Knowledge Graph
     */
    async learnTopic(topicName: string, version?: string): Promise<any> {
        // Parse topic name and version (e.g., "OpenShift v4.13" or just "OpenShift")
        const versionMatch = topicName.match(/(.+?)\s+v?(\d+\.\d+)/i);
        const baseName = versionMatch ? versionMatch[1].trim() : topicName;
        const detectedVersion = versionMatch ? versionMatch[2] : (version || '1.0');

        this.logger.log(`🧬 SELF-EVOLVE: Learning "${baseName}" version ${detectedVersion}...`);

        // 1. Check if this topic already exists (version-aware)
        const existing = this.atomStore.get(baseName.toLowerCase()) as VersionedAtom | undefined;

        // 2. Generate new knowledge via OmniEngine
        const curriculum = await this.omniEngine.architectSubject(baseName, "Self-Learning");
        const contextText = `${curriculum.subject.name}. ${curriculum.subject.description}`;
        const atoms = await this.omniEngine.extractAtomicConcepts(contextText);

        // 3. Generate lenses for the primary atom
        if (!atoms || atoms.length === 0) {
            this.logger.error(`Failed to extract atoms for ${baseName}`);
            return null;
        }

        const primaryAtom = atoms[0];
        const lenses = await this.omniEngine.generateLenses(baseName, contextText);

        // 4. Compute delta if this is a new version of existing topic
        let delta: string | undefined;
        if (existing && existing.versions.length > 0) {
            const lastVersion = existing.versions[existing.versions.length - 1];
            delta = this.computeDelta(lastVersion.definition, primaryAtom.definition);
            this.logger.log(`   📊 Delta detected: ${delta}`);
        }

        // 5. Create new version entry
        const newVersion: AtomVersion = {
            version: detectedVersion,
            timestamp: new Date(),
            definition: primaryAtom.definition,
            lenses: lenses,
            delta: delta
        };

        // 6. Update or create versioned atom
        if (existing) {
            // Append new version and keep only last 5
            existing.versions.push(newVersion);
            if (existing.versions.length > 5) {
                existing.versions.shift(); // Remove oldest
            }
            existing.currentVersion = detectedVersion;
            this.logger.log(`   ✨ Updated to version ${detectedVersion} (${existing.versions.length} versions stored)`);
        } else {
            // Create new versioned atom
            const versionedAtom: VersionedAtom = {
                baseName: baseName,
                currentVersion: detectedVersion,
                versions: [newVersion]
            };
            this.atomStore.set(baseName.toLowerCase(), versionedAtom);
            this.logger.log(`   ✨ Learned new concept: ${baseName} v${detectedVersion}`);
        }

        // Return in TutorService-compatible format (same as getAtom)
        return {
            type: 'CONCEPT_ATOM',
            name: baseName,
            definition: newVersion.definition,
            lenses: newVersion.lenses,
            sourceTopic: baseName,
            version: newVersion.version,
            versionCount: existing ? existing.versions.length : 1
        };
    }

    /**
     * Computes the delta (what changed) between two definitions
     */
    private computeDelta(oldDef: string, newDef: string): string {
        // Simple diff logic (in production, use proper diff algorithm)
        if (oldDef === newDef) return "No changes";

        const oldWords = oldDef.split(' ');
        const newWords = newDef.split(' ');

        if (newWords.length > oldWords.length) {
            return `Added ${newWords.length - oldWords.length} new concepts`;
        } else if (newWords.length < oldWords.length) {
            return `Removed ${oldWords.length - newWords.length} concepts`;
        }
        return "Definition updated";
    }

    /**
     * DEEP LEARN: Proactively learns comprehensive knowledge about a topic.
     * Generates sub-topics and learns each recursively.
     */
    async deepLearnTopic(baseTopic: string, depth: number = 2): Promise<{ totalLearned: number; topics: string[] }> {
        this.logger.log(`🎓 DEEP LEARNING: "${baseTopic}" (depth: ${depth})...`);

        const learnedTopics: string[] = [];

        // 1. Learn the base topic first
        await this.learnTopic(baseTopic);
        learnedTopics.push(baseTopic);

        // 2. Generate sub-topics
        if (depth > 0) {
            const subtopics = await this.omniEngine.generateTopicTree(baseTopic, depth);

            // 3. Learn each sub-topic
            for (const subtopic of subtopics) {
                this.logger.log(`   📖 Learning sub-topic: ${subtopic}...`);
                await this.learnTopic(subtopic);
                learnedTopics.push(subtopic);
            }
        }

        this.logger.log(`✅ Deep learning complete: ${learnedTopics.length} topics learned`);
        return {
            totalLearned: learnedTopics.length,
            topics: learnedTopics
        };
    }

    /**
     * GET ingestion progress for a topic
     */
    async getIngestionProgress(baseTopic: string): Promise<{ learned: number; total: number; percentage: number }> {
        const subtopics = await this.omniEngine.generateTopicTree(baseTopic);
        const total = subtopics.length + 1; // +1 for base topic

        let learned = 0;
        if (this.atomStore.has(baseTopic.toLowerCase())) learned++;

        for (const subtopic of subtopics) {
            if (this.atomStore.has(subtopic.toLowerCase())) learned++;
        }

        return {
            learned,
            total,
            percentage: Math.round((learned / total) * 100)
        };
    }
}
