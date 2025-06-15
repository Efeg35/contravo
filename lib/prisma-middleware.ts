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

// Apply multi-tenant middleware to a Prisma client
export function applyMultiTenantMiddleware(client: PrismaClient) {
  client.$use(async (params, next) => {
    try {
      // Get current user context from headers or other sources
      // We'll use a more direct approach to avoid circular dependencies
      const tenantContext = await getTenantContextSafe();
      
      if (!tenantContext?.userId) {
        // If no user context, only allow public reads
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
          if (params.model?.toLowerCase() === 'contracttemplate') {
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
            applyContractFilter(params, tenantContext);
            break;
            
          case 'contractattachment':
            applyContractAttachmentFilter(params, tenantContext);
            break;
            
          case 'contractapproval':
            applyContractApprovalFilter(params, tenantContext);
            break;
            
          case 'contractversion':
            applyContractVersionFilter(params, tenantContext);
            break;
            
          case 'contracttemplate':
            applyContractTemplateFilter(params, tenantContext);
            break;
            
          case 'notification':
            applyNotificationFilter(params, tenantContext);
            break;
            
          case 'digitalsignature':
            applyDigitalSignatureFilter(params, tenantContext);
            break;
            
          case 'signaturepackage':
            applySignaturePackageFilter(params, tenantContext);
            break;
            
          case 'clause':
            applyClauseFilter(params, tenantContext);
            break;
            
          case 'clauseusage':
          case 'clauseapproval':
            applyClauseRelatedFilter(params, tenantContext);
            break;
            
          case 'companysettings':
          case 'companyuser':
          case 'companyinvite':
            applyCompanyRelatedFilter(params, tenantContext);
            break;
        }
      }
      
      // Apply user-level filters
      if (USER_FILTERED_MODELS.includes(params.model?.toLowerCase() || '')) {
        applyUserFilter(params, tenantContext);
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

// Filter functions for different models
function applyContractFilter(params: any, context: TenantContext) {
  if (!context.userId) return;
  
  // Admin can see all contracts
  if (context.isAdmin) return;
  
  // For non-admins, only show contracts they have access to
  const accessFilter = {
    OR: [
      // Contracts they created
      { createdById: context.userId },
      // Contracts from companies they belong to (simplified for now)
      { createdById: context.userId } // This would need proper company relationship
    ]
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyContractAttachmentFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  const accessFilter = {
    contract: {
      createdById: context.userId
    }
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyContractApprovalFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  const accessFilter = {
    OR: [
      { approverId: context.userId },
      {
        contract: {
          createdById: context.userId
        }
      }
    ]
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyContractVersionFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  const accessFilter = {
    contract: {
      createdById: context.userId
    }
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyContractTemplateFilter(params: any, context: TenantContext) {
  if (!context.userId) return;
  
  // Admin can see all templates
  if (context.isAdmin) return;
  
  const accessFilter = {
    OR: [
      { isPublic: true },
      { createdById: context.userId }
    ]
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyNotificationFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  // Users can only see their own notifications
  const accessFilter = {
    userId: context.userId
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyDigitalSignatureFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  const accessFilter = {
    OR: [
      { userId: context.userId },
      {
        contract: {
          createdById: context.userId
        }
      }
    ]
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applySignaturePackageFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  const accessFilter = {
    OR: [
      { createdById: context.userId },
      {
        contract: {
          createdById: context.userId
        }
      }
    ]
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyClauseFilter(params: any, context: TenantContext) {
  if (!context.userId) return;
  
  // Admin can see all clauses
  if (context.isAdmin) return;
  
  const accessFilter = {
    OR: [
      { visibility: 'PUBLIC' },
      { createdById: context.userId }
    ]
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyClauseRelatedFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  const accessFilter = {
    clause: {
      OR: [
        { visibility: 'PUBLIC' },
        { createdById: context.userId }
      ]
    }
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyCompanyRelatedFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  // Simplified - would need proper company membership check
  const accessFilter = {
    company: {
      createdById: context.userId
    }
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
}

function applyUserFilter(params: any, context: TenantContext) {
  if (!context.userId || context.isAdmin) return;
  
  // Users can only access their own user-related data
  const accessFilter = {
    userId: context.userId
  };

  params.args.where = params.args.where ? 
    { AND: [params.args.where, accessFilter] } : 
    accessFilter;
} 