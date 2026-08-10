import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from './learning-library-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('api/v2/learning-materials/:materialId/documents')
  async createForMaterial(
    @Param('materialId') materialId: string,
    @Body() body: CreateDocumentDto,
  ) {
    return this.documentService.createForMaterial(materialId, body);
  }

  @Get('api/v2/learning-materials/:materialId/documents')
  async findAllForMaterial(@Param('materialId') materialId: string) {
    return this.documentService.findAllForMaterial(materialId);
  }

  @Get('api/v2/documents/:id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Patch('api/v2/documents/:id')
  async update(@Param('id') id: string, @Body() body: UpdateDocumentDto) {
    return this.documentService.update(id, body);
  }
}
