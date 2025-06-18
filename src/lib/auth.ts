import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';

// Rol hiyerarşisi tanımı
const ROLE_HIERARCHY = {
  'VIEWER': 0,
  'EDITOR': 1,
  'ADMIN': 2
};

export async function hasRequiredRole(requiredRole: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role) {
    return false;
  }

  // Kullanıcının mevcut rolünü ve gerekli rolü hiyerarşide kontrol et
  const userRoleLevel = ROLE_HIERARCHY[session.user.role as keyof typeof ROLE_HIERARCHY];
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY];
  
  // Tanımlanmamış roller için false döndür
  if (userRoleLevel === undefined || requiredRoleLevel === undefined) {
    return false;
  }

  // Kullanıcının rolü gerekli rol seviyesinde veya üstünde mi?
  return userRoleLevel >= requiredRoleLevel;
}