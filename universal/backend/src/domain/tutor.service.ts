import { Injectable, Logger } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { LlmService } from '../ai/llm.service';

export interface TopicContent {
    whatItIs: string;
    whyItExists: string;
    howItWorks: string[];
    keyComponents: string[];
    examples: string[];
}

export interface PersonaExplanation {
    whatItIs: string;
    whyItExists: string;
    howItWorks: string[];
    keyComponents: string[];
}

export interface WeeklyStat {
    day: string;
    fearIndex: number; // 0-10 (10 = high fear)
    confidence: number; // 0-10 (10 = high confidence)
    topicsCovered: number;
}

export interface Insight {
    id: string;
    type: 'success' | 'struggle' | 'pattern';
    message: string;
    date: string;
    relatedTopic?: string;
}

export interface ParentAnalytics {
    studentId: string;
    currentMastery: number; // Percentage
    fearReduction: number; // Percentage decrease
    activeStreak: number;
    weeklyProgress: WeeklyStat[];
    recentInsights: Insight[];
    masteredTopics: string[];
}

@Injectable()
export class TutorService {
    private readonly logger = new Logger(TutorService.name);

    // Mock topic database - in production, this would come from a real database
    private topics = new Map<string, TopicContent>();

    constructor(
        private readonly subjectService: SubjectService,
        private llmService: LlmService
    ) {
        this.initializeSampleTopics();
    }

    private initializeSampleTopics() {
        this.topics.set('kubernetes-architecture', {
            whatItIs: 'Kubernetes architecture is a distributed system design that orchestrates containerized applications across a cluster of machines.',
            whyItExists: 'It exists to automate deployment, scaling, and management of containerized applications, solving the complexity of running containers at scale.',
            howItWorks: [
                'API Server receives and processes requests',
                'Scheduler assigns pods to nodes based on resource requirements',
                'Controller Manager maintains desired state',
                'etcd stores cluster configuration and state',
                'Kubelet on each node manages pod lifecycle'
            ],
            keyComponents: [
                'API Server - Central management hub',
                'Scheduler - Pod placement engine',
                'Controller Manager - State reconciliation',
                'etcd - Distributed key-value store',
                'Kubelet - Node agent',
                'kube-proxy - Network proxy'
            ],
            examples: [
                'Deploying a web application with auto-scaling',
                'Running microservices with service discovery',
                'Managing stateful databases with persistent volumes'
            ]
        });
    }

    async getTopicExplanation(topicId: string): Promise<TopicContent | null> {
        this.logger.log(`Fetching topic explanation for: ${topicId}`);
        return this.topics.get(topicId) || null;
    }

    async getPersonaExplanation(topicId: string, persona: string): Promise<PersonaExplanation | null> {
        this.logger.log(`Fetching ${persona} explanation for: ${topicId}`);

        // 1. Try to fetch from Dynamic Knowledge Graph (The Brain)
        let atom = await this.subjectService.getAtom(topicId);

        // 🧬 SELF-EVOLUTION TRIGGER: If not found, learn it instantly!
        if (!atom) {
            this.logger.warn(`Concept "${topicId}" not found. Initiating Self-Evolution Protocol...`);
            atom = await this.subjectService.learnTopic(topicId);
        }

        if (atom && atom.lenses) {
            // Find the lens for the requested persona
            const roleMap: Record<string, string> = {
                'kid': 'KID',
                'student': 'STUDENT',
                'pro': 'PROFESSIONAL',
                'architect': 'FIRST_PRINCIPLES',
                'professor': 'FIRST_PRINCIPLES',
                'genius': 'FIRST_PRINCIPLES'
            };

            const targetRole = roleMap[persona.toLowerCase()] || 'STUDENT';
            const lens = atom.lenses.find((l: any) => l.role === targetRole);

            if (lens) {
                this.logger.log(`✅ FOUND Dynamic Lens for ${topicId} as ${targetRole}`);
                return {
                    whatItIs: lens.narrative,
                    whyItExists: lens.analogy,
                    howItWorks: ["Generated dynamically by AI"],
                    keyComponents: ["Concept Atom"]
                };
            }
        }

        // 2. Fallback to Legacy Mock Data (Deprecated but kept for safety)
        const topic = this.topics.get(topicId);
        if (!topic) return null;

        // Adapt explanation based on persona
        return this.adaptToPersona(topic, persona);
    }

