/**
 * Guru's voice: browser speech synthesis chosen for naturalness and the lesson language,
 * word-level pulses for the voice orb, and speech recognition so a learner can answer aloud.
 * Everything degrades gracefully: no synthesis means captions only; no recognition means typing.
 */
export type OrbState = "idle" | "speaking" | "listening" | "thinking";

/** Lesson language codes to regional tags that browsers ship voices for. */
export function bcp47(language?: string): string {
  const map: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    te: "te-IN",
    ta: "ta-IN",
    kn: "kn-IN",
    mr: "mr-IN",
    bn: "bn-IN",
    es: "es-ES",
    fr: "fr-FR",
    ar: "ar-SA",
  };
  const code = (language || "en").trim();
  if (code.includes("-")) return code;
  return map[code.toLowerCase()] || code;
}

export function voiceSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof (window as any).SpeechSynthesisUtterance === "function";
}

/** Rank available voices: same region, then same language; natural or neural engines first; never a novelty voice. */
export function pickVoice(voices: SpeechSynthesisVoice[], language?: string): SpeechSynthesisVoice | null {
  if (!voices?.length) return null;
  const wanted = bcp47(language).toLowerCase();
  const base = wanted.split("-")[0];
  const score = (v: SpeechSynthesisVoice) => {
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    const name = (v.name || "").toLowerCase();
    let s = 0;
    if (lang === wanted) s += 40;
    else if (lang.split("-")[0] === base) s += 20;
    else return -1;
    if (/natural|neural|online|premium|enhanced|wavenet|studio/.test(name)) s += 10;
    if (/google|microsoft|apple|samantha|siri/.test(name)) s += 4;
    if (/novelty|whisper|zarvox|bells|bad news|cellos|organ/.test(name)) s -= 50;
    if (!v.localService) s += 2;
    return s;
  };
  const ranked = voices
    .map((v) => ({ v, s: score(v) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  return ranked.length ? ranked[0].v : null;
}

export interface SpeakOptions {
  language?: string;
  rate?: number;
  onStart?: () => void;
  /** Fired at word boundaries where the engine supports them; drives the orb pulse. */
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
}
export interface SpeakHandle {
  cancel: () => void;
}

/** Speak one passage with the best voice for the language. Returns a cancel handle. */
export function speak(text: string, options: SpeakOptions = {}): SpeakHandle {
  if (!voiceSupported()) {
    options.onEnd?.();
    return { cancel: () => {} };
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47(options.language);
  utterance.rate = options.rate ?? 1;
  const voice = pickVoice(synth.getVoices ? synth.getVoices() : [], options.language);
  if (voice) utterance.voice = voice;
  let finished = false;
  const end = () => {
    if (finished) return;
    finished = true;
    options.onEnd?.();
  };
  utterance.onstart = () => options.onStart?.();
  utterance.onboundary = (event: any) => options.onBoundary?.(typeof event?.charIndex === "number" ? event.charIndex : 0);
  utterance.onend = end;
  utterance.onerror = end;
  synth.speak(utterance);
  return {
    cancel: () => {
      finished = true;
      synth.cancel();
    },
  };
}

export interface Recognizer {
  start: (handlers: { onResult: (text: string, isFinal: boolean) => void; onEnd: () => void; onError?: (message: string) => void }) => void;
  stop: () => void;
}

export function recognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return typeof (w.SpeechRecognition || w.webkitSpeechRecognition) === "function";
}

/** A one-shot recognizer for a spoken answer; returns null where the browser has no recognition. */
export function createRecognizer(language?: string): Recognizer | null {
  if (!recognitionSupported()) return null;
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  const recognition = new Ctor();
  recognition.lang = bcp47(language);
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  return {
    start: ({ onResult, onEnd, onError }) => {
      recognition.onresult = (event: any) => {
        let text = "";
        let isFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          text += result[0]?.transcript || "";
          if (result.isFinal) isFinal = true;
        }
        onResult(text.trim(), isFinal);
      };
      recognition.onerror = (event: any) => onError?.(String(event?.error || "recognition error"));
      recognition.onend = () => onEnd();
      try {
        recognition.start();
      } catch (error: any) {
        onError?.(String(error?.message || error));
        onEnd();
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
  };
}
