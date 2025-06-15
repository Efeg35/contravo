import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { passwordManager } from '../../../lib/password-manager';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email ve şifre gerekli.' }, { status: 400 });
    }

    // E-posta zaten kayıtlı mı kontrol et
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Bu email adresi zaten kayıtlı.' }, { status: 409 });
    }

    // Validate password against policy
    const passwordValidation = await passwordManager.validatePassword(password, {
      email,
      name,
    });

    if (!passwordValidation.valid) {
      return NextResponse.json({
        error: 'Şifre güvenlik gereksinimlerini karşılamıyor',
        errors: passwordValidation.errors,
        warnings: passwordValidation.warnings,
        strength: passwordValidation.strength
      }, { status: 400 });
    }

    const hashedPassword = await passwordManager.hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'VIEWER',
      },
    });

    return NextResponse.json({ message: 'Kayıt başarılı.', user: { id: newUser.id, email: newUser.email, name: newUser.name } }, { status: 201 });
  } catch {
    console.error('Kayıt hatası:');
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
} 