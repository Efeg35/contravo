import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createVersionSchema = z.object({
  changeType: z.enum(['CREATED', 'UPDATED', 'CONTENT_MODIFIED', 'TERMS_CHANGED', 'STATUS_CHANGED', 'ARCHIVED']),
  changeDescription: z.string().min(1, 'Değişiklik açıklaması gereklidir'),
  changeLog: z.object({}).optional(),
});

// GET /api/contracts/[id]/versions - Get contract version history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this contract
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        OR: [
          { createdById: session.user.id },
          {
            company: {
              users: {
                some: {
                  userId: session.user.id
                }
              }
            }
          }
        ]
      },
      include: {
        versions: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(contract.versions);
  } catch {
    console.error('Error fetching contract versions:');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/contracts/[id]/versions - Create new version
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createVersionSchema.parse(body);

    // Check if user has permission to create versions
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        OR: [
          { createdById: session.user.id },
          {
            company: {
              users: {
                some: {
                  userId: session.user.id,
                  role: {
                    in: ['ADMIN', 'EDITOR']
                  }
                }
              }
            }
          }
        ]
      },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    // Generate next version number
    const lastVersion = contract.versions[0];
    let nextVersionNumber = '1.0';
    
    if (lastVersion) {
      const [major, minor] = lastVersion.versionNumber.split('.').map(Number);
      if (validatedData.changeType === 'CONTENT_MODIFIED' || validatedData.changeType === 'TERMS_CHANGED') {
        nextVersionNumber = `${major + 1}.0`; // Major version bump
      } else {
        nextVersionNumber = `${major}.${minor + 1}`; // Minor version bump
      }
    }

    // Create new version with current contract data
    const newVersion = await prisma.contractVersion.create({
      data: {
        contractId: id,
        versionNumber: nextVersionNumber,
        title: contract.title,
        description: contract.description,
        content: contract.description || '', // Store current content
        status: contract.status,
        value: contract.value,
        currency: 'TRY', // Default currency
        startDate: contract.startDate,
        endDate: contract.endDate,
        changeType: validatedData.changeType,
        changeDescription: validatedData.changeDescription,
        changeLog: validatedData.changeLog,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(newVersion, { status: 201 });
  } catch {
    if (_error instanceof z.ZodError) {
      return NextResponse.json({ error: _error.errors }, { status: 400 });
    }
    
    console.error('Error creating contract version:');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 