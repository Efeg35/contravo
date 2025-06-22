// Role-based permissions system
export enum Permission {
  // User Management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ROLES_MANAGE = 'user:roles:manage',

  // Company Management
  COMPANY_VIEW = 'company:view',
  COMPANY_CREATE = 'company:create',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',
  COMPANY_SETTINGS_MANAGE = 'company:settings:manage',
  COMPANY_MEMBERS_MANAGE = 'company:members:manage',
  COMPANY_INVITES_MANAGE = 'company:invites:manage',

  // Contract Management
  CONTRACT_VIEW = 'contract:view',
  CONTRACT_CREATE = 'contract:create',
  CONTRACT_UPDATE = 'contract:update',
  CONTRACT_DELETE = 'contract:delete',
  CONTRACT_APPROVE = 'contract:approve',
  CONTRACT_SIGN = 'contract:sign',
  CONTRACT_ARCHIVE = 'contract:archive',
  CONTRACT_VIEW_ALL = 'contract:view:all',
  
  // Department-specific Contract Permissions
  CONTRACT_VIEW_HR = 'contract:view:hr',
  CONTRACT_VIEW_FINANCE = 'contract:view:finance',
  CONTRACT_VIEW_LEGAL = 'contract:view:legal',
  CONTRACT_VIEW_SALES = 'contract:view:sales',
  CONTRACT_VIEW_IT = 'contract:view:it',
  CONTRACT_VIEW_PROCUREMENT = 'contract:view:procurement',
  CONTRACT_CREATE_HR = 'contract:create:hr',
  CONTRACT_CREATE_FINANCE = 'contract:create:finance',
  CONTRACT_CREATE_LEGAL = 'contract:create:legal',
  CONTRACT_CREATE_SALES = 'contract:create:sales',
  CONTRACT_CREATE_IT = 'contract:create:it',
  CONTRACT_CREATE_PROCUREMENT = 'contract:create:procurement',

  // Template Management
  TEMPLATE_VIEW = 'template:view',
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',
  TEMPLATE_PUBLISH = 'template:publish',

  // Attachment Management
  ATTACHMENT_VIEW = 'attachment:view',
  ATTACHMENT_UPLOAD = 'attachment:upload',
  ATTACHMENT_DELETE = 'attachment:delete',

  // Notification Management
  NOTIFICATION_VIEW = 'notification:view',
  NOTIFICATION_MANAGE = 'notification:manage',
  NOTIFICATION_SEND = 'notification:send',

  // Report & Analytics
  REPORT_VIEW = 'report:view',
  REPORT_GENERATE = 'report:generate',
  ANALYTICS_VIEW = 'analytics:view',

  // System Administration
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
}

// Department Enum
export enum Department {
  HR = 'HR',
  FINANCE = 'FINANCE', 
  LEGAL = 'LEGAL',
  SALES = 'SALES',
  IT = 'IT',
  PROCUREMENT = 'PROCUREMENT',
  GENERAL = 'GENERAL'
}

// Contract Type to Department Mapping
export const CONTRACT_TYPE_DEPARTMENT_MAPPING: Record<string, Department[]> = {
  'EMPLOYMENT': [Department.HR, Department.LEGAL],
  'NDA': [Department.HR, Department.LEGAL, Department.SALES],
  'SERVICE': [Department.PROCUREMENT, Department.LEGAL, Department.FINANCE],
  'PARTNERSHIP': [Department.LEGAL, Department.SALES, Department.FINANCE],
  'SALES': [Department.SALES, Department.FINANCE, Department.LEGAL],
  'LEASE': [Department.FINANCE, Department.LEGAL],
  'SOFTWARE_LICENSE': [Department.IT, Department.PROCUREMENT, Department.LEGAL],
  'CONSULTING': [Department.PROCUREMENT, Department.LEGAL],
  'MAINTENANCE': [Department.IT, Department.PROCUREMENT],
  'VENDOR': [Department.PROCUREMENT, Department.FINANCE],
  'OTHER': [Department.GENERAL, Department.LEGAL]
};

