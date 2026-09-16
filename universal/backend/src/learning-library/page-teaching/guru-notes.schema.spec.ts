import {
  BLUEPRINTS,
  blueprintForAudience,
  longestSharedRun,
  notesDepthSection,
  notesPromptSection,
  readingLevelFor,
  validateGuruNotes,
  validateNotesForBlueprint,
  validateProfessionalNotes,
  validateProfessorNotes,
} from "./guru-notes.schema";

const blocks = [
  { blockId: "b1", text: "Living things grow. A tiny seed grows into a big plant when it gets water, air and sunlight." },
  { blockId: "b2", text: "Learning outcomes: say what living things need to grow." },
  { blockId: "b3", text: "3" },
];
const ids = new Set(blocks.map((b) => b.blockId));
const paragraph = (n: number) =>
  "Here is thought number " + n + ". Think of the tulsi plant at home, the one your mother waters every morning. Every day it is a little taller, and that is because it is alive. Alive things eat, breathe and grow, so a seed is a baby plant waiting to wake up.";
const goodNotes = () => ({
  title: "How living things grow",
  subtitle: "Seeds, plants and what makes them alive",
  overview:
    "This page is about one big idea: living things grow. You will see why a seed can become a plant. You will learn what it needs on the way. By the end you can explain growing in your own words.",
  objectives: ["I can say what living things need to grow"],
  topics: [
    {
      id: "t1",
      heading: "A seed is a baby plant",
      icon: "🌱",
      evidenceIds: ["b1", "b2"],
      lookAt: "Look at the small plant and the tall plant next to each other.",
      hook: "Close your eyes. Picture a tiny seed in your hand. It looks asleep. Is it?",
      bigIdea: "A seed is a baby plant waiting for water, air and light.",
      explanation: [paragraph(1), paragraph(2), paragraph(3)],
      keyPoints: ["A seed is a baby plant.", "It needs water, air and light.", "The root comes first."],
      steps: ["The seed drinks water and swells.", "A tiny root pushes down.", "A green shoot pushes up.", "Leaves open to catch light."],
      chain: [{ label: "Seed", emoji: "🌰" }, { label: "Sprout", emoji: "🌱" }, { label: "Plant", emoji: "🌿" }],
      diagram: [
        { type: "circle", x: 200, y: 700, radius: 40, color: "yellow", text: null, x2: null, y2: null, width: null, height: null },
        { type: "line", x: 200, y: 660, x2: 200, y2: 300, color: "green", text: null, width: null, height: null, radius: null },
        { type: "text", x: 260, y: 300, text: "shoot grows up", color: "white", x2: null, y2: null, width: null, height: null, radius: null },
      ],
      keyTerms: [{ term: "seed", meaning: "the small part of a plant that can grow into a new plant", example: "a bean you soak overnight" }],
      example: { situation: "Soaking a chana seed in a wet cloth", explanation: "After two days a white root pokes out because the seed drank water and woke up; that is growing." },
      tryNow: { title: "Grow a seed on a wet cloth", steps: ["Put three chana seeds on a wet cloth in a bowl.", "Keep the cloth wet for three days.", "Look every morning."], whatToNotice: "A white root comes out first, then a green shoot. The seed is alive." },
      didYouKnow: "Some seeds can sleep for hundreds of years and still wake up and grow.",
      rememberTip: "Seed, water, sun: a baby plant has begun.",
      commonDoubts: [{ question: "Does a stone grow?", answer: "No. A stone does not eat or breathe. It stays the same size for ever." }],
      quiz: { question: "What does a seed need first to wake up?", options: ["Water", "A blanket", "Music"], answerIndex: 0, why: "Water makes the seed swell and start to grow." },
      checkYourself: [{ question: "Name two things a seed needs to grow.", answer: "Water and sunlight (also air)." }],
    },
  ],
  summary: ["Living things grow.", "A seed is a baby plant.", "Growing needs water, air and sunlight."],
  closingLine: "Every seed is a small promise of a big tree.",
  omitted: [{ evidenceId: "b3", reason: "page number" }],
});

