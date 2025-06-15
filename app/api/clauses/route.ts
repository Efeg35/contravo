import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating clauses
const createClauseSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık çok uzun'),
  description: z.string().optional(),
  content: z.string().min(1, 'İçerik gereklidir'),
  category: z.enum([
    'LEGAL',
    'COMMERCIAL',
    'TECHNICAL',
    'CONFIDENTIALITY',
    'TERMINATION',
    'LIABILITY',
    'INTELLECTUAL_PROPERTY',
    'PAYMENT',
    'DELIVERY',
    'COMPLIANCE',
    'DISPUTE',
    'FORCE_MAJEURE',
    'OTHER'
  ]),
  visibility: z.enum(['PUBLIC', 'COMPANY', 'PRIVATE']).default('COMPANY'),
  variables: z.array(z.object({
    name: z.string().min(1, 'Variable adı gereklidir'),
    label: z.string().min(1, 'Variable etiketi gereklidir'),
    type: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'EMAIL', 'PHONE', 'CURRENCY', 'PERCENTAGE']).default('STRING'),
    defaultValue: z.string().optional(),
    isRequired: z.boolean().default(false),
    description: z.string().optional(),
    validation: z.any().optional()
  })).default([])
});

// GET /api/clauses - List clauses with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    // const visibility = searchParams.get('visibility'); // TODO: implement visibility filtering
    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId'); // Company context
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get user's accessible companies for filtering
    const userCompanies = await prisma.company.findMany({
      where: {
        OR: [
          { createdById: user.id },
          {
            users: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      select: { id: true }
    });

    const accessibleCompanyIds = userCompanies.map(c => c.id);

    // Build filter conditions
    const where: any = {
      isActive: true,
      approvalStatus: 'APPROVED', // Only show approved clauses
      OR: [
        { visibility: 'PUBLIC' },
        { 
          visibility: 'COMPANY',
          AND: [
            {
              OR: [
                { companyId: { in: accessibleCompanyIds } },
                { companyId: null } // System-wide company clauses
              ]
            },
            companyId ? { companyId } : {} // Filter by specific company if provided
          ]
        },
        { 
          visibility: 'PRIVATE',
          createdById: user.id 
        }
      ]
    };

    // Apply filters
    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        ...where.OR,
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.clause.count({ where });

    // Get clauses with pagination
    const clauses = await prisma.clause.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        variables: true,
        _count: {
          select: {
            usageStats: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    });

    return NextResponse.json({
      clauses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Clause listesi getirme hatası:', error);
    return NextResponse.json(
      { error: 'Clause listesi getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/clauses - Create new clause
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createClauseSchema.parse(body);

    // Create clause with variables
    const clause = await prisma.clause.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        category: validatedData.category,
        visibility: validatedData.visibility,
        createdById: user.id,
        // companyId: user.companyId, // TODO: add companyId to user type
        variables: {
          create: validatedData.variables
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        variables: true
      }
    });

    return NextResponse.json(clause, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Clause oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Clause oluşturulamadı' },
      { status: 500 }
    );
  }
} 