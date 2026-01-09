// Web Speech API Wrapper for Ekaguru

export interface VoiceService {
    speak: (text: string, onEnd?: () => void) => void;
    listen: (onResult: (text: string) => void, onError: (err: any) => void) => void;
    stop: () => void;
}

class BrowserVoiceService implements VoiceService {
    private synthesis: SpeechSynthesis;
    private recognition: any;
    private voice: SpeechSynthesisVoice | null = null;

    constructor() {
        this.synthesis = window.speechSynthesis;

        // Initialize Speech Recognition (Chrome/Edge support)
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
        }
    }

    private getVoice() {
        if (this.voice) return this.voice;
        const voices = this.synthesis.getVoices();
        // Prefer a female Google/Microsoft voice for "calm teacher" persona
        this.voice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Zira")) || voices[0];
        return this.voice;
    }

    speak(text: string, onEnd?: () => void) {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.getVoice();
        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Slightly higher pitch for friendliness

        if (onEnd) {
            utterance.onend = onEnd;
        }

        this.synthesis.speak(utterance);
    }

    listen(onResult: (text: string) => void, onError: (err: any) => void) {
        if (!this.recognition) {
            onError("Speech recognition not supported in this browser.");
            return;
        }

        this.recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        this.recognition.onerror = (event: any) => {
            onError(event.error);
        };

        this.recognition.start();
    }

    stop() {
        if (this.synthesis.speaking) this.synthesis.cancel();
        if (this.recognition) this.recognition.stop();
    }
}

export const voiceService = new BrowserVoiceService();
