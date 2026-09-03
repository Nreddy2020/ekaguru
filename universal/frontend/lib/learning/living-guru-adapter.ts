import { TeachingDepth } from './teaching-package.types';
import { LivingGuruLessonPlan, BlackboardProcessNode } from '../../components/learning/LivingGuruBlackboard';

export class LivingGuruAdapter {
  public static getLessonPlanForPage(
    pageNumber: number,
    depth: TeachingDepth,
    canonicalEntry: any,
    guruLesson: any
  ): LivingGuruLessonPlan {
    const p = Number(pageNumber) || 3;

    // PAGE 46: PUBLIC SERVICES
    if (p >= 44 && p <= 47) {
      return {
        pageNumber: p,
        subject: 'Environmental Studies (Class 5)',
        topicTitle: 'PUBLIC SERVICES IN OUR COMMUNITY',
        unitTitle: 'Unit 4: Community Living',
        depth,
        depthFocusDescription: 'Physical Page 46 • Essential Public Helpers & Emergency Infrastructure',
        introSpeech: 'Hello young scholars! Open your textbook to Page 46. Today we are going to learn about the public services that keep our community safe, healthy, and connected.',
        citationBBox: { x: 165, y: 84, width: 926, height: 298 },
        summaryRule: 'Core Rule: Public services operate in coordinated balance to protect all citizens.',
        nodes: [
          {
            id: 'node-pub-services',
            icon: '🏛️',
            label: 'PUBLIC SERVICES',
            subtext: 'Essential community institutions for safety & health',
            speechText: 'First, look at Public Services. These are essential community helpers that serve everyone in our town.',
          },
          {
            id: 'node-post-office',
            icon: '✉️',
            label: 'POST OFFICE',
            subtext: 'Delivers letters, parcels & money orders across cities',
            speechText: 'Next is the Post Office. Postal workers deliver mail and keep families connected across cities.',
          },
          {
            id: 'node-police-station',
            icon: '🚓',
            label: 'POLICE STATION (100)',
            subtext: 'Maintains law, peace & protects citizens from danger',
            speechText: 'Here is the Police Station. Police officers maintain law, safety, and protect our neighbourhood.',
          },
          {
            id: 'node-hospital',
            icon: '🏥',
            label: 'HOSPITAL & CLINIC (108)',
            subtext: 'Doctors, nurses & 24/7 emergency ambulances',
            speechText: 'Next, we see the Hospital and Clinic. Doctors and ambulances provide life-saving care when people fall sick.',
          },
          {
            id: 'node-fire-station',
            icon: '🚒',
            label: 'FIRE BRIGADE (101)',
            subtext: 'Firefighters put out fires & rescue trapped citizens',
            speechText: 'Finally, the Fire Station. Firefighters brave danger to put out fires and rescue trapped citizens.',
          },
        ],
        socraticQuestion: {
          question: 'If someone in your neighbourhood suddenly needs urgent medical treatment, which public service should they contact?',
          options: [
            {
              id: 'opt-post',
              label: 'Post Office for letters',
              isCorrect: false,
              misconceptionExplanation: 'The Post Office delivers mail, not emergency medical treatment! Hospitals provide doctors and ambulances.',
            },
            {
              id: 'opt-hospital',
              label: 'Hospital & Ambulance Service (Dial 108)',
              isCorrect: true,
            },
            {
              id: 'opt-fire',
              label: 'Fire Brigade for fire rescue',
              isCorrect: false,
              misconceptionExplanation: 'Fire stations extinguish fires; healthcare and injury treatments are provided by hospitals and clinics.',
            },
          ],
          correctExplanation: 'Spot on! Dialing 108 brings paramedics and ambulances immediately to treat sick or injured people.',
          misconceptionTargetNodeId: 'node-hospital',
        },
      };
    }

    // PAGE 73: ASTRONOMY / ECLIPSES
    if (p === 73) {
      return {
        pageNumber: 73,
        subject: 'Earth Science & Astronomy (Grade 7)',
        topicTitle: 'SOLAR AND LUNAR ECLIPSES',
        unitTitle: 'Chapter 11: Celestial Phenomena',
        depth,
        depthFocusDescription: 'Physical Page 73 • Rectilinear Optics, Umbra & Penumbra Geometry',
        introSpeech: 'Look at Page 73. Today we observe how celestial bodies cast shadows in space to create Solar and Lunar Eclipses.',
        citationBBox: { x: 120, y: 110, width: 850, height: 90 },
        summaryRule: 'Core Rule: Light travels in straight lines; opaque celestial bodies cast umbra and penumbra shadows.',
        nodes: [
          {
            id: 'node-sun',
            icon: '☀️',
            label: 'THE SUN',
            subtext: 'Primary rectilinear light source of our solar system',
            speechText: 'First, we draw the Sun, which emits light across our solar system.',
          },
          {
            id: 'node-moon',
            icon: '🌑',
            label: 'THE MOON',
            subtext: 'Passes directly between the Sun and Earth',
            speechText: 'During a Solar Eclipse, the Moon passes directly between the Sun and Earth.',
          },
          {
            id: 'node-umbra',
            icon: '⬛',
            label: 'UMBRA CONE',
            subtext: 'Dark central cone where sunlight is totally blocked',
            speechText: 'The dark inner cone where all sunlight is completely blocked is called the Umbra.',
          },
          {
            id: 'node-penumbra',
            icon: '◽',
            label: 'PENUMBRA ZONE',
            subtext: 'Lighter surrounding shadow of partial blockage',
            speechText: 'Surrounding the umbra is the penumbra, where observers see a partial eclipse.',
          },
          {
            id: 'node-earth',
            icon: '🌍',
            label: 'EARTH SURFACE',
            subtext: 'Observers inside the shadow witness the eclipse',
            speechText: 'As the shadow cone strikes Earth, observers in the umbra witness a Total Solar Eclipse!',
          },
        ],
        socraticQuestion: {
          question: 'What is the dark central part of the shadow where sunlight is completely blocked called?',
          options: [
            {
              id: 'opt-penumbra',
              label: 'Penumbra (Partial Outer Zone)',
              isCorrect: false,
              misconceptionExplanation: 'The penumbra is the outer zone where sunlight is only partially blocked! The dark central cone is called the Umbra.',
            },
            {
              id: 'opt-umbra',
              label: 'Umbra (Total Shadow Cone)',
              isCorrect: true,
            },
            {
              id: 'opt-corona',
              label: 'Solar Corona',
              isCorrect: false,
              misconceptionExplanation: 'The Corona is the outer glowing atmosphere of the Sun, not the shadow cone cast by the Moon.',
            },
          ],
          correctExplanation: 'Exactly right! The Umbra is the dark central cone of total sunlight blockage.',
          misconceptionTargetNodeId: 'node-umbra',
        },
      };
    }

    // DEFAULT: PAGE 1-3 (LIVING THINGS GROW) OR GENERAL ARBITRARY PAGE
    if (depth === 'developing') {
      return {
        pageNumber: p,
        subject: 'Environmental Studies (Class 5)',
        topicTitle: 'INTERNAL MECHANISMS OF GERMINATION',
        unitTitle: 'Unit 1: The Living World',
        depth,
        depthFocusDescription: 'Physical Page ' + p + ' • Developing Depth: Root Radicle & Shoot Plumule Growth',
        introSpeech: 'Welcome to Developing depth! Let us investigate what happens inside the seed to make it sprout into a healthy plant.',
        citationBBox: { x: 165, y: 84, width: 926, height: 298 },
        summaryRule: 'Developing Principle: Moisture activates dormant enzymes, triggering downward root radicle and upward shoot plumule.',
        nodes: [
          {
            id: 'node-water-intake',
            icon: '💧',
            label: 'WATER & SOIL MOISTURE',
            subtext: 'Enters seed coat to awaken dormant plant enzymes',
            speechText: 'First, moisture penetrates the outer seed coat, activating dormant growth enzymes inside.',
          },
          {
            id: 'node-radicle',
            icon: '🌱',
            label: 'ROOT RADICLE',
            subtext: 'Grows downwards to anchor and absorb minerals',
            speechText: 'Next, the root radicle pushes downward into the soil to anchor the plant and drink water.',
          },
          {
            id: 'node-plumule',
            icon: '🌿',
            label: 'SHOOT PLUMULE',
            subtext: 'Pushes upwards toward sunlight for photosynthesis',
            speechText: 'Then, the green shoot plumule reaches upward toward the sunlight.',
          },
          {
            id: 'node-photosynthesis',
            icon: '☀️',
            label: 'PHOTOSYNTHESIS & MATURITY',
            subtext: 'Leaves produce glucose food for full plant growth',
            speechText: 'Finally, green leaves harness sunlight to feed the growing plant until it reaches full maturity.',
          },
        ],
        socraticQuestion: {
          question: 'Why does the root radicle push downward into the soil before the green shoot grows upward?',
          options: [
            {
              id: 'opt-anchor',
              label: 'To anchor the plant and absorb moisture and nutrients first',
              isCorrect: true,
            },
            {
              id: 'opt-hide',
              label: 'To hide from the sun permanently',
              isCorrect: false,
              misconceptionExplanation: 'Roots do not hide; they actively absorb essential moisture and minerals needed for the green shoot to survive!',
            },
            {
              id: 'opt-random',
              label: 'It grows downward purely by random chance',
              isCorrect: false,
              misconceptionExplanation: 'Plant roots exhibit positive geotropism—they naturally grow toward gravity and moisture.',
            },
          ],
          correctExplanation: 'Outstanding! Roots must establish water uptake before leaves can safely unfurl in the air.',
          misconceptionTargetNodeId: 'node-radicle',
        },
      };
    }

    // BASIS DEPTH FOR PAGE 1-3 (HOW LIVING THINGS GROW)
    return {
      pageNumber: p,
      subject: 'Environmental Studies (Class 5)',
      topicTitle: 'HOW LIVING THINGS GROW',
      unitTitle: canonicalEntry?.unitName || 'Unit 1: The Living World',
      depth: 'basis',
      depthFocusDescription: 'Physical Page ' + p + ' • Concrete Identification of Life Growth Stages',
      introSpeech: 'Hello! Today we are going to learn about how living things grow. Look at the page on the left. We can see that living things change as they grow.',
      citationBBox: { x: 165, y: 84, width: 926, height: 298 },
      summaryRule: 'Core Rule: Living things do not become adults immediately; they progress through sequential stages of growth.',
      nodes: [
        {
          id: 'node-seed',
          icon: '🌱',
          label: 'SEED',
          subtext: 'Dormant beginning of plant life in the soil',
          speechText: 'This is our starting point — the seed.',
        },
        {
          id: 'node-sprout',
          icon: '🌿',
          label: 'SPROUT',
          subtext: 'The seed begins to grow and produce green shoots',
          speechText: 'The seed begins to grow. Next we see the sprout.',
        },
        {
          id: 'node-young',
          icon: '🌳',
          label: 'YOUNG PLANT',
          subtext: 'Strong stem, deeper roots, and expanding foliage',
          speechText: 'The sprout continues to grow taller and becomes a thriving young plant.',
        },
        {
          id: 'node-adult',
          icon: '🌳',
          label: 'ADULT PLANT',
          subtext: 'Fully matured plant capable of bearing fruit & seeds',
          speechText: 'Finally, it matures into a full adult plant that can produce new seeds of its own.',
        },
      ],
      socraticQuestion: {
        question: 'What happens when a seed begins to grow?',
        options: [
          {
            id: 'opt-immediate-adult',
            label: 'It immediately becomes an adult plant in one step.',
            isCorrect: false,
            misconceptionExplanation: 'Good try. But living things develop in gradual stages: first a seed, then a sprout, then a young plant, before becoming an adult plant. Look at our drawing again.',
          },
          {
            id: 'opt-sprout-first',
            label: 'It first sprouts into a seedling before growing into an adult plant.',
            isCorrect: true,
          },
          {
            id: 'opt-stone',
            label: 'It stops growing and turns into a stone.',
            isCorrect: false,
            misconceptionExplanation: 'Living seeds grow! Non-living objects like stones do not grow.',
          },
        ],
        correctExplanation: 'Excellent! You understood that growth occurs through sequential stages.',
        misconceptionTargetNodeId: 'node-sprout',
      },
    };
  }
}
