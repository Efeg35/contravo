import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get current user for authorization
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if current user has permission to add members to this company
    const hasAccess = currentUser.role === 'ADMIN' || await prisma.company.findFirst({
      where: {
        id,
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

    if (!hasAccess) {
      return new NextResponse("Forbidden - You don't have permission to add members to this company", { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: {
        id,
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const existingMember = company.users.find(
      (member) => member.user.id === user.id
    );

    if (existingMember) {
      return new NextResponse("User is already a member", { status: 400 });
    }

    const member = await prisma.companyUser.create({
      data: {
        companyId: company.id,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("[COMPANY_MEMBER_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 