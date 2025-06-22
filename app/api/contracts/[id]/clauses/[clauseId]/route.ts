import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH - Mark clause as modified in contract
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clauseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contractId = resolvedParams.id;
    const clauseId = resolvedParams.clauseId;

    // Verify user has access to this contract
    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
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
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı veya erişim izniniz yok' }, { status: 404 });
    }

    // Check if clause is associated with this contract
    const clauseOnContract = await db.clausesOnContracts.findFirst({
      where: {
        contractId: contractId,
        clauseId: clauseId
      }
    });

    if (!clauseOnContract) {
      return NextResponse.json({ error: 'Bu clause bu sözleşmede bulunamadı' }, { status: 404 });
    }

    // Mark clause as modified
    await db.clausesOnContracts.update({
      where: {
        contractId_clauseId: {
          contractId: contractId,
          clauseId: clauseId
        }
      },
      data: {
        isModified: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Clause düzenleme için açıldı'
    });

  } catch (error) {
    console.error('Clause modification marking error:', error);
    return NextResponse.json(
      { error: 'Clause düzenleme işareti güncellenemedi' },
      { status: 500 }
    );
  }
} 