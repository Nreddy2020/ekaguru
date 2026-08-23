import { Test, TestingModule } from '@nestjs/testing';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

jest.mock('pdf-parse', () => jest.fn());
jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({
    data: {
      text: 'Recovered scanned OCR content',
      confidence: 88,
    },
  }),
}));

describe('PdfExtractorService - M2.1 Forensics & Layout Tests', () => {
  let service: PdfExtractorService;
  const tempPdfPath = path.resolve(process.cwd(), './uploads/test-sample.pdf');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfExtractorService],
    }).compile();

    service = module.get<PdfExtractorService>(PdfExtractorService);
    if (!fs.existsSync(path.dirname(tempPdfPath))) {
      fs.mkdirSync(path.dirname(tempPdfPath), { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
    jest.clearAllMocks();
  });

  it('should support application/pdf and .pdf extension', () => {
    expect(service.supports('application/pdf', '.pdf')).toBe(true);
    expect(service.supports('text/plain', '.txt')).toBe(false);
  });

  it('should handle unparseable PDF by returning FAILED_TO_PARSE_PDF warning and SCANNED_DOCUMENT type', async () => {
    fs.writeFileSync(tempPdfPath, 'Not a valid binary PDF content');
    (pdfParse as jest.Mock).mockRejectedValueOnce(new Error('Corrupt header'));

    const result = await service.extract(tempPdfPath, 'test-sample.pdf');

    expect(result.pages).toBeDefined();
    expect(result.warnings).toContain('FAILED_TO_PARSE_PDF');
    expect(result.warnings).toContain('OCR_REQUIRED');
    expect(result.metadata.documentType).toBe('SCANNED_DOCUMENT');
  });

  it('should perform page-level forensics classification (TEXT_NATIVE, MIXED, SCANNED)', async () => {
    fs.writeFileSync(tempPdfPath, 'dummy pdf buffer');
    const mockPdfText = [
      'Chapter 1: The Living World\n\nThis is a long comprehensive paragraph with more than one hundred and twenty characters of text to test text native classification.',
      'Unit 1.1 Overview\nBrief summary with few words.',
      ' ',
    ].join('\f');

    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: mockPdfText,
      numpages: 3,
      info: { Title: 'Biology Textbook' },
    });

    const result = await service.extract(tempPdfPath, 'biology.pdf');

    expect(result.pages.length).toBe(3);
    expect(result.pages[0].classification).toBe('TEXT_NATIVE');
    expect(result.pages[0].textDensity).toBeGreaterThan(120);
    expect(result.pages[1].classification).toBe('MIXED');
    expect(result.pages[2].classification).toBe('SCANNED');
    expect(result.metadata.documentType).toBe('TEXTBOOK');
    expect(result.metadata.forensicsMetrics?.nativePageCount).toBe(1);
    expect(result.metadata.forensicsMetrics?.mixedPageCount).toBe(1);
    expect(result.metadata.forensicsMetrics?.scannedPageCount).toBe(1);
  });

  it('should extract layout blocks with bounding boxes and visual knowledge types (TABLE, EQUATION, CAPTION)', async () => {
    fs.writeFileSync(tempPdfPath, 'dummy pdf buffer');
    const samplePageText = [
      'Chapter 2: Energy & Work',
      'E = mc^2',
      'Figure 2.1: Energy conversion diagram',
      'Name | Value | Unit\nMass | 10 | kg\nSpeed | 300 | m/s',
      '• First key property of energy',
      'Energy is conserved in all closed physical systems over time.',
    ].join('\n\n');

    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: samplePageText,
      numpages: 1,
      info: { Title: 'Physics Lab' },
    });

    const result = await service.extract(tempPdfPath, 'physics.pdf');

    const page = result.pages[0];
    expect(page.blocks.length).toBeGreaterThan(0);

    const headingBlock = page.blocks.find((b) => b.type === 'HEADING');
    expect(headingBlock).toBeDefined();
    expect(headingBlock?.headingLevel).toBe(1);
    expect(headingBlock?.boundingBox).toBeDefined();
    expect(headingBlock?.id).toBeDefined();

    const eqBlock = page.blocks.find((b) => b.type === 'EQUATION');
    expect(eqBlock).toBeDefined();
    expect(eqBlock?.structuredData?.latexEquation).toContain('E = mc^2');

    const captionBlock = page.blocks.find((b) => b.type === 'CAPTION');
    expect(captionBlock).toBeDefined();
    expect(captionBlock?.structuredData?.diagramCaption).toContain('Figure 2.1');

    const tableBlock = page.blocks.find((b) => b.type === 'TABLE');
    expect(tableBlock).toBeDefined();
    expect(tableBlock?.structuredData?.tableJson).toBeDefined();

    const listBlock = page.blocks.find((b) => b.type === 'LIST');
    expect(listBlock).toBeDefined();

    const paraBlock = page.blocks.find((b) => b.type === 'PARAGRAPH');
    expect(paraBlock).toBeDefined();
    expect(paraBlock?.text).toContain('Energy is conserved');
  });
});

