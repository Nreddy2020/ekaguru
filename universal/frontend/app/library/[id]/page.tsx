'use client';

import React, { useState, useEffect } from 'react';
import {
  LearningShell,
  LearningLeftRail,
  LearningHeader,
  LearningTabs,
  LearningBottomNav,
  LearningOriginalBookViewer,
  LearningExplanationPanel,
  LearningBookStructure,
  LearningRightRail,
} from '@/components/learning';

const fallbackManifest = {
  "schemaVersion": "6.0",
  "material": {
    "id": "f309dd23-dc84-4dfa-8a4c-94d0e0e09049",
    "sha256": "db336cc2b3bfc1b30e3f1caab4210115061c77e03dcc15c1995fca97d2f0d759",
    "bookTitle": "MY BODY & LIVING WORLD (EVS Class 5)",
    "subject": "Environmental Studies",
    "grade": "Grade 5",
    "physicalPdfPages": 59,
    "totalSourcePages": 116,
    "logicalPrintedPages": 116,
    "totalUnits": 5,
    "totalChapters": 18
  },
  "sourceSequence": [
    {
      "sourceId": "src-0001",
      "sequenceIndex": 1,
      "physical": {
        "pdfPage": 1,
        "region": "full",
        "rotation": 0,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 1,
          "height": 1
        }
      },
      "printed": {
        "number": 1,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "index"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-toc",
        "unitTitle": "Book Navigation",
        "chapterId": "chap-toc",
        "chapterTitle": "Table of Contents",
        "sectionId": "sec-toc",
        "sectionTitle": "Table of Contents (Index)"
      }
    },
    {
      "sourceId": "src-0002",
      "sequenceIndex": 2,
      "physical": {
        "pdfPage": 2,
        "region": "full",
        "rotation": 0,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 1,
          "height": 1
        }
      },
      "printed": {
        "number": 1,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "special",
        "subType": "art"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "special-festivals-of-india",
        "chapterTitle": "Festivals of India",
        "sectionId": "special-festivals-of-india",
        "sectionTitle": "Festivals of India"
      },
      "content": "India is a land of festivals. We celebrate different kinds of festivals in the country. Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses."
    },
    {
      "sourceId": "src-0003",
      "sequenceIndex": 3,
      "physical": {
        "pdfPage": 3,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 2,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-2",
        "sectionTitle": "Introduction to How We Grow"
      },
      "content": "Introduction to human growth, childhood stages, physical changes, and comparing past milestones."
    },
    {
      "sourceId": "src-0004",
      "sequenceIndex": 4,
      "physical": {
        "pdfPage": 3,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 3,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-3",
        "sectionTitle": "Living Things and How They Grow"
      },
      "content": "Plants, animals and human beings are living things. All living things breathe, need food, water and grow in size. Small plants grow into big plants. All baby animals grow to become big animals. We grow from a little baby to an adult."
    },
    {
      "sourceId": "src-0005",
      "sequenceIndex": 5,
      "physical": {
        "pdfPage": 4,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 4,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-4",
        "sectionTitle": "Hobbies and Growth Activities"
      },
      "content": "As we grow up, we learn to do many activities. An activity that we do for fun when we are free is called a hobby. Singing, painting, dancing and drawing are hobbies."
    },
    {
      "sourceId": "src-0006",
      "sequenceIndex": 6,
      "physical": {
        "pdfPage": 4,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 5,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-5",
        "sectionTitle": "Childhood Stages & Growth Milestones"
      },
      "content": "Milestones of human development: infant, toddler, child, teenager and adult stages."
    },
    {
      "sourceId": "src-0007",
      "sequenceIndex": 7,
      "physical": {
        "pdfPage": 5,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 6,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-6",
        "sectionTitle": "Chapter Exercises & Observations"
      },
      "content": "Interactive observation drills, growth chart recording and self-assessment questions."
    },
    {
      "sourceId": "src-0008",
      "sequenceIndex": 8,
      "physical": {
        "pdfPage": 5,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 7,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-7",
        "sectionTitle": "Key Points & Chapter Revision"
      },
      "content": "Comprehensive chapter summary and review concepts for growth and development."
    },
    {
      "sourceId": "src-0009",
      "sequenceIndex": 9,
      "physical": {
        "pdfPage": 6,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 8,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-8",
        "sectionTitle": "Our Amazing Body Overview"
      },
      "content": "Overview of the human body structure, head, torso, limbs and sensory organs."
    },
    {
      "sourceId": "src-0010",
      "sequenceIndex": 10,
      "physical": {
        "pdfPage": 6,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 9,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-9",
        "sectionTitle": "External and Internal Organs"
      },
      "content": "Organs are important parts of our body. Some organs we can see and touch, for example, our sense organs. They are called external organs. Some organs are inside our body. We cannot see them. They are called internal organs."
    },
    {
      "sourceId": "src-0011",
      "sequenceIndex": 11,
      "physical": {
        "pdfPage": 7,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 10,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-10",
        "sectionTitle": "Heart, Lungs, Stomach & Kidneys"
      },
      "content": "Our body has two lungs, located on either side of our chest. Our lungs help us to breathe. When we breathe the air in, our chest expands. When we breathe out, it contracts. The heart pumps blood to the whole body. There are two kidneys in our body."
    },
    {
      "sourceId": "src-0012",
      "sequenceIndex": 12,
      "physical": {
        "pdfPage": 7,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 11,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-11",
        "sectionTitle": "Bones, Muscles & Good Posture"
      },
      "content": "Bones give shape to our body and protect inner organs. Muscles help us move."
    },
    {
      "sourceId": "src-0013",
      "sequenceIndex": 13,
      "physical": {
        "pdfPage": 8,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 12,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-12",
        "sectionTitle": "Organ Functions & Practice Drills"
      },
      "content": "Match the organ activities, true/false questions and diagram labeling drills."
    },
    {
      "sourceId": "src-0014",
      "sequenceIndex": 14,
      "physical": {
        "pdfPage": 8,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 13,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-13",
        "sectionTitle": "Hygiene, Body Care & Revision"
      },
      "content": "Healthy habits, daily hygiene routines, posture rules and key summary points."
    },
    {
      "sourceId": "src-0015",
      "sequenceIndex": 15,
      "physical": {
        "pdfPage": 9,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 14,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-14",
        "sectionTitle": "Importance of Food & Balanced Diet"
      },
      "content": "There are many types of food items which help our body in different ways. Some of them give us energy to do different types of work. Other food items help us to grow. Some also protect us from falling ill."
    },
    {
      "sourceId": "src-0016",
      "sequenceIndex": 16,
      "physical": {
        "pdfPage": 9,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 15,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-15",
        "sectionTitle": "Energy-Giving, Body-Building & Protective Food"
      },
      "content": "Carbohydrates, fats, proteins, vitamins and minerals in our daily food."
    },
    {
      "sourceId": "src-0017",
      "sequenceIndex": 17,
      "physical": {
        "pdfPage": 10,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 16,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-16",
        "sectionTitle": "Sources of Food: Plants and Animals"
      },
      "content": "Cereals, pulses, vegetables, fruits, milk, eggs and honey."
    },
    {
      "sourceId": "src-0018",
      "sequenceIndex": 18,
      "physical": {
        "pdfPage": 10,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 17,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-17",
        "sectionTitle": "Meals of the Day & Healthy Habits"
      },
      "content": "Breakfast, lunch and dinner routines; drinking clean water and avoiding junk food."
    },
    {
      "sourceId": "src-0019",
      "sequenceIndex": 19,
      "physical": {
        "pdfPage": 11,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 18,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-18",
        "sectionTitle": "Chapter Practice & Revision Summary"
      },
      "content": "Fill in the blanks, food group sorting exercises and chapter highlights."
    },
    {
      "sourceId": "src-0020",
      "sequenceIndex": 20,
      "physical": {
        "pdfPage": 11,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 19,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-19",
        "sectionTitle": "Food Hygiene & Summary Activities"
      },
      "content": "Safe food storage, washing hands and unit review points."
    },
    {
      "sourceId": "src-0021",
      "sequenceIndex": 21,
      "physical": {
        "pdfPage": 12,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 20,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-20",
        "sectionTitle": "We Need Clothes & Seasonal Wear"
      },
      "content": "Clothes protect us from heat, cold, rain, snow, dust and insect bites. Cotton clothes in summer, woollen in winter."
    },
    {
      "sourceId": "src-0022",
      "sequenceIndex": 22,
      "physical": {
        "pdfPage": 12,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 21,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-21",
        "sectionTitle": "Natural and Synthetic Fibres"
      },
      "content": "Cotton from cotton plants, silk from silkworms, wool from sheep."
    },
    {
      "sourceId": "src-0023",
      "sequenceIndex": 23,
      "physical": {
        "pdfPage": 13,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 22,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-22",
        "sectionTitle": "Uniforms and Traditional Costumes"
      },
      "content": "Special clothes for doctors, police, students and regional traditional attire."
    },
    {
      "sourceId": "src-0024",
      "sequenceIndex": 24,
      "physical": {
        "pdfPage": 13,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 23,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-23",
        "sectionTitle": "Care and Cleaning of Clothes"
      },
      "content": "Washing, drying, ironing and storing clothes with mothballs."
    },
    {
      "sourceId": "src-0025",
      "sequenceIndex": 25,
      "physical": {
        "pdfPage": 14,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 24,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-24",
        "sectionTitle": "Clothing Activities & Exercises"
      },
      "content": "Matching fibres to sources and seasonal clothing identification drills."
    },
    {
      "sourceId": "src-0026",
      "sequenceIndex": 26,
      "physical": {
        "pdfPage": 14,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 25,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-25",
        "sectionTitle": "Chapter Revision & Key Notes"
      },
      "content": "Summary notes for clothing types, fibres and hygiene."
    },
    {
      "sourceId": "src-0027",
      "sequenceIndex": 27,
      "physical": {
        "pdfPage": 15,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 26,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-26",
        "sectionTitle": "Unit 1 Clothing Summary & Drills"
      },
      "content": "Final review questions on clothes and seasons."
    },
    {
      "sourceId": "src-0028",
      "sequenceIndex": 28,
      "physical": {
        "pdfPage": 15,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 27,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-27",
        "sectionTitle": "Festivals, Celebrations & Togetherness"
      },
      "content": "We celebrate many festivals with our family and friends. Festivals bring joy and happiness. We wear new clothes, eat delicious food and share gifts."
    },
    {
      "sourceId": "src-0029",
      "sequenceIndex": 29,
      "physical": {
        "pdfPage": 16,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 28,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-28",
        "sectionTitle": "National and Religious Festivals"
      },
      "content": "Independence Day, Republic Day, Gandhi Jayanti, Diwali, Eid, Christmas and Gurpurab."
    },
    {
      "sourceId": "src-0030",
      "sequenceIndex": 30,
      "physical": {
        "pdfPage": 16,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 29,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-29",
        "sectionTitle": "Harvest Festivals of India"
      },
      "content": "Pongal, Bihu, Onam, Baisakhi and Makar Sankranti harvest traditions."
    },
    {
      "sourceId": "src-0031",
      "sequenceIndex": 31,
      "physical": {
        "pdfPage": 17,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 30,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-30",
        "sectionTitle": "Festival Activities & Food Specials"
      },
      "content": "Traditional sweets, rangoli art and family greetings."
    },
    {
      "sourceId": "src-0032",
      "sequenceIndex": 32,
      "physical": {
        "pdfPage": 17,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 31,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-31",
        "sectionTitle": "Chapter Summary & Unit Revision"
      },
      "content": "Key points on unity in diversity and festival celebrations."
    },
    {
      "sourceId": "src-0033",
      "sequenceIndex": 33,
      "physical": {
        "pdfPage": 18,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 32,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "special-yoga-sequence",
        "chapterTitle": "Yoga Practise Sequence",
        "sectionId": "special-yoga-sequence",
        "sectionTitle": "Yoga Practise Sequence"
      },
      "content": "Yoga helps us stay flexible, calm and healthy. Practise basic yoga asanas with slow breathing."
    },
    {
      "sourceId": "src-0034",
      "sequenceIndex": 34,
      "physical": {
        "pdfPage": 18,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 33,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "special-storytime-home",
        "chapterTitle": "Storytime: How I Got Home",
        "sectionId": "special-storytime-home",
        "sectionTitle": "Storytime: How I Got Home"
      },
      "content": "Story about finding directions, landmarks and travelling safely back home in our neighborhood."
    },
    {
      "sourceId": "src-0035",
      "sequenceIndex": 35,
      "physical": {
        "pdfPage": 19,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 34,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-34",
        "sectionTitle": "Family Types and Relationships"
      },
      "content": "Nuclear families have a small number of family members. Joint families have more members. Family members take care of each other."
    },
    {
      "sourceId": "src-0036",
      "sequenceIndex": 36,
      "physical": {
        "pdfPage": 19,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 35,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-35",
        "sectionTitle": "Roles and Responsibilities in Family"
      },
      "content": "Helping parents, respecting elders and sharing household chores."
    },
    {
      "sourceId": "src-0037",
      "sequenceIndex": 37,
      "physical": {
        "pdfPage": 20,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 36,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-36",
        "sectionTitle": "Family Trees and Heredity Traits"
      },
      "content": "Understanding family lineages and similar physical traits."
    },
    {
      "sourceId": "src-0038",
      "sequenceIndex": 38,
      "physical": {
        "pdfPage": 20,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 37,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-37",
        "sectionTitle": "Chapter Exercises & Revision Summary"
      },
      "content": "Family relations exercises and chapter key points."
    },
    {
      "sourceId": "src-0039",
      "sequenceIndex": 39,
      "physical": {
        "pdfPage": 21,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 38,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-38",
        "sectionTitle": "Kinds of Houses and Shelter"
      },
      "content": "A house protects us from bad weather and keeps us safe. Kuchcha houses are made of straw, mud and wood. Pucca houses are made of bricks, cement, wood and steel."
    },
    {
      "sourceId": "src-0040",
      "sequenceIndex": 40,
      "physical": {
        "pdfPage": 21,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 39,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-39",
        "sectionTitle": "Special Houses: Caravans, Houseboats & Igloos"
      },
      "content": "Temporary houses, stilt houses and igloos in arctic regions."
    },
    {
      "sourceId": "src-0041",
      "sequenceIndex": 41,
      "physical": {
        "pdfPage": 22,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 40,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-40",
        "sectionTitle": "Building Materials and Construction Workers"
      },
      "content": "Architects, masons, carpenters, plumbers and electricians."
    },
    {
      "sourceId": "src-0042",
      "sequenceIndex": 42,
      "physical": {
        "pdfPage": 22,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 41,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-41",
        "sectionTitle": "Keeping Our Home Clean and Safe"
      },
      "content": "Ventilation, sunlight, garbage disposal and sanitation."
    },
    {
      "sourceId": "src-0043",
      "sequenceIndex": 43,
      "physical": {
        "pdfPage": 23,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 42,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-42",
        "sectionTitle": "House Activities & Practice Drills"
      },
      "content": "Matching house types to regions and building materials."
    },
    {
      "sourceId": "src-0044",
      "sequenceIndex": 44,
      "physical": {
        "pdfPage": 23,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 43,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-43",
        "sectionTitle": "Chapter Revision & Shelter Summary"
      },
      "content": "Key concepts of human shelter and architecture."
    },
    {
      "sourceId": "src-0045",
      "sequenceIndex": 45,
      "physical": {
        "pdfPage": 24,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 44,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-44",
        "sectionTitle": "Places in Our Neighbourhood"
      },
      "content": "The area around our house is our neighbourhood. People who live near our house are our neighbours. A good neighbourhood has schools, hospitals, markets and parks."
    },
    {
      "sourceId": "src-0046",
      "sequenceIndex": 46,
      "physical": {
        "pdfPage": 24,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 45,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-45",
        "sectionTitle": "Community Helpers & Services"
      },
      "content": "Police stations, fire stations, post offices and banks."
    },
    {
      "sourceId": "src-0047",
      "sequenceIndex": 47,
      "physical": {
        "pdfPage": 25,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 46,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-46",
        "sectionTitle": "Places of Worship & Recreation"
      },
      "content": "Parks, playgrounds, libraries and places of worship."
    },
    {
      "sourceId": "src-0048",
      "sequenceIndex": 48,
      "physical": {
        "pdfPage": 25,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 47,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-47",
        "sectionTitle": "Being a Good Neighbor & Clean Surroundings"
      },
      "content": "Civic sense, noise control and keeping neighborhood parks green."
    },
    {
      "sourceId": "src-0049",
      "sequenceIndex": 49,
      "physical": {
        "pdfPage": 26,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 48,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-48",
        "sectionTitle": "Neighborhood Map & Location Drills"
      },
      "content": "Reading simple neighborhood maps and landmarks."
    },
    {
      "sourceId": "src-0050",
      "sequenceIndex": 50,
      "physical": {
        "pdfPage": 26,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 49,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-49",
        "sectionTitle": "Chapter Revision & Key Neighborhood Notes"
      },
      "content": "Summary of community places, services and helpers."
    },
    {
      "sourceId": "src-0051",
      "sequenceIndex": 51,
      "physical": {
        "pdfPage": 27,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 50,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "assessment-1",
        "chapterTitle": "Assessment-I",
        "sectionId": "assessment-1",
        "sectionTitle": "Assessment-I"
      },
      "content": "Multiple choice, true/false, and short answer evaluation covering Personal Identity, Body Organs, Food, Clothes, Shelter and Neighbourhood."
    },
    {
      "sourceId": "src-0052",
      "sequenceIndex": 52,
      "physical": {
        "pdfPage": 27,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 51,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "test-paper-1",
        "chapterTitle": "Test Paper-I",
        "sectionId": "test-paper-1",
        "sectionTitle": "Test Paper-I"
      },
      "content": "Comprehensive term test covering foundational environmental science concepts from Units 1 & 2."
    },
    {
      "sourceId": "src-0053",
      "sequenceIndex": 53,
      "physical": {
        "pdfPage": 28,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 52,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      }
    },
    {
      "sourceId": "src-0054",
      "sequenceIndex": 54,
      "physical": {
        "pdfPage": 28,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 53,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "special-mighty-animals",
        "chapterTitle": "Mighty Animals",
        "sectionId": "special-mighty-animals",
        "sectionTitle": "Mighty Animals"
      },
      "content": "Exploring wild fauna, animal adaptations and nature biodiversity."
    },
    {
      "sourceId": "src-0055",
      "sequenceIndex": 55,
      "physical": {
        "pdfPage": 29,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 54,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-54",
        "sectionTitle": "Plants Around Us & Photosynthesis"
      },
      "content": "Plants are our green friends. They give us clean air, food, wood and medicines."
    },
    {
      "sourceId": "src-0056",
      "sequenceIndex": 56,
      "physical": {
        "pdfPage": 29,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 55,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-55",
        "sectionTitle": "Types of Plants: Trees, Shrubs, Herbs & Climbers"
      },
      "content": "Classifying plant types by stem strength and lifespan."
    },
    {
      "sourceId": "src-0057",
      "sequenceIndex": 57,
      "physical": {
        "pdfPage": 30,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 56,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-56",
        "sectionTitle": "Parts of a Plant and Their Functions"
      },
      "content": "Roots, stems, leaves, flowers and fruit roles in plant life."
    },
    {
      "sourceId": "src-0058",
      "sequenceIndex": 58,
      "physical": {
        "pdfPage": 30,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 57,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-57",
        "sectionTitle": "Uses of Plants and Care for Nature"
      },
      "content": "Medicines, timber, oxygen, food crops and afforestation."
    },
    {
      "sourceId": "src-0059",
      "sequenceIndex": 59,
      "physical": {
        "pdfPage": 31,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 58,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-58",
        "sectionTitle": "Plant Activities & Leaf Rubbing Drills"
      },
      "content": "Botanical observation drills and leaf structure activities."
    },
    {
      "sourceId": "src-0060",
      "sequenceIndex": 60,
      "physical": {
        "pdfPage": 31,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 59,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-59",
        "sectionTitle": "Chapter Revision & Botany Key Notes"
      },
      "content": "Summary of plant anatomy and environmental value."
    },
    {
      "sourceId": "src-0061",
      "sequenceIndex": 61,
      "physical": {
        "pdfPage": 32,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 60,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-60",
        "sectionTitle": "Wild and Domestic Animals"
      },
      "content": "Animals live all around the world. Domestic animals live on farms or in homes. Wild animals live in forests."
    },
    {
      "sourceId": "src-0062",
      "sequenceIndex": 62,
      "physical": {
        "pdfPage": 32,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 61,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-61",
        "sectionTitle": "Animal Habitats: Land, Water & Amphibians"
      },
      "content": "Terrestrial, aquatic, aerial and arboreal animal environments."
    },
    {
      "sourceId": "src-0063",
      "sequenceIndex": 63,
      "physical": {
        "pdfPage": 33,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 62,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-62",
        "sectionTitle": "Food Habits: Herbivores, Carnivores & Omnivores"
      },
      "content": "Food chains and nutritional adaptations in wildlife."
    },
    {
      "sourceId": "src-0064",
      "sequenceIndex": 64,
      "physical": {
        "pdfPage": 33,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 63,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-63",
        "sectionTitle": "Animal Homes and Shelters"
      },
      "content": "Nests, burrows, dens, beehives and stables."
    },
    {
      "sourceId": "src-0065",
      "sequenceIndex": 65,
      "physical": {
        "pdfPage": 34,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 64,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-64",
        "sectionTitle": "Animal Care & Protection Drills"
      },
      "content": "Kindness to animals and wildlife conservation questions."
    },
    {
      "sourceId": "src-0066",
      "sequenceIndex": 66,
      "physical": {
        "pdfPage": 34,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 65,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-65",
        "sectionTitle": "Chapter Revision & Zoology Notes"
      },
      "content": "Key concepts of animal kingdom and habitats."
    },
    {
      "sourceId": "src-0067",
      "sequenceIndex": 67,
      "physical": {
        "pdfPage": 35,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 66,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-66",
        "sectionTitle": "Importance of Clean Air & Water"
      },
      "content": "All living things need air and water to survive. Moving air is called wind."
    },
    {
      "sourceId": "src-0068",
      "sequenceIndex": 68,
      "physical": {
        "pdfPage": 35,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 67,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-67",
        "sectionTitle": "Properties of Air: Weight, Pressure & Space"
      },
      "content": "Air occupies space, exerts pressure and contains oxygen."
    },
    {
      "sourceId": "src-0069",
      "sequenceIndex": 69,
      "physical": {
        "pdfPage": 36,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 68,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-68",
        "sectionTitle": "Water Sources and Water Cycle"
      },
      "content": "Evaporation, condensation, precipitation and ground water."
    },
    {
      "sourceId": "src-0070",
      "sequenceIndex": 70,
      "physical": {
        "pdfPage": 36,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 69,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-69",
        "sectionTitle": "Water Purification and Conservation"
      },
      "content": "Boiling, filtration, rainwater harvesting and saving water."
    },
    {
      "sourceId": "src-0071",
      "sequenceIndex": 71,
      "physical": {
        "pdfPage": 37,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 70,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-70",
        "sectionTitle": "Chapter Revision & Eco Experiments"
      },
      "content": "Summary and practical water conservation tips."
    },
    {
      "sourceId": "src-0072",
      "sequenceIndex": 72,
      "physical": {
        "pdfPage": 37,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 71,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-71",
        "sectionTitle": "The Cycle of Seasons in India"
      },
      "content": "The weather changes throughout the year. Summer, Monsoon, Autumn, Winter and Spring are the main seasons."
    },
    {
      "sourceId": "src-0073",
      "sequenceIndex": 73,
      "physical": {
        "pdfPage": 38,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 72,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-72",
        "sectionTitle": "Summer Season: Heat, Food & Clothing"
      },
      "content": "Hot winds (loo), cotton clothes, mangoes and cool drinks."
    },
    {
      "sourceId": "src-0074",
      "sequenceIndex": 74,
      "physical": {
        "pdfPage": 38,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 73,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-73",
        "sectionTitle": "Monsoon Season: Rain, Clouds & Raincoats"
      },
      "content": "Monsoon clouds, raincoats, umbrellas and crops."
    },
    {
      "sourceId": "src-0075",
      "sequenceIndex": 75,
      "physical": {
        "pdfPage": 39,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 74,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-74",
        "sectionTitle": "Winter Season: Cold Weather & Warm Food"
      },
      "content": "Woollen clothes, heaters, hot soups and snow in mountains."
    },
    {
      "sourceId": "src-0076",
      "sequenceIndex": 76,
      "physical": {
        "pdfPage": 39,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 75,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-75",
        "sectionTitle": "Spring and Autumn Seasons"
      },
      "content": "Blooming flowers in spring, falling leaves in autumn."
    },
    {
      "sourceId": "src-0077",
      "sequenceIndex": 77,
      "physical": {
        "pdfPage": 40,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 76,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-76",
        "sectionTitle": "Seasonal Activities & Matching Drills"
      },
      "content": "Matching foods, clothes and activities to seasons."
    },
    {
      "sourceId": "src-0078",
      "sequenceIndex": 78,
      "physical": {
        "pdfPage": 40,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 77,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-77",
        "sectionTitle": "Chapter Revision & Climate Summary"
      },
      "content": "Key concepts of Indian climate and seasonal cycles."
    },
    {
      "sourceId": "src-0079",
      "sequenceIndex": 79,
      "physical": {
        "pdfPage": 41,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 78,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "special-animal-walk",
        "chapterTitle": "Animal Walk",
        "sectionId": "special-animal-walk",
        "sectionTitle": "Animal Walk"
      },
      "content": "Fun physical exercise imitating bear walks, frog jumps and crab walks."
    },
    {
      "sourceId": "src-0080",
      "sequenceIndex": 80,
      "physical": {
        "pdfPage": 41,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 79,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "special-storytime-luna",
        "chapterTitle": "Storytime: How Luna Got her Dog Back?",
        "sectionId": "special-storytime-luna",
        "sectionTitle": "Storytime: How Luna Got her Dog Back?"
      },
      "content": "Illustrated narrative on pet empathy, community helpfulness and animal care."
    },
    {
      "sourceId": "src-0081",
      "sequenceIndex": 81,
      "physical": {
        "pdfPage": 42,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 80,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-80",
        "sectionTitle": "Landforms and Oceans of Earth"
      },
      "content": "The Earth is our home planet. It is made of land and water."
    },
    {
      "sourceId": "src-0082",
      "sequenceIndex": 82,
      "physical": {
        "pdfPage": 42,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 81,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-81",
        "sectionTitle": "Mountains, Hills, Valleys & Plateaus"
      },
      "content": "Major geographical landforms and their characteristics."
    },
    {
      "sourceId": "src-0083",
      "sequenceIndex": 83,
      "physical": {
        "pdfPage": 43,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 82,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-82",
        "sectionTitle": "Plains, Deserts and Islands"
      },
      "content": "Flat plains, sandy deserts and islands surrounded by oceans."
    },
    {
      "sourceId": "src-0084",
      "sequenceIndex": 84,
      "physical": {
        "pdfPage": 43,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 83,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-83",
        "sectionTitle": "Globes, Maps and Directions"
      },
      "content": "North, South, East, West cardinal directions and map keys."
    },
    {
      "sourceId": "src-0085",
      "sequenceIndex": 85,
      "physical": {
        "pdfPage": 44,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 84,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-84",
        "sectionTitle": "Chapter Revision & Geography Drills"
      },
      "content": "Summary of planet Earth and physical landforms."
    },
    {
      "sourceId": "src-0086",
      "sequenceIndex": 86,
      "physical": {
        "pdfPage": 44,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 85,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-85",
        "sectionTitle": "Caring for Our Environment"
      },
      "content": "We must keep our Earth clean and green by saving water and planting trees."
    },
    {
      "sourceId": "src-0087",
      "sequenceIndex": 87,
      "physical": {
        "pdfPage": 45,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 86,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-86",
        "sectionTitle": "Pollution: Air, Water, Land & Noise"
      },
      "content": "Causes of environmental pollution and how to prevent them."
    },
    {
      "sourceId": "src-0088",
      "sequenceIndex": 88,
      "physical": {
        "pdfPage": 45,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 87,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-87",
        "sectionTitle": "The 3 Rs: Reduce, Reuse, Recycle"
      },
      "content": "Waste management and eco-friendly daily practices."
    },
    {
      "sourceId": "src-0089",
      "sequenceIndex": 89,
      "physical": {
        "pdfPage": 46,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 88,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-88",
        "sectionTitle": "Saving Energy and Planting Trees"
      },
      "content": "Switching off lights, saving paper and community green drives."
    },
    {
      "sourceId": "src-0090",
      "sequenceIndex": 90,
      "physical": {
        "pdfPage": 46,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 89,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-89",
        "sectionTitle": "Chapter Revision & Green Pledge"
      },
      "content": "Environmental care commitment and chapter summary."
    },
    {
      "sourceId": "src-0091",
      "sequenceIndex": 91,
      "physical": {
        "pdfPage": 47,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 90,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-90",
        "sectionTitle": "The Sun, Moon and Stars"
      },
      "content": "When we look up at the sky during the day, we see the Sun. At night, we see the Moon and stars."
    },
    {
      "sourceId": "src-0092",
      "sequenceIndex": 92,
      "physical": {
        "pdfPage": 47,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 91,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-91",
        "sectionTitle": "The Solar System and the 8 Planets"
      },
      "content": "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune."
    },
    {
      "sourceId": "src-0093",
      "sequenceIndex": 93,
      "physical": {
        "pdfPage": 48,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 92,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-92",
        "sectionTitle": "Phases of the Moon"
      },
      "content": "New moon, crescent, half moon, gibbous and full moon cycle."
    },
    {
      "sourceId": "src-0094",
      "sequenceIndex": 94,
      "physical": {
        "pdfPage": 48,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 93,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-93",
        "sectionTitle": "Constellations & Night Sky Exploration"
      },
      "content": "Great Bear (Ursa Major), Orion and finding the Pole Star."
    },
    {
      "sourceId": "src-0095",
      "sequenceIndex": 95,
      "physical": {
        "pdfPage": 49,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 94,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-94",
        "sectionTitle": "Space Observation Activities"
      },
      "content": "Astronomical diagram labeling and night sky recording drills."
    },
    {
      "sourceId": "src-0096",
      "sequenceIndex": 96,
      "physical": {
        "pdfPage": 49,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 95,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-95",
        "sectionTitle": "Chapter Revision & Astronomy Notes"
      },
      "content": "Summary of the celestial bodies and solar system."
    },
    {
      "sourceId": "src-0097",
      "sequenceIndex": 97,
      "physical": {
        "pdfPage": 50,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 96,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-96",
        "sectionTitle": "National Symbols of India"
      },
      "content": "India is our motherland. Our national flag is the Tricolour (Tiranga), national bird is Peacock, national animal is Tiger."
    },
    {
      "sourceId": "src-0098",
      "sequenceIndex": 98,
      "physical": {
        "pdfPage": 50,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 97,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-97",
        "sectionTitle": "National Anthem, Emblem & Song"
      },
      "content": "Jana Gana Mana by Rabindranath Tagore and Ashoka Lion Capital."
    },
    {
      "sourceId": "src-0099",
      "sequenceIndex": 99,
      "physical": {
        "pdfPage": 51,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 98,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-98",
        "sectionTitle": "States, Union Territories & Heritage"
      },
      "content": "Diversity of languages, food, clothes and cultural heritage of India."
    },
    {
      "sourceId": "src-0100",
      "sequenceIndex": 100,
      "physical": {
        "pdfPage": 51,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 99,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-99",
        "sectionTitle": "Chapter Revision & National Pride Notes"
      },
      "content": "Key concepts of Indian citizenship and heritage."
    },
    {
      "sourceId": "src-0101",
      "sequenceIndex": 101,
      "physical": {
        "pdfPage": 52,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 100,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-100",
        "sectionTitle": "Means of Transport and Travel"
      },
      "content": "We use different vehicles to travel from one place to another."
    },
    {
      "sourceId": "src-0102",
      "sequenceIndex": 102,
      "physical": {
        "pdfPage": 52,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 101,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-101",
        "sectionTitle": "Land Transport: Roadways and Railways"
      },
      "content": "Bicycles, cars, buses, metro trains and railway tracks."
    },
    {
      "sourceId": "src-0103",
      "sequenceIndex": 103,
      "physical": {
        "pdfPage": 53,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 102,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-102",
        "sectionTitle": "Water and Air Transport"
      },
      "content": "Boats, ships, aeroplanes, helicopters and airports."
    },
    {
      "sourceId": "src-0104",
      "sequenceIndex": 104,
      "physical": {
        "pdfPage": 53,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 103,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-103",
        "sectionTitle": "Special Vehicles & Emergency Transport"
      },
      "content": "Ambulances, fire engines, police vans and postal vans."
    },
    {
      "sourceId": "src-0105",
      "sequenceIndex": 105,
      "physical": {
        "pdfPage": 54,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 104,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-104",
        "sectionTitle": "Road Safety & Traffic Signals"
      },
      "content": "Zebra crossing, traffic lights and pedestrian safety rules."
    },
    {
      "sourceId": "src-0106",
      "sequenceIndex": 106,
      "physical": {
        "pdfPage": 54,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 105,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-105",
        "sectionTitle": "Chapter Revision & Transport Summary"
      },
      "content": "Summary of transportation modes and travel guidelines."
    },
    {
      "sourceId": "src-0107",
      "sequenceIndex": 107,
      "physical": {
        "pdfPage": 55,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 106,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-106",
        "sectionTitle": "Modern Communication & Devices"
      },
      "content": "Sending and receiving messages is called communication. We use telephones and computers."
    },
    {
      "sourceId": "src-0108",
      "sequenceIndex": 108,
      "physical": {
        "pdfPage": 55,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 107,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-107",
        "sectionTitle": "Postal Communication: Letters & Postcards"
      },
      "content": "PIN code, letter boxes, postmen and speed post services."
    },
    {
      "sourceId": "src-0109",
      "sequenceIndex": 109,
      "physical": {
        "pdfPage": 56,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 108,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-108",
        "sectionTitle": "Telecommunication: Phones, Smartphones & SMS"
      },
      "content": "Landlines, mobile smartphones, voice calls and messaging apps."
    },
    {
      "sourceId": "src-0110",
      "sequenceIndex": 110,
      "physical": {
        "pdfPage": 56,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 109,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-109",
        "sectionTitle": "Mass Communication: Newspapers, Radio & TV"
      },
      "content": "Broadcasting news and entertainment to millions simultaneously."
    },
    {
      "sourceId": "src-0111",
      "sequenceIndex": 111,
      "physical": {
        "pdfPage": 57,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 110,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-110",
        "sectionTitle": "Internet, Email and Social Media"
      },
      "content": "World Wide Web, search engines, emails and safe online browsing."
    },
    {
      "sourceId": "src-0112",
      "sequenceIndex": 112,
      "physical": {
        "pdfPage": 57,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 111,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-111",
        "sectionTitle": "Communication Drills & Activities"
      },
      "content": "Writing postcards and matching communication devices."
    },
    {
      "sourceId": "src-0113",
      "sequenceIndex": 113,
      "physical": {
        "pdfPage": 58,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 112,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-112",
        "sectionTitle": "Chapter Revision & Connectivity Notes"
      },
      "content": "Summary of interpersonal and mass communication technologies."
    },
    {
      "sourceId": "src-0114",
      "sequenceIndex": 114,
      "physical": {
        "pdfPage": 58,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 113,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "special-fitness-activities",
        "chapterTitle": "Fitness Activities",
        "sectionId": "special-fitness-activities",
        "sectionTitle": "Fitness Activities"
      },
      "content": "Outdoor sports, agility drills and physical fitness challenges."
    },
    {
      "sourceId": "src-0115",
      "sequenceIndex": 115,
      "physical": {
        "pdfPage": 59,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 114,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "assessment-2",
        "chapterTitle": "Assessment-II",
        "sectionId": "assessment-2",
        "sectionTitle": "Assessment-II"
      },
      "content": "Summative evaluation covering Environment, Earth, Space, National Symbols, Transport and Communication."
    },
    {
      "sourceId": "src-0116",
      "sequenceIndex": 116,
      "physical": {
        "pdfPage": 59,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 115,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "test-paper-2",
        "chapterTitle": "Test Paper-II",
        "sectionId": "test-paper-2",
        "sectionTitle": "Test Paper-II"
      },
      "content": "End-of-year comprehensive exam evaluating all 5 units of the textbook curriculum."
    }
  ],
  "sourcePages": [
    {
      "sourceId": "src-0001",
      "sequenceIndex": 1,
      "physical": {
        "pdfPage": 1,
        "region": "full",
        "rotation": 0,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 1,
          "height": 1
        }
      },
      "printed": {
        "number": 1,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "index"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-toc",
        "unitTitle": "Book Navigation",
        "chapterId": "chap-toc",
        "chapterTitle": "Table of Contents",
        "sectionId": "sec-toc",
        "sectionTitle": "Table of Contents (Index)"
      }
    },
    {
      "sourceId": "src-0002",
      "sequenceIndex": 2,
      "physical": {
        "pdfPage": 2,
        "region": "full",
        "rotation": 0,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 1,
          "height": 1
        }
      },
      "printed": {
        "number": 1,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "special",
        "subType": "art"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "special-festivals-of-india",
        "chapterTitle": "Festivals of India",
        "sectionId": "special-festivals-of-india",
        "sectionTitle": "Festivals of India"
      },
      "content": "India is a land of festivals. We celebrate different kinds of festivals in the country. Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses."
    },
    {
      "sourceId": "src-0003",
      "sequenceIndex": 3,
      "physical": {
        "pdfPage": 3,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 2,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-2",
        "sectionTitle": "Introduction to How We Grow"
      },
      "content": "Introduction to human growth, childhood stages, physical changes, and comparing past milestones."
    },
    {
      "sourceId": "src-0004",
      "sequenceIndex": 4,
      "physical": {
        "pdfPage": 3,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 3,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-3",
        "sectionTitle": "Living Things and How They Grow"
      },
      "content": "Plants, animals and human beings are living things. All living things breathe, need food, water and grow in size. Small plants grow into big plants. All baby animals grow to become big animals. We grow from a little baby to an adult."
    },
    {
      "sourceId": "src-0005",
      "sequenceIndex": 5,
      "physical": {
        "pdfPage": 4,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 4,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-4",
        "sectionTitle": "Hobbies and Growth Activities"
      },
      "content": "As we grow up, we learn to do many activities. An activity that we do for fun when we are free is called a hobby. Singing, painting, dancing and drawing are hobbies."
    },
    {
      "sourceId": "src-0006",
      "sequenceIndex": 6,
      "physical": {
        "pdfPage": 4,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 5,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-5",
        "sectionTitle": "Childhood Stages & Growth Milestones"
      },
      "content": "Milestones of human development: infant, toddler, child, teenager and adult stages."
    },
    {
      "sourceId": "src-0007",
      "sequenceIndex": 7,
      "physical": {
        "pdfPage": 5,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 6,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-6",
        "sectionTitle": "Chapter Exercises & Observations"
      },
      "content": "Interactive observation drills, growth chart recording and self-assessment questions."
    },
    {
      "sourceId": "src-0008",
      "sequenceIndex": 8,
      "physical": {
        "pdfPage": 5,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 7,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-1",
        "chapterTitle": "1. I am Growing Up",
        "sectionId": "sec-1-7",
        "sectionTitle": "Key Points & Chapter Revision"
      },
      "content": "Comprehensive chapter summary and review concepts for growth and development."
    },
    {
      "sourceId": "src-0009",
      "sequenceIndex": 9,
      "physical": {
        "pdfPage": 6,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 8,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-8",
        "sectionTitle": "Our Amazing Body Overview"
      },
      "content": "Overview of the human body structure, head, torso, limbs and sensory organs."
    },
    {
      "sourceId": "src-0010",
      "sequenceIndex": 10,
      "physical": {
        "pdfPage": 6,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 9,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-9",
        "sectionTitle": "External and Internal Organs"
      },
      "content": "Organs are important parts of our body. Some organs we can see and touch, for example, our sense organs. They are called external organs. Some organs are inside our body. We cannot see them. They are called internal organs."
    },
    {
      "sourceId": "src-0011",
      "sequenceIndex": 11,
      "physical": {
        "pdfPage": 7,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 10,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-10",
        "sectionTitle": "Heart, Lungs, Stomach & Kidneys"
      },
      "content": "Our body has two lungs, located on either side of our chest. Our lungs help us to breathe. When we breathe the air in, our chest expands. When we breathe out, it contracts. The heart pumps blood to the whole body. There are two kidneys in our body."
    },
    {
      "sourceId": "src-0012",
      "sequenceIndex": 12,
      "physical": {
        "pdfPage": 7,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 11,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-11",
        "sectionTitle": "Bones, Muscles & Good Posture"
      },
      "content": "Bones give shape to our body and protect inner organs. Muscles help us move."
    },
    {
      "sourceId": "src-0013",
      "sequenceIndex": 13,
      "physical": {
        "pdfPage": 8,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 12,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-12",
        "sectionTitle": "Organ Functions & Practice Drills"
      },
      "content": "Match the organ activities, true/false questions and diagram labeling drills."
    },
    {
      "sourceId": "src-0014",
      "sequenceIndex": 14,
      "physical": {
        "pdfPage": 8,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 13,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-2",
        "chapterTitle": "2. My Body",
        "sectionId": "sec-2-13",
        "sectionTitle": "Hygiene, Body Care & Revision"
      },
      "content": "Healthy habits, daily hygiene routines, posture rules and key summary points."
    },
    {
      "sourceId": "src-0015",
      "sequenceIndex": 15,
      "physical": {
        "pdfPage": 9,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 14,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-14",
        "sectionTitle": "Importance of Food & Balanced Diet"
      },
      "content": "There are many types of food items which help our body in different ways. Some of them give us energy to do different types of work. Other food items help us to grow. Some also protect us from falling ill."
    },
    {
      "sourceId": "src-0016",
      "sequenceIndex": 16,
      "physical": {
        "pdfPage": 9,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 15,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-15",
        "sectionTitle": "Energy-Giving, Body-Building & Protective Food"
      },
      "content": "Carbohydrates, fats, proteins, vitamins and minerals in our daily food."
    },
    {
      "sourceId": "src-0017",
      "sequenceIndex": 17,
      "physical": {
        "pdfPage": 10,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 16,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-16",
        "sectionTitle": "Sources of Food: Plants and Animals"
      },
      "content": "Cereals, pulses, vegetables, fruits, milk, eggs and honey."
    },
    {
      "sourceId": "src-0018",
      "sequenceIndex": 18,
      "physical": {
        "pdfPage": 10,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 17,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-17",
        "sectionTitle": "Meals of the Day & Healthy Habits"
      },
      "content": "Breakfast, lunch and dinner routines; drinking clean water and avoiding junk food."
    },
    {
      "sourceId": "src-0019",
      "sequenceIndex": 19,
      "physical": {
        "pdfPage": 11,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 18,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-18",
        "sectionTitle": "Chapter Practice & Revision Summary"
      },
      "content": "Fill in the blanks, food group sorting exercises and chapter highlights."
    },
    {
      "sourceId": "src-0020",
      "sequenceIndex": 20,
      "physical": {
        "pdfPage": 11,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 19,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-3",
        "chapterTitle": "3. Food I Eat",
        "sectionId": "sec-3-19",
        "sectionTitle": "Food Hygiene & Summary Activities"
      },
      "content": "Safe food storage, washing hands and unit review points."
    },
    {
      "sourceId": "src-0021",
      "sequenceIndex": 21,
      "physical": {
        "pdfPage": 12,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 20,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-20",
        "sectionTitle": "We Need Clothes & Seasonal Wear"
      },
      "content": "Clothes protect us from heat, cold, rain, snow, dust and insect bites. Cotton clothes in summer, woollen in winter."
    },
    {
      "sourceId": "src-0022",
      "sequenceIndex": 22,
      "physical": {
        "pdfPage": 12,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 21,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-21",
        "sectionTitle": "Natural and Synthetic Fibres"
      },
      "content": "Cotton from cotton plants, silk from silkworms, wool from sheep."
    },
    {
      "sourceId": "src-0023",
      "sequenceIndex": 23,
      "physical": {
        "pdfPage": 13,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 22,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-22",
        "sectionTitle": "Uniforms and Traditional Costumes"
      },
      "content": "Special clothes for doctors, police, students and regional traditional attire."
    },
    {
      "sourceId": "src-0024",
      "sequenceIndex": 24,
      "physical": {
        "pdfPage": 13,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 23,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-23",
        "sectionTitle": "Care and Cleaning of Clothes"
      },
      "content": "Washing, drying, ironing and storing clothes with mothballs."
    },
    {
      "sourceId": "src-0025",
      "sequenceIndex": 25,
      "physical": {
        "pdfPage": 14,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 24,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-24",
        "sectionTitle": "Clothing Activities & Exercises"
      },
      "content": "Matching fibres to sources and seasonal clothing identification drills."
    },
    {
      "sourceId": "src-0026",
      "sequenceIndex": 26,
      "physical": {
        "pdfPage": 14,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 25,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-25",
        "sectionTitle": "Chapter Revision & Key Notes"
      },
      "content": "Summary notes for clothing types, fibres and hygiene."
    },
    {
      "sourceId": "src-0027",
      "sequenceIndex": 27,
      "physical": {
        "pdfPage": 15,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 26,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-4",
        "chapterTitle": "4. Clothes I Wear",
        "sectionId": "sec-4-26",
        "sectionTitle": "Unit 1 Clothing Summary & Drills"
      },
      "content": "Final review questions on clothes and seasons."
    },
    {
      "sourceId": "src-0028",
      "sequenceIndex": 28,
      "physical": {
        "pdfPage": 15,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 27,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-27",
        "sectionTitle": "Festivals, Celebrations & Togetherness"
      },
      "content": "We celebrate many festivals with our family and friends. Festivals bring joy and happiness. We wear new clothes, eat delicious food and share gifts."
    },
    {
      "sourceId": "src-0029",
      "sequenceIndex": 29,
      "physical": {
        "pdfPage": 16,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 28,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-28",
        "sectionTitle": "National and Religious Festivals"
      },
      "content": "Independence Day, Republic Day, Gandhi Jayanti, Diwali, Eid, Christmas and Gurpurab."
    },
    {
      "sourceId": "src-0030",
      "sequenceIndex": 30,
      "physical": {
        "pdfPage": 16,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 29,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-29",
        "sectionTitle": "Harvest Festivals of India"
      },
      "content": "Pongal, Bihu, Onam, Baisakhi and Makar Sankranti harvest traditions."
    },
    {
      "sourceId": "src-0031",
      "sequenceIndex": 31,
      "physical": {
        "pdfPage": 17,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 30,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-30",
        "sectionTitle": "Festival Activities & Food Specials"
      },
      "content": "Traditional sweets, rangoli art and family greetings."
    },
    {
      "sourceId": "src-0032",
      "sequenceIndex": 32,
      "physical": {
        "pdfPage": 17,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 31,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "chap-5",
        "chapterTitle": "5. I Celebrate",
        "sectionId": "sec-5-31",
        "sectionTitle": "Chapter Summary & Unit Revision"
      },
      "content": "Key points on unity in diversity and festival celebrations."
    },
    {
      "sourceId": "src-0033",
      "sequenceIndex": 33,
      "physical": {
        "pdfPage": 18,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 32,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-1",
        "unitTitle": "Unit 1: About Me",
        "chapterId": "special-yoga-sequence",
        "chapterTitle": "Yoga Practise Sequence",
        "sectionId": "special-yoga-sequence",
        "sectionTitle": "Yoga Practise Sequence"
      },
      "content": "Yoga helps us stay flexible, calm and healthy. Practise basic yoga asanas with slow breathing."
    },
    {
      "sourceId": "src-0034",
      "sequenceIndex": 34,
      "physical": {
        "pdfPage": 18,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 33,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "special-storytime-home",
        "chapterTitle": "Storytime: How I Got Home",
        "sectionId": "special-storytime-home",
        "sectionTitle": "Storytime: How I Got Home"
      },
      "content": "Story about finding directions, landmarks and travelling safely back home in our neighborhood."
    },
    {
      "sourceId": "src-0035",
      "sequenceIndex": 35,
      "physical": {
        "pdfPage": 19,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 34,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-34",
        "sectionTitle": "Family Types and Relationships"
      },
      "content": "Nuclear families have a small number of family members. Joint families have more members. Family members take care of each other."
    },
    {
      "sourceId": "src-0036",
      "sequenceIndex": 36,
      "physical": {
        "pdfPage": 19,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 35,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-35",
        "sectionTitle": "Roles and Responsibilities in Family"
      },
      "content": "Helping parents, respecting elders and sharing household chores."
    },
    {
      "sourceId": "src-0037",
      "sequenceIndex": 37,
      "physical": {
        "pdfPage": 20,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 36,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-36",
        "sectionTitle": "Family Trees and Heredity Traits"
      },
      "content": "Understanding family lineages and similar physical traits."
    },
    {
      "sourceId": "src-0038",
      "sequenceIndex": 38,
      "physical": {
        "pdfPage": 20,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 37,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-6",
        "chapterTitle": "6. I Live With Them",
        "sectionId": "sec-6-37",
        "sectionTitle": "Chapter Exercises & Revision Summary"
      },
      "content": "Family relations exercises and chapter key points."
    },
    {
      "sourceId": "src-0039",
      "sequenceIndex": 39,
      "physical": {
        "pdfPage": 21,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 38,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-38",
        "sectionTitle": "Kinds of Houses and Shelter"
      },
      "content": "A house protects us from bad weather and keeps us safe. Kuchcha houses are made of straw, mud and wood. Pucca houses are made of bricks, cement, wood and steel."
    },
    {
      "sourceId": "src-0040",
      "sequenceIndex": 40,
      "physical": {
        "pdfPage": 21,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 39,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-39",
        "sectionTitle": "Special Houses: Caravans, Houseboats & Igloos"
      },
      "content": "Temporary houses, stilt houses and igloos in arctic regions."
    },
    {
      "sourceId": "src-0041",
      "sequenceIndex": 41,
      "physical": {
        "pdfPage": 22,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 40,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-40",
        "sectionTitle": "Building Materials and Construction Workers"
      },
      "content": "Architects, masons, carpenters, plumbers and electricians."
    },
    {
      "sourceId": "src-0042",
      "sequenceIndex": 42,
      "physical": {
        "pdfPage": 22,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 41,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-41",
        "sectionTitle": "Keeping Our Home Clean and Safe"
      },
      "content": "Ventilation, sunlight, garbage disposal and sanitation."
    },
    {
      "sourceId": "src-0043",
      "sequenceIndex": 43,
      "physical": {
        "pdfPage": 23,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 42,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-42",
        "sectionTitle": "House Activities & Practice Drills"
      },
      "content": "Matching house types to regions and building materials."
    },
    {
      "sourceId": "src-0044",
      "sequenceIndex": 44,
      "physical": {
        "pdfPage": 23,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 43,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-7",
        "chapterTitle": "7. Where I Stay",
        "sectionId": "sec-7-43",
        "sectionTitle": "Chapter Revision & Shelter Summary"
      },
      "content": "Key concepts of human shelter and architecture."
    },
    {
      "sourceId": "src-0045",
      "sequenceIndex": 45,
      "physical": {
        "pdfPage": 24,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 44,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-44",
        "sectionTitle": "Places in Our Neighbourhood"
      },
      "content": "The area around our house is our neighbourhood. People who live near our house are our neighbours. A good neighbourhood has schools, hospitals, markets and parks."
    },
    {
      "sourceId": "src-0046",
      "sequenceIndex": 46,
      "physical": {
        "pdfPage": 24,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 45,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-45",
        "sectionTitle": "Community Helpers & Services"
      },
      "content": "Police stations, fire stations, post offices and banks."
    },
    {
      "sourceId": "src-0047",
      "sequenceIndex": 47,
      "physical": {
        "pdfPage": 25,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 46,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-46",
        "sectionTitle": "Places of Worship & Recreation"
      },
      "content": "Parks, playgrounds, libraries and places of worship."
    },
    {
      "sourceId": "src-0048",
      "sequenceIndex": 48,
      "physical": {
        "pdfPage": 25,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 47,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-47",
        "sectionTitle": "Being a Good Neighbor & Clean Surroundings"
      },
      "content": "Civic sense, noise control and keeping neighborhood parks green."
    },
    {
      "sourceId": "src-0049",
      "sequenceIndex": 49,
      "physical": {
        "pdfPage": 26,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 48,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-48",
        "sectionTitle": "Neighborhood Map & Location Drills"
      },
      "content": "Reading simple neighborhood maps and landmarks."
    },
    {
      "sourceId": "src-0050",
      "sequenceIndex": 50,
      "physical": {
        "pdfPage": 26,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 49,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "chap-8",
        "chapterTitle": "8. Our Neighbourhood",
        "sectionId": "sec-8-49",
        "sectionTitle": "Chapter Revision & Key Neighborhood Notes"
      },
      "content": "Summary of community places, services and helpers."
    },
    {
      "sourceId": "src-0051",
      "sequenceIndex": 51,
      "physical": {
        "pdfPage": 27,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 50,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "assessment-1",
        "chapterTitle": "Assessment-I",
        "sectionId": "assessment-1",
        "sectionTitle": "Assessment-I"
      },
      "content": "Multiple choice, true/false, and short answer evaluation covering Personal Identity, Body Organs, Food, Clothes, Shelter and Neighbourhood."
    },
    {
      "sourceId": "src-0052",
      "sequenceIndex": 52,
      "physical": {
        "pdfPage": 27,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 51,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-2",
        "unitTitle": "Unit 2: Our Surroundings",
        "chapterId": "test-paper-1",
        "chapterTitle": "Test Paper-I",
        "sectionId": "test-paper-1",
        "sectionTitle": "Test Paper-I"
      },
      "content": "Comprehensive term test covering foundational environmental science concepts from Units 1 & 2."
    },
    {
      "sourceId": "src-0053",
      "sequenceIndex": 53,
      "physical": {
        "pdfPage": 28,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 52,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      }
    },
    {
      "sourceId": "src-0054",
      "sequenceIndex": 54,
      "physical": {
        "pdfPage": 28,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 53,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "special-mighty-animals",
        "chapterTitle": "Mighty Animals",
        "sectionId": "special-mighty-animals",
        "sectionTitle": "Mighty Animals"
      },
      "content": "Exploring wild fauna, animal adaptations and nature biodiversity."
    },
    {
      "sourceId": "src-0055",
      "sequenceIndex": 55,
      "physical": {
        "pdfPage": 29,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 54,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-54",
        "sectionTitle": "Plants Around Us & Photosynthesis"
      },
      "content": "Plants are our green friends. They give us clean air, food, wood and medicines."
    },
    {
      "sourceId": "src-0056",
      "sequenceIndex": 56,
      "physical": {
        "pdfPage": 29,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 55,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-55",
        "sectionTitle": "Types of Plants: Trees, Shrubs, Herbs & Climbers"
      },
      "content": "Classifying plant types by stem strength and lifespan."
    },
    {
      "sourceId": "src-0057",
      "sequenceIndex": 57,
      "physical": {
        "pdfPage": 30,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 56,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-56",
        "sectionTitle": "Parts of a Plant and Their Functions"
      },
      "content": "Roots, stems, leaves, flowers and fruit roles in plant life."
    },
    {
      "sourceId": "src-0058",
      "sequenceIndex": 58,
      "physical": {
        "pdfPage": 30,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 57,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-57",
        "sectionTitle": "Uses of Plants and Care for Nature"
      },
      "content": "Medicines, timber, oxygen, food crops and afforestation."
    },
    {
      "sourceId": "src-0059",
      "sequenceIndex": 59,
      "physical": {
        "pdfPage": 31,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 58,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-58",
        "sectionTitle": "Plant Activities & Leaf Rubbing Drills"
      },
      "content": "Botanical observation drills and leaf structure activities."
    },
    {
      "sourceId": "src-0060",
      "sequenceIndex": 60,
      "physical": {
        "pdfPage": 31,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 59,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-9",
        "chapterTitle": "9. My Green Friends",
        "sectionId": "sec-9-59",
        "sectionTitle": "Chapter Revision & Botany Key Notes"
      },
      "content": "Summary of plant anatomy and environmental value."
    },
    {
      "sourceId": "src-0061",
      "sequenceIndex": 61,
      "physical": {
        "pdfPage": 32,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 60,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-60",
        "sectionTitle": "Wild and Domestic Animals"
      },
      "content": "Animals live all around the world. Domestic animals live on farms or in homes. Wild animals live in forests."
    },
    {
      "sourceId": "src-0062",
      "sequenceIndex": 62,
      "physical": {
        "pdfPage": 32,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 61,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-61",
        "sectionTitle": "Animal Habitats: Land, Water & Amphibians"
      },
      "content": "Terrestrial, aquatic, aerial and arboreal animal environments."
    },
    {
      "sourceId": "src-0063",
      "sequenceIndex": 63,
      "physical": {
        "pdfPage": 33,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 62,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-62",
        "sectionTitle": "Food Habits: Herbivores, Carnivores & Omnivores"
      },
      "content": "Food chains and nutritional adaptations in wildlife."
    },
    {
      "sourceId": "src-0064",
      "sequenceIndex": 64,
      "physical": {
        "pdfPage": 33,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 63,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-63",
        "sectionTitle": "Animal Homes and Shelters"
      },
      "content": "Nests, burrows, dens, beehives and stables."
    },
    {
      "sourceId": "src-0065",
      "sequenceIndex": 65,
      "physical": {
        "pdfPage": 34,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 64,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-64",
        "sectionTitle": "Animal Care & Protection Drills"
      },
      "content": "Kindness to animals and wildlife conservation questions."
    },
    {
      "sourceId": "src-0066",
      "sequenceIndex": 66,
      "physical": {
        "pdfPage": 34,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 65,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-10",
        "chapterTitle": "10. The Animal Kingdom",
        "sectionId": "sec-10-65",
        "sectionTitle": "Chapter Revision & Zoology Notes"
      },
      "content": "Key concepts of animal kingdom and habitats."
    },
    {
      "sourceId": "src-0067",
      "sequenceIndex": 67,
      "physical": {
        "pdfPage": 35,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 66,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-66",
        "sectionTitle": "Importance of Clean Air & Water"
      },
      "content": "All living things need air and water to survive. Moving air is called wind."
    },
    {
      "sourceId": "src-0068",
      "sequenceIndex": 68,
      "physical": {
        "pdfPage": 35,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 67,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-67",
        "sectionTitle": "Properties of Air: Weight, Pressure & Space"
      },
      "content": "Air occupies space, exerts pressure and contains oxygen."
    },
    {
      "sourceId": "src-0069",
      "sequenceIndex": 69,
      "physical": {
        "pdfPage": 36,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 68,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-68",
        "sectionTitle": "Water Sources and Water Cycle"
      },
      "content": "Evaporation, condensation, precipitation and ground water."
    },
    {
      "sourceId": "src-0070",
      "sequenceIndex": 70,
      "physical": {
        "pdfPage": 36,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 69,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-69",
        "sectionTitle": "Water Purification and Conservation"
      },
      "content": "Boiling, filtration, rainwater harvesting and saving water."
    },
    {
      "sourceId": "src-0071",
      "sequenceIndex": 71,
      "physical": {
        "pdfPage": 37,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 70,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-11",
        "chapterTitle": "11. Air and Water",
        "sectionId": "sec-11-70",
        "sectionTitle": "Chapter Revision & Eco Experiments"
      },
      "content": "Summary and practical water conservation tips."
    },
    {
      "sourceId": "src-0072",
      "sequenceIndex": 72,
      "physical": {
        "pdfPage": 37,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 71,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-71",
        "sectionTitle": "The Cycle of Seasons in India"
      },
      "content": "The weather changes throughout the year. Summer, Monsoon, Autumn, Winter and Spring are the main seasons."
    },
    {
      "sourceId": "src-0073",
      "sequenceIndex": 73,
      "physical": {
        "pdfPage": 38,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 72,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-72",
        "sectionTitle": "Summer Season: Heat, Food & Clothing"
      },
      "content": "Hot winds (loo), cotton clothes, mangoes and cool drinks."
    },
    {
      "sourceId": "src-0074",
      "sequenceIndex": 74,
      "physical": {
        "pdfPage": 38,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 73,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-73",
        "sectionTitle": "Monsoon Season: Rain, Clouds & Raincoats"
      },
      "content": "Monsoon clouds, raincoats, umbrellas and crops."
    },
    {
      "sourceId": "src-0075",
      "sequenceIndex": 75,
      "physical": {
        "pdfPage": 39,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 74,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-74",
        "sectionTitle": "Winter Season: Cold Weather & Warm Food"
      },
      "content": "Woollen clothes, heaters, hot soups and snow in mountains."
    },
    {
      "sourceId": "src-0076",
      "sequenceIndex": 76,
      "physical": {
        "pdfPage": 39,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 75,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-75",
        "sectionTitle": "Spring and Autumn Seasons"
      },
      "content": "Blooming flowers in spring, falling leaves in autumn."
    },
    {
      "sourceId": "src-0077",
      "sequenceIndex": 77,
      "physical": {
        "pdfPage": 40,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 76,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-76",
        "sectionTitle": "Seasonal Activities & Matching Drills"
      },
      "content": "Matching foods, clothes and activities to seasons."
    },
    {
      "sourceId": "src-0078",
      "sequenceIndex": 78,
      "physical": {
        "pdfPage": 40,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 77,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "chap-12",
        "chapterTitle": "12. Seasons",
        "sectionId": "sec-12-77",
        "sectionTitle": "Chapter Revision & Climate Summary"
      },
      "content": "Key concepts of Indian climate and seasonal cycles."
    },
    {
      "sourceId": "src-0079",
      "sequenceIndex": 79,
      "physical": {
        "pdfPage": 41,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 78,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-3",
        "unitTitle": "Unit 3: Our Environment",
        "chapterId": "special-animal-walk",
        "chapterTitle": "Animal Walk",
        "sectionId": "special-animal-walk",
        "sectionTitle": "Animal Walk"
      },
      "content": "Fun physical exercise imitating bear walks, frog jumps and crab walks."
    },
    {
      "sourceId": "src-0080",
      "sequenceIndex": 80,
      "physical": {
        "pdfPage": 41,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 79,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "special-storytime-luna",
        "chapterTitle": "Storytime: How Luna Got her Dog Back?",
        "sectionId": "special-storytime-luna",
        "sectionTitle": "Storytime: How Luna Got her Dog Back?"
      },
      "content": "Illustrated narrative on pet empathy, community helpfulness and animal care."
    },
    {
      "sourceId": "src-0081",
      "sequenceIndex": 81,
      "physical": {
        "pdfPage": 42,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 80,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-80",
        "sectionTitle": "Landforms and Oceans of Earth"
      },
      "content": "The Earth is our home planet. It is made of land and water."
    },
    {
      "sourceId": "src-0082",
      "sequenceIndex": 82,
      "physical": {
        "pdfPage": 42,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 81,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-81",
        "sectionTitle": "Mountains, Hills, Valleys & Plateaus"
      },
      "content": "Major geographical landforms and their characteristics."
    },
    {
      "sourceId": "src-0083",
      "sequenceIndex": 83,
      "physical": {
        "pdfPage": 43,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 82,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-82",
        "sectionTitle": "Plains, Deserts and Islands"
      },
      "content": "Flat plains, sandy deserts and islands surrounded by oceans."
    },
    {
      "sourceId": "src-0084",
      "sequenceIndex": 84,
      "physical": {
        "pdfPage": 43,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 83,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-83",
        "sectionTitle": "Globes, Maps and Directions"
      },
      "content": "North, South, East, West cardinal directions and map keys."
    },
    {
      "sourceId": "src-0085",
      "sequenceIndex": 85,
      "physical": {
        "pdfPage": 44,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 84,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-13",
        "chapterTitle": "13. Our Earth",
        "sectionId": "sec-13-84",
        "sectionTitle": "Chapter Revision & Geography Drills"
      },
      "content": "Summary of planet Earth and physical landforms."
    },
    {
      "sourceId": "src-0086",
      "sequenceIndex": 86,
      "physical": {
        "pdfPage": 44,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 85,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-85",
        "sectionTitle": "Caring for Our Environment"
      },
      "content": "We must keep our Earth clean and green by saving water and planting trees."
    },
    {
      "sourceId": "src-0087",
      "sequenceIndex": 87,
      "physical": {
        "pdfPage": 45,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 86,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-86",
        "sectionTitle": "Pollution: Air, Water, Land & Noise"
      },
      "content": "Causes of environmental pollution and how to prevent them."
    },
    {
      "sourceId": "src-0088",
      "sequenceIndex": 88,
      "physical": {
        "pdfPage": 45,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 87,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-87",
        "sectionTitle": "The 3 Rs: Reduce, Reuse, Recycle"
      },
      "content": "Waste management and eco-friendly daily practices."
    },
    {
      "sourceId": "src-0089",
      "sequenceIndex": 89,
      "physical": {
        "pdfPage": 46,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 88,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-88",
        "sectionTitle": "Saving Energy and Planting Trees"
      },
      "content": "Switching off lights, saving paper and community green drives."
    },
    {
      "sourceId": "src-0090",
      "sequenceIndex": 90,
      "physical": {
        "pdfPage": 46,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 89,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-14",
        "chapterTitle": "14. I Will Take Care",
        "sectionId": "sec-14-89",
        "sectionTitle": "Chapter Revision & Green Pledge"
      },
      "content": "Environmental care commitment and chapter summary."
    },
    {
      "sourceId": "src-0091",
      "sequenceIndex": 91,
      "physical": {
        "pdfPage": 47,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 90,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-90",
        "sectionTitle": "The Sun, Moon and Stars"
      },
      "content": "When we look up at the sky during the day, we see the Sun. At night, we see the Moon and stars."
    },
    {
      "sourceId": "src-0092",
      "sequenceIndex": 92,
      "physical": {
        "pdfPage": 47,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 91,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-91",
        "sectionTitle": "The Solar System and the 8 Planets"
      },
      "content": "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune."
    },
    {
      "sourceId": "src-0093",
      "sequenceIndex": 93,
      "physical": {
        "pdfPage": 48,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 92,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-92",
        "sectionTitle": "Phases of the Moon"
      },
      "content": "New moon, crescent, half moon, gibbous and full moon cycle."
    },
    {
      "sourceId": "src-0094",
      "sequenceIndex": 94,
      "physical": {
        "pdfPage": 48,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 93,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-93",
        "sectionTitle": "Constellations & Night Sky Exploration"
      },
      "content": "Great Bear (Ursa Major), Orion and finding the Pole Star."
    },
    {
      "sourceId": "src-0095",
      "sequenceIndex": 95,
      "physical": {
        "pdfPage": 49,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 94,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-94",
        "sectionTitle": "Space Observation Activities"
      },
      "content": "Astronomical diagram labeling and night sky recording drills."
    },
    {
      "sourceId": "src-0096",
      "sequenceIndex": 96,
      "physical": {
        "pdfPage": 49,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 95,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-15",
        "chapterTitle": "15. High Above the World",
        "sectionId": "sec-15-95",
        "sectionTitle": "Chapter Revision & Astronomy Notes"
      },
      "content": "Summary of the celestial bodies and solar system."
    },
    {
      "sourceId": "src-0097",
      "sequenceIndex": 97,
      "physical": {
        "pdfPage": 50,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 96,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-96",
        "sectionTitle": "National Symbols of India"
      },
      "content": "India is our motherland. Our national flag is the Tricolour (Tiranga), national bird is Peacock, national animal is Tiger."
    },
    {
      "sourceId": "src-0098",
      "sequenceIndex": 98,
      "physical": {
        "pdfPage": 50,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 97,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-97",
        "sectionTitle": "National Anthem, Emblem & Song"
      },
      "content": "Jana Gana Mana by Rabindranath Tagore and Ashoka Lion Capital."
    },
    {
      "sourceId": "src-0099",
      "sequenceIndex": 99,
      "physical": {
        "pdfPage": 51,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 98,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-98",
        "sectionTitle": "States, Union Territories & Heritage"
      },
      "content": "Diversity of languages, food, clothes and cultural heritage of India."
    },
    {
      "sourceId": "src-0100",
      "sequenceIndex": 100,
      "physical": {
        "pdfPage": 51,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 99,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-4",
        "unitTitle": "Unit 4: Our Lovely Planet",
        "chapterId": "chap-16",
        "chapterTitle": "16. My Country: India",
        "sectionId": "sec-16-99",
        "sectionTitle": "Chapter Revision & National Pride Notes"
      },
      "content": "Key concepts of Indian citizenship and heritage."
    },
    {
      "sourceId": "src-0101",
      "sequenceIndex": 101,
      "physical": {
        "pdfPage": 52,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 100,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-100",
        "sectionTitle": "Means of Transport and Travel"
      },
      "content": "We use different vehicles to travel from one place to another."
    },
    {
      "sourceId": "src-0102",
      "sequenceIndex": 102,
      "physical": {
        "pdfPage": 52,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 101,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-101",
        "sectionTitle": "Land Transport: Roadways and Railways"
      },
      "content": "Bicycles, cars, buses, metro trains and railway tracks."
    },
    {
      "sourceId": "src-0103",
      "sequenceIndex": 103,
      "physical": {
        "pdfPage": 53,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 102,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-102",
        "sectionTitle": "Water and Air Transport"
      },
      "content": "Boats, ships, aeroplanes, helicopters and airports."
    },
    {
      "sourceId": "src-0104",
      "sequenceIndex": 104,
      "physical": {
        "pdfPage": 53,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 103,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-103",
        "sectionTitle": "Special Vehicles & Emergency Transport"
      },
      "content": "Ambulances, fire engines, police vans and postal vans."
    },
    {
      "sourceId": "src-0105",
      "sequenceIndex": 105,
      "physical": {
        "pdfPage": 54,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 104,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-104",
        "sectionTitle": "Road Safety & Traffic Signals"
      },
      "content": "Zebra crossing, traffic lights and pedestrian safety rules."
    },
    {
      "sourceId": "src-0106",
      "sequenceIndex": 106,
      "physical": {
        "pdfPage": 54,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 105,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-17",
        "chapterTitle": "17. Alia and the Birthday Party",
        "sectionId": "sec-17-105",
        "sectionTitle": "Chapter Revision & Transport Summary"
      },
      "content": "Summary of transportation modes and travel guidelines."
    },
    {
      "sourceId": "src-0107",
      "sequenceIndex": 107,
      "physical": {
        "pdfPage": 55,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 106,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-106",
        "sectionTitle": "Modern Communication & Devices"
      },
      "content": "Sending and receiving messages is called communication. We use telephones and computers."
    },
    {
      "sourceId": "src-0108",
      "sequenceIndex": 108,
      "physical": {
        "pdfPage": 55,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 107,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-107",
        "sectionTitle": "Postal Communication: Letters & Postcards"
      },
      "content": "PIN code, letter boxes, postmen and speed post services."
    },
    {
      "sourceId": "src-0109",
      "sequenceIndex": 109,
      "physical": {
        "pdfPage": 56,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 108,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-108",
        "sectionTitle": "Telecommunication: Phones, Smartphones & SMS"
      },
      "content": "Landlines, mobile smartphones, voice calls and messaging apps."
    },
    {
      "sourceId": "src-0110",
      "sequenceIndex": 110,
      "physical": {
        "pdfPage": 56,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 109,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-109",
        "sectionTitle": "Mass Communication: Newspapers, Radio & TV"
      },
      "content": "Broadcasting news and entertainment to millions simultaneously."
    },
    {
      "sourceId": "src-0111",
      "sequenceIndex": 111,
      "physical": {
        "pdfPage": 57,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 110,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-110",
        "sectionTitle": "Internet, Email and Social Media"
      },
      "content": "World Wide Web, search engines, emails and safe online browsing."
    },
    {
      "sourceId": "src-0112",
      "sequenceIndex": 112,
      "physical": {
        "pdfPage": 57,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 111,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-111",
        "sectionTitle": "Communication Drills & Activities"
      },
      "content": "Writing postcards and matching communication devices."
    },
    {
      "sourceId": "src-0113",
      "sequenceIndex": 113,
      "physical": {
        "pdfPage": 58,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 112,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "chap-18",
        "chapterTitle": "18. Communication Today",
        "sectionId": "sec-18-112",
        "sectionTitle": "Chapter Revision & Connectivity Notes"
      },
      "content": "Summary of interpersonal and mass communication technologies."
    },
    {
      "sourceId": "src-0114",
      "sequenceIndex": 114,
      "physical": {
        "pdfPage": 58,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 113,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "special-fitness-activities",
        "chapterTitle": "Fitness Activities",
        "sectionId": "special-fitness-activities",
        "sectionTitle": "Fitness Activities"
      },
      "content": "Outdoor sports, agility drills and physical fitness challenges."
    },
    {
      "sourceId": "src-0115",
      "sequenceIndex": 115,
      "physical": {
        "pdfPage": 59,
        "region": "left",
        "rotation": 270,
        "viewport": {
          "x": 0,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 114,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "assessment-2",
        "chapterTitle": "Assessment-II",
        "sectionId": "assessment-2",
        "sectionTitle": "Assessment-II"
      },
      "content": "Summative evaluation covering Environment, Earth, Space, National Symbols, Transport and Communication."
    },
    {
      "sourceId": "src-0116",
      "sequenceIndex": 116,
      "physical": {
        "pdfPage": 59,
        "region": "right",
        "rotation": 270,
        "viewport": {
          "x": 0.5,
          "y": 0,
          "width": 0.5,
          "height": 1
        }
      },
      "printed": {
        "number": 115,
        "confidence": 0.98,
        "detected": true
      },
      "classification": {
        "type": "normal"
      },
      "forensic": {
        "confidence": 0.99,
        "needsReview": false,
        "reviewReasons": []
      },
      "structure": {
        "unitId": "unit-5",
        "unitTitle": "Unit 5: Staying Connected",
        "chapterId": "test-paper-2",
        "chapterTitle": "Test Paper-II",
        "sectionId": "test-paper-2",
        "sectionTitle": "Test Paper-II"
      },
      "content": "End-of-year comprehensive exam evaluating all 5 units of the textbook curriculum."
    }
  ],
  "units": [
    {
      "id": "unit-1",
      "unitNumber": 1,
      "title": "Unit 1: About Me",
      "startSequenceIndex": 2,
      "endSequenceIndex": 33,
      "items": [
        {
          "id": "special-festivals-of-india",
          "type": "special",
          "subType": "art",
          "title": "Festivals of India",
          "startSequenceIndex": 2,
          "endSequenceIndex": 2,
          "printedPage": 1,
          "pdfPage": 2,
          "side": "full",
          "learningOutcome": "LO-ART-01: Cultural Heritage and Festival Traditions in India",
          "content": "India is a land of festivals. We celebrate different kinds of festivals in the country. Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses."
        },
        {
          "id": "chap-1",
          "type": "chapter",
          "chapterNumber": 1,
          "title": "1. I am Growing Up",
          "startSequenceIndex": 3,
          "endSequenceIndex": 8,
          "startPrintedPage": 2,
          "endPrintedPage": 7,
          "sections": [
            {
              "id": "sec-1-2",
              "type": "section",
              "sectionNumber": "1.2",
              "title": "Introduction to How We Grow",
              "sequenceIndex": 3,
              "printedPage": 2,
              "content": "Introduction to human growth, childhood stages, physical changes, and comparing past milestones."
            },
            {
              "id": "sec-1-3",
              "type": "section",
              "sectionNumber": "1.3",
              "title": "Living Things and How They Grow",
              "sequenceIndex": 4,
              "printedPage": 3,
              "content": "Plants, animals and human beings are living things. All living things breathe, need food, water and grow in size. Small plants grow into big plants. All baby animals grow to become big animals. We grow from a little baby to an adult."
            },
            {
              "id": "sec-1-4",
              "type": "section",
              "sectionNumber": "1.4",
              "title": "Hobbies and Growth Activities",
              "sequenceIndex": 5,
              "printedPage": 4,
              "content": "As we grow up, we learn to do many activities. An activity that we do for fun when we are free is called a hobby. Singing, painting, dancing and drawing are hobbies."
            },
            {
              "id": "sec-1-5",
              "type": "section",
              "sectionNumber": "1.5",
              "title": "Childhood Stages & Growth Milestones",
              "sequenceIndex": 6,
              "printedPage": 5,
              "content": "Milestones of human development: infant, toddler, child, teenager and adult stages."
            },
            {
              "id": "sec-1-6",
              "type": "section",
              "sectionNumber": "1.6",
              "title": "Chapter Exercises & Observations",
              "sequenceIndex": 7,
              "printedPage": 6,
              "content": "Interactive observation drills, growth chart recording and self-assessment questions."
            },
            {
              "id": "sec-1-7",
              "type": "section",
              "sectionNumber": "1.7",
              "title": "Key Points & Chapter Revision",
              "sequenceIndex": 8,
              "printedPage": 7,
              "content": "Comprehensive chapter summary and review concepts for growth and development."
            }
          ]
        },
        {
          "id": "chap-2",
          "type": "chapter",
          "chapterNumber": 2,
          "title": "2. My Body",
          "startSequenceIndex": 9,
          "endSequenceIndex": 14,
          "startPrintedPage": 8,
          "endPrintedPage": 13,
          "sections": [
            {
              "id": "sec-2-8",
              "type": "section",
              "sectionNumber": "2.8",
              "title": "Our Amazing Body Overview",
              "sequenceIndex": 9,
              "printedPage": 8,
              "content": "Overview of the human body structure, head, torso, limbs and sensory organs."
            },
            {
              "id": "sec-2-9",
              "type": "section",
              "sectionNumber": "2.9",
              "title": "External and Internal Organs",
              "sequenceIndex": 10,
              "printedPage": 9,
              "content": "Organs are important parts of our body. Some organs we can see and touch, for example, our sense organs. They are called external organs. Some organs are inside our body. We cannot see them. They are called internal organs."
            },
            {
              "id": "sec-2-10",
              "type": "section",
              "sectionNumber": "2.10",
              "title": "Heart, Lungs, Stomach & Kidneys",
              "sequenceIndex": 11,
              "printedPage": 10,
              "content": "Our body has two lungs, located on either side of our chest. Our lungs help us to breathe. When we breathe the air in, our chest expands. When we breathe out, it contracts. The heart pumps blood to the whole body. There are two kidneys in our body."
            },
            {
              "id": "sec-2-11",
              "type": "section",
              "sectionNumber": "2.11",
              "title": "Bones, Muscles & Good Posture",
              "sequenceIndex": 12,
              "printedPage": 11,
              "content": "Bones give shape to our body and protect inner organs. Muscles help us move."
            },
            {
              "id": "sec-2-12",
              "type": "section",
              "sectionNumber": "2.12",
              "title": "Organ Functions & Practice Drills",
              "sequenceIndex": 13,
              "printedPage": 12,
              "content": "Match the organ activities, true/false questions and diagram labeling drills."
            },
            {
              "id": "sec-2-13",
              "type": "section",
              "sectionNumber": "2.13",
              "title": "Hygiene, Body Care & Revision",
              "sequenceIndex": 14,
              "printedPage": 13,
              "content": "Healthy habits, daily hygiene routines, posture rules and key summary points."
            }
          ]
        },
        {
          "id": "chap-3",
          "type": "chapter",
          "chapterNumber": 3,
          "title": "3. Food I Eat",
          "startSequenceIndex": 15,
          "endSequenceIndex": 20,
          "startPrintedPage": 14,
          "endPrintedPage": 19,
          "sections": [
            {
              "id": "sec-3-14",
              "type": "section",
              "sectionNumber": "3.14",
              "title": "Importance of Food & Balanced Diet",
              "sequenceIndex": 15,
              "printedPage": 14,
              "content": "There are many types of food items which help our body in different ways. Some of them give us energy to do different types of work. Other food items help us to grow. Some also protect us from falling ill."
            },
            {
              "id": "sec-3-15",
              "type": "section",
              "sectionNumber": "3.15",
              "title": "Energy-Giving, Body-Building & Protective Food",
              "sequenceIndex": 16,
              "printedPage": 15,
              "content": "Carbohydrates, fats, proteins, vitamins and minerals in our daily food."
            },
            {
              "id": "sec-3-16",
              "type": "section",
              "sectionNumber": "3.16",
              "title": "Sources of Food: Plants and Animals",
              "sequenceIndex": 17,
              "printedPage": 16,
              "content": "Cereals, pulses, vegetables, fruits, milk, eggs and honey."
            },
            {
              "id": "sec-3-17",
              "type": "section",
              "sectionNumber": "3.17",
              "title": "Meals of the Day & Healthy Habits",
              "sequenceIndex": 18,
              "printedPage": 17,
              "content": "Breakfast, lunch and dinner routines; drinking clean water and avoiding junk food."
            },
            {
              "id": "sec-3-18",
              "type": "section",
              "sectionNumber": "3.18",
              "title": "Chapter Practice & Revision Summary",
              "sequenceIndex": 19,
              "printedPage": 18,
              "content": "Fill in the blanks, food group sorting exercises and chapter highlights."
            },
            {
              "id": "sec-3-19",
              "type": "section",
              "sectionNumber": "3.19",
              "title": "Food Hygiene & Summary Activities",
              "sequenceIndex": 20,
              "printedPage": 19,
              "content": "Safe food storage, washing hands and unit review points."
            }
          ]
        },
        {
          "id": "chap-4",
          "type": "chapter",
          "chapterNumber": 4,
          "title": "4. Clothes I Wear",
          "startSequenceIndex": 21,
          "endSequenceIndex": 27,
          "startPrintedPage": 20,
          "endPrintedPage": 26,
          "sections": [
            {
              "id": "sec-4-20",
              "type": "section",
              "sectionNumber": "4.20",
              "title": "We Need Clothes & Seasonal Wear",
              "sequenceIndex": 21,
              "printedPage": 20,
              "content": "Clothes protect us from heat, cold, rain, snow, dust and insect bites. Cotton clothes in summer, woollen in winter."
            },
            {
              "id": "sec-4-21",
              "type": "section",
              "sectionNumber": "4.21",
              "title": "Natural and Synthetic Fibres",
              "sequenceIndex": 22,
              "printedPage": 21,
              "content": "Cotton from cotton plants, silk from silkworms, wool from sheep."
            },
            {
              "id": "sec-4-22",
              "type": "section",
              "sectionNumber": "4.22",
              "title": "Uniforms and Traditional Costumes",
              "sequenceIndex": 23,
              "printedPage": 22,
              "content": "Special clothes for doctors, police, students and regional traditional attire."
            },
            {
              "id": "sec-4-23",
              "type": "section",
              "sectionNumber": "4.23",
              "title": "Care and Cleaning of Clothes",
              "sequenceIndex": 24,
              "printedPage": 23,
              "content": "Washing, drying, ironing and storing clothes with mothballs."
            },
            {
              "id": "sec-4-24",
              "type": "section",
              "sectionNumber": "4.24",
              "title": "Clothing Activities & Exercises",
              "sequenceIndex": 25,
              "printedPage": 24,
              "content": "Matching fibres to sources and seasonal clothing identification drills."
            },
            {
              "id": "sec-4-25",
              "type": "section",
              "sectionNumber": "4.25",
              "title": "Chapter Revision & Key Notes",
              "sequenceIndex": 26,
              "printedPage": 25,
              "content": "Summary notes for clothing types, fibres and hygiene."
            },
            {
              "id": "sec-4-26",
              "type": "section",
              "sectionNumber": "4.26",
              "title": "Unit 1 Clothing Summary & Drills",
              "sequenceIndex": 27,
              "printedPage": 26,
              "content": "Final review questions on clothes and seasons."
            }
          ]
        },
        {
          "id": "chap-5",
          "type": "chapter",
          "chapterNumber": 5,
          "title": "5. I Celebrate",
          "startSequenceIndex": 28,
          "endSequenceIndex": 32,
          "startPrintedPage": 27,
          "endPrintedPage": 31,
          "sections": [
            {
              "id": "sec-5-27",
              "type": "section",
              "sectionNumber": "5.27",
              "title": "Festivals, Celebrations & Togetherness",
              "sequenceIndex": 28,
              "printedPage": 27,
              "content": "We celebrate many festivals with our family and friends. Festivals bring joy and happiness. We wear new clothes, eat delicious food and share gifts."
            },
            {
              "id": "sec-5-28",
              "type": "section",
              "sectionNumber": "5.28",
              "title": "National and Religious Festivals",
              "sequenceIndex": 29,
              "printedPage": 28,
              "content": "Independence Day, Republic Day, Gandhi Jayanti, Diwali, Eid, Christmas and Gurpurab."
            },
            {
              "id": "sec-5-29",
              "type": "section",
              "sectionNumber": "5.29",
              "title": "Harvest Festivals of India",
              "sequenceIndex": 30,
              "printedPage": 29,
              "content": "Pongal, Bihu, Onam, Baisakhi and Makar Sankranti harvest traditions."
            },
            {
              "id": "sec-5-30",
              "type": "section",
              "sectionNumber": "5.30",
              "title": "Festival Activities & Food Specials",
              "sequenceIndex": 31,
              "printedPage": 30,
              "content": "Traditional sweets, rangoli art and family greetings."
            },
            {
              "id": "sec-5-31",
              "type": "section",
              "sectionNumber": "5.31",
              "title": "Chapter Summary & Unit Revision",
              "sequenceIndex": 32,
              "printedPage": 31,
              "content": "Key points on unity in diversity and festival celebrations."
            }
          ]
        },
        {
          "id": "special-yoga-sequence",
          "type": "special",
          "subType": "fitness",
          "title": "Yoga Practise Sequence",
          "startSequenceIndex": 33,
          "endSequenceIndex": 33,
          "printedPage": 32,
          "pdfPage": 17,
          "side": "left",
          "content": "Yoga helps us stay flexible, calm and healthy. Practise basic yoga asanas with slow breathing."
        }
      ]
    },
    {
      "id": "unit-2",
      "unitNumber": 2,
      "title": "Unit 2: Our Surroundings",
      "startSequenceIndex": 34,
      "endSequenceIndex": 52,
      "items": [
        {
          "id": "special-storytime-home",
          "type": "special",
          "subType": "art",
          "title": "Storytime: How I Got Home",
          "startSequenceIndex": 34,
          "endSequenceIndex": 34,
          "printedPage": 33,
          "content": "Story about finding directions, landmarks and travelling safely back home in our neighborhood."
        },
        {
          "id": "chap-6",
          "type": "chapter",
          "chapterNumber": 6,
          "title": "6. I Live With Them",
          "startSequenceIndex": 35,
          "endSequenceIndex": 38,
          "startPrintedPage": 34,
          "endPrintedPage": 37,
          "sections": [
            {
              "id": "sec-6-34",
              "type": "section",
              "sectionNumber": "6.34",
              "title": "Family Types and Relationships",
              "sequenceIndex": 35,
              "printedPage": 34,
              "content": "Nuclear families have a small number of family members. Joint families have more members. Family members take care of each other."
            },
            {
              "id": "sec-6-35",
              "type": "section",
              "sectionNumber": "6.35",
              "title": "Roles and Responsibilities in Family",
              "sequenceIndex": 36,
              "printedPage": 35,
              "content": "Helping parents, respecting elders and sharing household chores."
            },
            {
              "id": "sec-6-36",
              "type": "section",
              "sectionNumber": "6.36",
              "title": "Family Trees and Heredity Traits",
              "sequenceIndex": 37,
              "printedPage": 36,
              "content": "Understanding family lineages and similar physical traits."
            },
            {
              "id": "sec-6-37",
              "type": "section",
              "sectionNumber": "6.37",
              "title": "Chapter Exercises & Revision Summary",
              "sequenceIndex": 38,
              "printedPage": 37,
              "content": "Family relations exercises and chapter key points."
            }
          ]
        },
        {
          "id": "chap-7",
          "type": "chapter",
          "chapterNumber": 7,
          "title": "7. Where I Stay",
          "startSequenceIndex": 39,
          "endSequenceIndex": 44,
          "startPrintedPage": 38,
          "endPrintedPage": 43,
          "sections": [
            {
              "id": "sec-7-38",
              "type": "section",
              "sectionNumber": "7.38",
              "title": "Kinds of Houses and Shelter",
              "sequenceIndex": 39,
              "printedPage": 38,
              "content": "A house protects us from bad weather and keeps us safe. Kuchcha houses are made of straw, mud and wood. Pucca houses are made of bricks, cement, wood and steel."
            },
            {
              "id": "sec-7-39",
              "type": "section",
              "sectionNumber": "7.39",
              "title": "Special Houses: Caravans, Houseboats & Igloos",
              "sequenceIndex": 40,
              "printedPage": 39,
              "content": "Temporary houses, stilt houses and igloos in arctic regions."
            },
            {
              "id": "sec-7-40",
              "type": "section",
              "sectionNumber": "7.40",
              "title": "Building Materials and Construction Workers",
              "sequenceIndex": 41,
              "printedPage": 40,
              "content": "Architects, masons, carpenters, plumbers and electricians."
            },
            {
              "id": "sec-7-41",
              "type": "section",
              "sectionNumber": "7.41",
              "title": "Keeping Our Home Clean and Safe",
              "sequenceIndex": 42,
              "printedPage": 41,
              "content": "Ventilation, sunlight, garbage disposal and sanitation."
            },
            {
              "id": "sec-7-42",
              "type": "section",
              "sectionNumber": "7.42",
              "title": "House Activities & Practice Drills",
              "sequenceIndex": 43,
              "printedPage": 42,
              "content": "Matching house types to regions and building materials."
            },
            {
              "id": "sec-7-43",
              "type": "section",
              "sectionNumber": "7.43",
              "title": "Chapter Revision & Shelter Summary",
              "sequenceIndex": 44,
              "printedPage": 43,
              "content": "Key concepts of human shelter and architecture."
            }
          ]
        },
        {
          "id": "chap-8",
          "type": "chapter",
          "chapterNumber": 8,
          "title": "8. Our Neighbourhood",
          "startSequenceIndex": 45,
          "endSequenceIndex": 50,
          "startPrintedPage": 44,
          "endPrintedPage": 49,
          "sections": [
            {
              "id": "sec-8-44",
              "type": "section",
              "sectionNumber": "8.44",
              "title": "Places in Our Neighbourhood",
              "sequenceIndex": 45,
              "printedPage": 44,
              "content": "The area around our house is our neighbourhood. People who live near our house are our neighbours. A good neighbourhood has schools, hospitals, markets and parks."
            },
            {
              "id": "sec-8-45",
              "type": "section",
              "sectionNumber": "8.45",
              "title": "Community Helpers & Services",
              "sequenceIndex": 46,
              "printedPage": 45,
              "content": "Police stations, fire stations, post offices and banks."
            },
            {
              "id": "sec-8-46",
              "type": "section",
              "sectionNumber": "8.46",
              "title": "Places of Worship & Recreation",
              "sequenceIndex": 47,
              "printedPage": 46,
              "content": "Parks, playgrounds, libraries and places of worship."
            },
            {
              "id": "sec-8-47",
              "type": "section",
              "sectionNumber": "8.47",
              "title": "Being a Good Neighbor & Clean Surroundings",
              "sequenceIndex": 48,
              "printedPage": 47,
              "content": "Civic sense, noise control and keeping neighborhood parks green."
            },
            {
              "id": "sec-8-48",
              "type": "section",
              "sectionNumber": "8.48",
              "title": "Neighborhood Map & Location Drills",
              "sequenceIndex": 49,
              "printedPage": 48,
              "content": "Reading simple neighborhood maps and landmarks."
            },
            {
              "id": "sec-8-49",
              "type": "section",
              "sectionNumber": "8.49",
              "title": "Chapter Revision & Key Neighborhood Notes",
              "sequenceIndex": 50,
              "printedPage": 49,
              "content": "Summary of community places, services and helpers."
            }
          ]
        },
        {
          "id": "assessment-1",
          "type": "assessment",
          "title": "Assessment-I",
          "startSequenceIndex": 51,
          "endSequenceIndex": 51,
          "printedPage": 50,
          "content": "Multiple choice, true/false, and short answer evaluation covering Personal Identity, Body Organs, Food, Clothes, Shelter and Neighbourhood."
        },
        {
          "id": "test-paper-1",
          "type": "test",
          "title": "Test Paper-I",
          "startSequenceIndex": 52,
          "endSequenceIndex": 52,
          "printedPage": 51,
          "content": "Comprehensive term test covering foundational environmental science concepts from Units 1 & 2."
        }
      ]
    },
    {
      "id": "unit-3",
      "unitNumber": 3,
      "title": "Unit 3: Our Environment",
      "startSequenceIndex": 53,
      "endSequenceIndex": 79,
      "items": [
        {
          "id": "special-mighty-animals",
          "type": "special",
          "subType": "art",
          "title": "Mighty Animals",
          "startSequenceIndex": 54,
          "endSequenceIndex": 54,
          "printedPage": 53,
          "content": "Exploring wild fauna, animal adaptations and nature biodiversity."
        },
        {
          "id": "chap-9",
          "type": "chapter",
          "chapterNumber": 9,
          "title": "9. My Green Friends",
          "startSequenceIndex": 55,
          "endSequenceIndex": 60,
          "startPrintedPage": 54,
          "endPrintedPage": 59,
          "sections": [
            {
              "id": "sec-9-54",
              "type": "section",
              "sectionNumber": "9.54",
              "title": "Plants Around Us & Photosynthesis",
              "sequenceIndex": 55,
              "printedPage": 54,
              "content": "Plants are our green friends. They give us clean air, food, wood and medicines."
            },
            {
              "id": "sec-9-55",
              "type": "section",
              "sectionNumber": "9.55",
              "title": "Types of Plants: Trees, Shrubs, Herbs & Climbers",
              "sequenceIndex": 56,
              "printedPage": 55,
              "content": "Classifying plant types by stem strength and lifespan."
            },
            {
              "id": "sec-9-56",
              "type": "section",
              "sectionNumber": "9.56",
              "title": "Parts of a Plant and Their Functions",
              "sequenceIndex": 57,
              "printedPage": 56,
              "content": "Roots, stems, leaves, flowers and fruit roles in plant life."
            },
            {
              "id": "sec-9-57",
              "type": "section",
              "sectionNumber": "9.57",
              "title": "Uses of Plants and Care for Nature",
              "sequenceIndex": 58,
              "printedPage": 57,
              "content": "Medicines, timber, oxygen, food crops and afforestation."
            },
            {
              "id": "sec-9-58",
              "type": "section",
              "sectionNumber": "9.58",
              "title": "Plant Activities & Leaf Rubbing Drills",
              "sequenceIndex": 59,
              "printedPage": 58,
              "content": "Botanical observation drills and leaf structure activities."
            },
            {
              "id": "sec-9-59",
              "type": "section",
              "sectionNumber": "9.59",
              "title": "Chapter Revision & Botany Key Notes",
              "sequenceIndex": 60,
              "printedPage": 59,
              "content": "Summary of plant anatomy and environmental value."
            }
          ]
        },
        {
          "id": "chap-10",
          "type": "chapter",
          "chapterNumber": 10,
          "title": "10. The Animal Kingdom",
          "startSequenceIndex": 61,
          "endSequenceIndex": 66,
          "startPrintedPage": 60,
          "endPrintedPage": 65,
          "sections": [
            {
              "id": "sec-10-60",
              "type": "section",
              "sectionNumber": "10.60",
              "title": "Wild and Domestic Animals",
              "sequenceIndex": 61,
              "printedPage": 60,
              "content": "Animals live all around the world. Domestic animals live on farms or in homes. Wild animals live in forests."
            },
            {
              "id": "sec-10-61",
              "type": "section",
              "sectionNumber": "10.61",
              "title": "Animal Habitats: Land, Water & Amphibians",
              "sequenceIndex": 62,
              "printedPage": 61,
              "content": "Terrestrial, aquatic, aerial and arboreal animal environments."
            },
            {
              "id": "sec-10-62",
              "type": "section",
              "sectionNumber": "10.62",
              "title": "Food Habits: Herbivores, Carnivores & Omnivores",
              "sequenceIndex": 63,
              "printedPage": 62,
              "content": "Food chains and nutritional adaptations in wildlife."
            },
            {
              "id": "sec-10-63",
              "type": "section",
              "sectionNumber": "10.63",
              "title": "Animal Homes and Shelters",
              "sequenceIndex": 64,
              "printedPage": 63,
              "content": "Nests, burrows, dens, beehives and stables."
            },
            {
              "id": "sec-10-64",
              "type": "section",
              "sectionNumber": "10.64",
              "title": "Animal Care & Protection Drills",
              "sequenceIndex": 65,
              "printedPage": 64,
              "content": "Kindness to animals and wildlife conservation questions."
            },
            {
              "id": "sec-10-65",
              "type": "section",
              "sectionNumber": "10.65",
              "title": "Chapter Revision & Zoology Notes",
              "sequenceIndex": 66,
              "printedPage": 65,
              "content": "Key concepts of animal kingdom and habitats."
            }
          ]
        },
        {
          "id": "chap-11",
          "type": "chapter",
          "chapterNumber": 11,
          "title": "11. Air and Water",
          "startSequenceIndex": 67,
          "endSequenceIndex": 71,
          "startPrintedPage": 66,
          "endPrintedPage": 70,
          "sections": [
            {
              "id": "sec-11-66",
              "type": "section",
              "sectionNumber": "11.66",
              "title": "Importance of Clean Air & Water",
              "sequenceIndex": 67,
              "printedPage": 66,
              "content": "All living things need air and water to survive. Moving air is called wind."
            },
            {
              "id": "sec-11-67",
              "type": "section",
              "sectionNumber": "11.67",
              "title": "Properties of Air: Weight, Pressure & Space",
              "sequenceIndex": 68,
              "printedPage": 67,
              "content": "Air occupies space, exerts pressure and contains oxygen."
            },
            {
              "id": "sec-11-68",
              "type": "section",
              "sectionNumber": "11.68",
              "title": "Water Sources and Water Cycle",
              "sequenceIndex": 69,
              "printedPage": 68,
              "content": "Evaporation, condensation, precipitation and ground water."
            },
            {
              "id": "sec-11-69",
              "type": "section",
              "sectionNumber": "11.69",
              "title": "Water Purification and Conservation",
              "sequenceIndex": 70,
              "printedPage": 69,
              "content": "Boiling, filtration, rainwater harvesting and saving water."
            },
            {
              "id": "sec-11-70",
              "type": "section",
              "sectionNumber": "11.70",
              "title": "Chapter Revision & Eco Experiments",
              "sequenceIndex": 71,
              "printedPage": 70,
              "content": "Summary and practical water conservation tips."
            }
          ]
        },
        {
          "id": "chap-12",
          "type": "chapter",
          "chapterNumber": 12,
          "title": "12. Seasons",
          "startSequenceIndex": 72,
          "endSequenceIndex": 78,
          "startPrintedPage": 71,
          "endPrintedPage": 77,
          "sections": [
            {
              "id": "sec-12-71",
              "type": "section",
              "sectionNumber": "12.71",
              "title": "The Cycle of Seasons in India",
              "sequenceIndex": 72,
              "printedPage": 71,
              "content": "The weather changes throughout the year. Summer, Monsoon, Autumn, Winter and Spring are the main seasons."
            },
            {
              "id": "sec-12-72",
              "type": "section",
              "sectionNumber": "12.72",
              "title": "Summer Season: Heat, Food & Clothing",
              "sequenceIndex": 73,
              "printedPage": 72,
              "content": "Hot winds (loo), cotton clothes, mangoes and cool drinks."
            },
            {
              "id": "sec-12-73",
              "type": "section",
              "sectionNumber": "12.73",
              "title": "Monsoon Season: Rain, Clouds & Raincoats",
              "sequenceIndex": 74,
              "printedPage": 73,
              "content": "Monsoon clouds, raincoats, umbrellas and crops."
            },
            {
              "id": "sec-12-74",
              "type": "section",
              "sectionNumber": "12.74",
              "title": "Winter Season: Cold Weather & Warm Food",
              "sequenceIndex": 75,
              "printedPage": 74,
              "content": "Woollen clothes, heaters, hot soups and snow in mountains."
            },
            {
              "id": "sec-12-75",
              "type": "section",
              "sectionNumber": "12.75",
              "title": "Spring and Autumn Seasons",
              "sequenceIndex": 76,
              "printedPage": 75,
              "content": "Blooming flowers in spring, falling leaves in autumn."
            },
            {
              "id": "sec-12-76",
              "type": "section",
              "sectionNumber": "12.76",
              "title": "Seasonal Activities & Matching Drills",
              "sequenceIndex": 77,
              "printedPage": 76,
              "content": "Matching foods, clothes and activities to seasons."
            },
            {
              "id": "sec-12-77",
              "type": "section",
              "sectionNumber": "12.77",
              "title": "Chapter Revision & Climate Summary",
              "sequenceIndex": 78,
              "printedPage": 77,
              "content": "Key concepts of Indian climate and seasonal cycles."
            }
          ]
        },
        {
          "id": "special-animal-walk",
          "type": "special",
          "subType": "fitness",
          "title": "Animal Walk",
          "startSequenceIndex": 79,
          "endSequenceIndex": 79,
          "printedPage": 78,
          "content": "Fun physical exercise imitating bear walks, frog jumps and crab walks."
        }
      ]
    },
    {
      "id": "unit-4",
      "unitNumber": 4,
      "title": "Unit 4: Our Lovely Planet",
      "startSequenceIndex": 80,
      "endSequenceIndex": 100,
      "items": [
        {
          "id": "special-storytime-luna",
          "type": "special",
          "subType": "art",
          "title": "Storytime: How Luna Got her Dog Back?",
          "startSequenceIndex": 80,
          "endSequenceIndex": 80,
          "printedPage": 79,
          "content": "Illustrated narrative on pet empathy, community helpfulness and animal care."
        },
        {
          "id": "chap-13",
          "type": "chapter",
          "chapterNumber": 13,
          "title": "13. Our Earth",
          "startSequenceIndex": 81,
          "endSequenceIndex": 85,
          "startPrintedPage": 80,
          "endPrintedPage": 84,
          "sections": [
            {
              "id": "sec-13-80",
              "type": "section",
              "sectionNumber": "13.80",
              "title": "Landforms and Oceans of Earth",
              "sequenceIndex": 81,
              "printedPage": 80,
              "content": "The Earth is our home planet. It is made of land and water."
            },
            {
              "id": "sec-13-81",
              "type": "section",
              "sectionNumber": "13.81",
              "title": "Mountains, Hills, Valleys & Plateaus",
              "sequenceIndex": 82,
              "printedPage": 81,
              "content": "Major geographical landforms and their characteristics."
            },
            {
              "id": "sec-13-82",
              "type": "section",
              "sectionNumber": "13.82",
              "title": "Plains, Deserts and Islands",
              "sequenceIndex": 83,
              "printedPage": 82,
              "content": "Flat plains, sandy deserts and islands surrounded by oceans."
            },
            {
              "id": "sec-13-83",
              "type": "section",
              "sectionNumber": "13.83",
              "title": "Globes, Maps and Directions",
              "sequenceIndex": 84,
              "printedPage": 83,
              "content": "North, South, East, West cardinal directions and map keys."
            },
            {
              "id": "sec-13-84",
              "type": "section",
              "sectionNumber": "13.84",
              "title": "Chapter Revision & Geography Drills",
              "sequenceIndex": 85,
              "printedPage": 84,
              "content": "Summary of planet Earth and physical landforms."
            }
          ]
        },
        {
          "id": "chap-14",
          "type": "chapter",
          "chapterNumber": 14,
          "title": "14. I Will Take Care",
          "startSequenceIndex": 86,
          "endSequenceIndex": 90,
          "startPrintedPage": 85,
          "endPrintedPage": 89,
          "sections": [
            {
              "id": "sec-14-85",
              "type": "section",
              "sectionNumber": "14.85",
              "title": "Caring for Our Environment",
              "sequenceIndex": 86,
              "printedPage": 85,
              "content": "We must keep our Earth clean and green by saving water and planting trees."
            },
            {
              "id": "sec-14-86",
              "type": "section",
              "sectionNumber": "14.86",
              "title": "Pollution: Air, Water, Land & Noise",
              "sequenceIndex": 87,
              "printedPage": 86,
              "content": "Causes of environmental pollution and how to prevent them."
            },
            {
              "id": "sec-14-87",
              "type": "section",
              "sectionNumber": "14.87",
              "title": "The 3 Rs: Reduce, Reuse, Recycle",
              "sequenceIndex": 88,
              "printedPage": 87,
              "content": "Waste management and eco-friendly daily practices."
            },
            {
              "id": "sec-14-88",
              "type": "section",
              "sectionNumber": "14.88",
              "title": "Saving Energy and Planting Trees",
              "sequenceIndex": 89,
              "printedPage": 88,
              "content": "Switching off lights, saving paper and community green drives."
            },
            {
              "id": "sec-14-89",
              "type": "section",
              "sectionNumber": "14.89",
              "title": "Chapter Revision & Green Pledge",
              "sequenceIndex": 90,
              "printedPage": 89,
              "content": "Environmental care commitment and chapter summary."
            }
          ]
        },
        {
          "id": "chap-15",
          "type": "chapter",
          "chapterNumber": 15,
          "title": "15. High Above the World",
          "startSequenceIndex": 91,
          "endSequenceIndex": 96,
          "startPrintedPage": 90,
          "endPrintedPage": 95,
          "sections": [
            {
              "id": "sec-15-90",
              "type": "section",
              "sectionNumber": "15.90",
              "title": "The Sun, Moon and Stars",
              "sequenceIndex": 91,
              "printedPage": 90,
              "content": "When we look up at the sky during the day, we see the Sun. At night, we see the Moon and stars."
            },
            {
              "id": "sec-15-91",
              "type": "section",
              "sectionNumber": "15.91",
              "title": "The Solar System and the 8 Planets",
              "sequenceIndex": 92,
              "printedPage": 91,
              "content": "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune."
            },
            {
              "id": "sec-15-92",
              "type": "section",
              "sectionNumber": "15.92",
              "title": "Phases of the Moon",
              "sequenceIndex": 93,
              "printedPage": 92,
              "content": "New moon, crescent, half moon, gibbous and full moon cycle."
            },
            {
              "id": "sec-15-93",
              "type": "section",
              "sectionNumber": "15.93",
              "title": "Constellations & Night Sky Exploration",
              "sequenceIndex": 94,
              "printedPage": 93,
              "content": "Great Bear (Ursa Major), Orion and finding the Pole Star."
            },
            {
              "id": "sec-15-94",
              "type": "section",
              "sectionNumber": "15.94",
              "title": "Space Observation Activities",
              "sequenceIndex": 95,
              "printedPage": 94,
              "content": "Astronomical diagram labeling and night sky recording drills."
            },
            {
              "id": "sec-15-95",
              "type": "section",
              "sectionNumber": "15.95",
              "title": "Chapter Revision & Astronomy Notes",
              "sequenceIndex": 96,
              "printedPage": 95,
              "content": "Summary of the celestial bodies and solar system."
            }
          ]
        },
        {
          "id": "chap-16",
          "type": "chapter",
          "chapterNumber": 16,
          "title": "16. My Country: India",
          "startSequenceIndex": 97,
          "endSequenceIndex": 100,
          "startPrintedPage": 96,
          "endPrintedPage": 99,
          "sections": [
            {
              "id": "sec-16-96",
              "type": "section",
              "sectionNumber": "16.96",
              "title": "National Symbols of India",
              "sequenceIndex": 97,
              "printedPage": 96,
              "content": "India is our motherland. Our national flag is the Tricolour (Tiranga), national bird is Peacock, national animal is Tiger."
            },
            {
              "id": "sec-16-97",
              "type": "section",
              "sectionNumber": "16.97",
              "title": "National Anthem, Emblem & Song",
              "sequenceIndex": 98,
              "printedPage": 97,
              "content": "Jana Gana Mana by Rabindranath Tagore and Ashoka Lion Capital."
            },
            {
              "id": "sec-16-98",
              "type": "section",
              "sectionNumber": "16.98",
              "title": "States, Union Territories & Heritage",
              "sequenceIndex": 99,
              "printedPage": 98,
              "content": "Diversity of languages, food, clothes and cultural heritage of India."
            },
            {
              "id": "sec-16-99",
              "type": "section",
              "sectionNumber": "16.99",
              "title": "Chapter Revision & National Pride Notes",
              "sequenceIndex": 100,
              "printedPage": 99,
              "content": "Key concepts of Indian citizenship and heritage."
            }
          ]
        }
      ]
    },
    {
      "id": "unit-5",
      "unitNumber": 5,
      "title": "Unit 5: Staying Connected",
      "startSequenceIndex": 101,
      "endSequenceIndex": 116,
      "items": [
        {
          "id": "chap-17",
          "type": "chapter",
          "chapterNumber": 17,
          "title": "17. Alia and the Birthday Party",
          "startSequenceIndex": 101,
          "endSequenceIndex": 106,
          "startPrintedPage": 100,
          "endPrintedPage": 105,
          "sections": [
            {
              "id": "sec-17-100",
              "type": "section",
              "sectionNumber": "17.100",
              "title": "Means of Transport and Travel",
              "sequenceIndex": 101,
              "printedPage": 100,
              "content": "We use different vehicles to travel from one place to another."
            },
            {
              "id": "sec-17-101",
              "type": "section",
              "sectionNumber": "17.101",
              "title": "Land Transport: Roadways and Railways",
              "sequenceIndex": 102,
              "printedPage": 101,
              "content": "Bicycles, cars, buses, metro trains and railway tracks."
            },
            {
              "id": "sec-17-102",
              "type": "section",
              "sectionNumber": "17.102",
              "title": "Water and Air Transport",
              "sequenceIndex": 103,
              "printedPage": 102,
              "content": "Boats, ships, aeroplanes, helicopters and airports."
            },
            {
              "id": "sec-17-103",
              "type": "section",
              "sectionNumber": "17.103",
              "title": "Special Vehicles & Emergency Transport",
              "sequenceIndex": 104,
              "printedPage": 103,
              "content": "Ambulances, fire engines, police vans and postal vans."
            },
            {
              "id": "sec-17-104",
              "type": "section",
              "sectionNumber": "17.104",
              "title": "Road Safety & Traffic Signals",
              "sequenceIndex": 105,
              "printedPage": 104,
              "content": "Zebra crossing, traffic lights and pedestrian safety rules."
            },
            {
              "id": "sec-17-105",
              "type": "section",
              "sectionNumber": "17.105",
              "title": "Chapter Revision & Transport Summary",
              "sequenceIndex": 106,
              "printedPage": 105,
              "content": "Summary of transportation modes and travel guidelines."
            }
          ]
        },
        {
          "id": "chap-18",
          "type": "chapter",
          "chapterNumber": 18,
          "title": "18. Communication Today",
          "startSequenceIndex": 107,
          "endSequenceIndex": 113,
          "startPrintedPage": 106,
          "endPrintedPage": 112,
          "sections": [
            {
              "id": "sec-18-106",
              "type": "section",
              "sectionNumber": "18.106",
              "title": "Modern Communication & Devices",
              "sequenceIndex": 107,
              "printedPage": 106,
              "content": "Sending and receiving messages is called communication. We use telephones and computers."
            },
            {
              "id": "sec-18-107",
              "type": "section",
              "sectionNumber": "18.107",
              "title": "Postal Communication: Letters & Postcards",
              "sequenceIndex": 108,
              "printedPage": 107,
              "content": "PIN code, letter boxes, postmen and speed post services."
            },
            {
              "id": "sec-18-108",
              "type": "section",
              "sectionNumber": "18.108",
              "title": "Telecommunication: Phones, Smartphones & SMS",
              "sequenceIndex": 109,
              "printedPage": 108,
              "content": "Landlines, mobile smartphones, voice calls and messaging apps."
            },
            {
              "id": "sec-18-109",
              "type": "section",
              "sectionNumber": "18.109",
              "title": "Mass Communication: Newspapers, Radio & TV",
              "sequenceIndex": 110,
              "printedPage": 109,
              "content": "Broadcasting news and entertainment to millions simultaneously."
            },
            {
              "id": "sec-18-110",
              "type": "section",
              "sectionNumber": "18.110",
              "title": "Internet, Email and Social Media",
              "sequenceIndex": 111,
              "printedPage": 110,
              "content": "World Wide Web, search engines, emails and safe online browsing."
            },
            {
              "id": "sec-18-111",
              "type": "section",
              "sectionNumber": "18.111",
              "title": "Communication Drills & Activities",
              "sequenceIndex": 112,
              "printedPage": 111,
              "content": "Writing postcards and matching communication devices."
            },
            {
              "id": "sec-18-112",
              "type": "section",
              "sectionNumber": "18.112",
              "title": "Chapter Revision & Connectivity Notes",
              "sequenceIndex": 113,
              "printedPage": 112,
              "content": "Summary of interpersonal and mass communication technologies."
            }
          ]
        },
        {
          "id": "special-fitness-activities",
          "type": "special",
          "subType": "fitness",
          "title": "Fitness Activities",
          "startSequenceIndex": 114,
          "endSequenceIndex": 114,
          "printedPage": 113,
          "content": "Outdoor sports, agility drills and physical fitness challenges."
        },
        {
          "id": "assessment-2",
          "type": "assessment",
          "title": "Assessment-II",
          "startSequenceIndex": 115,
          "endSequenceIndex": 115,
          "printedPage": 114,
          "content": "Summative evaluation covering Environment, Earth, Space, National Symbols, Transport and Communication."
        },
        {
          "id": "test-paper-2",
          "type": "test",
          "title": "Test Paper-II",
          "startSequenceIndex": 116,
          "endSequenceIndex": 116,
          "printedPage": 115,
          "content": "End-of-year comprehensive exam evaluating all 5 units of the textbook curriculum."
        }
      ]
    }
  ],
  "chapters": [
    {
      "id": "chap-1",
      "chapterNumber": 1,
      "title": "1. I am Growing Up",
      "unitTitle": "Unit 1: About Me",
      "startPrintedPage": 2,
      "endPrintedPage": 7,
      "startSequenceIndex": 3,
      "endSequenceIndex": 8,
      "sections": [
        {
          "id": "sec-1-2",
          "type": "section",
          "sectionNumber": "1.2",
          "title": "Introduction to How We Grow",
          "sequenceIndex": 3,
          "printedPage": 2,
          "content": "Introduction to human growth, childhood stages, physical changes, and comparing past milestones."
        },
        {
          "id": "sec-1-3",
          "type": "section",
          "sectionNumber": "1.3",
          "title": "Living Things and How They Grow",
          "sequenceIndex": 4,
          "printedPage": 3,
          "content": "Plants, animals and human beings are living things. All living things breathe, need food, water and grow in size. Small plants grow into big plants. All baby animals grow to become big animals. We grow from a little baby to an adult."
        },
        {
          "id": "sec-1-4",
          "type": "section",
          "sectionNumber": "1.4",
          "title": "Hobbies and Growth Activities",
          "sequenceIndex": 5,
          "printedPage": 4,
          "content": "As we grow up, we learn to do many activities. An activity that we do for fun when we are free is called a hobby. Singing, painting, dancing and drawing are hobbies."
        },
        {
          "id": "sec-1-5",
          "type": "section",
          "sectionNumber": "1.5",
          "title": "Childhood Stages & Growth Milestones",
          "sequenceIndex": 6,
          "printedPage": 5,
          "content": "Milestones of human development: infant, toddler, child, teenager and adult stages."
        },
        {
          "id": "sec-1-6",
          "type": "section",
          "sectionNumber": "1.6",
          "title": "Chapter Exercises & Observations",
          "sequenceIndex": 7,
          "printedPage": 6,
          "content": "Interactive observation drills, growth chart recording and self-assessment questions."
        },
        {
          "id": "sec-1-7",
          "type": "section",
          "sectionNumber": "1.7",
          "title": "Key Points & Chapter Revision",
          "sequenceIndex": 8,
          "printedPage": 7,
          "content": "Comprehensive chapter summary and review concepts for growth and development."
        }
      ]
    },
    {
      "id": "chap-2",
      "chapterNumber": 2,
      "title": "2. My Body",
      "unitTitle": "Unit 1: About Me",
      "startPrintedPage": 8,
      "endPrintedPage": 13,
      "startSequenceIndex": 9,
      "endSequenceIndex": 14,
      "sections": [
        {
          "id": "sec-2-8",
          "type": "section",
          "sectionNumber": "2.8",
          "title": "Our Amazing Body Overview",
          "sequenceIndex": 9,
          "printedPage": 8,
          "content": "Overview of the human body structure, head, torso, limbs and sensory organs."
        },
        {
          "id": "sec-2-9",
          "type": "section",
          "sectionNumber": "2.9",
          "title": "External and Internal Organs",
          "sequenceIndex": 10,
          "printedPage": 9,
          "content": "Organs are important parts of our body. Some organs we can see and touch, for example, our sense organs. They are called external organs. Some organs are inside our body. We cannot see them. They are called internal organs."
        },
        {
          "id": "sec-2-10",
          "type": "section",
          "sectionNumber": "2.10",
          "title": "Heart, Lungs, Stomach & Kidneys",
          "sequenceIndex": 11,
          "printedPage": 10,
          "content": "Our body has two lungs, located on either side of our chest. Our lungs help us to breathe. When we breathe the air in, our chest expands. When we breathe out, it contracts. The heart pumps blood to the whole body. There are two kidneys in our body."
        },
        {
          "id": "sec-2-11",
          "type": "section",
          "sectionNumber": "2.11",
          "title": "Bones, Muscles & Good Posture",
          "sequenceIndex": 12,
          "printedPage": 11,
          "content": "Bones give shape to our body and protect inner organs. Muscles help us move."
        },
        {
          "id": "sec-2-12",
          "type": "section",
          "sectionNumber": "2.12",
          "title": "Organ Functions & Practice Drills",
          "sequenceIndex": 13,
          "printedPage": 12,
          "content": "Match the organ activities, true/false questions and diagram labeling drills."
        },
        {
          "id": "sec-2-13",
          "type": "section",
          "sectionNumber": "2.13",
          "title": "Hygiene, Body Care & Revision",
          "sequenceIndex": 14,
          "printedPage": 13,
          "content": "Healthy habits, daily hygiene routines, posture rules and key summary points."
        }
      ]
    },
    {
      "id": "chap-3",
      "chapterNumber": 3,
      "title": "3. Food I Eat",
      "unitTitle": "Unit 1: About Me",
      "startPrintedPage": 14,
      "endPrintedPage": 19,
      "startSequenceIndex": 15,
      "endSequenceIndex": 20,
      "sections": [
        {
          "id": "sec-3-14",
          "type": "section",
          "sectionNumber": "3.14",
          "title": "Importance of Food & Balanced Diet",
          "sequenceIndex": 15,
          "printedPage": 14,
          "content": "There are many types of food items which help our body in different ways. Some of them give us energy to do different types of work. Other food items help us to grow. Some also protect us from falling ill."
        },
        {
          "id": "sec-3-15",
          "type": "section",
          "sectionNumber": "3.15",
          "title": "Energy-Giving, Body-Building & Protective Food",
          "sequenceIndex": 16,
          "printedPage": 15,
          "content": "Carbohydrates, fats, proteins, vitamins and minerals in our daily food."
        },
        {
          "id": "sec-3-16",
          "type": "section",
          "sectionNumber": "3.16",
          "title": "Sources of Food: Plants and Animals",
          "sequenceIndex": 17,
          "printedPage": 16,
          "content": "Cereals, pulses, vegetables, fruits, milk, eggs and honey."
        },
        {
          "id": "sec-3-17",
          "type": "section",
          "sectionNumber": "3.17",
          "title": "Meals of the Day & Healthy Habits",
          "sequenceIndex": 18,
          "printedPage": 17,
          "content": "Breakfast, lunch and dinner routines; drinking clean water and avoiding junk food."
        },
        {
          "id": "sec-3-18",
          "type": "section",
          "sectionNumber": "3.18",
          "title": "Chapter Practice & Revision Summary",
          "sequenceIndex": 19,
          "printedPage": 18,
          "content": "Fill in the blanks, food group sorting exercises and chapter highlights."
        },
        {
          "id": "sec-3-19",
          "type": "section",
          "sectionNumber": "3.19",
          "title": "Food Hygiene & Summary Activities",
          "sequenceIndex": 20,
          "printedPage": 19,
          "content": "Safe food storage, washing hands and unit review points."
        }
      ]
    },
    {
      "id": "chap-4",
      "chapterNumber": 4,
      "title": "4. Clothes I Wear",
      "unitTitle": "Unit 1: About Me",
      "startPrintedPage": 20,
      "endPrintedPage": 26,
      "startSequenceIndex": 21,
      "endSequenceIndex": 27,
      "sections": [
        {
          "id": "sec-4-20",
          "type": "section",
          "sectionNumber": "4.20",
          "title": "We Need Clothes & Seasonal Wear",
          "sequenceIndex": 21,
          "printedPage": 20,
          "content": "Clothes protect us from heat, cold, rain, snow, dust and insect bites. Cotton clothes in summer, woollen in winter."
        },
        {
          "id": "sec-4-21",
          "type": "section",
          "sectionNumber": "4.21",
          "title": "Natural and Synthetic Fibres",
          "sequenceIndex": 22,
          "printedPage": 21,
          "content": "Cotton from cotton plants, silk from silkworms, wool from sheep."
        },
        {
          "id": "sec-4-22",
          "type": "section",
          "sectionNumber": "4.22",
          "title": "Uniforms and Traditional Costumes",
          "sequenceIndex": 23,
          "printedPage": 22,
          "content": "Special clothes for doctors, police, students and regional traditional attire."
        },
        {
          "id": "sec-4-23",
          "type": "section",
          "sectionNumber": "4.23",
          "title": "Care and Cleaning of Clothes",
          "sequenceIndex": 24,
          "printedPage": 23,
          "content": "Washing, drying, ironing and storing clothes with mothballs."
        },
        {
          "id": "sec-4-24",
          "type": "section",
          "sectionNumber": "4.24",
          "title": "Clothing Activities & Exercises",
          "sequenceIndex": 25,
          "printedPage": 24,
          "content": "Matching fibres to sources and seasonal clothing identification drills."
        },
        {
          "id": "sec-4-25",
          "type": "section",
          "sectionNumber": "4.25",
          "title": "Chapter Revision & Key Notes",
          "sequenceIndex": 26,
          "printedPage": 25,
          "content": "Summary notes for clothing types, fibres and hygiene."
        },
        {
          "id": "sec-4-26",
          "type": "section",
          "sectionNumber": "4.26",
          "title": "Unit 1 Clothing Summary & Drills",
          "sequenceIndex": 27,
          "printedPage": 26,
          "content": "Final review questions on clothes and seasons."
        }
      ]
    },
    {
      "id": "chap-5",
      "chapterNumber": 5,
      "title": "5. I Celebrate",
      "unitTitle": "Unit 1: About Me",
      "startPrintedPage": 27,
      "endPrintedPage": 31,
      "startSequenceIndex": 28,
      "endSequenceIndex": 32,
      "sections": [
        {
          "id": "sec-5-27",
          "type": "section",
          "sectionNumber": "5.27",
          "title": "Festivals, Celebrations & Togetherness",
          "sequenceIndex": 28,
          "printedPage": 27,
          "content": "We celebrate many festivals with our family and friends. Festivals bring joy and happiness. We wear new clothes, eat delicious food and share gifts."
        },
        {
          "id": "sec-5-28",
          "type": "section",
          "sectionNumber": "5.28",
          "title": "National and Religious Festivals",
          "sequenceIndex": 29,
          "printedPage": 28,
          "content": "Independence Day, Republic Day, Gandhi Jayanti, Diwali, Eid, Christmas and Gurpurab."
        },
        {
          "id": "sec-5-29",
          "type": "section",
          "sectionNumber": "5.29",
          "title": "Harvest Festivals of India",
          "sequenceIndex": 30,
          "printedPage": 29,
          "content": "Pongal, Bihu, Onam, Baisakhi and Makar Sankranti harvest traditions."
        },
        {
          "id": "sec-5-30",
          "type": "section",
          "sectionNumber": "5.30",
          "title": "Festival Activities & Food Specials",
          "sequenceIndex": 31,
          "printedPage": 30,
          "content": "Traditional sweets, rangoli art and family greetings."
        },
        {
          "id": "sec-5-31",
          "type": "section",
          "sectionNumber": "5.31",
          "title": "Chapter Summary & Unit Revision",
          "sequenceIndex": 32,
          "printedPage": 31,
          "content": "Key points on unity in diversity and festival celebrations."
        }
      ]
    },
    {
      "id": "chap-6",
      "chapterNumber": 6,
      "title": "6. I Live With Them",
      "unitTitle": "Unit 2: Our Surroundings",
      "startPrintedPage": 34,
      "endPrintedPage": 37,
      "startSequenceIndex": 35,
      "endSequenceIndex": 38,
      "sections": [
        {
          "id": "sec-6-34",
          "type": "section",
          "sectionNumber": "6.34",
          "title": "Family Types and Relationships",
          "sequenceIndex": 35,
          "printedPage": 34,
          "content": "Nuclear families have a small number of family members. Joint families have more members. Family members take care of each other."
        },
        {
          "id": "sec-6-35",
          "type": "section",
          "sectionNumber": "6.35",
          "title": "Roles and Responsibilities in Family",
          "sequenceIndex": 36,
          "printedPage": 35,
          "content": "Helping parents, respecting elders and sharing household chores."
        },
        {
          "id": "sec-6-36",
          "type": "section",
          "sectionNumber": "6.36",
          "title": "Family Trees and Heredity Traits",
          "sequenceIndex": 37,
          "printedPage": 36,
          "content": "Understanding family lineages and similar physical traits."
        },
        {
          "id": "sec-6-37",
          "type": "section",
          "sectionNumber": "6.37",
          "title": "Chapter Exercises & Revision Summary",
          "sequenceIndex": 38,
          "printedPage": 37,
          "content": "Family relations exercises and chapter key points."
        }
      ]
    },
    {
      "id": "chap-7",
      "chapterNumber": 7,
      "title": "7. Where I Stay",
      "unitTitle": "Unit 2: Our Surroundings",
      "startPrintedPage": 38,
      "endPrintedPage": 43,
      "startSequenceIndex": 39,
      "endSequenceIndex": 44,
      "sections": [
        {
          "id": "sec-7-38",
          "type": "section",
          "sectionNumber": "7.38",
          "title": "Kinds of Houses and Shelter",
          "sequenceIndex": 39,
          "printedPage": 38,
          "content": "A house protects us from bad weather and keeps us safe. Kuchcha houses are made of straw, mud and wood. Pucca houses are made of bricks, cement, wood and steel."
        },
        {
          "id": "sec-7-39",
          "type": "section",
          "sectionNumber": "7.39",
          "title": "Special Houses: Caravans, Houseboats & Igloos",
          "sequenceIndex": 40,
          "printedPage": 39,
          "content": "Temporary houses, stilt houses and igloos in arctic regions."
        },
        {
          "id": "sec-7-40",
          "type": "section",
          "sectionNumber": "7.40",
          "title": "Building Materials and Construction Workers",
          "sequenceIndex": 41,
          "printedPage": 40,
          "content": "Architects, masons, carpenters, plumbers and electricians."
        },
        {
          "id": "sec-7-41",
          "type": "section",
          "sectionNumber": "7.41",
          "title": "Keeping Our Home Clean and Safe",
          "sequenceIndex": 42,
          "printedPage": 41,
          "content": "Ventilation, sunlight, garbage disposal and sanitation."
        },
        {
          "id": "sec-7-42",
          "type": "section",
          "sectionNumber": "7.42",
          "title": "House Activities & Practice Drills",
          "sequenceIndex": 43,
          "printedPage": 42,
          "content": "Matching house types to regions and building materials."
        },
        {
          "id": "sec-7-43",
          "type": "section",
          "sectionNumber": "7.43",
          "title": "Chapter Revision & Shelter Summary",
          "sequenceIndex": 44,
          "printedPage": 43,
          "content": "Key concepts of human shelter and architecture."
        }
      ]
    },
    {
      "id": "chap-8",
      "chapterNumber": 8,
      "title": "8. Our Neighbourhood",
      "unitTitle": "Unit 2: Our Surroundings",
      "startPrintedPage": 44,
      "endPrintedPage": 49,
      "startSequenceIndex": 45,
      "endSequenceIndex": 50,
      "sections": [
        {
          "id": "sec-8-44",
          "type": "section",
          "sectionNumber": "8.44",
          "title": "Places in Our Neighbourhood",
          "sequenceIndex": 45,
          "printedPage": 44,
          "content": "The area around our house is our neighbourhood. People who live near our house are our neighbours. A good neighbourhood has schools, hospitals, markets and parks."
        },
        {
          "id": "sec-8-45",
          "type": "section",
          "sectionNumber": "8.45",
          "title": "Community Helpers & Services",
          "sequenceIndex": 46,
          "printedPage": 45,
          "content": "Police stations, fire stations, post offices and banks."
        },
        {
          "id": "sec-8-46",
          "type": "section",
          "sectionNumber": "8.46",
          "title": "Places of Worship & Recreation",
          "sequenceIndex": 47,
          "printedPage": 46,
          "content": "Parks, playgrounds, libraries and places of worship."
        },
        {
          "id": "sec-8-47",
          "type": "section",
          "sectionNumber": "8.47",
          "title": "Being a Good Neighbor & Clean Surroundings",
          "sequenceIndex": 48,
          "printedPage": 47,
          "content": "Civic sense, noise control and keeping neighborhood parks green."
        },
        {
          "id": "sec-8-48",
          "type": "section",
          "sectionNumber": "8.48",
          "title": "Neighborhood Map & Location Drills",
          "sequenceIndex": 49,
          "printedPage": 48,
          "content": "Reading simple neighborhood maps and landmarks."
        },
        {
          "id": "sec-8-49",
          "type": "section",
          "sectionNumber": "8.49",
          "title": "Chapter Revision & Key Neighborhood Notes",
          "sequenceIndex": 50,
          "printedPage": 49,
          "content": "Summary of community places, services and helpers."
        }
      ]
    },
    {
      "id": "chap-9",
      "chapterNumber": 9,
      "title": "9. My Green Friends",
      "unitTitle": "Unit 3: Our Environment",
      "startPrintedPage": 54,
      "endPrintedPage": 59,
      "startSequenceIndex": 55,
      "endSequenceIndex": 60,
      "sections": [
        {
          "id": "sec-9-54",
          "type": "section",
          "sectionNumber": "9.54",
          "title": "Plants Around Us & Photosynthesis",
          "sequenceIndex": 55,
          "printedPage": 54,
          "content": "Plants are our green friends. They give us clean air, food, wood and medicines."
        },
        {
          "id": "sec-9-55",
          "type": "section",
          "sectionNumber": "9.55",
          "title": "Types of Plants: Trees, Shrubs, Herbs & Climbers",
          "sequenceIndex": 56,
          "printedPage": 55,
          "content": "Classifying plant types by stem strength and lifespan."
        },
        {
          "id": "sec-9-56",
          "type": "section",
          "sectionNumber": "9.56",
          "title": "Parts of a Plant and Their Functions",
          "sequenceIndex": 57,
          "printedPage": 56,
          "content": "Roots, stems, leaves, flowers and fruit roles in plant life."
        },
        {
          "id": "sec-9-57",
          "type": "section",
          "sectionNumber": "9.57",
          "title": "Uses of Plants and Care for Nature",
          "sequenceIndex": 58,
          "printedPage": 57,
          "content": "Medicines, timber, oxygen, food crops and afforestation."
        },
        {
          "id": "sec-9-58",
          "type": "section",
          "sectionNumber": "9.58",
          "title": "Plant Activities & Leaf Rubbing Drills",
          "sequenceIndex": 59,
          "printedPage": 58,
          "content": "Botanical observation drills and leaf structure activities."
        },
        {
          "id": "sec-9-59",
          "type": "section",
          "sectionNumber": "9.59",
          "title": "Chapter Revision & Botany Key Notes",
          "sequenceIndex": 60,
          "printedPage": 59,
          "content": "Summary of plant anatomy and environmental value."
        }
      ]
    },
    {
      "id": "chap-10",
      "chapterNumber": 10,
      "title": "10. The Animal Kingdom",
      "unitTitle": "Unit 3: Our Environment",
      "startPrintedPage": 60,
      "endPrintedPage": 65,
      "startSequenceIndex": 61,
      "endSequenceIndex": 66,
      "sections": [
        {
          "id": "sec-10-60",
          "type": "section",
          "sectionNumber": "10.60",
          "title": "Wild and Domestic Animals",
          "sequenceIndex": 61,
          "printedPage": 60,
          "content": "Animals live all around the world. Domestic animals live on farms or in homes. Wild animals live in forests."
        },
        {
          "id": "sec-10-61",
          "type": "section",
          "sectionNumber": "10.61",
          "title": "Animal Habitats: Land, Water & Amphibians",
          "sequenceIndex": 62,
          "printedPage": 61,
          "content": "Terrestrial, aquatic, aerial and arboreal animal environments."
        },
        {
          "id": "sec-10-62",
          "type": "section",
          "sectionNumber": "10.62",
          "title": "Food Habits: Herbivores, Carnivores & Omnivores",
          "sequenceIndex": 63,
          "printedPage": 62,
          "content": "Food chains and nutritional adaptations in wildlife."
        },
        {
          "id": "sec-10-63",
          "type": "section",
          "sectionNumber": "10.63",
          "title": "Animal Homes and Shelters",
          "sequenceIndex": 64,
          "printedPage": 63,
          "content": "Nests, burrows, dens, beehives and stables."
        },
        {
          "id": "sec-10-64",
          "type": "section",
          "sectionNumber": "10.64",
          "title": "Animal Care & Protection Drills",
          "sequenceIndex": 65,
          "printedPage": 64,
          "content": "Kindness to animals and wildlife conservation questions."
        },
        {
          "id": "sec-10-65",
          "type": "section",
          "sectionNumber": "10.65",
          "title": "Chapter Revision & Zoology Notes",
          "sequenceIndex": 66,
          "printedPage": 65,
          "content": "Key concepts of animal kingdom and habitats."
        }
      ]
    },
    {
      "id": "chap-11",
      "chapterNumber": 11,
      "title": "11. Air and Water",
      "unitTitle": "Unit 3: Our Environment",
      "startPrintedPage": 66,
      "endPrintedPage": 70,
      "startSequenceIndex": 67,
      "endSequenceIndex": 71,
      "sections": [
        {
          "id": "sec-11-66",
          "type": "section",
          "sectionNumber": "11.66",
          "title": "Importance of Clean Air & Water",
          "sequenceIndex": 67,
          "printedPage": 66,
          "content": "All living things need air and water to survive. Moving air is called wind."
        },
        {
          "id": "sec-11-67",
          "type": "section",
          "sectionNumber": "11.67",
          "title": "Properties of Air: Weight, Pressure & Space",
          "sequenceIndex": 68,
          "printedPage": 67,
          "content": "Air occupies space, exerts pressure and contains oxygen."
        },
        {
          "id": "sec-11-68",
          "type": "section",
          "sectionNumber": "11.68",
          "title": "Water Sources and Water Cycle",
          "sequenceIndex": 69,
          "printedPage": 68,
          "content": "Evaporation, condensation, precipitation and ground water."
        },
        {
          "id": "sec-11-69",
          "type": "section",
          "sectionNumber": "11.69",
          "title": "Water Purification and Conservation",
          "sequenceIndex": 70,
          "printedPage": 69,
          "content": "Boiling, filtration, rainwater harvesting and saving water."
        },
        {
          "id": "sec-11-70",
          "type": "section",
          "sectionNumber": "11.70",
          "title": "Chapter Revision & Eco Experiments",
          "sequenceIndex": 71,
          "printedPage": 70,
          "content": "Summary and practical water conservation tips."
        }
      ]
    },
    {
      "id": "chap-12",
      "chapterNumber": 12,
      "title": "12. Seasons",
      "unitTitle": "Unit 3: Our Environment",
      "startPrintedPage": 71,
      "endPrintedPage": 77,
      "startSequenceIndex": 72,
      "endSequenceIndex": 78,
      "sections": [
        {
          "id": "sec-12-71",
          "type": "section",
          "sectionNumber": "12.71",
          "title": "The Cycle of Seasons in India",
          "sequenceIndex": 72,
          "printedPage": 71,
          "content": "The weather changes throughout the year. Summer, Monsoon, Autumn, Winter and Spring are the main seasons."
        },
        {
          "id": "sec-12-72",
          "type": "section",
          "sectionNumber": "12.72",
          "title": "Summer Season: Heat, Food & Clothing",
          "sequenceIndex": 73,
          "printedPage": 72,
          "content": "Hot winds (loo), cotton clothes, mangoes and cool drinks."
        },
        {
          "id": "sec-12-73",
          "type": "section",
          "sectionNumber": "12.73",
          "title": "Monsoon Season: Rain, Clouds & Raincoats",
          "sequenceIndex": 74,
          "printedPage": 73,
          "content": "Monsoon clouds, raincoats, umbrellas and crops."
        },
        {
          "id": "sec-12-74",
          "type": "section",
          "sectionNumber": "12.74",
          "title": "Winter Season: Cold Weather & Warm Food",
          "sequenceIndex": 75,
          "printedPage": 74,
          "content": "Woollen clothes, heaters, hot soups and snow in mountains."
        },
        {
          "id": "sec-12-75",
          "type": "section",
          "sectionNumber": "12.75",
          "title": "Spring and Autumn Seasons",
          "sequenceIndex": 76,
          "printedPage": 75,
          "content": "Blooming flowers in spring, falling leaves in autumn."
        },
        {
          "id": "sec-12-76",
          "type": "section",
          "sectionNumber": "12.76",
          "title": "Seasonal Activities & Matching Drills",
          "sequenceIndex": 77,
          "printedPage": 76,
          "content": "Matching foods, clothes and activities to seasons."
        },
        {
          "id": "sec-12-77",
          "type": "section",
          "sectionNumber": "12.77",
          "title": "Chapter Revision & Climate Summary",
          "sequenceIndex": 78,
          "printedPage": 77,
          "content": "Key concepts of Indian climate and seasonal cycles."
        }
      ]
    },
    {
      "id": "chap-13",
      "chapterNumber": 13,
      "title": "13. Our Earth",
      "unitTitle": "Unit 4: Our Lovely Planet",
      "startPrintedPage": 80,
      "endPrintedPage": 84,
      "startSequenceIndex": 81,
      "endSequenceIndex": 85,
      "sections": [
        {
          "id": "sec-13-80",
          "type": "section",
          "sectionNumber": "13.80",
          "title": "Landforms and Oceans of Earth",
          "sequenceIndex": 81,
          "printedPage": 80,
          "content": "The Earth is our home planet. It is made of land and water."
        },
        {
          "id": "sec-13-81",
          "type": "section",
          "sectionNumber": "13.81",
          "title": "Mountains, Hills, Valleys & Plateaus",
          "sequenceIndex": 82,
          "printedPage": 81,
          "content": "Major geographical landforms and their characteristics."
        },
        {
          "id": "sec-13-82",
          "type": "section",
          "sectionNumber": "13.82",
          "title": "Plains, Deserts and Islands",
          "sequenceIndex": 83,
          "printedPage": 82,
          "content": "Flat plains, sandy deserts and islands surrounded by oceans."
        },
        {
          "id": "sec-13-83",
          "type": "section",
          "sectionNumber": "13.83",
          "title": "Globes, Maps and Directions",
          "sequenceIndex": 84,
          "printedPage": 83,
          "content": "North, South, East, West cardinal directions and map keys."
        },
        {
          "id": "sec-13-84",
          "type": "section",
          "sectionNumber": "13.84",
          "title": "Chapter Revision & Geography Drills",
          "sequenceIndex": 85,
          "printedPage": 84,
          "content": "Summary of planet Earth and physical landforms."
        }
      ]
    },
    {
      "id": "chap-14",
      "chapterNumber": 14,
      "title": "14. I Will Take Care",
      "unitTitle": "Unit 4: Our Lovely Planet",
      "startPrintedPage": 85,
      "endPrintedPage": 89,
      "startSequenceIndex": 86,
      "endSequenceIndex": 90,
      "sections": [
        {
          "id": "sec-14-85",
          "type": "section",
          "sectionNumber": "14.85",
          "title": "Caring for Our Environment",
          "sequenceIndex": 86,
          "printedPage": 85,
          "content": "We must keep our Earth clean and green by saving water and planting trees."
        },
        {
          "id": "sec-14-86",
          "type": "section",
          "sectionNumber": "14.86",
          "title": "Pollution: Air, Water, Land & Noise",
          "sequenceIndex": 87,
          "printedPage": 86,
          "content": "Causes of environmental pollution and how to prevent them."
        },
        {
          "id": "sec-14-87",
          "type": "section",
          "sectionNumber": "14.87",
          "title": "The 3 Rs: Reduce, Reuse, Recycle",
          "sequenceIndex": 88,
          "printedPage": 87,
          "content": "Waste management and eco-friendly daily practices."
        },
        {
          "id": "sec-14-88",
          "type": "section",
          "sectionNumber": "14.88",
          "title": "Saving Energy and Planting Trees",
          "sequenceIndex": 89,
          "printedPage": 88,
          "content": "Switching off lights, saving paper and community green drives."
        },
        {
          "id": "sec-14-89",
          "type": "section",
          "sectionNumber": "14.89",
          "title": "Chapter Revision & Green Pledge",
          "sequenceIndex": 90,
          "printedPage": 89,
          "content": "Environmental care commitment and chapter summary."
        }
      ]
    },
    {
      "id": "chap-15",
      "chapterNumber": 15,
      "title": "15. High Above the World",
      "unitTitle": "Unit 4: Our Lovely Planet",
      "startPrintedPage": 90,
      "endPrintedPage": 95,
      "startSequenceIndex": 91,
      "endSequenceIndex": 96,
      "sections": [
        {
          "id": "sec-15-90",
          "type": "section",
          "sectionNumber": "15.90",
          "title": "The Sun, Moon and Stars",
          "sequenceIndex": 91,
          "printedPage": 90,
          "content": "When we look up at the sky during the day, we see the Sun. At night, we see the Moon and stars."
        },
        {
          "id": "sec-15-91",
          "type": "section",
          "sectionNumber": "15.91",
          "title": "The Solar System and the 8 Planets",
          "sequenceIndex": 92,
          "printedPage": 91,
          "content": "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune."
        },
        {
          "id": "sec-15-92",
          "type": "section",
          "sectionNumber": "15.92",
          "title": "Phases of the Moon",
          "sequenceIndex": 93,
          "printedPage": 92,
          "content": "New moon, crescent, half moon, gibbous and full moon cycle."
        },
        {
          "id": "sec-15-93",
          "type": "section",
          "sectionNumber": "15.93",
          "title": "Constellations & Night Sky Exploration",
          "sequenceIndex": 94,
          "printedPage": 93,
          "content": "Great Bear (Ursa Major), Orion and finding the Pole Star."
        },
        {
          "id": "sec-15-94",
          "type": "section",
          "sectionNumber": "15.94",
          "title": "Space Observation Activities",
          "sequenceIndex": 95,
          "printedPage": 94,
          "content": "Astronomical diagram labeling and night sky recording drills."
        },
        {
          "id": "sec-15-95",
          "type": "section",
          "sectionNumber": "15.95",
          "title": "Chapter Revision & Astronomy Notes",
          "sequenceIndex": 96,
          "printedPage": 95,
          "content": "Summary of the celestial bodies and solar system."
        }
      ]
    },
    {
      "id": "chap-16",
      "chapterNumber": 16,
      "title": "16. My Country: India",
      "unitTitle": "Unit 4: Our Lovely Planet",
      "startPrintedPage": 96,
      "endPrintedPage": 99,
      "startSequenceIndex": 97,
      "endSequenceIndex": 100,
      "sections": [
        {
          "id": "sec-16-96",
          "type": "section",
          "sectionNumber": "16.96",
          "title": "National Symbols of India",
          "sequenceIndex": 97,
          "printedPage": 96,
          "content": "India is our motherland. Our national flag is the Tricolour (Tiranga), national bird is Peacock, national animal is Tiger."
        },
        {
          "id": "sec-16-97",
          "type": "section",
          "sectionNumber": "16.97",
          "title": "National Anthem, Emblem & Song",
          "sequenceIndex": 98,
          "printedPage": 97,
          "content": "Jana Gana Mana by Rabindranath Tagore and Ashoka Lion Capital."
        },
        {
          "id": "sec-16-98",
          "type": "section",
          "sectionNumber": "16.98",
          "title": "States, Union Territories & Heritage",
          "sequenceIndex": 99,
          "printedPage": 98,
          "content": "Diversity of languages, food, clothes and cultural heritage of India."
        },
        {
          "id": "sec-16-99",
          "type": "section",
          "sectionNumber": "16.99",
          "title": "Chapter Revision & National Pride Notes",
          "sequenceIndex": 100,
          "printedPage": 99,
          "content": "Key concepts of Indian citizenship and heritage."
        }
      ]
    },
    {
      "id": "chap-17",
      "chapterNumber": 17,
      "title": "17. Alia and the Birthday Party",
      "unitTitle": "Unit 5: Staying Connected",
      "startPrintedPage": 100,
      "endPrintedPage": 105,
      "startSequenceIndex": 101,
      "endSequenceIndex": 106,
      "sections": [
        {
          "id": "sec-17-100",
          "type": "section",
          "sectionNumber": "17.100",
          "title": "Means of Transport and Travel",
          "sequenceIndex": 101,
          "printedPage": 100,
          "content": "We use different vehicles to travel from one place to another."
        },
        {
          "id": "sec-17-101",
          "type": "section",
          "sectionNumber": "17.101",
          "title": "Land Transport: Roadways and Railways",
          "sequenceIndex": 102,
          "printedPage": 101,
          "content": "Bicycles, cars, buses, metro trains and railway tracks."
        },
        {
          "id": "sec-17-102",
          "type": "section",
          "sectionNumber": "17.102",
          "title": "Water and Air Transport",
          "sequenceIndex": 103,
          "printedPage": 102,
          "content": "Boats, ships, aeroplanes, helicopters and airports."
        },
        {
          "id": "sec-17-103",
          "type": "section",
          "sectionNumber": "17.103",
          "title": "Special Vehicles & Emergency Transport",
          "sequenceIndex": 104,
          "printedPage": 103,
          "content": "Ambulances, fire engines, police vans and postal vans."
        },
        {
          "id": "sec-17-104",
          "type": "section",
          "sectionNumber": "17.104",
          "title": "Road Safety & Traffic Signals",
          "sequenceIndex": 105,
          "printedPage": 104,
          "content": "Zebra crossing, traffic lights and pedestrian safety rules."
        },
        {
          "id": "sec-17-105",
          "type": "section",
          "sectionNumber": "17.105",
          "title": "Chapter Revision & Transport Summary",
          "sequenceIndex": 106,
          "printedPage": 105,
          "content": "Summary of transportation modes and travel guidelines."
        }
      ]
    },
    {
      "id": "chap-18",
      "chapterNumber": 18,
      "title": "18. Communication Today",
      "unitTitle": "Unit 5: Staying Connected",
      "startPrintedPage": 106,
      "endPrintedPage": 112,
      "startSequenceIndex": 107,
      "endSequenceIndex": 113,
      "sections": [
        {
          "id": "sec-18-106",
          "type": "section",
          "sectionNumber": "18.106",
          "title": "Modern Communication & Devices",
          "sequenceIndex": 107,
          "printedPage": 106,
          "content": "Sending and receiving messages is called communication. We use telephones and computers."
        },
        {
          "id": "sec-18-107",
          "type": "section",
          "sectionNumber": "18.107",
          "title": "Postal Communication: Letters & Postcards",
          "sequenceIndex": 108,
          "printedPage": 107,
          "content": "PIN code, letter boxes, postmen and speed post services."
        },
        {
          "id": "sec-18-108",
          "type": "section",
          "sectionNumber": "18.108",
          "title": "Telecommunication: Phones, Smartphones & SMS",
          "sequenceIndex": 109,
          "printedPage": 108,
          "content": "Landlines, mobile smartphones, voice calls and messaging apps."
        },
        {
          "id": "sec-18-109",
          "type": "section",
          "sectionNumber": "18.109",
          "title": "Mass Communication: Newspapers, Radio & TV",
          "sequenceIndex": 110,
          "printedPage": 109,
          "content": "Broadcasting news and entertainment to millions simultaneously."
        },
        {
          "id": "sec-18-110",
          "type": "section",
          "sectionNumber": "18.110",
          "title": "Internet, Email and Social Media",
          "sequenceIndex": 111,
          "printedPage": 110,
          "content": "World Wide Web, search engines, emails and safe online browsing."
        },
        {
          "id": "sec-18-111",
          "type": "section",
          "sectionNumber": "18.111",
          "title": "Communication Drills & Activities",
          "sequenceIndex": 112,
          "printedPage": 111,
          "content": "Writing postcards and matching communication devices."
        },
        {
          "id": "sec-18-112",
          "type": "section",
          "sectionNumber": "18.112",
          "title": "Chapter Revision & Connectivity Notes",
          "sequenceIndex": 113,
          "printedPage": 112,
          "content": "Summary of interpersonal and mass communication technologies."
        }
      ]
    }
  ],
  "validation": {
    "sourceConservationPassed": true,
    "sequenceContinuityPassed": true,
    "duplicateSources": 0,
    "missingSources": 0,
    "totalPhysicalPages": 59,
    "totalSourceRecords": 116,
    "status": "READY",
    "auditedAt": "2026-08-28T18:46:52.050Z"
  }
};

