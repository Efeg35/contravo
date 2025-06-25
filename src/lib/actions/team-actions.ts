'use server';

import { db } from '@/lib/db';
import { hasRequiredRole } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma, Team, UsersOnTeams } from '@prisma/client';

interface TeamWithMembers extends Team {
  members: UsersOnTeams[];
}

// Takım yönetimi için yetki kontrolü yapan yardımcı fonksiyon
async function canManageTeam(teamId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || !session?.user?.role) {
    return false;
  }

  // ADMIN'ler her takımı yönetebilir
  if (session.user.role === 'ADMIN') {
    return true;
  }

  // EDITOR rolündeki kullanıcılar sadece kendi takımlarını yönetebilir
  if (session.user.role === 'EDITOR') {
    const userTeamMembership = await db.usersOnTeams.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
      },
      include: {
        user: true
      }
    });

    // Kullanıcı bu takımın üyesi mi ve EDITOR rolünde mi?
    return userTeamMembership !== null && userTeamMembership.user.role === 'EDITOR';
  }

  // Diğer roller (VIEWER) takım yönetimi yapamaz
  return false;
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

    revalidatePath('/settings/company/groups');
    return { success: true, team };
  } catch (error) {
    console.error('Takım oluşturma hatası:', error);
    return { success: false, error: 'Takım oluşturulurken bir hata oluştu.' };
  }
}

export async function addUserToTeam(teamId: string, userId: string) {
  try {
    // Yeni yetki kontrolü: ADMIN veya o takımın müdürü olması gerekiyor
    if (!await canManageTeam(teamId)) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor. Sadece yöneticiler ve takım müdürleri takım üyelerini düzenleyebilir.');
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

    revalidatePath(`/settings/company/groups/${teamId}`);
    revalidatePath('/settings/company/groups');
    return { success: true };
  } catch (error) {
    console.error('Kullanıcı ekleme hatası:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Kullanıcı eklenirken bir hata oluştu.' };
  }
}

export async function removeUserFromTeam(teamId: string, userId: string) {
  try {
    // Yeni yetki kontrolü: ADMIN veya o takımın müdürü olması gerekiyor
    if (!await canManageTeam(teamId)) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor. Sadece yöneticiler ve takım müdürleri takım üyelerini düzenleyebilir.');
    }

    await db.usersOnTeams.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    revalidatePath(`/settings/company/groups/${teamId}`);
    revalidatePath('/settings/company/groups');
    return { success: true };
  } catch (error) {
    console.error('Kullanıcı çıkarma hatası:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Kullanıcı çıkarılırken bir hata oluştu.' };
  }
} 