import { Controller, Post, UploadedFile, UseInterceptors, Logger, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BookService } from './book.service';

@Controller('upload')
export class UploadController {
    private readonly logger = new Logger(UploadController.name);

    constructor(private readonly bookService: BookService) { }

    @Post('book')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
            fileFilter: (req, file, cb) => {
                if (file.mimetype.match(/\/(pdf|docx|epub)$/)) {
                    cb(null, true);
                } else {
                    cb(new Error('Only PDF, DOCX, and EPUB files are allowed!'), false);
                }
            },
        }),
    )
    async uploadBook(@UploadedFile() file: Express.Multer.File) {
        this.logger.log(`Book uploaded: ${file.originalname} (${file.size} bytes)`);

        // Process the book using the BookService - passing path for real parsing
        // The service now handles Visual Layout Analysis
        const structure = await this.bookService.processBook(file.path, file.originalname);

        return {
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            uike_status: 'Visual Layout Analysis Complete',
            structure // Return the full structured knowledge graph
        };
    }
}
