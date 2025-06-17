import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasRequiredRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Admin yetkisi kontrolü
    if (!await hasRequiredRole('ADMIN')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 