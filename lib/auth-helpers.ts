import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { Permission, PermissionManager } from './permissions';
import prisma from './prisma';

// Session helper functions
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      department: true,
      departmentRole: true,
      createdAt: true,
    }
  });

  return user;
}

// Get user with company role for specific company
export async function getCurrentUserWithCompanyRole(companyId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      companyUsers: {
        where: { companyId },
        select: {
          role: true,
          company: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      createdCompanies: {
        where: { id: companyId },
        select: {
          id: true,
          name: true,
        }
      }
    }
  });

  if (!user) return null;

  // Determine company role
  let companyRole = null;
  
  // Check if user is the company owner
  if (user.createdCompanies.length > 0) {
    companyRole = 'OWNER';
  } 
  // Check if user is a member with specific role
  else if (user.companyUsers.length > 0) {
    companyRole = user.companyUsers[0].role;
  }

  return {
    ...user,
    companyRole,
    company: user.companyUsers[0]?.company || user.createdCompanies[0] || null,
  };
}

// Permission checking functions
export async function userHasPermission(permission: Permission, companyId?: string): Promise<boolean> {
  if (companyId) {
    const userWithCompanyRole = await getCurrentUserWithCompanyRole(companyId);
    if (!userWithCompanyRole) return false;
    
    return PermissionManager.userHasPermission(
      userWithCompanyRole.role,
      userWithCompanyRole.companyRole,
      null, // TODO: Add department role support to company context
      permission
    );
  } else {
    const user = await getCurrentUser();
    if (!user) return false;
    
    return PermissionManager.userHasPermission(
      user.role,
      null,
      user.departmentRole,
      permission
    );
  }
}

export async function userHasAnyPermission(permissions: Permission[], companyId?: string): Promise<boolean> {
  if (companyId) {
    const userWithCompanyRole = await getCurrentUserWithCompanyRole(companyId);
    if (!userWithCompanyRole) return false;
    
    return PermissionManager.hasAnyPermission(
      userWithCompanyRole.role,
      userWithCompanyRole.companyRole,
      null, // TODO: Add department role support to company context
      permissions
    );
  } else {
    const user = await getCurrentUser();
    if (!user) return false;
    
    return PermissionManager.hasAnyPermission(
      user.role,
      null,
      user.departmentRole,
      permissions
    );
  }
}

export async function userHasAllPermissions(permissions: Permission[], companyId?: string): Promise<boolean> {
  if (companyId) {
    const userWithCompanyRole = await getCurrentUserWithCompanyRole(companyId);
    if (!userWithCompanyRole) return false;
    
    return PermissionManager.hasAllPermissions(
      userWithCompanyRole.role,
      userWithCompanyRole.companyRole,
      null, // TODO: Add department role support to company context
      permissions
    );
  } else {
    const user = await getCurrentUser();
    if (!user) return false;
    
    return PermissionManager.hasAllPermissions(
      user.role,
      null,
      user.departmentRole,
      permissions
    );
  }
}

// Resource ownership checking
export async function userOwnsResource(resourceType: string, resourceId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  switch (resourceType) {
    case 'contract':
      const contract = await prisma.contract.findFirst({
        where: {
          id: resourceId,
          createdById: user.id,
        }
      });
      return !!contract;

    case 'company':
      const company = await prisma.company.findFirst({
        where: {
          id: resourceId,
          createdById: user.id,
        }
      });
      return !!company;

    case 'template':
      const template = await prisma.contractTemplate.findFirst({
        where: {
          id: resourceId,
          createdById: user.id,
        }
      });
      return !!template;

    default:
      return false;
  }
}

// Company access checking
export async function userHasCompanyAccess(companyId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const access = await prisma.company.findFirst({
    where: {
      id: companyId,
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
    }
  });

  return !!access;
}

// Contract access checking with company context
export async function userCanAccessContract(contractId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      OR: [
        // User is the creator
        { createdById: user.id },
        // User has access through company
        {
          company: {
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
          }
        }
      ]
    }
  });

  return !!contract;
}

// Authorization middleware factory
export function requireAuth() {
  return async () => {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    return null; // Continue
  };
}

export function requirePermissions(permissions: Permission[], companyId?: string) {
  return async () => {
    const hasPermissions = await userHasAllPermissions(permissions, companyId);
    if (!hasPermissions) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    return null; // Continue
  };
}

export function requireOwnership(resourceType: string, resourceId: string) {
  return async () => {
    const isOwner = await userOwnsResource(resourceType, resourceId);
    if (!isOwner) {
      return Response.json({ error: 'Resource access denied' }, { status: 403 });
    }
    return null; // Continue
  };
}

// Permission checking with error responses
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'INSUFFICIENT_PERMISSIONS'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function checkPermissionOrThrow(permission: Permission, companyId?: string) {
  const hasPermission = await userHasPermission(permission, companyId);
  if (!hasPermission) {
    throw new AuthorizationError(`Permission required: ${permission}`);
  }
}

export async function checkCompanyAccessOrThrow(companyId: string) {
  const hasAccess = await userHasCompanyAccess(companyId);
  if (!hasAccess) {
    throw new AuthorizationError('Company access denied');
  }
}

export async function checkContractAccessOrThrow(contractId: string) {
  const hasAccess = await userCanAccessContract(contractId);
  if (!hasAccess) {
    throw new AuthorizationError('Contract access denied');
  }
}

// Get user permissions for frontend
export async function getUserPermissions(companyId?: string) {
  if (companyId) {
    const userWithCompanyRole = await getCurrentUserWithCompanyRole(companyId);
    if (!userWithCompanyRole) return [];
    
    return PermissionManager.getEffectivePermissions(
      userWithCompanyRole.role,
      userWithCompanyRole.companyRole
    );
  } else {
    const user = await getCurrentUser();
    if (!user) return [];
    
    return PermissionManager.getRolePermissions(user.role);
  }
}

// Role management helpers
export async function canManageUserRole(targetUserId: string): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true }
  });

  if (!targetUser) return false;

  return PermissionManager.canManageRole(currentUser.role, targetUser.role);
}

export async function canManageCompanyUserRole(companyId: string, targetUserId: string): Promise<boolean> {
  const currentUserWithRole = await getCurrentUserWithCompanyRole(companyId);
  if (!currentUserWithRole?.companyRole) return false;

  const targetUserCompanyRole = await prisma.companyUser.findFirst({
    where: { companyId, userId: targetUserId },
    select: { role: true }
  });

  if (!targetUserCompanyRole) return false;

  return PermissionManager.canManageCompanyRole(
    currentUserWithRole.companyRole,
    targetUserCompanyRole.role
  );
} 