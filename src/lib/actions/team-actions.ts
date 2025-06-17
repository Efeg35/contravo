'use server';

import { db } from '@/lib/db';
import { hasRequiredRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma, Team, UsersOnTeams } from '@prisma/client';

interface TeamWithMembers extends Team {
  members: UsersOnTeams[];
}

export async function createTeam(formData: FormData) {
  try {
    if (!await hasRequiredRole('ADMIN')) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    const name = formData.get('name') as string;
    if (!name) {
      throw new Error('Takım adı gereklidir.');
    }

    const team = await db.team.create({
      data: {
        name,
      },
    });

    revalidatePath('/dashboard/admin/teams');
    return { success: true, team };
  } catch (error) {
    console.error('Takım oluşturma hatası:', error);
    return { success: false, error: 'Takım oluşturulurken bir hata oluştu.' };
  }
}

export async function addUserToTeam(teamId: string, userId: string) {
  try {
    if (!await hasRequiredRole('ADMIN')) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    }) as TeamWithMembers | null;

    if (!team) {
      throw new Error('Takım bulunamadı.');
    }

    // Kullanıcının zaten takımda olup olmadığını kontrol et
    const isUserInTeam = team.members.some((member) => member.userId === userId);
    if (isUserInTeam) {
      throw new Error('Kullanıcı zaten bu takımda.');
    }

    await db.usersOnTeams.create({
      data: {
        teamId,
        userId,
      },
    });

    revalidatePath(`/dashboard/admin/teams/${teamId}`);
    revalidatePath('/dashboard/admin/teams');
    return { success: true };
  } catch (error) {
    console.error('Kullanıcı ekleme hatası:', error);
    return { success: false, error: 'Kullanıcı eklenirken bir hata oluştu.' };
  }
}

export async function removeUserFromTeam(teamId: string, userId: string) {
  try {
    if (!await hasRequiredRole('ADMIN')) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    await db.usersOnTeams.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    revalidatePath(`/dashboard/admin/teams/${teamId}`);
    revalidatePath('/dashboard/admin/teams');
    return { success: true };
  } catch (error) {
    console.error('Kullanıcı çıkarma hatası:', error);
    return { success: false, error: 'Kullanıcı çıkarılırken bir hata oluştu.' };
  }
} 