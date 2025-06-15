import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fileManager, FileCategory, FileUploadOptions } from '@/lib/file-manager';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get upload options
    const category = formData.get('category') as FileCategory || FileCategory.OTHER;
    const isPublic = formData.get('isPublic') === 'true';
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];
    const description = formData.get('description') as string;
    const generateThumbnail = formData.get('generateThumbnail') === 'true';
    const compress = formData.get('compress') === 'true';
    const virusScan = formData.get('virusScan') === 'true';

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload options
    const options: FileUploadOptions = {
      category,
      isPublic,
      tags,
      description,
      generateThumbnail,
      compress,
      virusScan,
      maxSize: 100 * 1024 * 1024 // 100MB
    };

    // Upload file
    const result = await fileManager.uploadFile(
      buffer,
      file.name,
      file.type,
      session.user.id,
      options
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: result.fileId,
        name: result.fileName,
        size: result.size,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl
      },
      warnings: result.warnings
    });

  } catch (error) {
    console.error('❌ Error in file upload API:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get upload limits and allowed types
export async function GET() {
  try {
    return NextResponse.json({
      limits: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxChunkSize: 5 * 1024 * 1024,  // 5MB
        allowedCategories: Object.values(FileCategory),
        supportedFeatures: {
          compression: true,
          thumbnails: true,
          virusScanning: true,
          versioning: true
        }
      },
      allowedTypes: {
        [FileCategory.DOCUMENT]: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        [FileCategory.IMAGE]: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ],
        [FileCategory.VIDEO]: [
          'video/mp4',
          'video/mpeg'
        ],
        [FileCategory.AUDIO]: [
          'audio/mpeg',
          'audio/wav'
        ]
      }
    });
  } catch (error) {
    console.error('❌ Error getting upload info:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 