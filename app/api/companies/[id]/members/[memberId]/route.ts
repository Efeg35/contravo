import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, memberId } = await params;

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

    await prisma.companyUser.delete({
      where: {
        id: member.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (_error) {
    console.error("[COMPANY_MEMBER_DELETE]");
    return new NextResponse("Internal error", { status: 500 });
  }
} 