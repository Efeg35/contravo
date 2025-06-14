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
   * Check if user has permission considering both global and company roles
   */
  static userHasPermission(
    globalRole: string,
    companyRole: string | null,
    permission: Permission
  ): boolean {
    // Check global role permissions
    if (this.hasPermission(globalRole, permission)) {
      return true;
    }

    // Check company role permissions if available
    if (companyRole && this.hasCompanyPermission(companyRole, permission)) {
      return true;
    }

    return false;
  }

  /**
   * Get effective permissions for a user (combining global and company roles)
   */
  static getEffectivePermissions(
    globalRole: string,
    companyRole: string | null = null
  ): Permission[] {
    const globalPermissions = this.getRolePermissions(globalRole);
    const companyPermissions = companyRole ? this.getCompanyRolePermissions(companyRole) : [];
    
    // Combine and deduplicate permissions
    return [...new Set([...globalPermissions, ...companyPermissions])];
  }

  /**
   * Check multiple permissions at once
   */
  static hasAllPermissions(
    globalRole: string,
    companyRole: string | null,
    permissions: Permission[]
  ): boolean {
    return permissions.every(permission => 
      this.userHasPermission(globalRole, companyRole, permission)
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(
    globalRole: string,
    companyRole: string | null,
    permissions: Permission[]
  ): boolean {
    return permissions.some(permission => 
      this.userHasPermission(globalRole, companyRole, permission)
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
}

// Decorator for API route protection
export function requirePermission(permission: Permission) {
   
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
     
    descriptor.value = async function (...args: any[]) {
      const [request] = args;
      const userRole = (request as any).headers.get('x-user-role');
      const companyRole = (request as any).headers.get('x-company-role');
      
      if (!PermissionManager.userHasPermission(userRole, companyRole, permission)) {
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