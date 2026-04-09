'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Message } from '@/lib/types';

interface TutorState {
    currentTopicId: string | null;
    currentPersona: string;
    conversationHistory: Message[];
    setCurrentTopic: (topicId: string) => void;
    setPersona: (persona: string) => void;
    addMessage: (message: Message) => void;
    clearHistory: () => void;
    parentMode: boolean;
    setParentMode: (val: boolean) => void;
}

const TutorContext = createContext<TutorState | undefined>(undefined);

export function TutorProvider({ children }: { children: ReactNode }) {
    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
    const [currentPersona, setCurrentPersona] = useState('student');
    const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
    const [parentMode, setParentMode] = useState(false);

    const addMessage = (message: Message) => {
        setConversationHistory(prev => [...prev, message]);
    };

    const clearHistory = () => {
        setConversationHistory([]);
    };

    return (
        <TutorContext.Provider
            value={{
                currentTopicId,
                currentPersona,
                conversationHistory,
                setCurrentTopic: setCurrentTopicId,
                setPersona: setCurrentPersona,
                addMessage,
                clearHistory,
                parentMode,
                setParentMode,
            }}
        >
            {children}
        </TutorContext.Provider>
    );
}

export function useTutor() {
    const context = useContext(TutorContext);
    if (!context) {
        throw new Error('useTutor must be used within TutorProvider');
    }
    return context;
}
