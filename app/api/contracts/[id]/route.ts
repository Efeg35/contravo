import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { z } from 'zod'
import prisma from '../../../../lib/prisma'
import { ContractStatusEnum, ContractStatus } from '@/app/types'

// 📅 ANAHTAR TARİH TAKİBİ - Güncelleme Doğrulama Şeması
const updateContractSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  value: z.union([z.number(), z.string().transform(val => val === '' ? null : parseFloat(val))]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // 📅 ANAHTAR TARİH TAKİBİ - Yeni Doğrulama Alanları
  expirationDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)), 
    { message: 'Geçerli bir bitiş tarihi giriniz' }
  ),
  noticePeriodDays: z.union([
    z.number().int().min(0).max(365),
    z.string().transform(val => val === '' ? null : parseInt(val, 10))
  ]).optional().refine(
    (val) => val === undefined || val === null || (Number.isInteger(val) && val >= 0 && val <= 365),
    { message: 'İhbar süresi 0-365 gün arasında olmalıdır' }
  ),
  otherPartyName: z.string().optional(),
  otherPartyEmail: z.string().optional(),
  assignedToId: z.string().optional(),
  approverIds: z.array(z.string()).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const contract = await (db.contract as any).findFirst({
      where: {
        id: id,
        OR: [
          { createdById: user.id },
          {
            company: {
              OR: [
                { createdById: user.id },
                {
                  users: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          }
        },
        parentContract: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        amendments: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            createdBy: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    let validatedData;
    
    try {
      // 📅 ANAHTAR TARİH TAKİBİ - Veri Doğrulama
      validatedData = updateContractSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Veri doğrulama hatası',
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
      throw validationError;
    }

    // Önce sözleşmenin var olduğunu ve kullanıcıya ait olduğunu kontrol et
    const existingContract = await db.contract.findFirst({
      where: {
        id: id,
        OR: [
          { createdById: user.id },
          {
            company: {
              OR: [
                { createdById: user.id },
                {
                  users: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    })

    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // 🔒 GÜVENLİK KONTROLÜ: Aktif sözleşmeler düzenlenemez!
    // Ancak ACTIVE -> ARCHIVED status değişikliğine izin ver
    if (existingContract.status === 'ACTIVE') {
      const isArchivingOnly = validatedData.status === 'ARCHIVED' && 
        Object.keys(validatedData).length === 1 && 
        Object.keys(validatedData)[0] === 'status';
      
      if (!isArchivingOnly) {
        return NextResponse.json(
          { 
            error: 'Aktif sözleşmeler düzenlenemez',
            message: 'Bu sözleşme aktif olduğu için düzenleyemezsiniz. Değişiklik yapmak için "Değişiklik Yap" butonunu kullanın.'
          }, 
          { status: 403 }
        )
      }
    }

    // 🔄 REVISION WORKFLOW FIX: Sözleşme DRAFT'tan REVIEW'a geçiyorsa,
    // REVISION_REQUESTED durumundaki approval'ları PENDING'e çevir
    if (existingContract.status === 'DRAFT' && validatedData.status === 'REVIEW') {
      await prisma.contractApproval.updateMany({
        where: {
          contractId: id,
          status: 'REVISION_REQUESTED'
        },
        data: {
          status: 'PENDING',
          comment: null,
          approvedAt: null,
          updatedAt: new Date()
        }
      });
      console.log('Reset REVISION_REQUESTED approvals to PENDING for contract:', id);
    }

    // Transaction ile onaycıları ve sözleşmeyi güncelle
    if (Array.isArray(body.approverIds)) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Eski onaycıları sil
          await tx.contractApproval.deleteMany({ where: { contractId: id } });
          // 2. Yeni onaycıları ekle
          if (body.approverIds.length > 0) {
            await tx.contractApproval.createMany({
              data: body.approverIds.map((approverId: string) => ({ contractId: id, approverId }))
            });
          }
          // 3. Sözleşmeyi güncelle
          await tx.contract.update({
            where: { id },
            data: {
              ...validatedData,
              status: validatedData.status as ContractStatus,
              updatedById: user.id
            }
          });
        });
        return NextResponse.json({ message: 'Contract updated successfully' });
      } catch (error) {
        console.error('Error updating approvers or contract (transaction):', error);
        return NextResponse.json(
          { error: 'Onaylayıcılar veya sözleşme güncellenirken bir hata oluştu' },
          { status: 500 }
        );
      }
    } else {
      // Sadece sözleşme alanlarını güncelle (onaycılar değişmiyorsa)
      await prisma.contract.update({
        where: { id },
        data: {
          ...validatedData,
          status: validatedData.status as ContractStatus,
          updatedById: user.id
        }
      });
      return NextResponse.json({ message: 'Contract updated successfully' });
    }
  } catch (error) {
    console.error('Error in PUT request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Önce sözleşmenin var olduğunu ve kullanıcıya ait olduğunu kontrol et
    const existingContract = await db.contract.findFirst({
      where: {
        id: id,
        OR: [
          { createdById: user.id },
          {
            company: {
              OR: [
                { createdById: user.id },
                {
                  users: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    })

    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // 🔒 GÜVENLİK KONTROLÜ: İmzalanmış sözleşmeler silinemez!
    if (existingContract.status === ContractStatusEnum.SIGNING || existingContract.status === ContractStatusEnum.ARCHIVED) {
      return NextResponse.json(
        { 
          error: 'İmzalanmış veya arşivlenmiş sözleşmeler silinemez',
          message: 'Bu sözleşme imzalanmış veya arşivlenmiş olduğu için silemezsiniz.'
        }, 
        { status: 403 }
      )
    }

    await db.contract.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Contract deleted successfully' })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 