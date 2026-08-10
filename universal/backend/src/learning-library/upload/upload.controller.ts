import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadService } from './upload.service';
import { UploadMaterialDto } from './dto/upload-material.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const tempUploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', 'v2', '.tmp');

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

@Controller('api/v2/learning-materials')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!fs.existsSync(tempUploadDir)) {
            fs.mkdirSync(tempUploadDir, { recursive: true });
          }
          cb(null, tempUploadDir);
        },
        filename: (req, file, cb) => {
          const tempName = `temp-${crypto.randomUUID()}.tmp`;
          cb(null, tempName);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max limit
      },
    }),
  )
  async uploadMaterial(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadMaterialDto,
    @Request() req: any,
  ) {
    return this.uploadService.handleFileUpload(body, file, req.user);
  }
}
