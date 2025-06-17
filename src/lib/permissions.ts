import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Rol hiyerarşisi - her rol kendinden düşük rollere sahip yetkilere de sahiptir
const roleHierarchy: Record<Role, Role[]> = {
  [Role.ADMIN]: [Role.ADMIN, Role.EDITOR, Role.VIEWER],
  [Role.EDITOR]: [Role.EDITOR, Role.VIEWER],
  [Role.VIEWER]: [Role.VIEWER],
};

async function checkRole(requiredRole: Role) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userRole = session.user.role as Role;
  const allowedRoles = roleHierarchy[userRole];
  
  if (!allowedRoles?.includes(requiredRole)) {
    throw new Error('Bu işlem için yetkiniz bulunmamaktadır.');
  }

  return true;
}

// Rol kontrol fonksiyonları
export const isAdmin = () => checkRole(Role.ADMIN);
export const isEditor = () => checkRole(Role.EDITOR);
export const isViewer = () => checkRole(Role.VIEWER); 