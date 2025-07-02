import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId } = await params;

    // Workflow template'in sahibinin bu kullanıcı olduğunu kontrol et
    const template = await db.workflowTemplate.findFirst({
      where: {
        id: templateId,
        companyId: (session.user as any).companyId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Review settings'i güncelle
    const updatedTemplate = await db.workflowTemplate.update({
      where: {
        id: templateId,
      },
      data: {
        reviewSettings: body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    console.error('Review settings update error:', error);
    return NextResponse.json(
      { error: 'Review settings güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId } = await params;

    // Workflow template'in review settings'ini getir
    const template = await db.workflowTemplate.findFirst({
      where: {
        id: templateId,
        companyId: (session.user as any).companyId,
      },
      select: {
        reviewSettings: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: template.reviewSettings,
    });
  } catch (error) {
    console.error('Review settings get error:', error);
    return NextResponse.json(
      { error: 'Review settings alınamadı' },
      { status: 500 }
    );
  }
} 