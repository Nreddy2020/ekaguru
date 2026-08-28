import { KnowledgeUnit } from './runtime-contracts';

export class KnowledgeRepositoryService {
  private static units: Record<string, KnowledgeUnit> = {
    // 1. Chapter 2: Heart & Circulation (NORMAL_CHAPTER) - Full 5-Step Socratic Progression
    'c-heart-circulation': {
      id: 'ku-heart-circulation',
      conceptId: 'c-heart-circulation',
      title: 'Circulatory System: The Heart as a Continuous Pump',
      archetype: 'NORMAL_CHAPTER',
      sourceFacts: [
        {
          id: 'fact-heart-pumps',
          sourceAnchor: {
            sourceId: 'src-0011',
            sequenceIndex: 11,
            printedPage: 10,
            pdfPage: 6,
            side: 'left',
            snippetText: 'The heart pumps blood to the whole body.',
            confidence: 1.0,
          },
          exactSnippet: 'The heart pumps blood to the whole body.',
          statement: 'The heart is a muscular organ that pumps blood to all organs of the human body.',
          confidence: 1.0,
        },
        {
          id: 'fact-lungs-breathe',
          sourceAnchor: {
            sourceId: 'src-0011',
            sequenceIndex: 11,
            printedPage: 10,
            pdfPage: 6,
            side: 'left',
            snippetText: 'Our body has two lungs... Our lungs help us to breathe.',
            confidence: 1.0,
          },
          exactSnippet: 'Our lungs help us to breathe. When we breathe the air in, our chest expands.',
          statement: 'Lungs facilitate respiration and gas exchange; they do not pump blood.',
          confidence: 1.0,
        },
      ],
      socraticSteps: [
        {
          id: 'step-what',
          stepType: 'WHAT',
          title: '1. WHAT IS IT? — Core Definition',
          prompt: 'Identify the fundamental biological role of the heart.',
          groundedExplanation:
            'The heart is an internal muscular organ located inside your chest cavity. It continuously pumps blood containing oxygen and vital nutrients to every single organ, limb, and cell in your body.',
          mentalModelDiagram: 'Heart ❤️  --pumps-->  Blood 🩸  --delivers to-->  Whole Body 🏃',
          cognitiveDimension: 'RECALL',
          difficulty: 1,
          question: {
            text: 'Which internal organ is responsible for pumping blood to the entire body?',
            options: ['The Heart', 'The Lungs', 'The Stomach', 'The Kidneys'],
            correctIndex: 0,
            explanation: 'The heart is the muscular pump that circulates blood throughout the body.',
            misconceptionIdIfChosen: { 1: 'MIS-HEART-LUNGS-001' },
          },
        },
        {
          id: 'step-how',
          stepType: 'HOW',
          title: '2. HOW DOES IT WORK? — The Pumping Mechanism',
          prompt: 'Understand how rhythmic contraction generates hydraulic fluid pressure.',
          groundedExplanation:
            'The heart muscles contract (squeeze tight) and relax in a steady rhythm. When it contracts, it forces blood out into arteries; when it relaxes, it fills with returning blood—acting just like a mechanical water pump.',
          mentalModelDiagram: 'Squeeze (Contract) ➔ Blood Ejected | Relax (Expand) ➔ Blood Fills',
          cognitiveDimension: 'APPLICATION',
          difficulty: 2,
          question: {
            text: 'How does the heart move blood through thousands of miles of blood vessels?',
            options: [
              'By contracting and relaxing rhythmically like a mechanical pump',
              'By absorbing sunlight through our skin',
              'By staying completely still without motion',
              'By using stomach digestive acids to push liquid',
            ],
            correctIndex: 0,
            explanation: 'Rhythmic muscular contractions generate the pressure required to circulate blood throughout the body.',
            misconceptionIdIfChosen: { 3: 'MIS-CIRCULATION-STOMACH-002' },
          },
        },
        {
          id: 'step-why',
          stepType: 'WHY',
          title: '3. WHY IS IT IMPORTANT? — Oxygen & Cellular Fuel',
          prompt: 'Reason about the necessity of continuous blood flow for muscle cells.',
          groundedExplanation:
            'Your cells and muscles cannot store excess oxygen. Blood must circulate non-stop to deliver fresh oxygen from lungs and glucose from digestion, keeping your body energized and alert.',
          cognitiveDimension: 'REASONING',
          difficulty: 3,
          question: {
            text: 'Why does your heartbeat accelerate when you run, jump, or play sports?',
            options: [
              'Working muscles demand more oxygen rapidly, requiring the heart to pump blood faster',
              'The heart gets frightened by physical movement and tries to escape',
              'Physical exercise removes all blood from the body',
              'The lungs stop working during exercise',
            ],
            correctIndex: 0,
            explanation: 'Active muscles require increased oxygen, signaling the brain to accelerate heart pumping speed.',
          },
        },
        {
          id: 'step-what-if',
          stepType: 'WHAT_IF',
          title: '4. WHAT IF? — Causal Counterfactual Inquiry',
          prompt: 'Investigate what occurs when circulation is momentarily restricted.',
          groundedExplanation:
            'If blood circulation to an arm or leg slows down (like sitting awkwardly on your foot), the nerves and muscles lack oxygen and nutrients, causing that "pins-and-needles" sensation until blood flow returns.',
          cognitiveDimension: 'REASONING',
          difficulty: 4,
          question: {
            text: 'What happens to body tissues if blood circulation is temporarily slowed or blocked?',
            options: [
              'Tissues lack oxygen and energy, causing numbness or fatigue',
              'Tissues instantly turn into solid bone',
              'The body starts breathing through the skin',
              'Nothing happens because cells do not need blood',
            ],
            correctIndex: 0,
            explanation: 'Without continuous blood flow, tissues are deprived of oxygen and essential nutrients.',
          },
        },
        {
          id: 'step-transfer',
          stepType: 'TRANSFER',
          title: '5. REAL-WORLD TRANSFER — Engineering Analogy',
          prompt: 'Connect biological circulation to mechanical and municipal engineering.',
          groundedExplanation:
            'A multi-story building uses an electric water pump to push water through pipes up to every apartment tap. Your heart is the biological pump that pushes life-giving blood to every cell!',
          cognitiveDimension: 'APPLICATION',
          difficulty: 4,
          question: {
            text: 'Which real-world engineering device operates on the exact same physical principle as the human heart?',
            options: [
              'A water pump pushing water through pipes to overhead tanks',
              'A mirror reflecting sunlight',
              'A wooden door hinge',
              'A pair of scissors cutting paper',
            ],
            correctIndex: 0,
            explanation: 'Both the heart and a water pump create fluid pressure to drive liquid through a closed network of conduits.',
          },
        },
      ],
      observationalTask: {
        id: 'obs-pulse-experiment',
        conceptId: 'c-heart-circulation',
        title: 'Hands-on Pulse & Heart Rate Experiment',
        objective: 'Measure empirical changes in pulse rate before and after physical exertion.',
        steps: [
          {
            stepNumber: 1,
            action: 'OBSERVE',
            instruction: 'Place your index and middle fingers gently on the inside of your wrist below your thumb.',
          },
          {
            stepNumber: 2,
            action: 'MEASURE',
            instruction: 'Count the beats you feel for 30 seconds while sitting quietly (Baseline).',
            fieldKey: 'baselinePulse',
            unit: 'beats / 30s',
            defaultValue: '38',
          },
          {
            stepNumber: 3,
            action: 'ACT',
            instruction: 'Stand up and perform 20 jumping jacks or jog in place for 30 seconds.',
          },
          {
            stepNumber: 4,
            action: 'PREDICT',
            instruction: 'Do you predict your pulse count will be higher, lower, or the same?',
            fieldKey: 'pulsePrediction',
            defaultValue: 'higher',
          },
          {
            stepNumber: 5,
            action: 'MEASURE',
            instruction: 'Count your pulse immediately after the exercise for 30 seconds.',
            fieldKey: 'postPulse',
            unit: 'beats / 30s',
            defaultValue: '52',
          },
          {
            stepNumber: 6,
            action: 'EXPLAIN',
            instruction: 'Explain why your heart rate increased during physical activity.',
            fieldKey: 'explanationText',
            defaultValue: 'Muscles demanded more oxygen during exercise, signaling the heart to pump blood faster.',
          },
        ],
        validationLogic: (inputs) => {
          const baseline = Number(inputs.baselinePulse || 0);
          const post = Number(inputs.postPulse || 0);
          const hasIncrease = post > baseline;
          const hasValidExplanation = String(inputs.explanationText || '').length > 10;

          if (hasIncrease && hasValidExplanation) {
            return {
              valid: true,
              reasoningScore: 1.0,
              feedback: '✓ Excellent observational evidence! Your heart pumped faster to supply extra oxygen to working muscles.',
            };
          }
          return {
            valid: false,
            reasoningScore: 0.4,
            feedback: 'Ensure you measure pulse accurately and provide an explanation connecting exercise to oxygen demand.',
          };
        },
      },
      misconceptions: [
        {
          id: 'MIS-HEART-LUNGS-001',
          conceptId: 'c-heart-circulation',
          misconceptionType: 'FUNCTIONAL_CONFUSION',
          triggerPattern: 'Lungs pump blood',
          incorrectMentalModel: 'The student believes the lungs pump blood because both are inside the chest.',
          correctMentalModel: 'The heart pumps blood; the lungs facilitate gas exchange (breathing).',
          socraticRemediation:
            'You selected lungs! Remember: your lungs take in fresh air when you breathe, but your HEART is the muscular pump that pushes blood everywhere.',
          independentVerificationChallenge: {
            question: 'When oxygen enters your lungs from the air, which organ pumps that oxygenated blood to your legs and brain?',
            options: ['The Heart', 'The Stomach', 'The Skin', 'The Lungs'],
            correctIndex: 0,
            explanation: 'The lungs absorb oxygen, but the heart pumps the blood carrying that oxygen throughout the body.',
          },
        },
      ],
      prerequisiteConceptIds: ['c-body-organs-overview'],
      extensionConceptIds: ['c-lungs-respiration', 'c-exercise-health'],
      realWorldTransfers: [
        {
          title: 'Building Water Pumps',
          scenario: 'A municipal water pump pushes clean water through underground pipes to high apartment floors.',
          connection: 'Mechanical pumps mirror the biological hydraulic pumping action of the human heart.',
        },
      ],
    },

    // 2. Festivals of India (ART_SPECIAL) - Full 5-Step Socratic Progression
    'c-festivals-india': {
      id: 'ku-festivals-india',
      conceptId: 'c-festivals-india',
      title: 'Festivals of India: Harvest Cycles, Community Unity & Rangoli Symmetry',
      archetype: 'ART_SPECIAL',
      sourceFacts: [
        {
          id: 'fact-festivals-harvest',
          sourceAnchor: {
            sourceId: 'src-0002',
            sequenceIndex: 2,
            printedPage: 1,
            pdfPage: 2,
            side: 'full',
            snippetText: 'India is a land of festivals... Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli).',
            confidence: 1.0,
          },
          exactSnippet: 'Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses.',
          statement: 'Indian festivals celebrate seasonal harvests, community unity, and folk art traditions like Rangoli.',
          confidence: 1.0,
        },
      ],
      socraticSteps: [
        {
          id: 'step-art-what',
          stepType: 'WHAT',
          title: '1. WHAT IS IT? — Cultural & Seasonal Meaning',
          prompt: 'Understand the connection between Indian festivals and agricultural seasons.',
          groundedExplanation:
            'India is a land of vibrant festivals. Sankranthi is celebrated as a major harvest festival where farming communities express gratitude for newly gathered crops, nature, and sunlight.',
          mentalModelDiagram: 'Winter Crop Harvest ➔ Farmers Rejoice ➔ Community Feast & Muggu Art',
          cognitiveDimension: 'RECALL',
          difficulty: 1,
          question: {
            text: 'What type of seasonal celebration does Sankranthi represent across India?',
            options: [
              'A harvest festival celebrating the gathering of newly ripened crops',
              'A monsoon thunderstorm drill',
              'A factory technology holiday',
              'A winter hibernation break',
            ],
            correctIndex: 0,
            explanation: 'Sankranthi marks the harvest of winter crops like rice, sugarcane, and sesame.',
          },
        },
        {
          id: 'step-art-how',
          stepType: 'HOW',
          title: '2. HOW IS IT CELEBRATED? — Folk Art & Geometry',
          prompt: 'Explore the artistic and geometric traditions of Muggu (Rangoli).',
          groundedExplanation:
            'Families create intricate Muggu (Rangoli) patterns at home entrances using rice flour. These designs use mathematical symmetry—dots connected by curves to form repeating geometric stars and floral shapes.',
          cognitiveDimension: 'APPLICATION',
          difficulty: 2,
          question: {
            text: 'Why do traditional Rangoli (Muggu) patterns use geometric grid dots and symmetry?',
            options: [
              'Symmetrical patterns create balanced, beautiful visual art welcoming guests and nature',
              'To prevent people from entering the doorway',
              'Because only square shapes are allowed during festivals',
              'To test mathematical exam formulas on the floor',
            ],
            correctIndex: 0,
            explanation: 'Symmetry and geometric balance symbolize harmony, welcome, and cultural artistry.',
          },
        },
        {
          id: 'step-art-why',
          stepType: 'WHY',
          title: '3. WHY IS IT IMPORTANT? — Social Cohesion',
          prompt: 'Reason about the cultural importance of shared community celebrations.',
          groundedExplanation:
            'Harvest festivals unite people from diverse backgrounds. Sharing freshly cooked harvest dishes (like Pongal and sesame sweets) strengthens community bonds and mutual respect.',
          cognitiveDimension: 'REASONING',
          difficulty: 3,
          question: {
            text: 'How do festival celebrations contribute to social harmony in our neighborhoods?',
            options: [
              'They bring neighbors together to share food, greetings, and cultural traditions',
              'They force neighbors to stay completely silent inside their rooms',
              'They stop people from talking to their families',
              'They replace all school learning forever',
            ],
            correctIndex: 0,
            explanation: 'Festivals promote togetherness, mutual sharing, and collective joy.',
          },
        },
        {
          id: 'step-art-what-if',
          stepType: 'WHAT_IF',
          title: '4. WHAT IF? — Agriculture & Climate Reflection',
          prompt: 'Reflect on what happens to harvest traditions during extreme droughts.',
          groundedExplanation:
            'If rainfall is delayed or crops fail, harvest yields decrease. This highlights how deeply human cultural celebrations depend on healthy natural ecosystems and rainfall cycles.',
          cognitiveDimension: 'REASONING',
          difficulty: 4,
          question: {
            text: 'What does the existence of harvest festivals teach us about our relationship with nature?',
            options: [
              'Human survival and celebrations are deeply tied to agriculture and weather cycles',
              'Humans can live happily without any crops or farming',
              'Nature has no impact on human culture or food',
              'Festivals create rainfall out of thin air',
            ],
            correctIndex: 0,
            explanation: "Harvest traditions reflect humanity's vital dependence on agriculture and natural environmental cycles.",
          },
        },
        {
          id: 'step-art-transfer',
          stepType: 'TRANSFER',
          title: '5. REAL-WORLD TRANSFER — Observing Traditions',
          prompt: 'Identify harvest and seasonal foods in your own household.',
          groundedExplanation:
            'Whether it is Pongal, Bihu, Lohri, Onam, or Baisakhi, every region of India celebrates harvest abundance with special local grains and sweets!',
          cognitiveDimension: 'APPLICATION',
          difficulty: 4,
          question: {
            text: 'Which festival in northern India is also celebrated as a harvest festival around the same time as Sankranthi?',
            options: ['Lohri and Bihu', 'Halloween', 'Monsoon Rain Day', 'Winter Solstice Freeze'],
            correctIndex: 0,
            explanation: 'Lohri (Punjab) and Bihu (Assam) are regional harvest celebrations occurring alongside Sankranthi.',
          },
        },
      ],
      misconceptions: [],
      prerequisiteConceptIds: [],
      extensionConceptIds: ['c-living-things-growth'],
      realWorldTransfers: [
        {
          title: 'Rangoli Symmetrical Art',
          scenario: 'Drawing 4x4 dot grid geometric patterns at the doorway.',
          connection: 'Applying geometric symmetry to folk art traditions.',
        },
      ],
    },
  };

  public static getKnowledgeUnit(conceptId: string, sectionTitle: string = ''): KnowledgeUnit {
    if (conceptId.includes('festival') || sectionTitle.includes('Festival') || conceptId === 'special-festivals-of-india') {
      return this.units['c-festivals-india'];
    }
    return this.units['c-heart-circulation'];
  }
}
