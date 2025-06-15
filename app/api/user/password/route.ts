import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../lib/prisma'
import { authOptions } from '../../../../lib/auth'
import { z } from 'zod'
import { passwordManager } from '../../../../lib/password-manager'

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = passwordChangeSchema.parse(body)

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found or account not created with password' },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await passwordManager.verifyPassword(
      validatedData.currentPassword,
      user.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Validate new password against policy
    const passwordValidation = await passwordManager.validatePassword(
      validatedData.newPassword,
      {
        id: user.id,
        email: user.email || undefined,
        name: user.name || undefined,
      }
    )

    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          errors: passwordValidation.errors,
          warnings: passwordValidation.warnings,
          strength: passwordValidation.strength
        },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await passwordManager.hashPassword(validatedData.newPassword)

    // Save old password to history
    await passwordManager.savePasswordHistory(user.id, user.password)

    // Update password
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      }
    })

    return NextResponse.json({ 
      message: 'Password updated successfully',
      strength: passwordValidation.strength 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 