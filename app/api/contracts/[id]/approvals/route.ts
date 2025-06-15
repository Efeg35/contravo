import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createApprovalSchema = z.object({
  approverIds: z.array(z.string()).min(1, 'En az bir onaylayıcı seçmelisiniz'),
});

// Şu anda kullanılmıyor ama gelecekte kullanılabilir
// const updateApprovalSchema = z.object({
//   status: z.enum(['APPROVED', 'REJECTED']),
//   comment: z.string().optional(),
// });

// GET /api/contracts/[id]/approvals - Get contract approvals
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
          { company: { users: { some: { userId: session.user.id } } } }
        ]
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const approvals = await prisma.contractApproval.findMany({
      where: { contractId: id },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('Error fetching approvals:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/contracts/[id]/approvals - Request approvals
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
    const validatedData = createApprovalSchema.parse(body);

    // Check if user owns this contract
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        createdById: session.user.id
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found or no permission' }, { status: 404 });
    }

    // Check if contract is in appropriate status
    if (!['DRAFT', 'IN_REVIEW'].includes(contract.status)) {
      return NextResponse.json({ 
        error: 'Contract must be in DRAFT or IN_REVIEW status to request approvals' 
      }, { status: 400 });
    }

    // Remove existing pending approvals
    await prisma.contractApproval.deleteMany({
      where: {
        contractId: id,
        status: 'PENDING'
      }
    });

    // Create new approval requests
    const approvals = await Promise.all(
      validatedData.approverIds.map(approverId => 
        prisma.contractApproval.create({
          data: {
            contractId: id,
            approverId,
            status: 'PENDING'
          },
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        })
      )
    );

    // Update contract status to IN_REVIEW
    await prisma.contract.update({
      where: { id },
      data: { 
        status: 'IN_REVIEW',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Approval requests sent successfully',
      approvals 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    console.error('Error creating approvals:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 