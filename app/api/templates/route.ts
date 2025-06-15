import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Template creation schema
const createTemplateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  description: z.string().optional(),
  category: z.enum(['EMPLOYMENT', 'SERVICE', 'PARTNERSHIP', 'SALES', 'RENTAL', 'CONSULTING', 'NDA', 'SUPPLY', 'OTHER']),
  content: z.string().min(1, 'Şablon içeriği gereklidir'),
  variables: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'number', 'date', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    defaultValue: z.string().optional(),
  })).optional(),
  isPublic: z.boolean().default(false),
  companyId: z.string().optional(),
});

// GET /api/templates - List templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const baseWhere = {
      AND: [
        { isActive: true },
        {
          OR: [
            { isPublic: true },
            { createdById: session.user.id },
            ...(companyId ? [{ companyId }] : [])
          ]
        }
      ]
    };

    const where = category && category !== 'ALL' 
      ? { ...baseWhere, category: category as 'SERVICE' | 'SALES' | 'PARTNERSHIP' | 'EMPLOYMENT' | 'RENTAL' | 'CONSULTING' | 'NDA' | 'SUPPLY' | 'OTHER' }
      : baseWhere;

    const [templates, total] = await Promise.all([
      prisma.contractTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              contracts: true,
            },
          },
        },
      }),
      prisma.contractTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Templates fetch error:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/templates - Create template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    // Check if user has permission to create template for company
    if (data.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: data.companyId,
          OR: [
            { createdById: session.user.id },
            {
              users: {
                some: {
                  userId: session.user.id,
                  role: { in: ['ADMIN', 'EDITOR'] }
                }
              }
            }
          ]
        }
      });

      if (!company) {
        return NextResponse.json({ error: 'Şirket için şablon oluşturma yetkiniz yok' }, { status: 403 });
      }
    }

    const template = await prisma.contractTemplate.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        content: data.content,
        variables: data.variables || [],
        isPublic: data.isPublic,
        companyId: data.companyId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Template creation error:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 