import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Sözleşmeye ait clause'ları getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contractId = resolvedParams.id;

    // Verify user has access to this contract and get clauses
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
      },
      include: {
        clauses: {
          include: {
            clause: {
              include: {
                createdBy: {
                  select: {
                    name: true,
                    email: true
                  }
                },
                variables: true
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı veya erişim izniniz yok' }, { status: 404 });
    }

    const clauses = contract.clauses.map((item: any) => ({
      ...item.clause,
      addedAt: item.addedAt
    }));

    return NextResponse.json({
      success: true,
      clauses
    });

  } catch (error) {
    console.error('Contract clauses fetch error:', error);
    return NextResponse.json(
      { error: 'Clause\'lar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST - Sözleşmeye yeni clause ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contractId = resolvedParams.id;
    const body = await request.json();
    const { clauseId } = body;

    if (!clauseId) {
      return NextResponse.json(
        { error: 'Clause ID gerekli' },
        { status: 400 }
      );
    }

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

    // Verify clause exists and user has access to it
    const clause = await db.clause.findFirst({
      where: {
        id: clauseId,
        OR: [
          { visibility: 'PUBLIC' },
          { createdById: session.user.id },
          {
            AND: [
              { visibility: 'COMPANY' },
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
        ]
      }
    });

    if (!clause) {
      return NextResponse.json({ error: 'Clause bulunamadı veya erişim izniniz yok' }, { status: 404 });
    }

    // Check if clause is already added to this contract
    const existingClause = await db.contract.findFirst({
      where: {
        id: contractId,
        clauses: {
          some: {
            clauseId: clauseId
          }
        }
      }
    });

    if (existingClause) {
      return NextResponse.json({ error: 'Bu clause zaten sözleşmede mevcut' }, { status: 400 });
    }

    // Create the relationship
    await db.contract.update({
      where: { id: contractId },
      data: {
        clauses: {
          create: {
            clauseId: clauseId
          }
        }
      }
    });

    // Get the created relation with clause details
    const updatedContract = await db.contract.findFirst({
      where: { id: contractId },
      include: {
        clauses: {
          where: { clauseId: clauseId },
          include: {
            clause: {
              include: {
                createdBy: {
                  select: {
                    name: true,
                    email: true
                  }
                },
                variables: true
              }
            }
          }
        }
      }
    });

    // Also create a usage record for analytics
    await db.clauseUsage.create({
      data: {
        clauseId: clauseId,
        contractId: contractId,
        userId: session.user.id,
        contractType: contract.type
      }
    });

    const addedClause = updatedContract?.clauses[0];

    return NextResponse.json({
      success: true,
      clause: addedClause ? {
        ...addedClause.clause,
        addedAt: addedClause.addedAt
      } : null
    });

  } catch (error) {
    console.error('Contract clause add error:', error);
    return NextResponse.json(
      { error: 'Clause eklenemedi' },
      { status: 500 }
    );
  }
} 