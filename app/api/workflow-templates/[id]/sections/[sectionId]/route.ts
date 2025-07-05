import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { db } from '../../../../../../lib/db';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const templateId = params.id;
    const sectionId = params.sectionId;

    if (!templateId || templateId === 'new' || !sectionId) {
      return NextResponse.json(
        { success: false, message: 'Template ID and Section ID are required' },
        { status: 400 }
      );
    }

    // Get template
    const template = await db.workflowTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    // Remove section from launchFormLayout
    const currentLayout = template.launchFormLayout as any || {};
    const sections = (currentLayout.sections || []).filter((s: any) => s.id !== sectionId);

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
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete section' },
      { status: 500 }
    );
  }
} 