describe("Guru notes validation", () => {
  it("accepts complete teacher notes and records their identity", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash");
    expect(notes.topics[0].keyTerms[0].term).toBe("seed");
    expect(notes).toMatchObject({ language: "en", sourceHash: "hash", blueprint: "notes-v4" });
  });
  it("measures the longest run of words shared with the page", () => {
    expect(longestSharedRun("A tiny seed grows into a big plant when it gets water.", blocks[0].text)).toBe(12);
    expect(longestSharedRun("Completely different words here.", blocks[0].text)).toBe(0);
  });
  it("rejects notes that copy the book instead of explaining", () => {
    const raw = goodNotes();
    raw.topics[0].explanation[0] = "Remember: " + blocks[0].text + " That is the whole idea of this page for you.";
    expect(() => validateGuruNotes(raw, ids, blocks, "en", "hash")).toThrow(/copies the book \(b1\)/);
  });
  it("rejects thin explanations, missing coverage and unknown citations", () => {
    const thin = goodNotes();
    thin.topics[0].explanation = ["Living things grow. This is very important.", "Seeds grow into plants. Remember this well."];
    expect(() => validateGuruNotes(thin, ids, blocks, "en", "hash")).toThrow(/too thin/);
    const missing = goodNotes();
    missing.omitted = [];
    expect(() => validateGuruNotes(missing, ids, blocks, "en", "hash")).toThrow(/not explained or omitted: b3/);
    const unknown = goodNotes();
    unknown.topics[0].evidenceIds = ["b9"];
    expect(() => validateGuruNotes(unknown, ids, blocks, "en", "hash")).toThrow(/unknown evidence b9/);
  });
  it("requires doubts, checks, a real-life example and a bounded omission list", () => {
    const noDoubts = goodNotes();
    noDoubts.topics[0].commonDoubts = [];
    expect(() => validateGuruNotes(noDoubts, ids, blocks, "en", "hash")).toThrow(/commonDoubts/);
    const noQuiz: any = goodNotes();
    noQuiz.topics[0].quiz = { question: "Which?", options: ["Water", "Water"], answerIndex: 0, why: "Because it is so." };
    expect(() => validateGuruNotes(noQuiz, ids, blocks, "en", "hash")).toThrow(/quiz with exactly 3 options/);
    const overlap = goodNotes();
    overlap.omitted = [{ evidenceId: "b1", reason: "dup" }, { evidenceId: "b3", reason: "page number" }];
    expect(() => validateGuruNotes(overlap, ids, blocks, "en", "hash")).toThrow(/also explained/);
    const many = goodNotes();
    many.topics[0].evidenceIds = ["b1"];
    many.omitted = [{ evidenceId: "b2", reason: "banner" }, { evidenceId: "b3", reason: "page number" }];
    // Two of three omitted is within the allowance of max(3, 30%), so only the overlap and reasons matter.
    expect(validateGuruNotes(many, ids, blocks, "en", "hash").omitted).toHaveLength(2);
  });
});

describe("Guru notes v3: pictures, drawings and try-now activities", () => {
  it("keeps the look-at caption, clamps the diagram and requires a try-now activity", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash");
    const topic = notes.topics[0];
    expect(topic.lookAt).toMatch(/Look at the small plant/);
    expect(topic.diagram).toHaveLength(3);
    expect(topic.diagram[0]).toMatchObject({ id: "shape-0", type: "circle", radius: 40, color: "yellow" });
    expect(topic.diagram[2].text).toBe("shoot grows up");
    expect(topic.tryNow.steps).toHaveLength(3);
    const noActivity: any = goodNotes();
    noActivity.topics[0].tryNow = { title: "x", steps: ["only one"], whatToNotice: "nothing" };
    expect(() => validateGuruNotes(noActivity, ids, blocks, "en", "hash")).toThrow(/tryNow activity with 2 to 5 steps/);
    const badShape: any = goodNotes();
    badShape.topics[0].diagram = [{ type: "rect", x: 990, y: 990, width: 500, height: 500, color: "blue" }, { type: "text", x: 10, y: 10, text: "corner", color: "white" }];
    expect(validateGuruNotes(badShape, ids, blocks, "en", "hash").topics[0].diagram[0]).toMatchObject({ width: 10, height: 10 });
    const unlabelled: any = goodNotes();
    unlabelled.topics[0].diagram = [{ type: "rect", x: 100, y: 100, width: 300, height: 200, color: "green" }];
    expect(() => validateGuruNotes(unlabelled, ids, blocks, "en", "hash")).toThrow(/diagram has no labels/);
    const outside: any = goodNotes();
    outside.topics[0].diagram = [{ type: "rect", x: 1000, y: 10, width: 5, height: 5, color: "blue" }];
    expect(() => validateGuruNotes(outside, ids, blocks, "en", "hash")).toThrow(/rectangle outside scene/);
  });
});

