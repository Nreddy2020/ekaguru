export interface ExtractedAtom {
    name: string;
    type: "CONCEPT" | "ENTITY" | "PROCESS" | "PRINCIPLE";
    definition: string;
}

export interface GeneratedLens {
    role: 'KID' | 'STUDENT' | 'PROFESSIONAL' | 'ARCHITECT' | 'PROFESSOR' | 'RESEARCHER' | 'FIRST_PRINCIPLES';
    narrative: string;
    analogy: string;
    visualPrompt: string;
}

export interface ConceptEdge {
    source: string;
    target: string;
    relation: "PREREQUISITE" | "COMPONENT_OF" | "ANALOGY_FOR" | "EVOLUTION_OF";
    weight: number;
    description: string;
}
