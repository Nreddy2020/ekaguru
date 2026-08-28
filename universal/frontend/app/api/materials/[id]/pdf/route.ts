import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pdfPath = 'E:/Ekaguru/uploads/v2/tenant-default/learner-001/d88f7a6e-0e20-4c8c-a1fb-7b9206e2e2c7.pdf';

  if (!fs.existsSync(pdfPath)) {
    return new NextResponse('Source PDF not found on disk', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(pdfPath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="book.pdf"',
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
