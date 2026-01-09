import { useState, useEffect } from 'react';
import AvatarCanvas from './AvatarCanvas';
import { voiceService } from '../../services/voice';
import { Mic, MicOff } from 'lucide-react';
import GamificationPanel from './GamificationPanel';

export default function StudentInterface() {
    const [status, setStatus] = useState<string>("Ready to learn!");
    const [isListening, setIsListening] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'thinking' | 'compassionate' | 'celebrating'>('neutral');
    const [transcript, setTranscript] = useState("");

    const startListening = () => {
        setIsListening(true);
        setStatus("Listening...");
        voiceService.listen(
            (text) => {
                setTranscript(text);
                setIsListening(false);
                processInput(text);
            },
            (err) => {
                console.error(err);
                setIsListening(false);
                setStatus("Didn't catch that. Try again?");
            }
        );
    };

    const processInput = (text: string) => {
        setStatus("Thinking...");
        setEmotion('thinking');

        // MOCK AI LOGIC (Replace with Backend API call later)
        setTimeout(() => {
            let responseText = "";
            let nextEmotion: any = 'neutral';

            if (text.toLowerCase().includes("fraction") || text.toLowerCase().includes("math")) {
                responseText = "Fractions are cool! Think of them like slices of a pizza. How many slices do you want?";
                nextEmotion = 'happy';
            } else if (text.toLowerCase().includes("hard") || text.toLowerCase().includes("stuck")) {
                responseText = "It's okay to feel stuck. Take a deep breath. Let's look at it differently.";
                nextEmotion = 'compassionate';
            } else if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("did it")) {
                responseText = "Amazing job! You nailed it!";
                nextEmotion = 'celebrating';
            } else {
                responseText = "I see. Tell me more about that!";
                nextEmotion = 'neutral';
            }

            setStatus(responseText);
            setEmotion(nextEmotion);
            speak(responseText);
        }, 1500);
    };

    const speak = (text: string) => {
        setIsTalking(true);
        voiceService.speak(text, () => {
            setIsTalking(false);
            setEmotion('neutral');
            setStatus("Your turn!");
        });
    };

    useEffect(() => {
        // Initial Greeting
        setTimeout(() => {
            speak("Hi! I'm your Ekaguru tutor. What do you want to learn today?");
        }, 1000);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white items-center justify-center p-4 relative">

            {/* Gamification Overlay */}
            <div className="absolute top-4 right-4 z-10 w-80 hidden md:block">
                <GamificationPanel />
            </div>

            {/* Avatar Stage */}
            <div className="relative w-80 h-80 md:w-96 md:h-96 bg-slate-800 rounded-full shadow-2xl border-4 border-slate-700 flex items-center justify-center overflow-hidden mb-8">
                <AvatarCanvas emotion={emotion} isTalking={isTalking} />
            </div>

            {/* Status Text */}
            <div className="text-center mb-8 max-w-lg">
                <p className="text-2xl font-light text-slate-300 min-h-[4rem]">{status}</p>
                {transcript && <p className="text-sm text-slate-500 mt-2">You said: "{transcript}"</p>}
            </div>

            {/* Controls */}
            <div className="flex space-x-6">
                <button
                    onClick={startListening}
                    disabled={isListening || isTalking}
                    className={`p-6 rounded-full transition-all ${isListening
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
            </div>

            <p className="mt-8 text-slate-600 text-sm">
                Microphone access required. Speaks best on Chrome/Edge.
            </p>
        </div>
    );
}
