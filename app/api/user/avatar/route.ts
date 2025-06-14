import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import prisma from '../../../../lib/prisma'
import { authOptions } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('avatar') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large (max 5MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `avatar-${session.user.id}-${timestamp}.${extension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    
    try {
      await writeFile(join(uploadsDir, filename), buffer)
    } catch (_error) {
      // Try to create directory and try again
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
      await writeFile(join(uploadsDir, filename), buffer)
    }

    const imageUrl = `/uploads/avatars/${filename}`

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    })

    console.log('Avatar updated for user:', session.user.id)
    console.log('New image URL:', imageUrl)
    console.log('Updated user image:', updatedUser.image)

    return NextResponse.json({ 
      message: 'Avatar uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (_error) {
    console.error('[AVATAR_UPLOAD]');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 