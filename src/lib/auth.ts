import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function hasRequiredRole(requiredRole: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return false;
  }

  // Kullanıcının rolünü kontrol et
  // Not: Bu kısmı kendi rol yapınıza göre düzenlemelisiniz
  return session.user.role === requiredRole;
} 