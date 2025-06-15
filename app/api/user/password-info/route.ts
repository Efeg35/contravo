import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { passwordManager } from '../../../../lib/password-manager';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get password expiration info
    const expirationInfo = await passwordManager.getPasswordExpirationInfo(session.user.id);
    
    // Get current policy
    const policy = passwordManager.getPolicy();

    // Check if password is expired
    const isExpired = await passwordManager.isPasswordExpired(session.user.id);

    return NextResponse.json({
      expirationInfo,
      isExpired,
      policy: {
        minLength: policy.minLength,
        maxLength: policy.maxLength,
        requireUppercase: policy.requireUppercase,
        requireLowercase: policy.requireLowercase,
        requireNumbers: policy.requireNumbers,
        requireSpecialChars: policy.requireSpecialChars,
        minSpecialChars: policy.minSpecialChars,
        preventCommonPasswords: policy.preventCommonPasswords,
        preventPersonalInfo: policy.preventPersonalInfo,
        historyLimit: policy.historyLimit,
        expirationDays: policy.expirationDays,
      }
    });
  } catch (error) {
    console.error('Error getting password info:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 