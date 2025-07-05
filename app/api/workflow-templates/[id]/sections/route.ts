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

    // Create new section using generic JSON approach since FormSection model may not exist yet
    const sectionData = {
      id: `section_${Date.now()}`,
      workflowTemplateId: templateId,
      name: body.name || 'New Section',
      description: body.description || '',
      icon: body.icon || '📋',
      displayMode: body.displayMode || 'EXPANDED',
      isCollapsible: body.isCollapsible !== undefined ? body.isCollapsible : true,
      isExpanded: body.isExpanded !== undefined ? body.isExpanded : true,
      visibilityCondition: body.visibilityCondition || 'ALWAYS',
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in template's launchFormLayout as sections array
    const currentLayout = template.launchFormLayout as any || {};
    const sections = currentLayout.sections || [];
    sections.push(sectionData);

    await db.workflowTemplate.update({
      where: { id: templateId },
      data: {
        launchFormLayout: {
          ...currentLayout,
          sections
        }
      }
    });

    return NextResponse.json({
      success: true,
      section: sectionData
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
    const template = await db.workflowTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    const layout = template.launchFormLayout as any || {};
    const sections = layout.sections || [];

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