    private adaptToPersona(topic: TopicContent, persona: string): PersonaExplanation {
        switch (persona) {
            case 'kid':
                return {
                    whatItIs: this.simplifyForKid(topic.whatItIs),
                    whyItExists: this.simplifyForKid(topic.whyItExists),
                    howItWorks: topic.howItWorks.map(step => this.simplifyForKid(step)),
                    keyComponents: topic.keyComponents.slice(0, 3).map(c => this.simplifyForKid(c))
                };

            case 'student':
                return {
                    whatItIs: topic.whatItIs,
                    whyItExists: topic.whyItExists,
                    howItWorks: topic.howItWorks,
                    keyComponents: topic.keyComponents
                };

            case 'pro':
                return {
                    whatItIs: this.enhanceForPro(topic.whatItIs),
                    whyItExists: this.enhanceForPro(topic.whyItExists),
                    howItWorks: topic.howItWorks,
                    keyComponents: topic.keyComponents
                };

            case 'architect':
                return {
                    whatItIs: this.enhanceForArchitect(topic.whatItIs),
                    whyItExists: this.enhanceForArchitect(topic.whyItExists),
                    howItWorks: topic.howItWorks,
                    keyComponents: topic.keyComponents
                };

            case 'professor':
                return {
                    whatItIs: this.enhanceForProfessor(topic.whatItIs),
                    whyItExists: this.enhanceForProfessor(topic.whyItExists),
                    howItWorks: topic.howItWorks,
                    keyComponents: topic.keyComponents
                };

            default:
                return {
                    whatItIs: topic.whatItIs,
                    whyItExists: topic.whyItExists,
                    howItWorks: topic.howItWorks,
                    keyComponents: topic.keyComponents
                };
        }
    }

    private simplifyForKid(text: string): string {
        // Simplified language for kids
        return text
            .replace(/orchestrates/gi, 'organizes')
            .replace(/containerized applications/gi, 'apps in boxes')
            .replace(/distributed system/gi, 'many computers working together')
            .replace(/automate/gi, 'do automatically');
    }

    private enhanceForPro(text: string): string {
        return `${text} This enables high availability, fault tolerance, and efficient resource utilization in production environments.`;
    }

    private enhanceForArchitect(text: string): string {
        return `${text} From an architectural perspective, this follows the control plane pattern with declarative configuration and eventual consistency.`;
    }

    private enhanceForProfessor(text: string): string {
        return `${text} The theoretical foundation draws from distributed systems research, including the Raft consensus algorithm and the actor model for concurrent computation.`;
    }

