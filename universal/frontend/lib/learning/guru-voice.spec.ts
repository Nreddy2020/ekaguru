import { bcp47, createRecognizer, pickVoice, recognitionSupported, speak, voiceSupported } from "./guru-voice";

const voice = (name: string, lang: string, localService = true) => ({ name, lang, localService, default: false, voiceURI: name }) as SpeechSynthesisVoice;

describe("guru voice selection", () => {
  it("maps lesson languages to regional tags", () => {
    expect(bcp47("en")).toBe("en-IN");
    expect(bcp47("hi")).toBe("hi-IN");
    expect(bcp47("en-GB")).toBe("en-GB");
    expect(bcp47(undefined)).toBe("en-IN");
  });
  it("prefers the region, then natural engines, and never a novelty voice", () => {
    const voices = [
      voice("Zarvox", "en-US"),
      voice("Microsoft David", "en-US"),
      voice("Microsoft Neerja Online (Natural) - English (India)", "en-IN", false),
      voice("Google हिन्दी", "hi-IN"),
    ];
    expect(pickVoice(voices, "en")?.name).toContain("Neerja");
    expect(pickVoice(voices, "hi")?.name).toContain("हिन्दी");
    expect(pickVoice([voice("Zarvox", "en-US"), voice("Alex", "en-US")], "en")?.name).toBe("Alex");
    expect(pickVoice(voices, "ta")).toBeNull();
    expect(pickVoice([], "en")).toBeNull();
  });
});

describe("speak", () => {
  afterEach(() => {
    delete (window as any).speechSynthesis;
    delete (window as any).SpeechSynthesisUtterance;
  });
  it("finishes immediately where synthesis is unavailable", () => {
    const onEnd = jest.fn();
    expect(voiceSupported()).toBe(false);
    speak("hello", { onEnd });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
  it("wires the chosen voice, rate and lifecycle callbacks, and cancels cleanly", () => {
    const spoken: any[] = [];
    (window as any).SpeechSynthesisUtterance = function (this: any, text: string) {
      this.text = text;
    };
    (window as any).speechSynthesis = {
      cancel: jest.fn(),
      speak: jest.fn((u: any) => spoken.push(u)),
      getVoices: () => [voice("Microsoft Neerja Online (Natural) - English (India)", "en-IN", false)],
    };
    const onStart = jest.fn();
    const onBoundary = jest.fn();
    const onEnd = jest.fn();
    const handle = speak("Plants use light.", { language: "en", rate: 0.9, onStart, onBoundary, onEnd });
    const u = spoken[0];
    expect(u.lang).toBe("en-IN");
    expect(u.rate).toBe(0.9);
    expect(u.voice.name).toContain("Neerja");
    u.onstart();
    u.onboundary({ charIndex: 7 });
    expect(onStart).toHaveBeenCalled();
    expect(onBoundary).toHaveBeenCalledWith(7);
    u.onend();
    u.onerror();
    expect(onEnd).toHaveBeenCalledTimes(1);
    handle.cancel();
    expect((window as any).speechSynthesis.cancel).toHaveBeenCalled();
  });
});

describe("spoken answers", () => {
  afterEach(() => {
    delete (window as any).webkitSpeechRecognition;
  });
  it("returns null without browser recognition", () => {
    expect(recognitionSupported()).toBe(false);
    expect(createRecognizer("en")).toBeNull();
  });
  it("streams interim and final transcripts and stops", () => {
    const instances: any[] = [];
    (window as any).webkitSpeechRecognition = function (this: any) {
      this.start = jest.fn();
      this.stop = jest.fn();
      instances.push(this);
    };
    const recognizer = createRecognizer("hi")!;
    const onResult = jest.fn();
    const onEnd = jest.fn();
    recognizer.start({ onResult, onEnd });
    const r = instances[0];
    expect(r.lang).toBe("hi-IN");
    expect(r.interimResults).toBe(true);
    expect(r.start).toHaveBeenCalled();
    r.onresult({ results: [Object.assign([{ transcript: "पौधे " }], { isFinal: false })] });
    r.onresult({ results: [Object.assign([{ transcript: "पौधे प्रकाश से भोजन बनाते हैं" }], { isFinal: true })] });
    expect(onResult).toHaveBeenNthCalledWith(1, "पौधे", false);
    expect(onResult).toHaveBeenNthCalledWith(2, "पौधे प्रकाश से भोजन बनाते हैं", true);
    r.onend();
    expect(onEnd).toHaveBeenCalled();
    recognizer.stop();
    expect(r.stop).toHaveBeenCalled();
  });
});
