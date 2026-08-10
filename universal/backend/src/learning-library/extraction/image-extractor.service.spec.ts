import { Test, TestingModule } from '@nestjs/testing';
import { ImageExtractorService } from './extractors/image-extractor.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ImageExtractorService', () => {
  let service: ImageExtractorService;
  const tempImgPath = path.resolve(process.cwd(), './uploads/test-img.png');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageExtractorService],
    }).compile();

    service = module.get<ImageExtractorService>(ImageExtractorService);
  });

  afterEach(() => {
    if (fs.existsSync(tempImgPath)) {
      fs.unlinkSync(tempImgPath);
    }
  });

  it('should support image MIME types and extensions', () => {
    expect(service.supports('image/png', '.png')).toBe(true);
    expect(service.supports('image/jpeg', '.jpg')).toBe(true);
    expect(service.supports('text/plain', '.txt')).toBe(false);
  });

  it('should return metadata and OCR_REQUIRED warning without fabricating text', async () => {
    fs.writeFileSync(tempImgPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    const result = await service.extract(tempImgPath, 'test-img.png');

    expect(result.warnings).toContain('OCR_REQUIRED');
    expect(result.pages[0].rawText).toBe('');
    expect(result.pages[0].blocks).toHaveLength(0);
  });
});
