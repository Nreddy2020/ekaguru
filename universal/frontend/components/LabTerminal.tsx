"use client";

import React, { useState } from 'react';

type LabStep = { cmd: string; desc: string };

export default function LabTerminal({ steps }: { steps: LabStep[] }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [output, setOutput] = useState<string[]>([]);

    const runCommand = (cmd: string) => {
        setOutput(prev => [...prev, `> ${cmd}`, `Running implementation... [OK]`, `Completed: ${steps[currentStep].desc}`]);
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setOutput(prev => [...prev, `🎉 LAB COMPLETED SUCCESSFULLY!`]);
        }
    };

    return (
        <div className="bg-gray-900 text-green-400 font-mono p-4 rounded-lg shadow-xl w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-4">
                <span className="text-gray-400 text-sm">Terminal - Lab Environment</span>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
            </div>

            <div className="h-64 overflow-y-auto mb-4 space-y-1 text-sm bg-black/50 p-2 rounded">
                {output.map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </div>

            <div className="flex gap-4 items-center">
                <div className="flex-1 bg-gray-800 p-3 rounded text-white text-sm">
                    <span className="text-blue-400 mr-2">Mission:</span>
                    {steps[currentStep]?.desc || "All tasks done."}
                </div>
                {steps[currentStep] && (
                    <button
                        onClick={() => runCommand(steps[currentStep].cmd)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold transition-all"
                    >
                        RUN: {steps[currentStep].cmd}
                    </button>
                )}
            </div>
        </div>
    );
}
