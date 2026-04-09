import { Injectable, Logger } from '@nestjs/common';
import { PROMPT_TEMPLATES } from './prompts';

@Injectable()
export class TemplateService {
    private readonly logger = new Logger(TemplateService.name);

    // TODO: Inject OpenAI Service here
    // constructor(private openai: OpenAIService) {}

    async generateSubject(name: string, category: string): Promise<any> {
        const template = PROMPT_TEMPLATES.SUBJECT_GENERATOR;
        const prompt = template
            .replace('{{subjectName}}', name)
            .replace('{{category}}', category)
            .replace('{{targetRoles}}', 'Student, Professional, Architect');

        this.logger.log(`Generating Subject: ${name}...`);

        // MOCK LLM CALL FOR NOW
        return this.mockLlmCall(prompt, 'subject');
    }

    async generateTopic(subject: string, module: string, topic: string): Promise<any> {
        const template = PROMPT_TEMPLATES.TOPIC_DEEP_DIVE;
        const prompt = template
            .replace('{{subjectName}}', subject)
            .replace('{{moduleTitle}}', module)
            .replace('{{topicTitle}}', topic);

        this.logger.log(`Deep Diving Topic: ${topic}...`);

        return this.mockLlmCall(prompt, 'topic');
    }

    private mockLlmCall(prompt: string, type: 'subject' | 'topic'): any {
        // Parse the subject name from the prompt (hacky but works for now)
        // Prompt looks like: "...subject: "SubjectName"..."
        const match = prompt.match(/subject: "([^"]+)"/);
        const subjectName = match ? match[1] : "General Topic";

        if (type === 'subject') {
            return {
                subject: {
                    name: subjectName,
                    phases: [
                        {
                            name: "Beginner",
                            modules: [
                                { title: `Introduction to ${subjectName}`, topics: [`What is ${subjectName}?`, `History of ${subjectName}`] },
                                { title: "Core Concepts", topics: ["Key Terminology", "Basic Architecture"] }
                            ]
                        },
                        {
                            name: "Intermediate",
                            modules: [
                                { title: `Advanced ${subjectName}`, topics: ["Deep Dive", "Best Practices"] },
                                { title: "Practical Application", topics: ["Real-world Use Cases", "Lab 1: Hello World"] }
                            ]
                        },
                        {
                            name: "Expert",
                            modules: [
                                { title: "Mastery & Research", topics: ["Future Trends", "Complex Systems"] }
                            ]
                        }
                    ]
                }
            };
        }
        return {
            title: "Generated Topic",
            contentData: { architecture: `Detailed architecture of ${subjectName}...` },
            explanations: { kid: `Imagine ${subjectName} is like a giant LEGO set...` }
        };
    }
}
