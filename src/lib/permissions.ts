import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Permission system for role-based access control

export type Permission =
  // User Management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.manage_roles'
  
  // Company Management
  | 'companies.view'
  | 'companies.create'
  | 'companies.edit'
  | 'companies.delete'
  | 'companies.manage_users'
  | 'companies.manage_settings'
  
  // Contract Management
  | 'contracts.view'
  | 'contracts.create'
  | 'contracts.edit'
  | 'contracts.delete'
  | 'contracts.approve'
  | 'contracts.manage_all'
  
  // Template Management
  | 'templates.view'
  | 'templates.create'
  | 'templates.edit'
  | 'templates.delete'
  
  // Clause Management
  | 'clauses.view'
  | 'clauses.create'
  | 'clauses.edit'
  | 'clauses.delete'
  | 'clauses.approve'
  
  // System Administration
  | 'system.admin'
  | 'system.debug'
  | 'system.backup'
  | 'system.restore'
  
  // Analytics & Reporting
  | 'analytics.view'
  | 'analytics.export'
  
  // Document Management
  | 'documents.upload'
  | 'documents.download'
  | 'documents.delete';

// Role definitions using string literals
type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';
type CompanyRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
type DepartmentRole = 'HEAD' | 'MANAGER' | 'MEMBER';

// Rol hiyerarşisi - her rol kendinden düşük rollere sahip yetkilere de sahiptir
const roleHierarchy: Record<UserRole, UserRole[]> = {
  ADMIN: ['ADMIN', 'EDITOR', 'VIEWER'],
  EDITOR: ['EDITOR', 'VIEWER'],
  VIEWER: ['VIEWER'],
};

async function checkRole(requiredRole: UserRole) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userRole = session.user.role as UserRole;
  const allowedRoles = roleHierarchy[userRole];
  
  if (!allowedRoles?.includes(requiredRole)) {
    throw new Error('Bu işlem için yetkiniz bulunmamaktadır.');
  }

  return true;
}

// Rol kontrol fonksiyonları
export const isAdmin = () => checkRole('ADMIN');
export const isEditor = () => checkRole('EDITOR');
export const isViewer = () => checkRole('VIEWER'); 