import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
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

    const { id, memberId } = await params;

    // Check if current user has permission to remove members from this company
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
      return new NextResponse("Forbidden - You don't have permission to remove members from this company", { status: 403 });
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

    const member = company.users.find(
      (member) => member.id === memberId
    );

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Prevent users from removing themselves unless they are the company owner
    if (member.user.id === session.user.id && company.createdById !== session.user.id) {
      return new NextResponse("You cannot remove yourself from the company unless you are the owner", { status: 403 });
    }

    await prisma.companyUser.delete({
      where: {
        id: member.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COMPANY_MEMBER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 