describe("Guru notes validator tolerance learned from the first whole-book run", () => {
  it("accepts an empty diagram, a one-word check answer and an omission of a region set aside for review", () => {
    const raw: any = goodNotes();
    raw.topics[0].diagram = [];
    raw.topics[0].checkYourself = [{ question: "Is a stone alive?", answer: "No" }];
    raw.omitted = [{ evidenceId: "b3", reason: "page number" }, { evidenceId: "vision-99", reason: "faint region" }];
    const notes = validateGuruNotes(raw, ids, blocks, "en", "hash");
    expect(notes.topics[0].diagram).toEqual([]);
    expect(notes.topics[0].checkYourself[0].answer).toBe("No");
    expect(notes.omitted).toEqual([{ evidenceId: "b3", reason: "page number" }]);
  });
});

describe("Guru notes v4: written for a child", () => {
  it("rejects adult sentences a class 5 child cannot read, and long or wordy topics", () => {
    const adult: any = goodNotes();
    adult.topics[0].explanation[0] =
      "This comparison constitutes the foundational starting point for comprehending the developmental trajectory of your individual life journey, which continues throughout childhood and adolescence.";
    expect(() => validateGuruNotes(adult, ids, blocks, "en", "hash", 5)).toThrow(/sentence of \d+ words|reads at grade/);
    const wordy: any = goodNotes();
    wordy.topics[0].explanation = [paragraph(1), paragraph(2), paragraph(3), paragraph(1), paragraph(2)];
    expect(() => validateGuruNotes(wordy, ids, blocks, "en", "hash", 5)).toThrow(/too long for a child/);
    const longHook: any = goodNotes();
    longHook.topics[0].hook = "One. Two. Three. Four. Five sentences is too many for a hook.";
    expect(() => validateGuruNotes(longHook, ids, blocks, "en", "hash", 5)).toThrow(/hook must be 1 to 4/);
  });
  it("keeps the children's parts: hook, big idea, steps, chain, fun fact, quiz, and 'I can' objectives", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5);
    const topic = notes.topics[0];
    expect(topic.bigIdea).toMatch(/baby plant/);
    expect(topic.steps).toHaveLength(4);
    expect(topic.chain.map((c) => c.label)).toEqual(["Seed", "Sprout", "Plant"]);
    expect(topic.quiz.answerIndex).toBe(0);
    expect(topic.didYouKnow).toMatch(/hundreds of years/);
    expect(notes.readingLevel).toBe(5);
    expect(notes.blueprint).toBe("notes-v4");
    const badChain: any = goodNotes();
    badChain.topics[0].chain = [{ label: "Seed", emoji: "🌰" }];
    expect(() => validateGuruNotes(badChain, ids, blocks, "en", "hash", 5)).toThrow(/chain must be empty or 3 to 6/);
  });
  it("reads the class from the book id", () => {
    expect(readingLevelFor("evs-class-5")).toBe(5);
    expect(readingLevelFor("science-class-6")).toBe(6);
    expect(readingLevelFor("m-2f1c")).toBe(6);
  });
});