// Role definitions with their permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Super admin - has all permissions
  ADMIN: [
    // User Management
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_ROLES_MANAGE,

    // Company Management
    Permission.COMPANY_VIEW,
    Permission.COMPANY_CREATE,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_DELETE,
    Permission.COMPANY_SETTINGS_MANAGE,
    Permission.COMPANY_MEMBERS_MANAGE,
    Permission.COMPANY_INVITES_MANAGE,

    // Contract Management
    Permission.CONTRACT_VIEW,
    Permission.CONTRACT_CREATE,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_DELETE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,
    Permission.CONTRACT_ARCHIVE,
    Permission.CONTRACT_VIEW_ALL,
    
    // All department permissions
    Permission.CONTRACT_VIEW_HR,
    Permission.CONTRACT_VIEW_FINANCE,
    Permission.CONTRACT_VIEW_LEGAL,
    Permission.CONTRACT_VIEW_SALES,
    Permission.CONTRACT_VIEW_IT,
    Permission.CONTRACT_VIEW_PROCUREMENT,
    Permission.CONTRACT_CREATE_HR,
    Permission.CONTRACT_CREATE_FINANCE,
    Permission.CONTRACT_CREATE_LEGAL,
    Permission.CONTRACT_CREATE_SALES,
    Permission.CONTRACT_CREATE_IT,
    Permission.CONTRACT_CREATE_PROCUREMENT,

    // Template Management
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
    Permission.TEMPLATE_PUBLISH,

    // Attachment Management
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
    Permission.ATTACHMENT_DELETE,

    // Notification Management
    Permission.NOTIFICATION_VIEW,
    Permission.NOTIFICATION_MANAGE,
    Permission.NOTIFICATION_SEND,

    // Report & Analytics
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.ANALYTICS_VIEW,

    // System Administration
    Permission.SYSTEM_ADMIN,
    Permission.SYSTEM_SETTINGS,
    Permission.SYSTEM_LOGS,
  ],

  // Editor - can manage contracts and templates
  EDITOR: [
    // User Management (limited)
    Permission.USER_VIEW,

    // Company Management (limited)
    Permission.COMPANY_VIEW,

    // Contract Management
    Permission.CONTRACT_VIEW,
    Permission.CONTRACT_CREATE,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_ARCHIVE,

    // Template Management
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,

    // Attachment Management
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
    Permission.ATTACHMENT_DELETE,

    // Notification Management
    Permission.NOTIFICATION_VIEW,

    // Report & Analytics
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
  ],

  // Approver - can approve and sign contracts
  APPROVER: [
    // Contract Management
    Permission.CONTRACT_VIEW,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,

    // Template Management (read-only)
    Permission.TEMPLATE_VIEW,

    // Attachment Management
    Permission.ATTACHMENT_VIEW,

    // Notification Management
    Permission.NOTIFICATION_VIEW,

    // Report & Analytics
    Permission.REPORT_VIEW,
  ],

  // Viewer - read-only access
  VIEWER: [
    // Contract Management (read-only)
    Permission.CONTRACT_VIEW,

    // Template Management (read-only)
    Permission.TEMPLATE_VIEW,

    // Attachment Management (read-only)
    Permission.ATTACHMENT_VIEW,

    // Notification Management
    Permission.NOTIFICATION_VIEW,
  ],

  // User - basic user permissions
  USER: [
    // Contract Management (limited)
    Permission.CONTRACT_VIEW,
    Permission.CONTRACT_CREATE,

    // Template Management (read-only)
    Permission.TEMPLATE_VIEW,

    // Attachment Management
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,

    // Notification Management
    Permission.NOTIFICATION_VIEW,
  ],
};

