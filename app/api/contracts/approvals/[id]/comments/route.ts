import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const approvalId = resolvedParams.id;

    // Mock comments data
    const mockComments = [
      {
        id: '1',
        approvalId,
        userId: '1',
        user: {
          name: 'Ahmet Yılmaz',
          email: 'ahmet@contravo.com',
          avatar: null
        },
        content: 'Bu madde için ek açıklama gerekiyor.',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        approvalId,
        userId: '2',
        user: {
          name: 'Ayşe Demir',
          email: 'ayse@contravo.com',
          avatar: null
        },
        content: 'Hukuki açıdan uygun görünüyor.',
        createdAt: '2024-01-15T11:15:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      comments: mockComments
    });

  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content } = await request.json();
    const resolvedParams = await params;
    const approvalId = resolvedParams.id;

    // Mock comment creation
    const newComment = {
      id: Date.now().toString(),
      approvalId,
      userId: session.user.id,
      user: {
        name: session.user.name || 'Unknown User',
        email: session.user.email || '',
        avatar: session.user.image
      },
      content,
      createdAt: new Date().toISOString()
    };

    console.log('New comment created:', newComment);

    return NextResponse.json({
      success: true,
      comment: newComment,
      message: 'Yorum başarıyla eklendi'
    });

  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 