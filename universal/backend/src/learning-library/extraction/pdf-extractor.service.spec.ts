import { Test, TestingModule } from '@nestjs/testing';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import * as fs from 'fs';
import * as path from 'path';

describe('PdfExtractorService', () => {
  let service: PdfExtractorService;
  const tempPdfPath = path.resolve(process.cwd(), './uploads/test-sample.pdf');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfExtractorService],
    }).compile();

    service = module.get<PdfExtractorService>(PdfExtractorService);
  });

  afterEach(() => {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  });

  it('should support application/pdf and .pdf extension', () => {
    expect(service.supports('application/pdf', '.pdf')).toBe(true);
    expect(service.supports('text/plain', '.txt')).toBe(false);
  });

  it('should handle missing or unparseable PDF by returning OCR_REQUIRED warning', async () => {
    fs.writeFileSync(tempPdfPath, 'Not a valid binary PDF content');

    const result = await service.extract(tempPdfPath, 'test-sample.pdf');

    expect(result.pages).toBeDefined();
    expect(result.warnings).toContain('FAILED_TO_PARSE_PDF');
    expect(result.warnings).toContain('OCR_REQUIRED');
  });
});
