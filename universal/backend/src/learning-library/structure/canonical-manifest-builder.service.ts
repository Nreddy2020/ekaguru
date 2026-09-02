import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ChapterStructure {
  chapterId: string;
  chapterNumber: number;
  unitName: string;
  title: string;
  startPhysicalPage: number;
  endPhysicalPage: number;
  printedPageRange: string;
  sections: {
    id: string;
    sectionNumber: string;
    title: string;
    startPhysicalPage: number;
    endPhysicalPage: number;
  }[];
}

export interface CanonicalBookManifestRecord {
  bookId: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string;
  totalPages: number;
  units: {
    unitNumber: number;
    unitName: string;
    startPhysicalPage: number;
    endPhysicalPage: number;
    chapterIds: string[];
  }[];
  chapters: ChapterStructure[];
  frontMatterPages: number[];
  backMatterPages: number[];
  unassignedPages: number[]; // Invariant: MUST BE []
  manifestHash: string;
  generatedAt: string;
}

@Injectable()
export class CanonicalManifestBuilderService {
  private readonly logger = new Logger(CanonicalManifestBuilderService.name);

  public buildManifest(bookId: string = 'evs-class-5'): CanonicalBookManifestRecord {
    const rawChapters = [
      { num: 1, unit: 'Unit 1: About Me', title: 'I am Growing Up', start: 3, end: 7, printed: 'Pages 2–7' },
      { num: 2, unit: 'Unit 1: About Me', title: 'My Body', start: 8, end: 13, printed: 'Pages 8–13' },
      { num: 3, unit: 'Unit 1: About Me', title: 'Food We Eat', start: 14, end: 19, printed: 'Pages 14–19' },
      { num: 4, unit: 'Unit 1: About Me', title: 'Clothes We Wear', start: 20, end: 25, printed: 'Pages 20–25' },
      { num: 5, unit: 'Unit 1: About Me', title: 'Festivals We Celebrate', start: 26, end: 32, printed: 'Pages 26–32' },
      { num: 6, unit: 'Unit 2: Our Surroundings', title: 'Families and Neighbourhood', start: 33, end: 38, printed: 'Pages 33–38' },
      { num: 7, unit: 'Unit 2: Our Surroundings', title: 'Houses We Live In', start: 39, end: 44, printed: 'Pages 39–44' },
      { num: 8, unit: 'Unit 2: Our Surroundings', title: 'Places in Neighbourhood', start: 45, end: 52, printed: 'Pages 45–52' },
      { num: 9, unit: 'Unit 3: Our Environment', title: 'My Green Friends (Plants)', start: 53, end: 59, printed: 'Pages 53–59' },
      { num: 10, unit: 'Unit 3: Our Environment', title: 'Animal Kingdom', start: 60, end: 65, printed: 'Pages 60–65' },
      { num: 11, unit: 'Unit 3: Our Environment', title: 'Air and Water', start: 66, end: 71, printed: 'Pages 66–71' },
      { num: 12, unit: 'Unit 3: Our Environment', title: 'Weather and Seasons', start: 72, end: 78, printed: 'Pages 72–78' },
      { num: 13, unit: 'Unit 4: Our Lovely Planet', title: 'Our Beautiful Earth', start: 79, end: 84, printed: 'Pages 79–84' },
      { num: 14, unit: 'Unit 4: Our Lovely Planet', title: 'Taking Care of Earth', start: 85, end: 89, printed: 'Pages 85–89' },
      { num: 15, unit: 'Unit 4: Our Lovely Planet', title: 'Sun, Moon and Stars', start: 90, end: 94, printed: 'Pages 90–94' },
      { num: 16, unit: 'Unit 4: Our Lovely Planet', title: 'India: My Country', start: 95, end: 99, printed: 'Pages 95–99' },
      { num: 17, unit: 'Unit 5: Staying Connected', title: 'Time and Clock', start: 100, end: 105, printed: 'Pages 100–105' },
      { num: 18, unit: 'Unit 5: Staying Connected', title: 'Means of Communication', start: 106, end: 116, printed: 'Pages 106–116' },
    ];

    const chapters: ChapterStructure[] = rawChapters.map((c) => ({
      chapterId: `ch-${c.num}`,
      chapterNumber: c.num,
      unitName: c.unit,
      title: c.title,
      startPhysicalPage: c.start,
      endPhysicalPage: c.end,
      printedPageRange: c.printed,
      sections: [
        {
          id: `sec-${c.num}-1`,
          sectionNumber: `${c.num}.1`,
          title: `${c.title} - Fundamentals`,
          startPhysicalPage: c.start,
          endPhysicalPage: Math.min(c.start + 2, c.end),
        },
        {
          id: `sec-${c.num}-2`,
          sectionNumber: `${c.num}.2`,
          title: `${c.title} - Applications & Exercises`,
          startPhysicalPage: Math.min(c.start + 3, c.end),
          endPhysicalPage: c.end,
        },
      ],
    }));

    const coveredPages = new Set<number>();
    chapters.forEach((c) => {
      for (let p = c.startPhysicalPage; p <= c.endPhysicalPage; p++) {
        coveredPages.add(p);
      }
    });

    const frontMatter = [1, 2]; // TOC and Art Special
    frontMatter.forEach((p) => coveredPages.add(p));

    const unassigned: number[] = [];
    for (let p = 1; p <= 116; p++) {
      if (!coveredPages.has(p)) {
        unassigned.push(p);
      }
    }

    const manifestHash = crypto.createHash('sha256').update(JSON.stringify({ chapters, frontMatter })).digest('hex');

    return {
      bookId,
      title: 'Environmental Studies: Living Earth & Our Planet',
      subject: 'Environmental Studies',
      grade: 'CLASS 5',
      curriculum: 'NCERT',
      totalPages: 116,
      units: [
        { unitNumber: 1, unitName: 'Unit 1: About Me', startPhysicalPage: 1, endPhysicalPage: 32, chapterIds: ['ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5'] },
        { unitNumber: 2, unitName: 'Unit 2: Our Surroundings', startPhysicalPage: 33, endPhysicalPage: 52, chapterIds: ['ch-6', 'ch-7', 'ch-8'] },
        { unitNumber: 3, unitName: 'Unit 3: Our Environment', startPhysicalPage: 53, endPhysicalPage: 78, chapterIds: ['ch-9', 'ch-10', 'ch-11', 'ch-12'] },
        { unitNumber: 4, unitName: 'Unit 4: Our Lovely Planet', startPhysicalPage: 79, endPhysicalPage: 99, chapterIds: ['ch-13', 'ch-14', 'ch-15', 'ch-16'] },
        { unitNumber: 5, unitName: 'Unit 5: Staying Connected', startPhysicalPage: 100, endPhysicalPage: 116, chapterIds: ['ch-17', 'ch-18'] },
      ],
      chapters,
      frontMatterPages: frontMatter,
      backMatterPages: [116],
      unassignedPages: unassigned, // Invariant: Must be 0
      manifestHash,
      generatedAt: new Date().toISOString(),
    };
  }
}
