"use client";

import React, { useState } from 'react';

type Question = {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
};

export default function AssessmentRunner({ questions }: { questions: Question[] }) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleAnswer = (option: string) => {
        const isCorrect = option === questions[index].correctAnswer;
        if (isCorrect) setScore(s => s + 1);

        setFeedback(isCorrect ? "✅ Correct!" : `❌ Incorrect. ${questions[index].explanation}`);

        setTimeout(() => {
            setFeedback(null);
            if (index < questions.length - 1) {
                setIndex(i => i + 1);
            } else {
                setShowResult(true);
            }
        }, 2000);
    };

    if (showResult) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-purple-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
                <div className="text-6xl mb-4">{score / questions.length > 0.7 ? '🏆' : '📚'}</div>
                <p className="text-xl text-gray-600">
                    You scored <span className="font-bold text-purple-600">{Math.round((score / questions.length) * 100)}%</span>
                </p>
            </div>
        );
    }

    const currentQ = questions[index];

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold text-purple-600 tracking-wider">QUESTION {index + 1} OF {questions.length}</span>
                <span className="text-gray-400 text-sm">{Math.round(((index) / questions.length) * 100)}% Complete</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-8 leading-snug">{currentQ.text}</h3>

            <div className="space-y-3">
                {currentQ.options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        disabled={!!feedback}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${feedback
                                ? (opt === currentQ.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 opacity-50')
                                : 'hover:bg-purple-50 hover:border-purple-200 border-gray-200'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {feedback && (
                <div className={`mt-6 p-4 rounded-lg text-center font-medium ${feedback.includes('Correct') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {feedback}
                </div>
            )}
        </div>
    );
}