export default function MaterialDetailPage({ params }: { params: { id: string } }) {
  const [material, setMaterial] = useState<any>({
    id: params.id,
    title: fallbackManifest.material.bookTitle,
    status: 'ACTIVE',
  });
  const [manifestData, setManifestData] = useState<any>(fallbackManifest);
  const [isStudioMode, setIsStudioMode] = useState<boolean>(true);

  // Active Reading Order Sequence Index (1..116)
  // Default to Sequence Index 2 (Festivals of India - first lesson page)
  const [activeSequenceIndex, setActiveSequenceIndex] = useState<number>(2);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/materials/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setMaterial(data);
          if (data.sourceSequence && data.sourceSequence.length > 0) {
            setManifestData(data);
          }
        }
      } catch (err) {
        console.warn('Using authoritative Ingestion Manifest fallback');
      }
    }
    loadData();
  }, [params.id]);

  const sourceSequence = manifestData.sourceSequence || manifestData.sourcePages || [];
  const safeSequenceIndex = Math.min(Math.max(1, activeSequenceIndex), sourceSequence.length || 116);
  const activeSourcePage = sourceSequence[safeSequenceIndex - 1] || sourceSequence[0];

  const structureData: any = {
    material: {
      id: material.id,
      title: material.title || manifestData.material.bookTitle,
      subtitle: 'Environmental Studies Class 5',
    },
    bookTitle: material.title || manifestData.material.bookTitle,
    totalPages: manifestData.material.physicalPdfPages || 59,
    units: manifestData.units,
    chapters: manifestData.chapters || [],
  };

  // Derive active context from the canonical source record structure mapping
  const struct = activeSourcePage?.structure || {};
  const activeUnit = (manifestData?.units || []).find((u: any) => u.id === struct.unitId) || { title: struct.unitTitle || 'Unit 1: About Me' };
  const activeChapter = (manifestData?.chapters || []).find((c: any) => c.id === struct.chapterId) || { id: struct.chapterId, title: struct.chapterTitle || activeSourcePage?.title || 'Chapter' };
  const activeSectionTitle = struct.sectionTitle || activeSourcePage?.title || `Sequence #${safeSequenceIndex}`;

  const cleanConceptName = activeSectionTitle.replace(/^(\d+\.\d+|TOC|★|📝)\s*/, '').trim();

  // Navigation handlers (Conservation-verified sequential stepping)
  const handleNextSource = () => {
    if (safeSequenceIndex < sourceSequence.length) {
      setActiveSequenceIndex(safeSequenceIndex + 1);
    }
  };

  const handlePrevSource = () => {
    if (safeSequenceIndex > 1) {
      setActiveSequenceIndex(safeSequenceIndex - 1);
    }
  };

  const handleSelectFromStructure = (node: any, parent: any) => {
    if (node?.sequenceIndex) {
      setActiveSequenceIndex(node.sequenceIndex);
    } else if (node?.startSequenceIndex) {
      setActiveSequenceIndex(node.startSequenceIndex);
    } else if (node?.sourceIndex) {
      setActiveSequenceIndex(node.sourceIndex);
    } else if (node?.startSourceIndex) {
      setActiveSequenceIndex(node.startSourceIndex);
    } else if (parent?.startSequenceIndex) {
      setActiveSequenceIndex(parent.startSequenceIndex);
    } else if (node?.id === 'toc-index') {
      setActiveSequenceIndex(1);
    } else if (node?.printedPage !== undefined) {
      const foundIdx = sourceSequence.findIndex(
        (s: any) => s.printed?.number === node.printedPage || s.printedPage === node.printedPage
      );
      if (foundIdx >= 0) {
        setActiveSequenceIndex(foundIdx + 1);
      }
    }
  };

  const currentTopicBreadcrumbs = [
    { label: 'Library', href: '/library' },
    { label: material.title || manifestData.material.bookTitle, href: `/library/${material.id}` },
    { label: activeUnit.title },
    { label: activeChapter?.title || activeSectionTitle },
    { label: activeSectionTitle, active: true },
  ];

  if (isStudioMode) {
    return (
      <LearningShell
        header={
          <LearningHeader
            brandName="EKAGURU"
            breadcrumbs={currentTopicBreadcrumbs}
            status={material.status === 'ACTIVE' ? 'READY' : 'PROCESSING'}
            learnerMode={true}
            onBack={() => setIsStudioMode(false)}
            backHref="/library"
            userProfile={{ name: 'Arjun Kumar', role: 'Student' }}
          />
        }
        leftRail={
          <LearningLeftRail
            bookTitle={material.title || manifestData.material.bookTitle}
            subjectGrade="Environmental Studies Class 5"
          >
            <LearningBookStructure
              structure={structureData}
              activeSectionId={struct.sectionId || activeSourcePage?.sourceId}
              onSelectSection={handleSelectFromStructure}
            />
          </LearningLeftRail>
        }
        rightRail={<LearningRightRail />}
        footer={<LearningBottomNav />}
      >
        {/* Navigation Tabs */}
        <LearningTabs />

        {/* Center Split Learning Workspace: Module 05 + Module 06 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[600px]">
          {/* MODULE 05: Original Book Content Viewer */}
          <LearningOriginalBookViewer
            materialId={material.id}
            sourcePage={activeSourcePage}
            totalSourcePages={sourceSequence.length}
            totalPdfPages={manifestData.material.physicalPdfPages || 59}
            totalPrintedPages={manifestData.material.logicalPrintedPages || 116}
            sectionTitle={activeSectionTitle}
            sourceTitle={`${material.title || manifestData.material.bookTitle} – NCERT`}
            extractedContent={activeSourcePage?.content || ''}
            onPreviousPage={handlePrevSource}
            onNextPage={handleNextSource}
          />

          {/* MODULE 06: EKAGURU Knowledge Construction Companion */}
          <LearningExplanationPanel
            sectionId={struct.sectionId || activeSourcePage?.sourceId}
            sectionTitle={activeSectionTitle}
            conceptName={cleanConceptName}
            description={activeSourcePage?.content || ''}
            sourceAnchor={{
              sourceId: activeSourcePage?.sourceId || 'src-0001',
              sequenceIndex: safeSequenceIndex,
              printedPage: activeSourcePage?.printed?.number || activeSourcePage?.printedPage || 1,
              pdfPage: activeSourcePage?.physical?.pdfPage || 1,
              side: activeSourcePage?.physical?.region || 'full',
              snippetText: activeSourcePage?.content || '',
              confidence: activeSourcePage?.forensic?.confidence || 0.98,
            }}
          />
        </div>
      </LearningShell>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-6xl mx-auto p-6">
        <h1>{material.title}</h1>
      </div>
    </div>
  );
}
