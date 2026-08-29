/**
 * EKAGURU Topic Knowledge Universe Engine
 * Expands any textbook topic from its smallest components to the cosmic universe.
 */

export interface UniverseNode {
  id: string;
  name: string;
  icon: string;
  category: 'CORE_TEXTBOOK' | 'AGRICULTURE_SCIENCE' | 'SOLAR_ASTRONOMY' | 'FOLK_ART_MATH' | 'COMMUNITY_CULTURE' | 'FOOD_ENERGY';
  tagline: string;
  provenance: '📖 In Your Textbook' | '🔬 Deep Science' | '🌌 Cosmic System' | '🎨 Culture & Art' | '🍚 Life & Nutrition';
  shortDescription: string;
  visualMechanism: {
    steps: { icon: string; label: string; detail: string }[];
    title: string;
  };
  socraticInquiry: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  handsOnTask?: {
    title: string;
    instruction: string;
    type: 'DRAWING' | 'OBSERVATION' | 'CALCULATION';
    rewardBadge: string;
  };
  deeperCosmicLink?: {
    question: string;
    answer: string;
    targetNodeId: string;
  };
  connectedNodeIds: string[];
}

export interface TopicUniverse {
  topicId: string;
  topicTitle: string;
  mainIcon: string;
  subtitle: string;
  textbookExcerpt: string;
  sourceAnchorText: string;
  coreNodes: UniverseNode[];
}

