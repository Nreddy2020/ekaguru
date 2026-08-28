import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const manifestPath = path.join(process.cwd(), '../backend/uploads/book_manifest_f309dd23.json');
  
  if (fs.existsSync(manifestPath)) {
    try {
      const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return NextResponse.json({
        id: params.id,
        title: manifestData.bookTitle,
        description: 'Authoritative CBSE / NCERT Environmental Studies Textbook for Grade 5.',
        status: 'ACTIVE',
        processingStatus: 'READY',
        pageCount: manifestData.physicalPdfPages || 59,
        totalPrintedPages: manifestData.totalPrintedPages || 118,
        units: manifestData.units,
      });
    } catch (e) {}
  }

  return NextResponse.json({
    id: params.id,
    title: 'MY BODY & LIVING WORLD (EVS Class 5)',
    description: 'CBSE / NCERT Environmental Studies Textbook for Grade 5.',
    status: 'ACTIVE',
    processingStatus: 'READY',
    pageCount: 59,
    totalPrintedPages: 118,
  });
}
