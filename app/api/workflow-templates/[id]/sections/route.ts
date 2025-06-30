import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { db } from '../../../../../lib/db';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const templateId = params.id;
    const body = await req.json();
    
    const { 
      name, 
      description, 
      icon, 
      displayMode, 
      isCollapsible, 
      isExpanded, 
      visibilityCondition, 
      order
    } = body;

    if (!templateId || !name) {
      return NextResponse.json({ success: false, message: 'Template ID ve section adı gerekli.' }, { status: 400 });
    }

    // Template'in var olduğunu kontrol et
    const template = await db.workflowTemplate.findFirst({
      where: {
        id: templateId
      }
    });

    if (!template) {
      return NextResponse.json({ success: false, message: 'Template bulunamadı.' }, { status: 404 });
    }

    // Section oluştur (Prisma model ready olduğunda)
    // Şimdilik success response döndür
    const mockSection = {
      id: `section_${Date.now()}`,
      templateId,
      name,
      description: description || null,
      icon: icon || null,
      displayMode: displayMode || 'EXPANDED',
      isCollapsible: isCollapsible ?? true,
      isExpanded: isExpanded ?? true,
      visibilityCondition: visibilityCondition || 'ALWAYS',
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Section başarıyla eklendi',
      section: mockSection
    });

  } catch (error) {
    console.error('Section ekleme hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Section eklenirken hata oluştu' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const templateId = params.id;

    // Template'in var olduğunu kontrol et
    const template = await db.workflowTemplate.findFirst({
      where: {
        id: templateId
      }
    });

    if (!template) {
      return NextResponse.json({ success: false, message: 'Template bulunamadı.' }, { status: 404 });
    }

    // Sections'ları getir (Prisma model ready olduğunda)
    // Şimdilik boş array döndür
    const sections: any[] = [];

    return NextResponse.json({ 
      success: true, 
      sections 
    });

  } catch (error) {
    console.error('Sections getirme hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Sections getirilirken hata oluştu' 
    }, { status: 500 });
  }
} 