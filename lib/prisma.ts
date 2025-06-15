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
  'contractAttachment', 
  'contractApproval',
  'contractVersion',
  'contractTemplate',
  'notification',
  'digitalSignature',
  'signaturePackage',
  'clause',
  'clauseUsage',
  'clauseApproval',
  'companySettings',
  'companyUser',
  'companyInvite'
];

// Models that should be filtered by user ownership
const USER_FILTERED_MODELS = [
  'userSession',
  'sessionActivity',
  'passwordHistory',
  'notificationSettings'
];

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  
  // Multi-tenant middleware will be added later to avoid circular dependencies
  // For now, basic client without middleware

  return client;
};

// Multi-tenant filter functions will be implemented in a separate module

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma; 