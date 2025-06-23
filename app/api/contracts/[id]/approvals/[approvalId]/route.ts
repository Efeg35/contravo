import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});

// PATCH /api/contracts/[id]/approvals/[approvalId] - Approve or reject
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; approvalId: string }> }
) {
  try {
    const { id, approvalId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateApprovalSchema.parse(body);

    // Check if user is the designated approver
    const approval = await prisma.contractApproval.findFirst({
      where: {
        id: approvalId,
        contractId: id,
        approverId: session.user.id,
        status: { in: ['PENDING', 'REVISION_REQUESTED'] }
      },
      include: {
        contract: true
      }
    });

    if (!approval) {
      return NextResponse.json({ 
        error: 'Approval not found or you are not authorized to approve this' 
      }, { status: 404 });
    }

    // Update the approval
    const updatedApproval = await prisma.contractApproval.update({
      where: { id: approvalId },
      data: {
        status: validatedData.status,
        comment: validatedData.comment,
        approvedAt: new Date(),
        updatedAt: new Date()
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
    });

    // Check if all required approvals are complete
    const allApprovals = await prisma.contractApproval.findMany({
      where: { contractId: id }
    });

    const pendingApprovals = allApprovals.filter(a => a.status === 'PENDING');
    const rejectedApprovals = allApprovals.filter(a => a.status === 'REJECTED');
    const approvedApprovals = allApprovals.filter(a => a.status === 'APPROVED');

    let newContractStatus = approval.contract.status;

    if (rejectedApprovals.length > 0) {
      // If any approval is rejected, contract is rejected
      newContractStatus = 'REJECTED';
    } else if (pendingApprovals.length === 0 && approvedApprovals.length > 0) {
      // If all approvals are completed and at least one is approved, contract is approved
      newContractStatus = 'APPROVED';
    }

    // Update contract status and assignment if needed
    if (newContractStatus !== approval.contract.status) {
      let assignedToId = null;

      // If contract is approved, check if there are more pending approvals
      if (newContractStatus === 'APPROVED' && pendingApprovals.length === 0) {
        // All approvals complete, remove assignment
        assignedToId = null;
      } else if (pendingApprovals.length > 0) {
        // Assign to next pending approver
        assignedToId = pendingApprovals[0].approverId;
      } else if (newContractStatus === 'REJECTED') {
        // Assign back to contract creator for revision
        assignedToId = approval.contract.createdById;
      }

      await prisma.contract.update({
        where: { id },
        data: { 
          status: newContractStatus,
          assignedToId: assignedToId,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ 
      approval: updatedApproval,
      contractStatus: newContractStatus,
      message: validatedData.status === 'APPROVED' ? 'Sözleşme onaylandı' : 'Sözleşme reddedildi'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    console.error('Error updating approval:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 