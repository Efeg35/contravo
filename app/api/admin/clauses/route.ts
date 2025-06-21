import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Tüm clause'ları getir (Admin için)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Admin yetkisi kontrolü (basit bir kontrol)
    // Bu kısımda rol kontrolü yapılabilir
    
    const clauses = await db.clause.findMany({
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        company: {
          select: {
            name: true
          }
        },
        variables: true,
        _count: {
          select: {
            usageStats: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      clauses
    });

  } catch (error) {
    console.error('Admin clauses fetch error:', error);
    return NextResponse.json(
      { error: 'Clause\'lar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni clause oluştur (Admin için)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, category, visibility = 'COMPANY', companyId } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Başlık, içerik ve kategori gerekli' },
        { status: 400 }
      );
    }

    const clause = await db.clause.create({
      data: {
        title,
        description,
        content,
        category,
        visibility,
        companyId,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        company: {
          select: {
            name: true
          }
        },
        variables: true
      }
    });

    return NextResponse.json({
      success: true,
      clause
    });

  } catch (error) {
    console.error('Admin clause creation error:', error);
    return NextResponse.json(
      { error: 'Clause oluşturulamadı' },
      { status: 500 }
    );
  }
} 