import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
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
    console.error("[COMPANY_MEMBER_POST]");
    return new NextResponse("Internal error", { status: 500 });
  }
} 