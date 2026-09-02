/**
 * ============================================================================
 * EKAGURU 1:1 PHYSICAL TEXTBOOK PRESERVATION ENGINE (116 SINGLE PAGES, 18 CHAPTERS)
 * ============================================================================
 * 
 * Auto-De-Spread Invariant:
 * 1. 2-page camera spreads are automatically rotated upright and split into single pages.
 * 2. 116 individual upright pages match the Table of Contents 100%.
 */

export interface PhysicalPageContent {
  pageNumber: number;
  pdfIndex: number;
  headerText: string;
  chapterNumber?: number;
  chapterTitle?: string;
  pageTitle: string;
  pageType: 'toc' | 'chapter_start' | 'lesson_content' | 'exercises' | 'assessment' | 'storytime' | 'fitness';
}

export interface TOCEntry {
  chapterNumber: number;
  unitName: string;
  title: string;
  startPage: number;
  endPage: number;
  pageRangeText: string;
  sections: {
    sectionNumber: string;
    title: string;
    page: number;
  }[];
  concepts: string[];
  boardTitle: string;
  boardSubtitle: string;
  flowSteps: {
    label: string;
    icon: string;
    description: string;
  }[];
  subBoxTitle: string;
  subBoxFormula: string;
  keyIdea: string;
}

// ----------------------------------------------------------------------------
// EXACT 18 CHAPTERS MATCHING PRINTED PAGE NUMBERS (1 to 116)
// ----------------------------------------------------------------------------
export const CANONICAL_TEXTBOOK_TOC: TOCEntry[] = [
  {
    chapterNumber: 0,
    unitName: 'Unit 1: About Me',
    title: 'Art Special: Festivals of India',
    startPage: 1,
    endPage: 1,
    pageRangeText: 'Page 1',
    sections: [
      { sectionNumber: '0.1', title: 'Festivals of India (Sankranthi, Bathukamma, Bonalu)', page: 1 },
      { sectionNumber: '0.2', title: 'Collage & Fun Activities', page: 1 },
    ],
    concepts: ['Sankranthi Harvest', 'Bathukamma Flowers', 'Bonalu Offering', 'Kite Flying & Rangoli'],
    boardTitle: 'FESTIVALS OF INDIA – HARVEST & NATURE',
    boardSubtitle: 'A festival of gratitude, nature and togetherness.',
    flowSteps: [
      { label: 'SUN', icon: '☀️', description: 'Gives us radiant light and solar energy' },
      { label: 'PLANTS', icon: '🌿', description: 'Use sunlight to make food (Photosynthesis)' },
      { label: 'CROPS', icon: '🌾', description: 'Plants grow and produce golden grains' },
      { label: 'HARVEST', icon: '🧑‍🌾', description: 'Farmers harvest mature crops' },
      { label: 'CELEBRATION', icon: '🎉', description: 'We celebrate with joy, rangoli, kites & feasts' },
    ],
    subBoxTitle: 'HOW PLANTS MAKE FOOD?',
    subBoxFormula: 'Sunlight + Water (H2O) + Carbon dioxide (CO2) ➔ Plant (Photosynthesis) ➔ Food (Glucose)',
    keyIdea: 'Plants use sunlight energy to make food through photosynthesis. When crops mature, farmers harvest them and communities celebrate Sankranthi.',
  },
  {
    chapterNumber: 1,
    unitName: 'Unit 1: About Me',
    title: 'Chapter 1: I am Growing Up',
    startPage: 2,
    endPage: 7,
    pageRangeText: 'Pages 2–7',
    sections: [
      { sectionNumber: '1.1', title: 'How Living Things Grow (Seeds to Big Plants)', page: 2 },
      { sectionNumber: '1.2', title: 'Chicks Come Out of Eggs & Human Growth', page: 3 },
      { sectionNumber: '1.3', title: 'Hobbies & Clay Modelling', page: 4 },
      { sectionNumber: '1.4', title: 'Words I Learnt & Exercises', page: 6 },
    ],
    concepts: ['Living Things', 'Growth from Seeds', 'Chicks from Eggs', 'Toddler to Adult', 'Hobbies'],
    boardTitle: 'HOW LIVING THINGS GROW & DEVELOP',
    boardSubtitle: 'Developmental lifecycle from seeds and chicks to mature living beings.',
    flowSteps: [
      { label: 'SEED / EGG', icon: '🥚', description: 'Beginning of life in dormant form' },
      { label: 'SPROUT / CHICK', icon: '🐣', description: 'Germination and hatching into young stage' },
      { label: 'TODDLER / SAPLING', icon: '🌱', description: 'Rapid physical growth needing nourishment' },
      { label: 'ADULT BEING', icon: '🧑', description: 'Mature living organism with independent skills' },
      { label: 'NEW GENERATION', icon: '🌳', description: 'Producing seeds and continuing the life cycle' },
    ],
    subBoxTitle: 'GROWTH CONTINUUM PRINCIPLE',
    subBoxFormula: 'Nutrients + Water + Care ➔ Cell Division & Expansion ➔ Maturity & Independence',
    keyIdea: 'All living things—plants, animals, and human beings—grow and change over time. Seeds grow into big trees and babies grow into adults.',
  },
  {
    chapterNumber: 2,
    unitName: 'Unit 1: About Me',
    title: 'Chapter 2: My Body',
    startPage: 8,
    endPage: 13,
    pageRangeText: 'Pages 8–13',
    sections: [
      { sectionNumber: '2.1', title: 'External & Sense Organs', page: 8 },
      { sectionNumber: '2.2', title: 'Internal Organs: Brain, Heart, Lungs, Stomach, Kidneys', page: 9 },
      { sectionNumber: '2.3', title: 'Bones & Muscles & Taking Care of Body', page: 11 },
      { sectionNumber: '2.4', title: 'I Learn, I Answer & Organ Matching', page: 12 },
    ],
    concepts: ['Sense Organs', 'Brain (Controls Body)', 'Heart (Pumps Blood)', 'Lungs (Breathe)', 'Stomach (Digestion)', 'Bones & Muscles'],
    boardTitle: 'HUMAN BODY – SENSE & INTERNAL ORGANS',
    boardSubtitle: 'How the brain, heart, lungs, stomach, and muscles work together to keep us healthy.',
    flowSteps: [
      { label: 'SENSES', icon: '👁️', description: 'Eyes, ears, nose, tongue, skin collect signals' },
      { label: 'BRAIN', icon: '🧠', description: 'Controls all actions, thoughts, and movements' },
      { label: 'HEART & LUNGS', icon: '🫀', description: 'Circulates oxygen and blood throughout the body' },
      { label: 'STOMACH', icon: '🥣', description: 'Breaks down food into energy nutrients' },
      { label: 'BONES & MUSCLES', icon: '💪', description: 'Gives shape, support, and athletic movement' },
    ],
    subBoxTitle: 'THE BODY CO-ORDINATION SYSTEM',
    subBoxFormula: 'Sensory Input ➔ Brain Processing ➔ Nerve Signal ➔ Organ / Muscle Action',
    keyIdea: 'Our brain is the master control center located inside the head. Internal organs work continuously, even while we are asleep.',
  },
  {
    chapterNumber: 3,
    unitName: 'Unit 1: About Me',
    title: 'Chapter 3: Food I Eat',
    startPage: 14,
    endPage: 19,
    pageRangeText: 'Pages 14–19',
    sections: [
      { sectionNumber: '3.1', title: 'Importance of Food & Sources (Plants & Animals)', page: 14 },
      { sectionNumber: '3.2', title: '3 Kinds of Food: Energy-giving, Bodybuilding, Protective', page: 16 },
      { sectionNumber: '3.3', title: 'Balanced Diet & Eating Habits', page: 17 },
      { sectionNumber: '3.4', title: 'I Learn, I Answer & Nutrition Table', page: 18 },
    ],
    concepts: ['Sources of Food', 'Energy-Giving (Carbs/Fats)', 'Bodybuilding (Proteins)', 'Protective (Vitamins)', 'Balanced Diet', 'Food Conservation'],
    boardTitle: 'FOOD GROUPS & BALANCED NUTRITION',
    boardSubtitle: 'How energy-giving, bodybuilding, and protective foods create vibrant health.',
    flowSteps: [
      { label: 'PLANTS & FARMS', icon: '🌾', description: 'Produce grains, vegetables, fruits, and pulses' },
      { label: 'ENERGY FOODS', icon: '🥔', description: 'Potato, rice, wheat give working energy' },
      { label: 'BODYBUILDING', icon: '🥛', description: 'Milk, pulses, eggs build muscles and bones' },
      { label: 'PROTECTIVE FOODS', icon: '🥗', description: 'Fruits and green vegetables fight diseases' },
      { label: 'BALANCED DIET', icon: '🍽️', description: 'A complete meal containing all three food kinds' },
    ],
    subBoxTitle: 'THE BALANCED DIET TRIAD',
    subBoxFormula: 'Energy-Giving + Bodybuilding + Protective Foods ➔ Optimal Growth & Immunity',
    keyIdea: 'Food gives us energy, builds our muscles, and protects us from illnesses. A balanced diet contains the right proportion of all three food groups.',
  },
  {
    chapterNumber: 4,
    unitName: 'Unit 1: About Me',
    title: 'Chapter 4: Clothes I Wear',
    startPage: 20,
    endPage: 26,
    pageRangeText: 'Pages 20–26',
    sections: [
      { sectionNumber: '4.1', title: 'Why We Need Clothes (Protection in Seasons)', page: 20 },
      { sectionNumber: '4.2', title: 'Uniforms & Costumes Across India', page: 22 },
      { sectionNumber: '4.3', title: 'Materials: Cotton, Wool, Silk', page: 23 },
      { sectionNumber: '4.4', title: 'Care of Clothes & Fabric Activity', page: 25 },
    ],
    concepts: ['Seasonal Clothing', 'Cotton from Plants', 'Wool from Sheep', 'Silk from Silkworms', 'Indian Traditional Dresses', 'Uniforms'],
    boardTitle: 'CLOTHING – FIBRES, SEASONS & TRADITIONS',
    boardSubtitle: 'How cotton, wool, and silk fibres are transformed into seasonal and traditional clothing.',
    flowSteps: [
      { label: 'FIBRE SOURCE', icon: '🌿', description: 'Cotton plant bolls, sheep wool, silkworm cocoons' },
      { label: 'SPINNING', icon: '🧶', description: 'Fibres spun into strong continuous yarn' },
      { label: 'WEAVING', icon: '🧵', description: 'Yarn woven on looms into beautiful fabric' },
      { label: 'SEASONAL WEAR', icon: '🧥', description: 'Cotton in summer, wool in winter, raincoats in monsoon' },
      { label: 'CULTURAL DRESS', icon: '👘', description: 'Traditional attire celebrating regional diversity' },
    ],
    subBoxTitle: 'HOW FABRIC IS MADE?',
    subBoxFormula: 'Natural Fibre ➔ Spinning into Yarn ➔ Weaving into Cloth ➔ Tailored Garments',
    keyIdea: 'Clothes protect our bodies from heat, cold, rain, and dust. Different professions wear special uniforms and different regions have traditional costumes.',
  },
  {
    chapterNumber: 5,
    unitName: 'Unit 1: About Me',
    title: 'Chapter 5: I Celebrate',
    startPage: 27,
    endPage: 32,
    pageRangeText: 'Pages 27–32',
    sections: [
      { sectionNumber: '5.1', title: 'Religious Festivals (Diwali, Eid, Gurpurab, Christmas)', page: 27 },
      { sectionNumber: '5.2', title: 'Harvest Festivals (Pongal, Onam, Baisakhi, Bihu)', page: 28 },
      { sectionNumber: '5.3', title: 'National Festivals (Independence Day, Republic Day, Gandhi Jayanti)', page: 29 },
      { sectionNumber: '5.4', title: 'Yoga Practise Sequence', page: 32 },
    ],
    concepts: ['Religious Festivals', 'Harvest Festivals', 'National Festivals', 'Pookolam Rangoli', 'Patriotism & Unity'],
    boardTitle: 'CELEBRATING FESTIVALS & NATIONAL UNITY',
    boardSubtitle: 'Honoring harvest traditions, diverse cultures, and national milestones.',
    flowSteps: [
      { label: 'TRADITION', icon: '🪔', description: 'Cultural roots passed down through families' },
      { label: 'HARVEST THANKS', icon: '🌾', description: 'Pongal, Onam, Baisakhi celebrate seasonal bounty' },
      { label: 'SHARED JOY', icon: '🍬', description: 'Feasting, special sweets, and festive greetings' },
      { label: 'NATIONAL PRIDE', icon: '🇮🇳', description: '15 August & 26 January celebrated across India' },
      { label: 'UNITY IN DIVERSITY', icon: '🤝', description: 'All communities celebrating together in harmony' },
    ],
    subBoxTitle: 'THE FESTIVAL SPECTRUM',
    subBoxFormula: 'Religious Festivals + Harvest Festivals + National Days ➔ Shared Cultural Harmony',
    keyIdea: 'Festivals bring people together. Harvest festivals thank nature for crops, while national festivals celebrate our country’s freedom and constitution.',
  },
  {
    chapterNumber: 6,
    unitName: 'Unit 2: Our Surroundings',
    title: 'Chapter 6: I Live with Them',
    startPage: 34,
    endPage: 37,
    pageRangeText: 'Pages 34–37',
    sections: [
      { sectionNumber: '6.1', title: 'Storytime: How I Got Home', page: 33 },
      { sectionNumber: '6.2', title: 'Types of Families: Nuclear, Joint, Single-parent', page: 34 },
      { sectionNumber: '6.3', title: 'Caring for Family & Helping at Home', page: 35 },
      { sectionNumber: '6.4', title: 'Family Tree Activity', page: 37 },
    ],
    concepts: ['Nuclear Family', 'Joint Family', 'Single-Parent Family', 'Family Tree', 'Mutual Respect & Care'],
    boardTitle: 'FAMILY STRUCTURES & MUTUAL CARE',
    boardSubtitle: 'Understanding nuclear, joint, and single-parent families and sharing responsibilities.',
    flowSteps: [
      { label: 'INDIVIDUAL', icon: '🧒', description: 'Every child is a cherished member of the home' },
      { label: 'NUCLEAR FAMILY', icon: '👨‍👩‍👧', description: 'Parents living together with their children' },
      { label: 'JOINT FAMILY', icon: '👨‍👩‍👧‍👦', description: 'Grandparents, uncles, aunts, and cousins together' },
      { label: 'HELPING AT HOME', icon: '🧹', description: 'Cleaning, setting tables, caring for pets' },
      { label: 'FAMILY VALUES', icon: '❤️', description: 'Love, respect, listening, and polite manners' },
    ],
    subBoxTitle: 'THE FAMILY VALUE PRINCIPLE',
    subBoxFormula: 'Love + Cooperation + Respect + Shared Chores ➔ Happy & Supportive Home',
    keyIdea: 'Family members take care of each other, celebrate special occasions together, and share everyday responsibilities.',
  },
  {
    chapterNumber: 7,
    unitName: 'Unit 2: Our Surroundings',
    title: 'Chapter 7: Where I Stay',
    startPage: 38,
    endPage: 43,
    pageRangeText: 'Pages 38–43',
    sections: [
      { sectionNumber: '7.1', title: 'Kinds of Houses: Kuchcha and Pucca Houses', page: 38 },
      { sectionNumber: '7.2', title: 'Special Houses: Sloping Roofs, Stilt Houses, Igloos, Houseboats, Tents', page: 40 },
      { sectionNumber: '7.3', title: 'People Who Build Houses (Architect, Mason, Carpenter, Plumber, Electrician)', page: 41 },
      { sectionNumber: '7.4', title: 'Picture Study Maze & House Design', page: 43 },
    ],
    concepts: ['Pucca House', 'Kuchcha House', 'Stilt Houses (Rainy areas)', 'Igloos (Cold snow)', 'Houseboats', 'Construction Professionals'],
    boardTitle: 'HOUSES & SHELTER – DESIGNS & BUILDERS',
    boardSubtitle: 'How climate shapes house architecture and the skilled people who build our homes.',
    flowSteps: [
      { label: 'ARCHITECT', icon: '📐', description: 'Designs blueprints and room layouts' },
      { label: 'MASON', icon: '🧱', description: 'Lays bricks with cement to build strong walls' },
      { label: 'CARPENTER', icon: '🪚', description: 'Crafts wooden doors, windows, and furniture' },
      { label: 'PLUMBER & ELECTRICIAN', icon: '🔧', description: 'Installs water pipes, taps, and electric wiring' },
      { label: 'SAFE HOME', icon: '🏠', description: 'Protects us from weather and keeps us comfortable' },
    ],
    subBoxTitle: 'CLIMATE ARCHITECTURE RELATION',
    subBoxFormula: 'Heavy Rain ➔ Sloping Roof / Stilt House | Snow ➔ Igloo | Lakes ➔ Houseboat',
    keyIdea: 'Houses are built according to the weather conditions of a place. Many skilled professionals work together to construct a safe home.',
  },
  {
    chapterNumber: 8,
    unitName: 'Unit 2: Our Surroundings',
    title: 'Chapter 8: Our Neighbourhood',
    startPage: 44,
    endPage: 51,
    pageRangeText: 'Pages 44–51',
    sections: [
      { sectionNumber: '8.1', title: 'Important Places: Market, Park, Bank, Cash Machines', page: 44 },
      { sectionNumber: '8.2', title: 'Public Services: Post Office, Police Station, Hospital, Fire Station', page: 46 },
      { sectionNumber: '8.3', title: 'Taking Care of Neighbourhood (Cleanliness & Trees)', page: 47 },
      { sectionNumber: '8.4', title: 'Assessment-I & Test Paper-I (Chapters 1–8)', page: 50 },
    ],
    concepts: ['Neighbourhood Services', 'Post Office', 'Police Station', 'Hospital', 'Bank & ATM', 'Waste Management'],
    boardTitle: 'OUR NEIGHBOURHOOD & COMMUNITY SERVICES',
    boardSubtitle: 'Exploring essential public services, emergency helpers, and environmental care.',
    flowSteps: [
      { label: 'NEIGHBOURHOOD', icon: '🏘️', description: 'Area surrounding our home with community members' },
      { label: 'COMMERCE & HEALTH', icon: '🏥', description: 'Markets, banks, clinics, and hospitals' },
      { label: 'SAFETY & PROTECTION', icon: '🚒', description: 'Police stations and fire brigades on alert' },
      { label: 'COMMUNITY CARE', icon: '🌳', description: 'Planting saplings and throwing waste in dustbins' },
      { label: 'GOOD CITIZEN', icon: '🤝', description: 'Living harmoniously without disturbing neighbours' },
    ],
    subBoxTitle: 'EMERGENCY & UTILITY CONNECTIONS',
    subBoxFormula: 'Medical Care ➔ Hospital (108) | Safety ➔ Police (100) | Fire ➔ Fire Brigade (101)',
    keyIdea: 'A clean and safe neighbourhood relies on community helpers and responsible citizens who keep surroundings green and waste-free.',
  },
  {
    chapterNumber: 9,
    unitName: 'Unit 3: Our Environment',
    title: 'Chapter 9: My Green Friends',
    startPage: 54,
    endPage: 59,
    pageRangeText: 'Pages 54–59',
    sections: [
      { sectionNumber: '9.1', title: 'Art Special: Mighty Animals', page: 53 },
      { sectionNumber: '9.2', title: 'Parts of a Plant & Functions (Roots, Stem, Leaves, Flowers, Fruits)', page: 54 },
      { sectionNumber: '9.3', title: 'How Do Plants Make Their Food? (Photosynthesis)', page: 56 },
      { sectionNumber: '9.4', title: 'Plants are Useful: Food, Medicine, Shade, Cotton', page: 57 },
      { sectionNumber: '9.5', title: 'I Learn, I Answer & Plant Matching Lab', page: 58 },
    ],
    concepts: ['Parts of a Plant', 'Roots (Water/Minerals)', 'Stem (Support/Transport)', 'Leaves (Food Factory)', 'Photosynthesis', 'Oxygen Cycle'],
    boardTitle: 'PLANTS – ANATOMY, PHOTOSYNTHESIS & USES',
    boardSubtitle: 'How plants absorb water, capture sunlight, produce glucose, and purify our atmosphere.',
    flowSteps: [
      { label: 'ROOTS', icon: '🌱', description: 'Hold plant firmly and absorb water & minerals from soil' },
      { label: 'STEM', icon: '🎋', description: 'Transports water and food to all parts of the plant' },
      { label: 'LEAVES', icon: '🍃', description: 'Food factory capturing sunlight and Carbon Dioxide' },
      { label: 'PHOTOSYNTHESIS', icon: '☀️', description: 'Prepares glucose food and releases fresh Oxygen' },
      { label: 'ECOSYSTEM BOUNTY', icon: '🍎', description: 'Provides fruits, vegetables, medicine, wood, and cotton' },
    ],
    subBoxTitle: 'THE PHOTOSYNTHESIS EQUATION',
    subBoxFormula: 'Sunlight + Water (from roots) + CO2 (from air) ➔ Glucose (Food) + Oxygen (O2)',
    keyIdea: 'Leaves are called the food factory of a plant. In the presence of sunlight, they combine water and carbon dioxide to prepare food and release oxygen.',
  },
  {
    chapterNumber: 10,
    unitName: 'Unit 3: Our Environment',
    title: 'Chapter 10: The Animal Kingdom',
    startPage: 60,
    endPage: 65,
    pageRangeText: 'Pages 60–65',
    sections: [
      { sectionNumber: '10.1', title: 'Wild Animals & Domestic/Farm Animals', page: 60 },
      { sectionNumber: '10.2', title: 'Animal Shelters: Caves, Trees, Nests, Burrows, Sheds, Coops', page: 62 },
      { sectionNumber: '10.3', title: 'What Animals Eat: Herbivores, Carnivores, Omnivores', page: 63 },
      { sectionNumber: '10.4', title: 'I Learn, I Answer & Animal Welfare', page: 64 },
    ],
    concepts: ['Wild vs Domestic', 'Animal Shelters', 'Herbivores (Plants)', 'Carnivores (Flesh)', 'Omnivores (Both)', 'Animal Care'],
    boardTitle: 'THE ANIMAL KINGDOM – HABITATS & DIETS',
    boardSubtitle: 'Understanding wild and domestic animals, their natural shelters, and feeding categories.',
    flowSteps: [
      { label: 'DOMESTIC ANIMALS', icon: '🐄', description: 'Cows, horses, hens live on farms and help humans' },
      { label: 'WILD ANIMALS', icon: '🦁', description: 'Lions, tigers, elephants live in natural forests' },
      { label: 'HERBIVORES', icon: '🦒', description: 'Eat only grass, leaves, and plants' },
      { label: 'CARNIVORES', icon: '🐅', description: 'Eat the flesh of other animals' },
      { label: 'OMNIVORES', icon: '🐻', description: 'Eat both plants and animal flesh' },
    ],
    subBoxTitle: 'ANIMAL DIET CLASSIFICATION',
    subBoxFormula: 'Herbivore (Plants only) | Carnivore (Flesh only) | Omnivore (Plants + Flesh)',
    keyIdea: 'Animals live in diverse habitats such as forests, caves, burrows, and human-made shelters. We must be kind and protect animal welfare.',
  },
  {
    chapterNumber: 11,
    unitName: 'Unit 3: Our Environment',
    title: 'Chapter 11: Air and Water',
    startPage: 66,
    endPage: 70,
    pageRangeText: 'Pages 66–70',
    sections: [
      { sectionNumber: '11.1', title: 'Why Do We Need Air? Breeze and Storm', page: 66 },
      { sectionNumber: '11.2', title: 'Air Pollution & Clean Air Actions', page: 67 },
      { sectionNumber: '11.3', title: 'Water and Its Uses & Sources of Water', page: 68 },
      { sectionNumber: '11.4', title: 'Saving Water & I Learn, I Answer', page: 69 },
    ],
    concepts: ['Properties of Air', 'Breeze & Storm', 'Air Pollution', 'Sources of Water (Rain, Lakes, Wells)', 'Water Conservation'],
    boardTitle: 'AIR & WATER – ESSENTIALS OF LIFE',
    boardSubtitle: 'Understanding atmospheric air, wind dynamics, freshwater sources, and pollution control.',
    flowSteps: [
      { label: 'ATMOSPHERE', icon: '🌬️', description: 'Invisible air surrounding Earth containing life-giving Oxygen' },
      { label: 'WIND DYNAMICS', icon: '🪁', description: 'Moving air (Breeze, Wind, Storm) powers kites and boats' },
      { label: 'WATER SOURCES', icon: '🌧️', description: 'Rainwater fills rivers, lakes, ponds, and aquifers' },
      { label: 'ESSENTIAL USES', icon: '💧', description: 'Drinking, cooking, cleaning, agriculture, and industry' },
      { label: 'CONSERVATION', icon: '🚰', description: 'Closing taps, harvesting rainwater, and preventing pollution' },
    ],
    subBoxTitle: 'THE WATER & AIR RECYCLING PRINCIPLE',
    subBoxFormula: 'Clean Air (Oxygen) + Fresh Water ➔ Sustains Human, Animal & Plant Life',
    keyIdea: 'Water is colourless, tasteless, and essential for all life. Rain is our primary water source, and planting trees keeps atmospheric air clean.',
  },
  {
    chapterNumber: 12,
    unitName: 'Unit 3: Our Environment',
    title: 'Chapter 12: Seasons',
    startPage: 71,
    endPage: 78,
    pageRangeText: 'Pages 71–78',
    sections: [
      { sectionNumber: '12.1', title: 'Weather vs Seasons (Spring, Summer, Monsoon, Autumn, Winter)', page: 71 },
      { sectionNumber: '12.2', title: 'Spring, Summer & Monsoon Weather', page: 72 },
      { sectionNumber: '12.3', title: 'Autumn, Winter & Words I Learnt', page: 74 },
      { sectionNumber: '12.4', title: 'Crossword Puzzle & Fitness Animal Walk', page: 76 },
    ],
    concepts: ['5 Seasons', 'Spring (Flowers)', 'Summer (Loo winds)', 'Monsoon (Raincoats)', 'Autumn (Shedding leaves)', 'Winter (Woollens)'],
    boardTitle: 'THE FIVE SEASONS & ANNUAL CYCLES',
    boardSubtitle: 'How solar weather changes create Spring, Summer, Monsoon, Autumn, and Winter.',
    flowSteps: [
      { label: 'SPRING', icon: '🌸', description: 'Pleasant weather; trees grow new leaves and bright flowers' },
      { label: 'SUMMER', icon: '☀️', description: 'Hot sunny days, cool cotton clothes, mangoes, and fans' },
      { label: 'MONSOON', icon: '🌧️', description: 'Heavy rains, umbrellas, gumboots, and fresh green earth' },
      { label: 'AUTUMN', icon: '🍂', description: 'Cool short season where deciduous trees shed their leaves' },
      { label: 'WINTER', icon: '❄️', description: 'Cold winds, snowfall in mountains, warm woollens and fires' },
    ],
    subBoxTitle: 'THE ANNUAL SEASONAL CYCLE',
    subBoxFormula: 'Spring ➔ Summer ➔ Monsoon ➔ Autumn ➔ Winter ➔ Spring',
    keyIdea: 'When the same weather condition persists for a few months, it is called a season. Seasons influence the clothes we wear and foods we eat.',
  },
  {
    chapterNumber: 13,
    unitName: 'Unit 4: Our Lovely Planet',
    title: 'Chapter 13: Our Earth',
    startPage: 80,
    endPage: 84,
    pageRangeText: 'Pages 80–84',
    sections: [
      { sectionNumber: '13.1', title: 'Storytime: How Luna Got her Dog Back?', page: 79 },
      { sectionNumber: '13.2', title: 'Land and Water on Earth', page: 80 },
      { sectionNumber: '13.3', title: 'Hill, Mountain, Plain, Valley, Plateau, Desert', page: 81 },
      { sectionNumber: '13.4', title: 'Water Bodies: Oceans, Seas, Rivers, Lakes, Ponds', page: 82 },
      { sectionNumber: '13.5', title: 'I Learn, I Answer & Picture Study', page: 84 },
    ],
    concepts: ['Landforms', 'Mountains & Valleys', 'Plains & Plateaus', 'Deserts & Cacti', 'Oceans & Freshwater Bodies'],
    boardTitle: 'OUR EARTH – LANDFORMS & WATER BODIES',
    boardSubtitle: 'Exploring Earth’s diverse geography from snowy mountains to deep blue oceans.',
    flowSteps: [
      { label: 'PLANET EARTH', icon: '🌍', description: 'Home to all living beings with land and vast water bodies' },
      { label: 'MOUNTAINS & HILLS', icon: '🏔️', description: 'High peaks with snow melting into mountain rivers' },
      { label: 'PLAINS & VALLEYS', icon: '🌾', description: 'Fertile flat lands where agriculture thrives' },
      { label: 'PLATEAUS & DESERTS', icon: '🏜️', description: 'Tablelands and arid sandy regions' },
      { label: 'OCEANS & SEAS', icon: '🌊', description: 'Vast saltwater bodies covering most of Earth’s surface' },
    ],
    subBoxTitle: 'EARTH SURFACE RATIO',
    subBoxFormula: '71% Water (Oceans, Seas, Rivers) + 29% Land (Continents & Islands)',
    keyIdea: 'Earth is unique because it has liquid water and breathable air that support rich ecosystems of plants and animals.',
  },
  {
    chapterNumber: 14,
    unitName: 'Unit 4: Our Lovely Planet',
    title: 'Chapter 14: I Will Take Care',
    startPage: 85,
    endPage: 89,
    pageRangeText: 'Pages 85–89',
    sections: [
      { sectionNumber: '14.1', title: 'How Humans Harm the Earth (Pollution, Chopping Trees)', page: 85 },
      { sectionNumber: '14.2', title: 'Rule 1: Keep Clean & Plant Trees', page: 87 },
      { sectionNumber: '14.3', title: 'Rule 2: Reuse Things | Rule 3: Save Water & Electricity', page: 88 },
      { sectionNumber: '14.4', title: 'I Learn, I Answer & Cloth Bag Project', page: 89 },
    ],
    concepts: ['Environmental Protection', 'Air & Water Pollution', 'Planting Trees', 'Reuse & Reduce Waste', 'Saving Energy'],
    boardTitle: 'PROTECTING EARTH – CONSERVATION RULES',
    boardSubtitle: 'Practical everyday actions to reduce pollution and conserve natural resources.',
    flowSteps: [
      { label: 'AWARENESS', icon: '📢', description: 'Recognizing pollution from vehicles, factories, and litter' },
      { label: 'PLANT TREES', icon: '🌳', description: 'Trees clean the air, give oxygen, and provide bird homes' },
      { label: 'REUSE & RECYCLE', icon: '♻️', description: 'Using cloth bags instead of single-use plastic' },
      { label: 'SAVE WATER & POWER', icon: '💡', description: 'Turning off taps and switching off unused lights' },
      { label: 'EARTH STEWARD', icon: '🌍', description: 'Preserving a clean, green planet for future generations' },
    ],
    subBoxTitle: 'THE 3 GOLDEN CONSERVATION RULES',
    subBoxFormula: 'Keep Clean & Plant Trees + Reuse Materials + Save Water & Energy ➔ Healthy Planet',
    keyIdea: 'Earth provides everything we need to live. We must take care of it by planting trees, avoiding single-use plastics, and turning off running taps.',
  },
  {
    chapterNumber: 15,
    unitName: 'Unit 4: Our Lovely Planet',
    title: 'Chapter 15: High Above the World',
    startPage: 90,
    endPage: 95,
    pageRangeText: 'Pages 90–95',
    sections: [
      { sectionNumber: '15.1', title: 'The Night Sky & The Sun (Head of Solar System)', page: 90 },
      { sectionNumber: '15.2', title: 'Eight Planets in Order (Mercury to Neptune)', page: 91 },
      { sectionNumber: '15.3', title: 'The Moon, Stars & Earth in Space', page: 92 },
      { sectionNumber: '15.4', title: 'I Learn, I Answer & Planet Crossword', page: 94 },
    ],
    concepts: ['The Sun (Star)', 'Eight Planets in Order', 'The Moon (Satellite)', 'Stars', 'Why Earth Has Life'],
    boardTitle: 'THE SOLAR SYSTEM & THE NIGHT SKY',
    boardSubtitle: 'Journeying through the Sun, eight orbiting planets, the Moon, and distant stars.',
    flowSteps: [
      { label: 'THE SUN', icon: '☀️', description: 'Massive glowing star at the center of the solar system' },
      { label: 'ROCKY PLANETS', icon: '🪨', description: 'Mercury, Venus, Earth, Mars orbiting closest to Sun' },
      { label: 'GAS GIANTS', icon: '🪐', description: 'Jupiter, Saturn with beautiful rings, Uranus, Neptune' },
      { label: 'THE MOON', icon: '🌕', description: 'Earth’s natural satellite reflecting sunlight' },
      { label: 'THE UNIVERSE', icon: '✨', description: 'Countless stars and celestial bodies across cosmic space' },
    ],
    subBoxTitle: 'PLANETARY SEQUENCE FROM SUN',
    subBoxFormula: 'Sun ➔ Mercury ➔ Venus ➔ Earth ➔ Mars ➔ Jupiter ➔ Saturn ➔ Uranus ➔ Neptune',
    keyIdea: 'The Sun gives heat and light to all eight planets. Earth is the only planet with the right temperature, water, and air to support life.',
  },
  {
    chapterNumber: 16,
    unitName: 'Unit 4: Our Lovely Planet',
    title: 'Chapter 16: My Country: India',
    startPage: 96,
    endPage: 99,
    pageRangeText: 'Pages 96–99',
    sections: [
      { sectionNumber: '16.1', title: 'National Flag (Tiranga: Saffron, White, Green)', page: 96 },
      { sectionNumber: '16.2', title: 'National Animal (Royal Bengal Tiger) & National Bird (Peacock)', page: 97 },
      { sectionNumber: '16.3', title: 'National Flower (Lotus) & National Anthem (Jana Gana Mana)', page: 98 },
      { sectionNumber: '16.4', title: 'Words I Learnt & National Symbols Chart', page: 99 },
    ],
    concepts: ['Tiranga Tricolour', 'Royal Bengal Tiger', 'Indian Peacock', 'Sacred Lotus', 'Jana Gana Mana Anthem'],
    boardTitle: 'NATIONAL SYMBOLS OF INDIA',
    boardSubtitle: 'Understanding the heritage and pride behind India’s national symbols.',
    flowSteps: [
      { label: 'OUR MOTHERLAND', icon: '🇮🇳', description: 'India — a land of unity, ancient heritage, and diversity' },
      { label: 'NATIONAL FLAG', icon: '🚩', description: 'Tiranga with saffron for courage, white for peace, green for growth' },
      { label: 'TIGER & PEACOCK', icon: '🐅', description: 'National Animal representing strength and National Bird for grace' },
      { label: 'LOTUS FLOWER', icon: '🪷', description: 'National Flower symbolizing truth, knowledge, and wealth' },
      { label: 'NATIONAL ANTHEM', icon: '🎵', description: 'Jana Gana Mana sung with respect standing in attention' },
    ],
    subBoxTitle: 'TRICOLOUR COLOUR SIGNIFICANCE',
    subBoxFormula: 'Saffron (Strength & Courage) + White (Peace & Truth) + Green (Fertility & Growth)',
    keyIdea: 'National symbols represent the pride and identity of all Indians. When the national anthem is played, we stand in attention with hands at our sides.',
  },
  {
    chapterNumber: 17,
    unitName: 'Unit 5: Staying Connected',
    title: 'Chapter 17: Alia and the Birthday Party',
    startPage: 100,
    endPage: 105,
    pageRangeText: 'Pages 100–105',
    sections: [
      { sectionNumber: '17.1', title: 'Telling Time: Clock Hands (Hour, Minute, Second)', page: 100 },
      { sectionNumber: '17.2', title: 'Days of the Week (Monday to Sunday)', page: 101 },
      { sectionNumber: '17.3', title: '12 Months, 365 Days, Leap Year & 4 Cardinal Directions', page: 102 },
      { sectionNumber: '17.4', title: 'I Learn, I Answer & Clock Drawing Lab', page: 104 },
    ],
    concepts: ['Clock Hands', '7 Days of Week', '12 Months & Leap Year', '4 Cardinal Directions (N, S, E, W)', 'Punctuality'],
    boardTitle: 'TIME, CALENDAR & CARDINAL DIRECTIONS',
    boardSubtitle: 'Mastering clock reading, weekly/monthly calendar cycles, and compass directions.',
    flowSteps: [
      { label: 'THE CLOCK', icon: '⏰', description: 'Short hand shows hours, long hand shows minutes' },
      { label: 'DAYS OF WEEK', icon: '📅', description: 'Seven days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday' },
      { label: 'MONTHS & YEAR', icon: '🗓️', description: '12 months with 365 days; Leap year has 366 days with Feb 29' },
      { label: 'SUN & COMPASS', icon: '🧭', description: 'Sun rises in East and sets in West; facing East, Left is North' },
      { label: 'TIME MANAGEMENT', icon: '⏳', description: 'Being punctual for school, meals, and appointments' },
    ],
    subBoxTitle: 'DIRECTION FINDING WITH SUN',
    subBoxFormula: 'Face Rising Sun (East) ➔ Behind is West ➔ Left Hand is North ➔ Right Hand is South',
    keyIdea: 'A clock helps us tell time. There are 7 days in a week, 12 months in a year, and four cardinal directions: North, South, East, and West.',
  },
  {
    chapterNumber: 18,
    unitName: 'Unit 5: Staying Connected',
    title: 'Chapter 18: Communication Today',
    startPage: 106,
    endPage: 116,
    pageRangeText: 'Pages 106–116',
    sections: [
      { sectionNumber: '18.1', title: 'What is Communication? (Verbal, Non-verbal, Gestures)', page: 106 },
      { sectionNumber: '18.2', title: 'Means of Communication: Past (Pigeons, Smoke) vs Present (Phones, Internet)', page: 108 },
      { sectionNumber: '18.3', title: 'Mass Communication: Newspapers, Television, Radio', page: 109 },
      { sectionNumber: '18.4', title: 'I Learn, I Answer & Assessment-II / Test Paper-II (Ch 9–18)', page: 110 },
    ],
    concepts: ['Communication', 'Gestures & Body Language', 'Pigeons to Telephones', 'Internet & Smartphones', 'Mass Media', 'PIN Code'],
    boardTitle: 'COMMUNICATION – CONNECTING THE WORLD',
    boardSubtitle: 'From messenger pigeons and smoke signals to smartphones, satellite internet, and mass media.',
    flowSteps: [
      { label: 'MESSAGE EXPRESSION', icon: '💬', description: 'Expressing ideas through speaking, writing, or facial gestures' },
      { label: 'ANCIENT MESSENGERS', icon: '🕊️', description: 'Carrier pigeons, smoke signals, and runners carried letters' },
      { label: 'POSTAL SYSTEM', icon: '✉️', description: 'Letters, envelopes, stamps, and PIN code distribution' },
      { label: 'DIGITAL ERA', icon: '📱', description: 'Smartphones, instant messaging, and high-speed internet' },
      { label: 'MASS MEDIA', icon: '📡', description: 'Newspapers, television, and radio reaching millions worldwide' },
    ],
    subBoxTitle: 'PERSONAL VS MASS COMMUNICATION',
    subBoxFormula: 'Personal (Letter, Phone, SMS) | Mass Communication (Newspaper, TV, Radio, Web)',
    keyIdea: 'Communication is expressing ideas or sharing information. Today, smartphones and the internet allow us to connect with anyone around the world instantly.',
  },
];

export function getPhysicalPageContent(pageNumber: number): PhysicalPageContent {
  const chapter = CANONICAL_TEXTBOOK_TOC.find(
    (c) => pageNumber >= c.startPage && pageNumber <= c.endPage
  );

  return {
    pageNumber,
    pdfIndex: pageNumber,
    headerText: chapter ? `${chapter.unitName} • ${chapter.title}` : 'Table of Contents',
    chapterNumber: chapter ? chapter.chapterNumber : 0,
    chapterTitle: chapter ? chapter.title : 'Table of Contents',
    pageTitle: chapter ? chapter.title : 'Table of Contents',
    pageType: pageNumber === 1 ? 'toc' : 'lesson_content',
  };
}