    async answerQuestion(topicId: string, question: string): Promise<{ answer: string; isOutOfScope: boolean }> {
        this.logger.log(`Answering question for topic ${topicId}: ${question}`);

        const topic = this.topics.get(topicId);
        if (!topic) {
            return {
                answer: 'I don\'t have information about this topic yet.',
                isOutOfScope: true
            };
        }

        // Build context from topic content
        const context = `
Topic: ${topicId}
What it is: ${topic.whatItIs}
Why it exists: ${topic.whyItExists}
How it works: ${topic.howItWorks.join('; ')}
Key components: ${topic.keyComponents.join('; ')}
Examples: ${topic.examples.join('; ')}
        `.trim();

        // Use LLM for contextual answering
        if (this.llmService.isReady()) {
            try {
                const answer = await this.llmService.answerQuestion(question, context);
                return { answer, isOutOfScope: false };
            } catch (error) {
                this.logger.warn('LLM answer failed, falling back to keyword matching', error);
            }
        }

        // Fallback: Simple keyword matching
        const questionLower = question.toLowerCase();

        if (questionLower.includes('what') && questionLower.includes('is')) {
            return { answer: topic.whatItIs, isOutOfScope: false };
        }

        if (questionLower.includes('why')) {
            return { answer: topic.whyItExists, isOutOfScope: false };
        }

        if (questionLower.includes('how')) {
            return {
                answer: `Here's how it works:\n${topic.howItWorks.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
                isOutOfScope: false
            };
        }

        if (questionLower.includes('component')) {
            return {
                answer: `The key components are:\n${topic.keyComponents.map(c => `• ${c}`).join('\n')}`,
                isOutOfScope: false
            };
        }

        // Default response
        return {
            answer: 'That\'s a great question! Based on this topic, ' + topic.whatItIs,
            isOutOfScope: false
        };
    }

    async getLearningGuidance(topicId: string): Promise<{ nextTopic: string; reason: string }> {
        this.logger.log(`Getting learning guidance for: ${topicId}`);

        // Simple guidance logic - in production, use AI to analyze progress
        return {
            nextTopic: 'kubernetes-networking',
            reason: 'After understanding the architecture, networking is the next logical step to learn how components communicate.'
        };
    }

    async getStudentProgress(studentId: string): Promise<ParentAnalytics> {
        this.logger.log(`Generating analytics for student: ${studentId}`);

        // 1. Fetch Real Mastery Data from Brain (SubjectService)
        const masteryMap = await this.subjectService.getStudentMastery(studentId);
        const masteredCount = masteryMap.size;

        // 2. Calculate Metrics
        // Simple heuristic: Each atom is 5% mastery for this demo
        const currentMastery = Math.min(masteredCount * 5, 100);
        const fearReduction = Math.min(masteredCount * 3, 90); // Harder to reduce fear than gain mastery

        // 3. Generate Dynamic Insights
        const insights: Insight[] = [];
        const masteredTopics = Array.from(masteryMap.keys());

        if (masteredCount > 0) {
            insights.push({
                id: Date.now().toString(),
                type: 'success',
                message: `Mastered ${masteredCount} new concepts, including "${masteredTopics[masteredCount - 1]}".`,
                date: new Date().toISOString(),
                relatedTopic: masteredTopics[masteredCount - 1]
            });
        } else {
            insights.push({
                id: 'init',
                type: 'pattern',
                message: 'Just starting the journey. No concepts mastered yet.',
                date: new Date().toISOString()
            });
        }

        // Return Data
        return {
            studentId,
            currentMastery,
            fearReduction,
            activeStreak: Math.max(1, masteredCount), // Mock streak based on activity
            masteredTopics: masteredTopics,
            weeklyProgress: [
                // Keep mock weekly data for UI visualization (hard to simulate timeline instantly)
                { day: 'Mon', fearIndex: 8, confidence: 2, topicsCovered: 1 },
                { day: 'Tue', fearIndex: 7, confidence: 3, topicsCovered: 1 },
                { day: 'Wed', fearIndex: 5, confidence: 5, topicsCovered: 2 },
                { day: 'Thu', fearIndex: 3, confidence: 7, topicsCovered: 3 },
                { day: 'Fri', fearIndex: 2, confidence: 8, topicsCovered: 2 },
                { day: 'Sat', fearIndex: 2, confidence: 9, topicsCovered: 1 },
                { day: 'Sun', fearIndex: 1, confidence: 9, topicsCovered: 0 }
            ],
            recentInsights: insights
        };
    }

    /**
     * CREATES a complete learning path for any goal.
     * Generates roadmap and deep learns all required topics.
     */
    async createLearningPath(goal: string): Promise<any> {
        this.logger.log(`🎯 Creating learning path for: "${goal}"...`);

        // 1. Generate the roadmap
        const roadmap = await this.subjectService['omniEngine'].generateLearningRoadmap(goal);

        // 2. Collect all topics from all levels
        const allTopics: string[] = [];
        for (const level of roadmap.levels) {
            allTopics.push(...level.topics);
        }

        this.logger.log(`   📚 Deep learning ${allTopics.length} topics...`);

        // 3. Deep learn each topic
        for (const topic of allTopics) {
            await this.subjectService.learnTopic(topic);
        }

        this.logger.log(`   ✅ Learning path ready with ${allTopics.length} topics learned`);

        return {
            roadmap: roadmap,
            topicsLearned: allTopics.length,
            status: 'ready'
        };
    }

    /**
     * GET recommended next steps for a user based on their progress
     */
    async getNextSteps(currentLevel: string = 'Beginner'): Promise<any> {
        const levelOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Architect'];
        const currentIndex = levelOrder.indexOf(currentLevel);

        if (currentIndex === -1 || currentIndex >= levelOrder.length - 1) {
            return {
                message: "You've reached the highest level!",
                nextLevel: null
            };
        }

        return {
            currentLevel: currentLevel,
            nextLevel: levelOrder[currentIndex + 1],
            recommendation: `Focus on completing ${currentLevel} milestones before advancing to ${levelOrder[currentIndex + 1]}`
        };
    }

    async getPrerequisites(topicId: string): Promise<{ topicId: string; prerequisites: { id: string; name: string; description: string }[] }> {
        this.logger.log(`Getting prerequisites for: ${topicId}`);

        const prerequisitesMap: Record<string, { id: string; name: string; description: string }[]> = {
            'kubernetes-architecture': [
                { id: 'containers', name: 'Containers', description: 'Understanding containerization is prerequisite to understanding Kubernetes orchestration.' },
                { id: 'docker', name: 'Docker Basics', description: 'Docker provides the container runtime that Kubernetes manages.' }
            ],
            'kubernetes-networking': [
                { id: 'kubernetes-architecture', name: 'Kubernetes Architecture', description: 'Must understand the basic architecture before networking.' }
            ],
            'kubernetes-storage': [
                { id: 'kubernetes-architecture', name: 'Kubernetes Architecture', description: 'Storage concepts build on the base architecture.' }
            ]
        };

        const prerequisites = prerequisitesMap[topicId] || [];

        return {
            topicId,
            prerequisites: prerequisites.map(p => ({ id: p.id, name: p.name, description: p.description }))
        };
    }
}
