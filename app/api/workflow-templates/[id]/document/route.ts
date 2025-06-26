import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id: templateId } = await params;
    const contentType = req.headers.get('content-type');

    // JSON ile gelen pending upload data'sı
    if (contentType?.includes('application/json')) {
      const { documentUrl, documentName } = await req.json();

      if (!documentUrl || !documentName) {
        return NextResponse.json({ error: 'Document URL ve Name gereklidir.' }, { status: 400 });
      }

      const updatedTemplate = await db.workflowTemplate.update({
        where: { id: templateId },
        data: {
          templateFileUrl: documentUrl,
          documentName: documentName,
        },
      });

      return NextResponse.json(updatedTemplate);
    }

    // FormData ile gelen dosya upload'ı 
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/workflows');
    const savePath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/workflows/${filename}`;
    
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });

    await writeFile(savePath, buffer);

    const updatedTemplate = await db.workflowTemplate.update({
      where: { id: templateId },
      data: {
        templateFileUrl: publicUrl,
        documentName: file.name,
      },
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Dosya yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    const { id } = await params;

    const updatedTemplate = await db.workflowTemplate.update({
      where: { id: id },
      data: {
        documentName: null,
        documentUrl: null,
      },
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Doküman silinirken bir hata oluştu.' }, { status: 500 });
  }
} 