import { Test, TestingModule } from '@nestjs/testing';
import { FileValidatorService } from './file-validator.service';
import { BadRequestException } from '@nestjs/common';

describe('FileValidatorService', () => {
  let service: FileValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileValidatorService],
    }).compile();

    service = module.get<FileValidatorService>(FileValidatorService);
  });

  it('should validate valid PDF file buffer', () => {
    const pdfBuffer = Buffer.from('%PDF-1.7 Test PDF Header Content');
    const result = service.validateFileHeader(pdfBuffer, 'sample.pdf', 'application/pdf');

    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe('application/pdf');
    expect(result.extension).toBe('.pdf');
  });

  it('should validate valid PNG image buffer', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = service.validateFileHeader(pngBuffer, 'image.png', 'image/png');

    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe('image/png');
  });

  it('should validate valid DOCX / EPUB ZIP container magic bytes', () => {
    const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
    const docxResult = service.validateFileHeader(
      zipBuffer,
      'document.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(docxResult.valid).toBe(true);
    expect(docxResult.detectedMime).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('should reject MIME spoofing attempt (e.g. executable disguised as PDF)', () => {
    const exeBuffer = Buffer.from('MZ Executable Binary Content Header');
    expect(() =>
      service.validateFileHeader(exeBuffer, 'fake.pdf', 'application/pdf'),
    ).toThrow(BadRequestException);
  });

  it('should reject file exceeding maximum size limit', () => {
    const oversizeBuffer = Buffer.alloc(53 * 1024 * 1024); // 53MB > 50MB
    expect(() =>
      service.validateFileHeader(oversizeBuffer, 'big.pdf', 'application/pdf'),
    ).toThrow(BadRequestException);
  });

  it('should reject disallowed file extension', () => {
    const pdfBuffer = Buffer.from('%PDF-1.7');
    expect(() =>
      service.validateFileHeader(pdfBuffer, 'script.exe', 'application/pdf'),
    ).toThrow(BadRequestException);
  });
});
