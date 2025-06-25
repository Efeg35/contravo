import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Find the company of the user (optional)
    const companyUser = await db.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    const newTemplate = await db.workflowTemplate.create({
      data: {
        name: `Untitled workflow configuration ${Date.now()}`,
        description: 'A new workflow template.',
        status: 'UNPUBLISHED',
        createdById: session.user.id,
        ...(companyUser?.companyId && { companyId: companyUser.companyId }),
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workflow template:', error);
    return NextResponse.json(
      { 
        error: 'İş akışı şablonu oluşturulurken bir hata oluştu.',
        details: error.message || 'No additional details available.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const templates = await db.workflowTemplate.findMany({
      include: {
        steps: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Workflow template listesi yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Şablonlar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 