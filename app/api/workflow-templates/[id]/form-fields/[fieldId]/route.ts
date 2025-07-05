import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const templateId = params.id;
    const fieldId = params.fieldId;

    if (!templateId || templateId === 'new' || !fieldId) {
      return NextResponse.json(
        { success: false, message: 'Template ID and Field ID are required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { label, helpText } = body;

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

    // Verify field exists and belongs to this template
    const field = await db.formField.findFirst({
      where: {
        id: fieldId,
        templateId: templateId
      }
    });

    if (!field) {
      return NextResponse.json(
        { success: false, message: 'Form field not found' },
        { status: 404 }
      );
    }

    // Update the form field
    const updatedField = await db.formField.update({
      where: { id: fieldId },
      data: {
        label: label || field.label,
        helpText: helpText !== undefined ? helpText : field.helpText
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Form field updated successfully',
      data: updatedField
    });
  } catch (error) {
    console.error('Error updating form field:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update form field' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const templateId = params.id;
    const fieldId = params.fieldId;

    if (!templateId || templateId === 'new' || !fieldId) {
      return NextResponse.json(
        { success: false, message: 'Template ID and Field ID are required' },
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

    // Verify field exists and belongs to this template
    const field = await db.formField.findFirst({
      where: {
        id: fieldId,
        templateId: templateId
      }
    });

    if (!field) {
      return NextResponse.json(
        { success: false, message: 'Form field not found' },
        { status: 404 }
      );
    }

    // Delete the form field
    await db.formField.delete({
      where: { id: fieldId }
    });

    // Also remove field from layout if it exists
    if (template.launchFormLayout) {
      const layout = template.launchFormLayout as any;
      if (layout.fieldOrder && Array.isArray(layout.fieldOrder)) {
        const updatedFieldOrder = layout.fieldOrder.filter((id: string) => id !== fieldId);
        await db.workflowTemplate.update({
          where: { id: templateId },
          data: {
            launchFormLayout: {
              ...layout,
              fieldOrder: updatedFieldOrder
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Form field deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting form field:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete form field' },
      { status: 500 }
    );
  }
} 