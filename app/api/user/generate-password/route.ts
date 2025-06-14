import { NextRequest, NextResponse } from 'next/server';
import { passwordManager } from '../../../../lib/password-manager';

export async function POST(request: NextRequest) {
  try {
    const { length = 12 } = await request.json();

    // Validate length
    const policy = passwordManager.getPolicy();
    const actualLength = Math.max(policy.minLength, Math.min(policy.maxLength, length));

    // Generate secure password
    const password = passwordManager.generateSecurePassword(actualLength);

    // Get strength of generated password
    const strength = passwordManager.calculatePasswordStrength(password);

    return NextResponse.json({
      password,
      length: actualLength,
      strength,
      policy: {
        minLength: policy.minLength,
        maxLength: policy.maxLength,
      }
    });
  } catch (_error) {
    console.error('Error generating password:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 