// Department-specific role permissions
export const DEPARTMENT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // HR Department Roles
  HR_MANAGER: [
    Permission.CONTRACT_VIEW_HR,
    Permission.CONTRACT_CREATE_HR,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,
    Permission.CONTRACT_VIEW_LEGAL, // Can see legal contracts for HR matters
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  
  HR_SPECIALIST: [
    Permission.CONTRACT_VIEW_HR,
    Permission.CONTRACT_CREATE_HR,
    Permission.CONTRACT_UPDATE,
    Permission.TEMPLATE_VIEW,
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
  ],
  
  HR_ASSISTANT: [
    Permission.CONTRACT_VIEW_HR,
    Permission.TEMPLATE_VIEW,
    Permission.ATTACHMENT_VIEW,
  ],

  // Finance Department Roles
  FINANCE_MANAGER: [
    Permission.CONTRACT_VIEW_FINANCE,
    Permission.CONTRACT_CREATE_FINANCE,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,
    Permission.CONTRACT_VIEW_SALES, // Can see sales contracts for financial oversight
    Permission.CONTRACT_VIEW_PROCUREMENT, // Can see procurement for budgets
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.ANALYTICS_VIEW,
  ],
  
  FINANCE_ANALYST: [
    Permission.CONTRACT_VIEW_FINANCE,
    Permission.CONTRACT_VIEW_SALES,
    Permission.TEMPLATE_VIEW,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  
  ACCOUNTANT: [
    Permission.CONTRACT_VIEW_FINANCE,
    Permission.TEMPLATE_VIEW,
    Permission.ATTACHMENT_VIEW,
  ],

  // Legal Department Roles
  LEGAL_COUNSEL: [
    Permission.CONTRACT_VIEW_LEGAL,
    Permission.CONTRACT_CREATE_LEGAL,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,
    Permission.CONTRACT_VIEW_HR, // Legal can see all HR contracts
    Permission.CONTRACT_VIEW_FINANCE, // Legal can see financial contracts
    Permission.CONTRACT_VIEW_SALES, // Legal can see sales contracts
    Permission.CONTRACT_VIEW_IT, // Legal can see IT contracts for compliance
    Permission.CONTRACT_VIEW_PROCUREMENT, // Legal can see procurement contracts
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_PUBLISH,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  
  PARALEGAL: [
    Permission.CONTRACT_VIEW_LEGAL,
    Permission.CONTRACT_CREATE_LEGAL,
    Permission.TEMPLATE_VIEW,
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
  ],

  // Sales Department Roles
  SALES_MANAGER: [
    Permission.CONTRACT_VIEW_SALES,
    Permission.CONTRACT_CREATE_SALES,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  
  SALES_REP: [
    Permission.CONTRACT_VIEW_SALES,
    Permission.CONTRACT_CREATE_SALES,
    Permission.TEMPLATE_VIEW,
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
  ],

  // IT Department Roles
  IT_MANAGER: [
    Permission.CONTRACT_VIEW_IT,
    Permission.CONTRACT_CREATE_IT,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_APPROVE,
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.REPORT_VIEW,
  ],
  
  IT_SPECIALIST: [
    Permission.CONTRACT_VIEW_IT,
    Permission.CONTRACT_CREATE_IT,
    Permission.TEMPLATE_VIEW,
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
  ],

  // Procurement Department Roles
  PROCUREMENT_MANAGER: [
    Permission.CONTRACT_VIEW_PROCUREMENT,
    Permission.CONTRACT_CREATE_PROCUREMENT,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,
    Permission.CONTRACT_VIEW_FINANCE, // Can see financial impact
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  
  PROCUREMENT_SPECIALIST: [
    Permission.CONTRACT_VIEW_PROCUREMENT,
    Permission.CONTRACT_CREATE_PROCUREMENT,
    Permission.TEMPLATE_VIEW,
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
  ],
};

// Company-specific role permissions
export const COMPANY_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    // Company Management (full)
    Permission.COMPANY_VIEW,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_DELETE,
    Permission.COMPANY_SETTINGS_MANAGE,
    Permission.COMPANY_MEMBERS_MANAGE,
    Permission.COMPANY_INVITES_MANAGE,

    // Contract Management (full within company)
    Permission.CONTRACT_VIEW,
    Permission.CONTRACT_CREATE,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_DELETE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,
    Permission.CONTRACT_ARCHIVE,
    Permission.CONTRACT_VIEW_ALL, // Owner can see all contracts in company

    // Template Management (full within company)
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
    Permission.TEMPLATE_PUBLISH,

    // Reports for company
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.ANALYTICS_VIEW,
  ],

  MANAGER: [
    // Company Management (limited)
    Permission.COMPANY_VIEW,
    Permission.COMPANY_MEMBERS_MANAGE,

    // Contract Management
    Permission.CONTRACT_VIEW,
    Permission.CONTRACT_CREATE,
    Permission.CONTRACT_UPDATE,
    Permission.CONTRACT_APPROVE,
    Permission.CONTRACT_SIGN,

    // Template Management
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,

    // Reports
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
  ],

  MEMBER: [
    // Contract Management (basic)
    Permission.CONTRACT_VIEW,
    Permission.CONTRACT_CREATE,

    // Template Management (read-only)
    Permission.TEMPLATE_VIEW,

    // Attachment Management
    Permission.ATTACHMENT_VIEW,
    Permission.ATTACHMENT_UPLOAD,
  ],
};

export class PermissionManager {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: string, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if a company role has a specific permission
   */
  static hasCompanyPermission(companyRole: string, permission: Permission): boolean {
    const permissions = COMPANY_ROLE_PERMISSIONS[companyRole] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if a department role has a specific permission
   */
  static hasDepartmentPermission(departmentRole: string, permission: Permission): boolean {
    const permissions = DEPARTMENT_ROLE_PERMISSIONS[departmentRole] || [];
    return permissions.includes(permission);
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get all permissions for a company role
   */
  static getCompanyRolePermissions(companyRole: string): Permission[] {
    return COMPANY_ROLE_PERMISSIONS[companyRole] || [];
  }

  /**
   * Get all permissions for a department role
   */
  static getDepartmentRolePermissions(departmentRole: string): Permission[] {
    return DEPARTMENT_ROLE_PERMISSIONS[departmentRole] || [];
  }

  /**
   * Check if user has permission considering global, company and department roles
   */
  static userHasPermission(
    globalRole: string,
    companyRole: string | null,
    departmentRole: string | null,
    permission: Permission
  ): boolean {
    // Check global role permissions first
    if (this.hasPermission(globalRole, permission)) {
      return true;
    }

    // Check company role permissions
    if (companyRole && this.hasCompanyPermission(companyRole, permission)) {
      return true;
    }

    // Check department role permissions
    if (departmentRole && this.hasDepartmentPermission(departmentRole, permission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can access contract based on contract type and department
   */
  static canAccessContractByType(
    contractType: string,
    userDepartment: Department,
    departmentRole: string | null
  ): boolean {
    // If user is in a department that can access this contract type
    const allowedDepartments = CONTRACT_TYPE_DEPARTMENT_MAPPING[contractType] || [Department.GENERAL];
    
    if (!allowedDepartments.includes(userDepartment)) {
      return false;
    }

    // If user has department role, check department-specific permissions
    if (departmentRole) {
      const departmentPermissions = this.getDepartmentRolePermissions(departmentRole);
      
      // Check if user has general view permission or department-specific view permission
      if (departmentPermissions.includes(Permission.CONTRACT_VIEW)) {
        return true;
      }

      // Check department-specific permissions
      switch (userDepartment) {
        case Department.HR:
          return departmentPermissions.includes(Permission.CONTRACT_VIEW_HR);
        case Department.FINANCE:
          return departmentPermissions.includes(Permission.CONTRACT_VIEW_FINANCE);
        case Department.LEGAL:
          return departmentPermissions.includes(Permission.CONTRACT_VIEW_LEGAL);
        case Department.SALES:
          return departmentPermissions.includes(Permission.CONTRACT_VIEW_SALES);
        case Department.IT:
          return departmentPermissions.includes(Permission.CONTRACT_VIEW_IT);
        case Department.PROCUREMENT:
          return departmentPermissions.includes(Permission.CONTRACT_VIEW_PROCUREMENT);
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Check if user can create contract of specific type in their department
   */
  static canCreateContractByType(
    contractType: string,
    userDepartment: Department,
    departmentRole: string | null
  ): boolean {
    // Check if department can handle this contract type
    const allowedDepartments = CONTRACT_TYPE_DEPARTMENT_MAPPING[contractType] || [Department.GENERAL];
    
    if (!allowedDepartments.includes(userDepartment)) {
      return false;
    }

    if (!departmentRole) {
      return false;
    }

    const departmentPermissions = this.getDepartmentRolePermissions(departmentRole);
    
    // Check if user has general create permission
    if (departmentPermissions.includes(Permission.CONTRACT_CREATE)) {
      return true;
    }

    // Check department-specific create permissions
    switch (userDepartment) {
      case Department.HR:
        return departmentPermissions.includes(Permission.CONTRACT_CREATE_HR);
      case Department.FINANCE:
        return departmentPermissions.includes(Permission.CONTRACT_CREATE_FINANCE);
      case Department.LEGAL:
        return departmentPermissions.includes(Permission.CONTRACT_CREATE_LEGAL);
      case Department.SALES:
        return departmentPermissions.includes(Permission.CONTRACT_CREATE_SALES);
      case Department.IT:
        return departmentPermissions.includes(Permission.CONTRACT_CREATE_IT);
      case Department.PROCUREMENT:
        return departmentPermissions.includes(Permission.CONTRACT_CREATE_PROCUREMENT);
      default:
        return false;
    }
  }

  /**
   * Get department from contract type
   */
  static getPrimaryDepartmentForContractType(contractType: string): Department {
    const departments = CONTRACT_TYPE_DEPARTMENT_MAPPING[contractType];
    return departments?.[0] || Department.GENERAL;
  }

  /**
   * Get effective permissions for a user (combining global, company and department roles)
   */
  static getEffectivePermissions(
    globalRole: string,
    companyRole: string | null = null,
    departmentRole: string | null = null
  ): Permission[] {
    const globalPermissions = this.getRolePermissions(globalRole);
    const companyPermissions = companyRole ? this.getCompanyRolePermissions(companyRole) : [];
    const departmentPermissions = departmentRole ? this.getDepartmentRolePermissions(departmentRole) : [];
    
    // Combine and deduplicate permissions
    return [...new Set([...globalPermissions, ...companyPermissions, ...departmentPermissions])];
  }

  /**
   * Check multiple permissions at once
   */
  static hasAllPermissions(
    globalRole: string,
    companyRole: string | null,
    departmentRole: string | null,
    permissions: Permission[]
  ): boolean {
    return permissions.every(permission => 
      this.userHasPermission(globalRole, companyRole, departmentRole, permission)
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(
    globalRole: string,
    companyRole: string | null,
    departmentRole: string | null,
    permissions: Permission[]
  ): boolean {
    return permissions.some(permission => 
      this.userHasPermission(globalRole, companyRole, departmentRole, permission)
    );
  }

  /**
   * Get highest role priority (for role hierarchy)
   */
  static getRolePriority(role: string): number {
    const rolePriorities: Record<string, number> = {
      ADMIN: 100,
      EDITOR: 80,
      APPROVER: 60,
      USER: 40,
      VIEWER: 20,
    };
    return rolePriorities[role] || 0;
  }

  /**
   * Get highest company role priority
   */
  static getCompanyRolePriority(role: string): number {
    const rolePriorities: Record<string, number> = {
      OWNER: 100,
      MANAGER: 80,
      MEMBER: 40,
    };
    return rolePriorities[role] || 0;
  }

  /**
   * Get department role priority
   */
  static getDepartmentRolePriority(role: string): number {
    const rolePriorities: Record<string, number> = {
      HR_MANAGER: 90,
      FINANCE_MANAGER: 90,
      LEGAL_COUNSEL: 95,
      SALES_MANAGER: 90,
      IT_MANAGER: 90,
      PROCUREMENT_MANAGER: 90,
      HR_SPECIALIST: 70,
      FINANCE_ANALYST: 70,
      PARALEGAL: 70,
      SALES_REP: 60,
      IT_SPECIALIST: 70,
      PROCUREMENT_SPECIALIST: 70,
      HR_ASSISTANT: 50,
      ACCOUNTANT: 60,
    };
    return rolePriorities[role] || 0;
  }

  /**
   * Check if role can manage another role
   */
  static canManageRole(managerRole: string, targetRole: string): boolean {
    const managerPriority = this.getRolePriority(managerRole);
    const targetPriority = this.getRolePriority(targetRole);
    return managerPriority > targetPriority;
  }

  /**
   * Check if company role can manage another company role
   */
  static canManageCompanyRole(managerRole: string, targetRole: string): boolean {
    const managerPriority = this.getCompanyRolePriority(managerRole);
    const targetPriority = this.getCompanyRolePriority(targetRole);
    return managerPriority > targetPriority;
  }

  /**
   * Check if department role can manage another department role
   */
  static canManageDepartmentRole(managerRole: string, targetRole: string): boolean {
    const managerPriority = this.getDepartmentRolePriority(managerRole);
    const targetPriority = this.getDepartmentRolePriority(targetRole);
    return managerPriority > targetPriority;
  }
}

// Decorator for API route protection
export function requirePermission(permission: Permission) {
   
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
     
    descriptor.value = async function (...args: any[]) {
      const [request] = args;
      const userRole = (request as any).headers.get('x-user-role');
      const companyRole = (request as any).headers.get('x-company-role');
      
      if (!PermissionManager.userHasPermission(userRole, companyRole, null, permission)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return method.apply(this, args);
    };
  };
}

// Permission contexts for different operations
export const PERMISSION_CONTEXTS = {
  CONTRACT: {
    CREATE: [Permission.CONTRACT_CREATE],
    VIEW: [Permission.CONTRACT_VIEW],
    UPDATE: [Permission.CONTRACT_UPDATE],
    DELETE: [Permission.CONTRACT_DELETE],
    APPROVE: [Permission.CONTRACT_APPROVE],
    SIGN: [Permission.CONTRACT_SIGN],
  },
  COMPANY: {
    MANAGE: [Permission.COMPANY_SETTINGS_MANAGE],
    INVITE_USERS: [Permission.COMPANY_INVITES_MANAGE],
    MANAGE_MEMBERS: [Permission.COMPANY_MEMBERS_MANAGE],
  },
  TEMPLATE: {
    CREATE: [Permission.TEMPLATE_CREATE],
    EDIT: [Permission.TEMPLATE_UPDATE],
    PUBLISH: [Permission.TEMPLATE_PUBLISH],
  },
  ADMIN: {
    USER_MANAGEMENT: [Permission.USER_ROLES_MANAGE],
    SYSTEM_SETTINGS: [Permission.SYSTEM_SETTINGS],
  },
} as const;

/**
 * Merkezi Sözleşme Görünürlük Filtresi
 * Kullanıcının hangi sözleşmeleri görmeye yetkili olduğunu belirler
 * @param userId - Kullanıcının ID'si
 * @param userRole - Kullanıcının rolü (ADMIN, EDITOR, VIEWER vb.)
 * @returns Prisma where objesi
 */
export async function getContractsVisibilityFilter(userId: string, userRole: string) {
  // Admin kullanıcılar her şeyi görebilir
  if (userRole === 'ADMIN') {
    return {};
  }

  // Admin olmayan kullanıcılar için yetki filtresi
  return {
    OR: [
      // Kullanıcının oluşturduğu sözleşmeler
      { createdById: userId },
      
      // Kullanıcının onay adımlarında yer aldığı sözleşmeler
      { approvals: { some: { approverId: userId } } },
      
      // Kullanıcının üye olduğu şirketlerin sözleşmeleri
      { 
        company: {
          OR: [
            { createdById: userId },
            { users: { some: { userId } } }
          ]
        }
      }
    ]
  };
}

/**
 * Kullanıcının erişim yetkisi olan şirket ID'lerini getirir
 * @param userId - Kullanıcının ID'si  
 * @returns Şirket ID'leri listesi
 */
async function getUserCompanyIds(userId: string): Promise<string[]> {
  // Bu fonksiyon şimdilik kullanılmıyor, gelecekte implement edilecek
  // Şimdilik boş array döndürüyoruz
  return [];
} 