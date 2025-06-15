import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre gerekli' },
        { status: 400 }
      );
    }

    // This endpoint is mainly for additional validation
    // Actual authentication is handled by NextAuth
    return NextResponse.json({
      message: 'Giriş işlemi başlatıldı',
    });
  } catch {
    console.error('Login error:');
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 