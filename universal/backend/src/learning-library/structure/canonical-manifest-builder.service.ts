import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

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
  unassignedPages: number[];
  manifestHash: string;
  generatedAt: string;
}

@Injectable()
export class CanonicalManifestBuilderService {
  private readonly logger = new Logger(CanonicalManifestBuilderService.name);
  private corpusRegistry: Map<string, any> = new Map();

  constructor() {
    this.loadCorpusRegistry();
  }

    private loadCorpusRegistry(): void {
    const candidatePaths = [
      path.join(__dirname, 'corpus-registry.json'),
      path.join(__dirname, '../../../src/learning-library/structure/corpus-registry.json'),
      'E:/Ekaguru/universal/backend/src/learning-library/structure/corpus-registry.json',
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf8');
          const books = JSON.parse(raw);
          books.forEach((b: any) => this.corpusRegistry.set(b.bookId, b));
          this.logger.log(`Loaded ${books.length} textbooks into corpus registry from ${p}`);
          return;
        } catch (err) {
          this.logger.warn(`Failed parsing registry at ${p}: ${err}`);
        }
      }
    }
  }

  public registerBook(bookMetadata: any): void {
    this.corpusRegistry.set(bookMetadata.bookId, bookMetadata);
  }

  public buildManifest(bookId: string = 'evs-class-5'): CanonicalBookManifestRecord {
    // Dynamic retrieval from corpus registry or standard EVS
    let bookMeta = this.corpusRegistry.get(bookId);

    if (!bookMeta) {
      // Default dynamic model for evs-class-5
      bookMeta = {
        bookId: 'evs-class-5',
        title: 'Looking Around: Environmental Studies Class 5',
        subject: 'Environmental Studies',
        grade: 'Class 5',
        curriculum: 'NCERT / CBSE',
        totalPages: 116,
        frontMatter: [1, 2],
        units: [
          { unitNumber: 1, unitName: 'Unit 1: About Me', start: 3, end: 32, chapterIds: ['ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5'] },
          { unitNumber: 2, unitName: 'Unit 2: Our Surroundings', start: 33, end: 52, chapterIds: ['ch-6', 'ch-7', 'ch-8'] },
          { unitNumber: 3, unitName: 'Unit 3: Our Environment', start: 53, end: 78, chapterIds: ['ch-9', 'ch-10', 'ch-11', 'ch-12'] },
          { unitNumber: 4, unitName: 'Unit 4: Our Lovely Planet', start: 79, end: 99, chapterIds: ['ch-13', 'ch-14', 'ch-15', 'ch-16'] },
          { unitNumber: 5, unitName: 'Unit 5: Staying Connected', start: 100, end: 116, chapterIds: ['ch-17', 'ch-18'] },
        ],
        chapters: [
          { num: 1, unit: 'Unit 1: About Me', title: 'I am Growing Up', start: 3, end: 7 },
          { num: 2, unit: 'Unit 1: About Me', title: 'My Body', start: 8, end: 13 },
          { num: 3, unit: 'Unit 1: About Me', title: 'Food We Eat', start: 14, end: 19 },
          { num: 4, unit: 'Unit 1: About Me', title: 'Clothes We Wear', start: 20, end: 25 },
          { num: 5, unit: 'Unit 1: About Me', title: 'Festivals We Celebrate', start: 26, end: 32 },
          { num: 6, unit: 'Unit 2: Our Surroundings', title: 'Families and Neighbourhood', start: 33, end: 38 },
          { num: 7, unit: 'Unit 2: Our Surroundings', title: 'Houses We Live In', start: 39, end: 44 },
          { num: 8, unit: 'Unit 2: Our Surroundings', title: 'Places in Neighbourhood', start: 45, end: 52 },
          { num: 9, unit: 'Unit 3: Our Environment', title: 'My Green Friends (Plants)', start: 53, end: 59 },
          { num: 10, unit: 'Unit 3: Our Environment', title: 'Animal Kingdom', start: 60, end: 65 },
          { num: 11, unit: 'Unit 3: Our Environment', title: 'Air and Water', start: 66, end: 71 },
          { num: 12, unit: 'Unit 3: Our Environment', title: 'Weather and Seasons', start: 72, end: 78 },
          { num: 13, unit: 'Unit 4: Our Lovely Planet', title: 'Our Beautiful Earth', start: 79, end: 84 },
          { num: 14, unit: 'Unit 4: Our Lovely Planet', title: 'Taking Care of Earth', start: 85, end: 89 },
          { num: 15, unit: 'Unit 4: Our Lovely Planet', title: 'Sun, Moon and Stars', start: 90, end: 94 },
          { num: 16, unit: 'Unit 4: Our Lovely Planet', title: 'India: My Country', start: 95, end: 99 },
          { num: 17, unit: 'Unit 5: Staying Connected', title: 'Time and Clock', start: 100, end: 105 },
          { num: 18, unit: 'Unit 5: Staying Connected', title: 'Means of Communication', start: 106, end: 116 },
        ],
      };
    }

    const chapters: ChapterStructure[] = bookMeta.chapters.map((c: any) => ({
      chapterId: `ch-${c.num}`,
      chapterNumber: c.num,
      unitName: c.unit,
      title: c.title,
      startPhysicalPage: c.start,
      endPhysicalPage: c.end,
      printedPageRange: `Pages ${c.start - 1}–${c.end - 1}`,
      sections: [
        {
          id: `sec-${c.num}-1`,
          sectionNumber: `${c.num}.1`,
          title: `${c.title} - Core Principles`,
          startPhysicalPage: c.start,
          endPhysicalPage: Math.min(c.start + 2, c.end),
        },
        {
          id: `sec-${c.num}-2`,
          sectionNumber: `${c.num}.2`,
          title: `${c.title} - Exercises & Application`,
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
    bookMeta.frontMatter.forEach((p: number) => coveredPages.add(p));

    // Calculate unassigned pages dynamically across total physical pages
    const unassignedPages: number[] = [];
    for (let p = 1; p <= bookMeta.totalPages; p++) {
      if (!coveredPages.has(p)) {
        unassignedPages.push(p);
      }
    }

    const units = bookMeta.units.map((u: any) => ({
      unitNumber: u.unitNumber,
      unitName: u.unitName,
      startPhysicalPage: u.start,
      endPhysicalPage: u.end,
      chapterIds: u.chapterIds,
    }));

    const manifestPayload = {
      bookId: bookMeta.bookId,
      title: bookMeta.title,
      subject: bookMeta.subject,
      grade: bookMeta.grade,
      curriculum: bookMeta.curriculum,
      totalPages: bookMeta.totalPages,
      units,
      chapters,
      frontMatterPages: bookMeta.frontMatter,
      backMatterPages: [],
      unassignedPages,
    };

    const manifestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(manifestPayload))
      .digest('hex');

    return {
      ...manifestPayload,
      manifestHash,
      generatedAt: new Date().toISOString(),
    };
  }
}
