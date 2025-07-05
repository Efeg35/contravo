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

    if (!templateId || templateId === 'new') {
      return NextResponse.json(
        { success: false, message: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Verify template exists
    const template = await db.workflowTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Workflow template not found' },
        { status: 404 }
      );
    }

    // Create new section using FormSection model instead of JSON
    const created = await db.formSection.create({
      data: {
        name: body.name || 'New Section',
        title: body.title || (body.name || 'New Section'),
        description: body.description || '',
        icon: body.icon || '📋',
        order: body.order || 0,
        isCollapsible: body.isCollapsible !== undefined ? body.isCollapsible : true,
        isCollapsed: body.isCollapsed !== undefined ? body.isCollapsed : false,
        templateId: templateId
      }
    });

    return NextResponse.json({
      success: true,
      section: created
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create section' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const templateId = params.id;

    if (!templateId || templateId === 'new') {
      return NextResponse.json({
        success: true,
        sections: []
      });
    }

    // Get template with sections
    const sections = await db.formSection.findMany({
      where: { templateId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      sections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
} 