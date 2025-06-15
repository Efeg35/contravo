import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import prisma from './prisma';

// Tenant context interface
export interface TenantContext {
  userId: string;
  companyId?: string;
  isAdmin: boolean;
  companyRole?: string;
}

// Global context storage for middleware access
let globalTenantContext: TenantContext | null = null;

// Set the current tenant context globally
export function setGlobalTenantContext(context: TenantContext | null) {
  globalTenantContext = context;
}

// Get the current tenant context safely (for middleware use)
export function getGlobalTenantContext(): TenantContext | null {
  return globalTenantContext;
}

// Get tenant context from session
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    isAdmin: session.user.role === 'ADMIN'
  };
}

// Get tenant context with specific company
export async function getTenantContextWithCompany(companyId: string): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Check if user has access to this company
  const companyAccess = await prisma.company.findFirst({
    where: {
      id: companyId,
      OR: [
        { createdById: session.user.id },
        {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      ]
    },
    include: {
      users: {
        where: {
          userId: session.user.id
        },
        select: {
          role: true
        }
      }
    }
  });

  if (!companyAccess) {
    return null;
  }

  // Determine company role
  let companyRole = 'OWNER';
  if (companyAccess.users.length > 0) {
    companyRole = companyAccess.users[0].role;
  }

  return {
    userId: session.user.id,
    companyId,
    isAdmin: session.user.role === 'ADMIN',
    companyRole
  };
}

// Check if user can access a specific company
export async function canAccessCompany(companyId: string): Promise<boolean> {
  const context = await getTenantContextWithCompany(companyId);
  return context !== null;
}

// Check if user can access a specific contract
export async function canAccessContract(contractId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return false;
  }

  // Admin can access all contracts
  if (session.user.role === 'ADMIN') {
    return true;
  }

  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      OR: [
        // User is the creator
        { createdById: session.user.id },
        // User has access through company
        {
          company: {
            OR: [
              { createdById: session.user.id },
              {
                users: {
                  some: {
                    userId: session.user.id
                  }
                }
              }
            ]
          }
        }
      ]
    }
  });

  return contract !== null;
}

// Middleware for API routes to require tenant context
export function withTenantContext(handler: (context: TenantContext, ...args: any[]) => Promise<Response>) {
  return async (...args: any[]): Promise<Response> => {
    const context = await getTenantContext();
    
    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(context, ...args);
  };
}

// Middleware for API routes to require company access
export function withCompanyAccess(handler: (context: TenantContext, ...args: any[]) => Promise<Response>) {
  return async (request: Request, { params }: { params: Promise<{ id: string }> }, ...args: any[]): Promise<Response> => {
    const { id: companyId } = await params;
    const context = await getTenantContextWithCompany(companyId);
    
    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Company access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(context, request, { params }, ...args);
  };
}

// Utility to create company-scoped Prisma client
export function createCompanyScopedClient(companyId: string) {
  // This returns a Prisma client that's automatically scoped to the company
  // The middleware we added will handle the filtering
  return prisma;
}

// Get all companies user has access to
export async function getUserCompanies(): Promise<Array<{ id: string; name: string; role: string }>> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return [];
  }

  // Admin can see all companies
  if (session.user.role === 'ADMIN') {
    const allCompanies = await prisma.company.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    return allCompanies.map(company => ({
      ...company,
      role: 'ADMIN'
    }));
  }

  // Get companies user owns
  const ownedCompanies = await prisma.company.findMany({
    where: {
      createdById: session.user.id
    },
    select: {
      id: true,
      name: true
    }
  });

  // Get companies user is a member of
  const memberCompanies = await prisma.companyUser.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      company: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return [
    ...ownedCompanies.map(company => ({
      ...company,
      role: 'OWNER'
    })),
    ...memberCompanies.map(member => ({
      id: member.company.id,
      name: member.company.name,
      role: member.role
    }))
  ];
}

// Validate that a company ID belongs to the current user's accessible companies
export async function validateCompanyAccess(companyId: string): Promise<boolean> {
  const userCompanies = await getUserCompanies();
  return userCompanies.some(company => company.id === companyId);
}

// Get user's role in a specific company
export async function getUserRoleInCompany(companyId: string): Promise<string | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Check if user owns the company
  const ownedCompany = await prisma.company.findFirst({
    where: {
      id: companyId,
      createdById: session.user.id
    }
  });

  if (ownedCompany) {
    return 'OWNER';
  }

  // Check if user is a member
  const membership = await prisma.companyUser.findFirst({
    where: {
      companyId,
      userId: session.user.id
    }
  });

  return membership?.role || null;
} 