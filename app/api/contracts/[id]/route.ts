import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { z } from 'zod'
import prisma from '../../../../lib/prisma'

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

    // 🔒 GÜVENLİK KONTROLÜ: İmzalanmış sözleşmeler düzenlenemez!
    // Ancak SIGNED -> ARCHIVED status değişikliğine izin ver
    if (existingContract.status === 'SIGNED') {
      const isArchivingOnly = validatedData.status === 'ARCHIVED' && 
        Object.keys(validatedData).length === 1 && 
        Object.keys(validatedData)[0] === 'status';
      
      if (!isArchivingOnly) {
        return NextResponse.json(
          { 
            error: 'İmzalanmış sözleşmeler düzenlenemez',
            message: 'Bu sözleşme imzalanmış olduğu için düzenleyemezsiniz. Değişiklik yapmak için "Değişiklik Yap" butonunu kullanın.'
          }, 
          { status: 403 }
        )
      }
    }

    // Transaction ile onaycıları ve sözleşmeyi güncelle
    if (Array.isArray(body.approverIds)) {
      try {
        const transactionOps = [];
        // 1. Eski onaycıları sil
        transactionOps.push(
          prisma.contractApproval.deleteMany({ where: { contractId: id } })
        );
        // 2. Yeni onaycıları ekle
        if (body.approverIds.length > 0) {
          transactionOps.push(
            prisma.contractApproval.createMany({
              data: body.approverIds.map((approverId: string) => ({ contractId: id, approverId }))
            })
          );
        }
        // 3. Sözleşmeyi güncelle
        transactionOps.push(
          db.contract.update({
            where: { id: id },
            data: {
              ...(validatedData.title !== undefined && { title: validatedData.title }),
              ...(validatedData.description !== undefined && { description: validatedData.description }),
              ...(validatedData.content !== undefined && { content: validatedData.content }),
              ...(validatedData.status !== undefined && { status: validatedData.status as any }),
              ...(validatedData.type !== undefined && { type: validatedData.type }),
              ...(validatedData.value !== undefined && { value: validatedData.value }),
              ...(validatedData.startDate !== undefined && { startDate: validatedData.startDate ? new Date(validatedData.startDate) : null }),
              ...(validatedData.endDate !== undefined && { endDate: validatedData.endDate ? new Date(validatedData.endDate) : null }),
              ...(validatedData.expirationDate !== undefined && { expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null }),
              ...(validatedData.noticePeriodDays !== undefined && { noticePeriodDays: validatedData.noticePeriodDays }),
              ...(validatedData.otherPartyName !== undefined && { otherPartyName: validatedData.otherPartyName }),
              ...(validatedData.otherPartyEmail !== undefined && { otherPartyEmail: validatedData.otherPartyEmail }),
              updatedById: user.id,
              updatedAt: new Date()
            },
            include: {
              createdBy: {
                select: {
                  name: true,
                }
              }
            }
          })
        );
        // Transactionu çalıştır
        const [, , updatedContract] = await prisma.$transaction(transactionOps);
        return NextResponse.json(updatedContract);
      } catch (error) {
        console.error('Error updating approvers or contract (transaction):', error);
        return NextResponse.json(
          { error: 'Onaylayıcılar veya sözleşme güncellenirken bir hata oluştu' },
          { status: 500 }
        );
      }
    } else {
      // Onaycı yoksa sadece contract'ı güncelle
      try {
        const contract = await db.contract.update({
          where: { id: id },
          data: {
            ...(validatedData.title !== undefined && { title: validatedData.title }),
            ...(validatedData.description !== undefined && { description: validatedData.description }),
            ...(validatedData.content !== undefined && { content: validatedData.content }),
            ...(validatedData.status !== undefined && { status: validatedData.status as any }),
            ...(validatedData.type !== undefined && { type: validatedData.type }),
            ...(validatedData.value !== undefined && { value: validatedData.value }),
            ...(validatedData.startDate !== undefined && { startDate: validatedData.startDate ? new Date(validatedData.startDate) : null }),
            ...(validatedData.endDate !== undefined && { endDate: validatedData.endDate ? new Date(validatedData.endDate) : null }),
            ...(validatedData.expirationDate !== undefined && { expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null }),
            ...(validatedData.noticePeriodDays !== undefined && { noticePeriodDays: validatedData.noticePeriodDays }),
            ...(validatedData.otherPartyName !== undefined && { otherPartyName: validatedData.otherPartyName }),
            ...(validatedData.otherPartyEmail !== undefined && { otherPartyEmail: validatedData.otherPartyEmail }),
            updatedById: user.id,
            updatedAt: new Date()
          },
          include: {
            createdBy: {
              select: {
                name: true,
              }
            }
          }
        });
        return NextResponse.json(contract);
      } catch (error) {
        console.error('Error updating contract:', error);
        return NextResponse.json(
          { error: 'Sözleşme güncellenirken bir hata oluştu' },
          { status: 500 }
        );
      }
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
    if (existingContract.status === 'SIGNED') {
      return NextResponse.json(
        { 
          error: 'İmzalanmış sözleşmeler silinemez',
          message: 'Bu sözleşme imzalanmış olduğu için silemezsiniz.'
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