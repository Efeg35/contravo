import { PrismaClient } from '@prisma/client';

// Multi-tenant context interface
interface TenantContext {
  userId?: string;
  companyId?: string;
  isAdmin?: boolean;
}

// Models that should be filtered by company
const COMPANY_FILTERED_MODELS = [
  'contract',
  'contractattachment', 
  'contractapproval',
  'contractversion',
  'contracttemplate',
  'notification',
  'digitalsignature',
  'signaturepackage',
  'clause',
  'clauseusage',
  'clauseapproval',
  'companysettings',
  'companyuser',
  'companyinvite'
];

// Models that should be filtered by user ownership
const USER_FILTERED_MODELS = [
  'usersession',
  'sessionactivity',
  'passwordhistory',
  'notificationsettings'
];

// Helper function to safely set params.args.where
function setWhereFilter(params: any, filter: any) {
  params.args = params.args || {};
  params.args.where = params.args.where ? 
    { AND: [params.args.where, filter] } : 
    filter;
}

// Apply multi-tenant middleware to a Prisma client
export function applyMultiTenantMiddleware(client: PrismaClient) {
  client.$use(async (params, next) => {
    try {
      // Get current user context from headers or other sources
      const tenantContext = await getTenantContextSafe();
      
      if (!tenantContext?.userId) {
        // If no user context, only allow public reads
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
          if (params.model?.toLowerCase() === 'contracttemplate') {
            params.args = params.args || {};
            params.args.where = {
              ...params.args.where,
              isPublic: true
            };
          }
        }
        return next(params);
      }

      // Apply company-level filters
      if (COMPANY_FILTERED_MODELS.includes(params.model?.toLowerCase() || '')) {
        const modelName = params.model?.toLowerCase();
        
        switch (modelName) {
          case 'contract':
            if (!tenantContext.isAdmin) {
              setWhereFilter(params, {
                OR: [
                  { createdById: tenantContext.userId },
                  // Add company-based access when companyId is available
                  ...(tenantContext.companyId ? [{ companyId: tenantContext.companyId }] : [])
                ]
              });
            }
            break;
            
          case 'contracttemplate':
            if (!tenantContext.isAdmin) {
              setWhereFilter(params, {
                OR: [
                  { isPublic: true },
                  { createdById: tenantContext.userId },
                  ...(tenantContext.companyId ? [{ companyId: tenantContext.companyId }] : [])
                ]
              });
            }
            break;
            
          case 'notification':
            if (!tenantContext.isAdmin) {
              setWhereFilter(params, {
                userId: tenantContext.userId
              });
            }
            break;
            
          case 'companysettings':
          case 'companyuser':
          case 'companyinvite':
            if (!tenantContext.isAdmin && tenantContext.companyId) {
              setWhereFilter(params, {
                companyId: tenantContext.companyId
              });
            }
            break;
            
          default:
            // For other models, apply basic user-based filtering
            if (!tenantContext.isAdmin) {
              setWhereFilter(params, {
                OR: [
                  { createdById: tenantContext.userId },
                  { userId: tenantContext.userId },
                  ...(tenantContext.companyId ? [{ companyId: tenantContext.companyId }] : [])
                ]
              });
            }
        }
      }
      
      // Apply user-level filters
      if (USER_FILTERED_MODELS.includes(params.model?.toLowerCase() || '')) {
        if (!tenantContext.isAdmin) {
          setWhereFilter(params, {
            userId: tenantContext.userId
          });
        }
      }

      return next(params);
    } catch (error) {
      console.error('Multi-tenant middleware error:', error);
      // In case of error, proceed without filtering (fail-open for now)
      return next(params);
    }
  });
}

// Safe way to get tenant context without circular dependencies
async function getTenantContextSafe(): Promise<TenantContext | null> {
  try {
    // Import here to avoid circular dependencies
    const { getGlobalTenantContext } = await import('./tenant-context');
    return getGlobalTenantContext();
  } catch (error) {
    console.error('Error getting tenant context:', error);
    return null;
  }
} 