import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { z } from 'zod'

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

    const contract = await db.contract.findFirst({
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
    
    // 📅 ANAHTAR TARİH TAKİBİ - Veri Doğrulama
    const validatedData = updateContractSchema.parse(body)

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
        // 📅 ANAHTAR TARİH TAKİBİ - Kritik Tarih Verilerini Güncelle
        ...(validatedData.expirationDate !== undefined && { 
          expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null 
        }),
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

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error updating contract:', error)
    
    // 📅 ANAHTAR TARİH TAKİBİ - Doğrulama Hatası Yönetimi
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Veri doğrulama hatası',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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