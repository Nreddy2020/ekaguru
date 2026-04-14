import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmCacheService } from './llm-cache.service';

@Injectable()
export class LlmService {
    private readonly logger = new Logger(LlmService.name);
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;
    private isConfigured = false;

    constructor(private cacheService: LlmCacheService) {
        this.initialize();
    }

    private initialize() {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not configured. LLM features will use fallback mode.');
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            this.isConfigured = true;
            this.logger.log('Gemini LLM initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Gemini:', error);
        }
    }

    async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
        const cacheKey = this.cacheService.generateKey(prompt + (systemInstruction || ''), 'content');
        const cached = this.cacheService.get<string>(cacheKey);
        if (cached) return cached;

        if (!this.isConfigured || !this.model) {
            return this.fallbackResponse(prompt);
        }

        try {
            const generationConfig = {
                temperature: 0.7,
                maxOutputTokens: 4096,
            };

            let content;
            if (systemInstruction) {
                content = [
                    { text: systemInstruction },
                    { text: prompt }
                ];
            } else {
                content = prompt;
            }

            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
                systemInstruction: systemInstruction ? { role: 'model', parts: [{ text: systemInstruction }] } : undefined
            });

            const response = result.response;
            const text = response.text();
            this.cacheService.set(cacheKey, text, 3600000);
            return text;
        } catch (error) {
            this.logger.error('LLM generation error:', error);
            return this.fallbackResponse(prompt);
        }
    }

    async generateJson<T>(prompt: string, systemInstruction?: string): Promise<T | null> {
        try {
            const text = await this.generateContent(prompt, systemInstruction);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as T;
            }
        } catch (error) {
            this.logger.error('JSON parsing error:', error);
        }
        return null;
    }

    async generateStructures(prompt: string): Promise<any> {
        const systemInstruction = `You are an expert curriculum architect. Generate structured learning content.
Return ONLY valid JSON with no additional text. Use this exact structure:
{
    "phases": [{"name": "Phase Name", "modules": [{"title": "Module Title", "topics": ["Topic 1", "Topic 2"]}]}]
}`;

        return this.generateJson<any>(prompt, systemInstruction);
    }

    async generateThreeLenses(concept: string, context: string): Promise<any[]> {
        const prompt = `For the concept "${concept}" in context "${context}", generate 3 distinct learning lenses.
Return ONLY valid JSON array with no additional text:
[
    {
        "role": "KID (Storyteller)",
        "narrative": "Child-friendly story or metaphor",
        "analogy": "Simple everyday analogy",
        "visualPrompt": "Cartoon description"
    },
    {
        "role": "STUDENT (Analyst)", 
        "narrative": "Clear definition with examples",
        "analogy": "Building block analogy",
        "visualPrompt": "Educational diagram description"
    },
    {
        "role": "GENIUS (First Principles)",
        "narrative": "Deep reasoning with cross-disciplinary links",
        "analogy": "Socratic question",
        "visualPrompt": "Abstract concept map description"
    }
]`;

        try {
            const result = await this.generateJson<any[]>(prompt);
            return result || this.fallbackLenses(concept);
        } catch {
            return this.fallbackLenses(concept);
        }
    }

    async extractAtomicConcepts(text: string): Promise<any[]> {
        const prompt = `Extract the top 10 atomic concepts from this text. 
Return ONLY valid JSON array with no additional text:
[
    {"name": "ConceptName", "type": "CONCEPT", "definition": "Brief definition"}
]`;

        return this.generateJson<any[]>(prompt + '\n\nText: ' + text.substring(0, 2000)) || [];
    }

    async answerQuestion(question: string, context: string): Promise<string> {
        const systemInstruction = `You are an expert tutor. Answer the question based ONLY on the provided context.
If the answer is not in the context, say "I don't have enough information to answer that."
Keep answers concise and age-appropriate.`;

        return this.generateContent(question, systemInstruction + '\n\nContext: ' + context);
    }

    private fallbackResponse(prompt: string): string {
        this.logger.warn('Using fallback LLM response');
        return 'LLM not configured. Please set GEMINI_API_KEY to enable AI features.';
    }

    private fallbackLenses(concept: string): any[] {
        return [
            {
                role: 'KID',
                narrative: `Imagine ${concept} is like a superpower that helps you do amazing things!`,
                analogy: 'Like a magic trick',
                visualPrompt: `Cartoon ${concept} as a friendly superhero`
            },
            {
                role: 'STUDENT',
                narrative: `${concept} is an important concept with specific properties and uses.`,
                analogy: 'Like a building block',
                visualPrompt: `Diagram showing ${concept} structure`
            },
            {
                role: 'GENIUS',
                narrative: `${concept} emerges from fundamental principles. What's the underlying truth?`,
                analogy: 'Socratic: What would happen if we removed all assumptions?',
                visualPrompt: `Abstract phase space of ${concept}`
            }
        ];
    }

    isReady(): boolean {
        return this.isConfigured;
    }
}