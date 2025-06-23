import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const templates = await db.workflowTemplate.findMany({
      include: {
        steps: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Workflow template listesi yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Şablonlar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 