import { Test, TestingModule } from '@nestjs/testing';
import { TextExtractorService } from './extractors/text-extractor.service';
import * as fs from 'fs';
import * as path from 'path';

describe('TextExtractorService', () => {
  let service: TextExtractorService;
  const tempTxtPath = path.resolve(process.cwd(), './uploads/test-sample.md');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextExtractorService],
    }).compile();

    service = module.get<TextExtractorService>(TextExtractorService);
  });

  afterEach(() => {
    if (fs.existsSync(tempTxtPath)) {
      fs.unlinkSync(tempTxtPath);
    }
  });

  it('should support text/plain and markdown files', () => {
    expect(service.supports('text/plain', '.txt')).toBe(true);
    expect(service.supports('text/markdown', '.md')).toBe(true);
    expect(service.supports('application/pdf', '.pdf')).toBe(false);
  });

  it('should parse Markdown headings and paragraphs', async () => {
    const content = '# Chapter 1: Introduction\n\nThis is paragraph one.\n\n## Section 1.1: Basics\n\n- Item 1\n- Item 2';
    fs.writeFileSync(tempTxtPath, content);

    const result = await service.extract(tempTxtPath, 'test-sample.md');

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].blocks.length).toBeGreaterThanOrEqual(3);

    const heading1 = result.pages[0].blocks.find((b) => b.type === 'HEADING' && b.headingLevel === 1);
    expect(heading1).toBeDefined();
    expect(heading1?.text).toBe('Chapter 1: Introduction');

    const heading2 = result.pages[0].blocks.find((b) => b.type === 'HEADING' && b.headingLevel === 2);
    expect(heading2).toBeDefined();
    expect(heading2?.text).toBe('Section 1.1: Basics');
  });
});
