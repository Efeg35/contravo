import { NextRequest, NextResponse } from 'next/server';
import { checkPermissionOrThrow, AuthorizationError, canManageUserRole } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newRole: z.enum(['ADMIN', 'EDITOR', 'APPROVER', 'USER', 'VIEWER'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),
});

// GET /api/admin/roles - Get all roles and their permissions
export async function GET() {
  try {
    const roles = {
      global: ['ADMIN', 'EDITOR', 'APPROVER', 'USER', 'VIEWER'],
      company: ['OWNER', 'MANAGER', 'MEMBER']
    };

    const permissions = [
      'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
      'CONTRACT_VIEW', 'CONTRACT_CREATE', 'CONTRACT_EDIT', 'CONTRACT_DELETE',
      'COMPANY_VIEW', 'COMPANY_CREATE', 'COMPANY_EDIT', 'COMPANY_DELETE',
      'TEMPLATE_VIEW', 'TEMPLATE_CREATE', 'TEMPLATE_EDIT', 'TEMPLATE_DELETE',
      'APPROVAL_VIEW', 'APPROVAL_CREATE', 'APPROVAL_EDIT', 'APPROVAL_DELETE',
      'SYSTEM_ADMIN', 'SYSTEM_CONFIG', 'SYSTEM_BACKUP'
    ];

    return NextResponse.json({ roles, permissions });
  } catch (_error) {
    console.error('Error fetching roles:');
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Update user role
export async function POST(request: NextRequest) {
  try {
    await checkPermissionOrThrow(Permission.USER_ROLES_MANAGE);

    const body = await request.json();
    const { userId, newRole } = updateUserRoleSchema.parse(body);

    // Check if current user can manage the target user's role
    const canManage = await canManageUserRole(userId);
    if (!canManage) {
      return NextResponse.json(
        { error: 'Cannot manage this user\'s role' },
        { status: 403 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      }
    });

    // Log the role change
    console.log(`User role updated: ${targetUser.email} from ${targetUser.role} to ${newRole}`);

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser,
      previousRole: targetUser.role,
      newRole,
    });

  } catch (_error) {
    if (_error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: _error.message },
        { status: _error.statusCode }
      );
    }

    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: _error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating user role:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 