export class KnowledgeUniverseService {
  private static universes: Record<string, TopicUniverse> = {
    'c-festivals-india': {
      topicId: 'c-festivals-india',
      topicTitle: 'Sankranthi & Harvest Festivals',
      mainIcon: '🌾',
      subtitle: 'From a tiny seed and solar rays to community harvest and cultural joy',
      textbookExcerpt:
        'India is a land of festivals... Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses and fly colourful kites.',
      sourceAnchorText: 'Class 5 EVS, Printed Page 1 (Spread 2)',
      coreNodes: [
        {
          id: 'node-harvest-crops',
          name: '🌾 Harvest & Crops',
          icon: '🌾',
          category: 'AGRICULTURE_SCIENCE',
          tagline: 'How human food is born from soil, water, and sunlight',
          provenance: '🔬 Deep Science',
          shortDescription:
            'A harvest is when farmers gather ripe grains (like rice, wheat, sugarcane, and sesame) that took months of sunlight and care to grow.',
          visualMechanism: {
            title: 'The Seed-to-Harvest Growth Chain',
            steps: [
              { icon: '🌱', label: 'Seed in Soil', detail: 'Sprouts roots to drink water & minerals' },
              { icon: '🌿', label: 'Green Leaves', detail: 'Captures sunlight energy (Photosynthesis)' },
              { icon: '🌾', label: 'Golden Grain', detail: 'Stores solar energy as nutritious food' },
              { icon: '👨‍🌾', label: 'Harvest Day', detail: 'Farmers reap the bounty with gratitude' },
            ],
          },
          socraticInquiry: {
            question: 'Why do farming communities celebrate during harvest time rather than during seed planting time?',
            options: [
              'Because months of hard labor have successfully yielded food to feed the community',
              'Because farmers want to stop farming forever',
              'Because crops grow with no water or care',
              'Because planting seeds is too noisy',
            ],
            correctIndex: 0,
            explanation: 'Harvest marks the culmination of months of farming effort, providing food security and abundance.',
          },
          handsOnTask: {
            title: '🍚 Spot 3 Harvest Grains in Your Kitchen',
            instruction: 'Look in your kitchen pantry: find Rice grains, Sesame seeds (Til), or Jaggery (Gur). How are they made?',
            type: 'OBSERVATION',
            rewardBadge: '🌾 Master Harvester',
          },
          deeperCosmicLink: {
            question: 'Where did the energy inside the rice grain originally come from?',
            answer: 'From the SUN! Sunlight traveled 150 million kilometers to power the plant leaves.',
            targetNodeId: 'node-sun-seasons',
          },
          connectedNodeIds: ['node-sun-seasons', 'node-food-nutrition', 'node-community-culture'],
        },

        {
          id: 'node-sun-seasons',
          name: '☀️ Sun & Earth Cycles',
          icon: '☀️',
          category: 'SOLAR_ASTRONOMY',
          tagline: 'Why Sankranthi marks the movement of the Sun (Makar Sankranti)',
          provenance: '🌌 Cosmic System',
          shortDescription:
            'Sankranthi marks the transition of the Sun into the northern celestial hemisphere (Uttarayan), bringing longer, warmer days that ripen winter crops.',
          visualMechanism: {
            title: 'Cosmic Solar Transit & Seasons',
            steps: [
              { icon: '⭐', label: 'Solar Fusion', detail: 'Sun converts hydrogen to pure light energy' },
              { icon: '🌍', label: 'Earth Tilt', detail: 'Earth orbits the Sun creating seasonal shifts' },
              { icon: '☀️', label: 'Uttarayan', detail: 'Sun appears to move northwards; warmer days begin' },
              { icon: '🌱', label: 'Crops Ripen', detail: 'Increased sunlight ripens winter harvest' },
            ],
          },
          socraticInquiry: {
            question: 'How is the astronomical movement of the Sun connected to the food on our plates?',
            options: [
              'Longer sunlight hours provide the thermal and light energy required for crops to mature',
              'The Sun makes food disappear from the earth',
              'Sunlight turns water into solid rock',
              'Astronomy has zero connection to farming',
            ],
            correctIndex: 0,
            explanation: 'Solar irradiance drives photosynthesis, temperature, and crop maturation cycles across Earth.',
          },
          deeperCosmicLink: {
            question: 'Where does the Sun itself get its glowing energy?',
            answer: 'Nuclear fusion at 15 million degrees Celsius in the core of our nearest star!',
            targetNodeId: 'node-harvest-crops',
          },
          connectedNodeIds: ['node-harvest-crops', 'node-kite-wind'],
        },

        {
          id: 'node-muggu-rangoli',
          name: '🎨 Muggu / Rangoli Art',
          icon: '🎨',
          category: 'FOLK_ART_MATH',
          tagline: 'Geometric symmetry, dot grids & welcoming nature',
          provenance: '🎨 Culture & Art',
          shortDescription:
            'Muggu (Rangoli) patterns use mathematical symmetry—connecting matrix dots with curved and straight lines using rice flour to feed tiny ants and welcome guests.',
          visualMechanism: {
            title: 'The Symmetrical Art Matrix',
            steps: [
              { icon: '▫️', label: 'Dot Grid', detail: '4x4 or 8x8 symmetrical coordinate points' },
              { icon: '〰️', label: 'Loop Curves', detail: 'Continuous geometric lines around dots' },
              { icon: '✨', label: 'Radial Symmetry', detail: '4-fold mirror balance in all quadrants' },
              { icon: '🐜', label: 'Nature Harmony', detail: 'Rice powder offers food to birds and ants' },
            ],
          },
          socraticInquiry: {
            question: 'Why is traditional Rangoli made with natural rice flour rather than chemical paint?',
            options: [
              'It provides food for ants and birds, symbolizing harmony between humans and nature',
              'Because rice flour is impossible to wash away',
              'Because paint cannot make straight lines',
              'Because people did not know how to paint',
            ],
            correctIndex: 0,
            explanation: 'Traditional Indian folk art embedded ecological consciousness into daily aesthetic rituals.',
          },
          handsOnTask: {
            title: '✨ Draw a 4x4 Symmetrical Dot Rangoli',
            instruction: 'Place 4 dots in 4 rows. Connect them with symmetrical loops to form a star!',
            type: 'DRAWING',
            rewardBadge: '🎨 Symmetry Artist',
          },
          connectedNodeIds: ['node-community-culture', 'node-harvest-crops'],
        },

        {
          id: 'node-kite-wind',
          name: '🪁 Kites & Aerodynamics',
          icon: '🪁',
          category: 'AGRICULTURE_SCIENCE',
          tagline: 'Lift, wind currents & rooftop community celebration',
          provenance: '🔬 Deep Science',
          shortDescription:
            'Kite flying during Sankranthi celebrates the clear, breezy winter skies. Aerodynamic lift allows lightweight paper and bamboo frames to soar into atmospheric thermals.',
          visualMechanism: {
            title: 'How Kites Soar into the Sky',
            steps: [
              { icon: '🪁', label: 'Angled Surface', detail: 'Kite face tilts against oncoming wind' },
              { icon: '💨', label: 'Aerodynamic Lift', detail: 'High pressure under wing pushes kite upwards' },
              { icon: '🧵', label: 'Tension Line', detail: 'String balances wind force against gravity' },
              { icon: '☀️', label: 'Rooftop Sunshine', detail: 'Families soak in vitamin D under the winter sun' },
            ],
          },
          socraticInquiry: {
            question: 'What physical force counteracts gravity to keep a kite flying high in the air?',
            options: [
              'Aerodynamic lift generated by air pressure pushing under the tilted sail',
              'Magnetic attraction to the clouds',
              'The kite contains engine rocket fuel',
              'The string pulls the clouds down',
            ],
            correctIndex: 0,
            explanation: 'Wind moving faster over the kite creates lift, keeping it suspended against gravity.',
          },
          connectedNodeIds: ['node-sun-seasons', 'node-community-culture'],
        },

        {
          id: 'node-community-culture',
          name: '👥 Community & Gratitude',
          icon: '👥',
          category: 'COMMUNITY_CULTURE',
          tagline: 'Sharing abundance, family reunions & cultural unity',
          provenance: '📖 In Your Textbook',
          shortDescription:
            'Festivals remind us that human survival is collective. Sharing harvest sweets (Pongal, Til-Gud, Pitha) strengthens social bonds across neighbors and generations.',
          visualMechanism: {
            title: 'The Human Celebration Loop',
            steps: [
              { icon: '🌾', label: 'Abundance', detail: 'Granaries filled with winter harvest' },
              { icon: '🍲', label: 'Shared Feasts', detail: 'Cooking fresh harvest grains together' },
              { icon: '🤝', label: 'Gratitude', detail: 'Honoring farmers, cattle, earth & sun' },
              { icon: '🎉', label: 'Cultural Joy', detail: 'Folk songs, dances, and renewed friendships' },
            ],
          },
          socraticInquiry: {
            question: 'What is the deepest social reason human cultures celebrate harvest festivals worldwide?',
            options: [
              'To express shared gratitude for nature’s bounty and strengthen community unity',
              'To force everyone to stay inside alone',
              'To throw away all harvested grain',
              'Because humans dislike sunny weather',
            ],
            correctIndex: 0,
            explanation: 'Harvest celebrations unite communities in collective gratitude for nature and shared survival.',
          },
          connectedNodeIds: ['node-harvest-crops', 'node-muggu-rangoli', 'node-food-nutrition'],
        },
      ],
    },
  };

  public static getUniverse(topicId: string): TopicUniverse {
    return this.universes['c-festivals-india'];
  }
}
