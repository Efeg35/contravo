import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const teams = await db.team.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Takımlar yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Takımlar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 