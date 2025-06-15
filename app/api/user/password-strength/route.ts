import { NextRequest, NextResponse } from 'next/server';
import { passwordManager } from '../../../../lib/password-manager';

export async function POST(request: NextRequest) {
  try {
    const { password, userInfo } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Calculate password strength
    const strength = passwordManager.calculatePasswordStrength(password);

    // If user info provided, do additional validation
    let validation = null;
    if (userInfo) {
      validation = await passwordManager.validatePassword(password, userInfo);
    }

    return NextResponse.json({
      strength,
      validation,
    });
  } catch (error) {
    console.error('Error checking password strength:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 