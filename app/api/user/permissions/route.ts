import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserWithCompanyRole, getUserPermissions } from '@/lib/auth-helpers';
import { PermissionManager } from '@/lib/permissions';

// GET /api/user/permissions - Get user permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (companyId) {
      const userWithCompanyRole = await getCurrentUserWithCompanyRole(companyId);
      if (!userWithCompanyRole) {
        return NextResponse.json({ error: 'Company access denied' }, { status: 403 });
      }

      const permissions = PermissionManager.getEffectivePermissions(
        userWithCompanyRole.role,
        userWithCompanyRole.companyRole
      );

      return NextResponse.json({
        user: {
          id: userWithCompanyRole.id,
          name: userWithCompanyRole.name,
          email: userWithCompanyRole.email,
          globalRole: userWithCompanyRole.role,
          companyRole: userWithCompanyRole.companyRole,
        },
        company: userWithCompanyRole.company,
        permissions,
        roleHierarchy: {
          globalRolePriority: PermissionManager.getRolePriority(userWithCompanyRole.role),
          companyRolePriority: userWithCompanyRole.companyRole 
            ? PermissionManager.getCompanyRolePriority(userWithCompanyRole.companyRole)
            : 0,
        }
      });
    } else {
      const permissions = await getUserPermissions();

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          globalRole: user.role,
          companyRole: null,
        },
        company: null,
        permissions,
        roleHierarchy: {
          globalRolePriority: PermissionManager.getRolePriority(user.role),
          companyRolePriority: 0,
        }
      });
    }

  } catch (_error) {
    console.error('Error fetching user permissions:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 