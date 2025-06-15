import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, comment } = await request.json();
    const resolvedParams = await params;
    const approvalId = resolvedParams.id;

    // Mock approval update
    console.log(`Approval ${approvalId} updated with action: ${action}`, { comment });

    return NextResponse.json({
      success: true,
      message: 'Onay işlemi başarıyla güncellendi',
      approval: {
        id: approvalId,
        status: action === 'approve' ? 'APPROVED' : 
                action === 'reject' ? 'REJECTED' : 
                'REVISION_REQUESTED',
        respondedAt: new Date().toISOString(),
        comment
      }
    });

  } catch (error) {
    console.error('Approval update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 