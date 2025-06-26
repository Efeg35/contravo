import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;

    const template = await db.workflowTemplate.findUnique({
      where: { id: id },
      include: {
        formFields: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(template);

  } catch (error) {
    console.error('Error fetching workflow template:', error);
    return NextResponse.json({ error: 'Şablon getirilirken bir hata oluştu.' }, { status: 500 });
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

    // Template'in varlığını kontrol et
    const template = await db.workflowTemplate.findUnique({
      where: { id: id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
    }

    // Template'i sil
    await db.workflowTemplate.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Workflow başarıyla silindi' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting workflow template:', error);
    return NextResponse.json({ error: 'Şablon silinirken bir hata oluştu.' }, { status: 500 });
  }
}