/**
 * EKAGURU CANONICAL STRUCTURE FACTORY (PHASE D - ZERO ORPHAN PAGES)
 */
import { CanonicalBookManifest, ChapterStructureNode } from './teaching-package.types';
import { CANONICAL_TEXTBOOK_TOC } from './page-preservation-engine';

export class CanonicalStructureFactory {
  public static buildBookManifest(bookId: string = 'evs-class-5'): CanonicalBookManifest {
    const chapters: ChapterStructureNode[] = CANONICAL_TEXTBOOK_TOC.map((t) => ({
      chapterId: `ch-${t.chapterNumber}`,
      chapterNumber: t.chapterNumber,
      unitName: t.unitName,
      title: t.title,
      startPhysicalPage: t.startPage,
      endPhysicalPage: t.endPage,
      printedPageRange: t.pageRangeText,
      sections: t.sections.map((s, idx) => ({
        id: `sec-${t.chapterNumber}-${idx + 1}`,
        sectionNumber: s.sectionNumber,
        title: s.title,
        startPhysicalPage: s.page,
        endPhysicalPage: Math.min(s.page + 1, t.endPage),
      })),
      headingEvidenceBlockId: `blk-${t.startPage}-1`,
    }));

    // Calculate covered physical pages
    const coveredPages = new Set<number>();
    chapters.forEach((c) => {
      for (let p = c.startPhysicalPage; p <= c.endPhysicalPage; p++) {
        coveredPages.add(p);
      }
    });

    // Front matter = Page 1 (TOC) & Page 2 (Festivals of India Art Special)
    const frontMatter = [1, 2];
    frontMatter.forEach((p) => coveredPages.add(p));

    // Verify all 116 pages are covered (ZERO ORPHAN PAGES)
    const unassigned: number[] = [];
    for (let p = 1; p <= 116; p++) {
      if (!coveredPages.has(p)) {
        unassigned.push(p);
      }
    }

    return {
      bookId,
      title: 'Environmental Studies: Living Earth & Our Planet',
      subject: 'Environmental Studies',
      grade: 'CLASS 5',
      curriculum: 'NCERT',
      totalPages: 116,
      units: [
        { unitNumber: 1, unitName: 'About Me', startPhysicalPage: 1, endPhysicalPage: 32, chapterIds: ['ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5'] },
        { unitNumber: 2, unitName: 'Our Surroundings', startPhysicalPage: 33, endPhysicalPage: 52, chapterIds: ['ch-6', 'ch-7', 'ch-8'] },
        { unitNumber: 3, unitName: 'Our Environment', startPhysicalPage: 53, endPhysicalPage: 78, chapterIds: ['ch-9', 'ch-10', 'ch-11', 'ch-12'] },
        { unitNumber: 4, unitName: 'Our Lovely Planet', startPhysicalPage: 79, endPhysicalPage: 99, chapterIds: ['ch-13', 'ch-14', 'ch-15', 'ch-16'] },
        { unitNumber: 5, unitName: 'Staying Connected', startPhysicalPage: 100, endPhysicalPage: 116, chapterIds: ['ch-17', 'ch-18'] },
      ],
      chapters,
      frontMatterPages: frontMatter,
      backMatterPages: [116], // Test Paper II
      unassignedPages: unassigned, // Invariant: Must be []
      manifestHash: 'sha256-manifest-18ch-116p-v1',
      generatedAt: new Date().toISOString(),
    };
  }
}