describe("Guru notes by teaching depth", () => {
  it("records the depth in the notes and changes what the prompt asks for", () => {
    expect(validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5).depth).toBe("basis");
    expect(validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5, "deep").depth).toBe("deep");
    expect(() => validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5, "expert" as any)).toThrow(/unknown depth/);
    expect(notesDepthSection("basis")).toMatch(/name and describe/);
    expect(notesDepthSection("advanced")).toMatch(/tempting wrong option/);
    expect(notesPromptSection("en", 5, "deep")).toMatch(/how could we find out/);
    // The reading level stays the child's class at every depth.
    expect(notesPromptSection("en", 5, "deep")).toMatch(/class 5 child/);
  });
  it("carries the poster parts: subtitle, topic icons, key points and a closing line", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5);
    expect(notes.subtitle).toBe("Seeds, plants and what makes them alive");
    expect(notes.topics[0].icon).toBe("🌱");
    expect(notes.topics[0].keyPoints).toHaveLength(3);
    expect(notes.closingLine).toMatch(/small promise/);
    const noPoints: any = goodNotes();
    noPoints.topics[0].keyPoints = ["Only one"];
    expect(() => validateGuruNotes(noPoints, ids, blocks, "en", "hash", 5)).toThrow(/keyPoints must have 3 to 5/);
  });
});

