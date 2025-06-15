import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

// GET /api/templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.contractTemplate.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { isPublic: true },
          { createdById: session.user.id },
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Template fetch error:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user owns the template or has permission
    const template = await prisma.contractTemplate.findFirst({
      where: {
        id,
        createdById: session.user.id,
        isActive: true,
      },
    });

    if (!template) {
      return NextResponse.json({ 
        error: 'Template not found or you do not have permission to delete it' 
      }, { status: 404 });
    }

    // Soft delete - set isActive to false
    await prisma.contractTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template delete error:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user owns the template
    const existingTemplate = await prisma.contractTemplate.findFirst({
      where: {
        id,
        createdById: session.user.id,
        isActive: true,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ 
        error: 'Template not found or you do not have permission to edit it' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, category, content, variables, isPublic } = body;

    const updatedTemplate = await prisma.contractTemplate.update({
      where: { id },
      data: {
        title,
        description,
        category,
        content,
        variables: variables || [],
        isPublic: isPublic || false,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Template update error:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 