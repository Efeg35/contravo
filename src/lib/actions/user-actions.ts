'use server';

import { db } from '@/lib/db';
import { hasRequiredRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma, User, UsersOnTeams, Role } from '@prisma/client';

interface UserWithTeams extends User {
  teams: UsersOnTeams[];
}

export async function createUser(formData: FormData) {
  try {
    if (!await hasRequiredRole('ADMIN')) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as Role;

    if (!email || !name || !role) {
      throw new Error('Tüm alanlar gereklidir.');
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        role,
      },
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true, user };
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    return { success: false, error: 'Kullanıcı oluşturulurken bir hata oluştu.' };
  }
}

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    if (!await hasRequiredRole('ADMIN')) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true, user };
  } catch (error) {
    console.error('Kullanıcı rolü güncelleme hatası:', error);
    return { success: false, error: 'Kullanıcı rolü güncellenirken bir hata oluştu.' };
  }
}

export async function deleteUser(userId: string) {
  try {
    if (!await hasRequiredRole('ADMIN')) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { teams: true },
    }) as UserWithTeams | null;

    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }

    // Önce kullanıcının takım ilişkilerini sil
    await db.usersOnTeams.deleteMany({
      where: { userId },
    });

    // Sonra kullanıcıyı sil
    await db.user.delete({
      where: { id: userId },
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return { success: false, error: 'Kullanıcı silinirken bir hata oluştu.' };
  }
} 