describe("Audience editions and blueprint selection (Step 6)", () => {
  it("maps each audience to the correct blueprint", () => {
    expect(blueprintForAudience("child")).toBe(BLUEPRINTS.CHILDREN);
    expect(blueprintForAudience("school_student")).toBe(BLUEPRINTS.CHILDREN);
    expect(blueprintForAudience("teacher")).toBe(BLUEPRINTS.CHILDREN);
    expect(blueprintForAudience("it_professional")).toBe(BLUEPRINTS.PROFESSIONAL);
    expect(blueprintForAudience("manager")).toBe(BLUEPRINTS.PROFESSIONAL);
    expect(blueprintForAudience("competitive_exam")).toBe(BLUEPRINTS.PROFESSIONAL);
    expect(blueprintForAudience("professor")).toBe(BLUEPRINTS.PROFESSOR);
    expect(blueprintForAudience("college_student")).toBe(BLUEPRINTS.PROFESSOR);
    expect(blueprintForAudience(null)).toBe(BLUEPRINTS.CHILDREN);
    expect(blueprintForAudience(undefined)).toBe(BLUEPRINTS.CHILDREN);
  });

  const goodProfNotes = () => ({
    title: "Distributed Plant Growth Telemetry",
    subtitle: "Architecture and operational patterns for botanical telemetry",
    overview: "This chapter covers automated sensory data collection for plant health monitoring across distributed edge gateways.",
    objectives: ["Deploy an edge telemetry daemon", "Configure alert thresholds for hydration"],
    topics: [
      {
        id: "t1",
        heading: "Soil moisture sensing and edge ingestion",
        icon: "💻",
        evidenceIds: ["b1", "b2"],
        explanation: [
          "Capacitive probes measure soil dielectric permittivity to evaluate volumetric water content at scale without corrosion.",
          "Edge gateways poll ADC channels every sixty seconds and publish condensed readings via lightweight MQTT brokers.",
        ],
        keyPoints: ["Capacitive sensing prevents sensor oxidation", "MQTT QoS 1 guarantees event telemetry delivery"],
        problemSolved: "Manual soil observation lacks continuous resolution and fails to scale across commercial hydroponics operations.",
        architecture: {
          description: "Soil sensors attach to microcontrollers streaming metrics over LoRaWAN to an on-premise message cluster.",
          components: ["Capacitive probe", "ESP32 edge node", "Mosquitto broker", "TimescaleDB metrics store"],
        },
        implementation: {
          pattern: "Publisher-Subscriber telemetry streaming",
          steps: [
            "Calibrate analogue ADC high and low frequency baselines in dry air and pure water.",
            "Attach sensor interrupt triggers to the edge scheduler.",
            "Send heartbeat pings every ten minutes to verify sensor loop continuity.",
          ],
        },
        commands: [
          { command: "mosquitto_sub -t sensors/soil/# -v", description: "Monitor raw sensory telemetry stream" },
          { command: "systemctl restart botanical-agent", description: "Restart local edge ingestion service" },
        ],
        troubleshooting: [
          { issue: "Flatline ADC 0 reading", cause: "Ground cable disconnected or pin voltage fault", resolution: "Verify 3.3V supply with a multimeter and check cold solder joints" },
        ],
        scenarios: [
          { title: "High-humidity greenhouse condensation", context: "Moisture droplets cause temporary pin bridges on sensor contacts", solution: "Conformal coat PCB traces leaving only sensing plates exposed" },
        ],
        labs: [
          { title: "End-to-end edge pipeline test", goal: "Transmit telemetry packet and verify persistence", steps: ["Plug probe into test bed", "Run simulator CLI script", "Query database"], verification: "Select count(*) returns non-zero records" },
        ],
        interviewQuestions: [
          { question: "How do capacitive soil sensors avoid galvanisation compared to resistive probes?", expectedAnswer: "Capacitive sensors insulate metal traces from direct water contact, measuring capacitance changes instead of passing direct electric current through the moist substrate." },
        ],
        keyTerms: [
          { term: "LoRaWAN", meaning: "Low Power Wide Area Network protocol for battery-operated wireless devices", example: "Sending soil packets across a five kilometer farm perimeter" },
        ],
      },
    ],
    summary: ["Telemetry automation enables precision agricultural analytics.", "Resilient edge architectures insulate against hardware failure."],
    closingLine: "Reliable production monitoring turns agricultural uncertainty into deterministic engineering.",
    omitted: [{ evidenceId: "b3", reason: "page number" }],
  });

  const goodProfessorNotes = () => ({
    title: "Theoretical Foundations of Plant Development",
    subtitle: "Morphogenetic signalling cascades and cellular differentiation",
    overview: "This pedagogical synthesis investigates the biophysical mechanisms regulating apical dominance and embryonic reactivation in angiosperms.",
    objectives: ["Analyze hormonal gradients in embryogenesis", "Critique classical morphogen diffusion paradigms"],
    topics: [
      {
        id: "t1",
        heading: "Auxin transport and embryonic polarity",
        icon: "🏛️",
        evidenceIds: ["b1", "b2"],
        explanation: [
          "Active polar transport of indole-3-acetic acid establishes the primary apical-basal symmetry axis within the early globular proembryo.",
          "Chemiosmotic gradients driven by plasma membrane proton pumps create directional fluxes governed by asymmetrical PIN efflux carriers.",
        ],
        keyPoints: ["Polar auxin transport establishes primary embryonic axes", "PIN carrier asymmetric localisation regulates vector flows"],
        foundations: {
          formalDefinition: "Apical-basal polarity is the asymmetric cellular alignment along the prospective longitudinal axis of symmetry in embryogenesis.",
          principles: ["Chemiosmotic auxin transport hypothesis", "Positional information and concentration threshold patterning"],
        },
        researchPerspective: {
          currentTrends: ["Single-cell transcriptomics of vascular transition states", "Optogenetic control of synthetic morphogen sinks"],
          openProblems: ["How mechanical tension feedback couples with transcriptional reprogramming", "Cross-talk dynamics between brassinosteroids and gibberellin sinks"],
        },
        caseStudies: [
          { title: "Arabidopsis gnom mutant phenotypic bifurcation", context: "Investigation of brefeldin-A sensitive vesicle trafficking mutants", findings: "Loss of GNOM ARF-GEF abolishes coordinated PIN1 polarity, causing symmetrical ball-shaped embryos devoid of root or shoot meristems." },
        ],
        limitations: [
          { boundaryCondition: "Linear diffusion approximation assumes isotropic cytoplasm", tradeOffs: "Fails to capture active cytoplasmic streaming dynamics observed in elongated cells" },
        ],
        references: [
          { citation: "Sachs, T. (1991). Pattern Formation in Plant Development. Cambridge University Press.", relevance: "Seminal formulation of the auxin canalisation hypothesis" },
        ],
        keyTerms: [
          { term: "Morphogen", meaning: "A signaling substance that imparts positional information to cells along a concentration gradient", example: "Auxin concentrations specifying distal and proximal tissue fates" },
        ],
      },
    ],
    summary: ["Embryonic polarity originates from asymmetric carrier distribution.", "Genetic mutants confirm the indispensable role of targeted vesicle recycling."],
    closingLine: "Theoretical biology unifies morphogenetic patterns under universal physicochemical conservation laws.",
    omitted: [{ evidenceId: "b3", reason: "page number" }],
  });

  it("validates professional notes with architecture, commands, troubleshooting, scenarios and labs", () => {
    const notes = validateProfessionalNotes(goodProfNotes(), ids, blocks, "en", "hash-prof", 12);
    expect(notes.blueprint).toBe(BLUEPRINTS.PROFESSIONAL);
    expect(notes.targetAudience).toBe("it_professional");
    expect(notes.topics[0].commands).toHaveLength(2);
    expect(notes.topics[0].architecture?.components).toContain("Mosquitto broker");
    expect(notes.topics[0].troubleshooting[0].issue).toMatch(/Flatline ADC/);
    expect(notes.topics[0].interviewQuestions[0].question).toMatch(/capacitive soil sensors/);
  });

  it("enforces no-copying rules on professional sections", () => {
    const copying = goodProfNotes();
    copying.topics[0].problemSolved = "Notice that: " + blocks[0].text + " This is our primary operational concern.";
    expect(() => validateProfessionalNotes(copying, ids, blocks, "en", "hash-prof", 12)).toThrow(/problemSolved copies the book \(b1\)/);
  });

  it("enforces complete page coverage on professional notes", () => {
    const missing = goodProfNotes();
    missing.omitted = [];
    expect(() => validateProfessionalNotes(missing, ids, blocks, "en", "hash-prof", 12)).toThrow(/not explained or omitted: b3/);
  });

  it("validates professor notes with foundations, research perspective, case studies and references", () => {
    const notes = validateProfessorNotes(goodProfessorNotes(), ids, blocks, "en", "hash-prof", 16);
    expect(notes.blueprint).toBe(BLUEPRINTS.PROFESSOR);
    expect(notes.targetAudience).toBe("professor");
    expect(notes.topics[0].foundations?.formalDefinition).toMatch(/Apical-basal polarity/);
    expect(notes.topics[0].caseStudies[0].title).toMatch(/gnom mutant/);
    expect(notes.topics[0].references[0].citation).toMatch(/Sachs/);
  });

  it("enforces no-copying and coverage rules on professor notes", () => {
    const copying = goodProfessorNotes();
    copying.topics[0].foundations.formalDefinition = "Definition: " + blocks[0].text + " As established in early botany.";
    expect(() => validateProfessorNotes(copying, ids, blocks, "en", "hash-prof", 16)).toThrow(/formal definition copies the book \(b1\)/);

    const missing = goodProfessorNotes();
    missing.omitted = [];
    expect(() => validateProfessorNotes(missing, ids, blocks, "en", "hash-prof", 16)).toThrow(/not explained or omitted: b3/);
  });

  it("routes validation correctly via validateNotesForBlueprint", () => {
    const prof = validateNotesForBlueprint(BLUEPRINTS.PROFESSIONAL, goodProfNotes(), ids, blocks, "en", "h1");
    expect(prof.blueprint).toBe(BLUEPRINTS.PROFESSIONAL);

    const acad = validateNotesForBlueprint(BLUEPRINTS.PROFESSOR, goodProfessorNotes(), ids, blocks, "en", "h2");
    expect(acad.blueprint).toBe(BLUEPRINTS.PROFESSOR);

    const child = validateNotesForBlueprint(BLUEPRINTS.CHILDREN, goodNotes(), ids, blocks, "en", "h3");
    expect(child.blueprint).toBe(BLUEPRINTS.CHILDREN);
  });
});
