import { hasRequiredRole } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addUserToTeam, removeUserFromTeam } from '../../../../../src/lib/actions/team-actions';
import { UserSearch } from '@/components/UserSearch';
import { Users, X } from 'lucide-react';

interface GroupPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Takım yönetimi yetkisi kontrolü
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

export default async function GroupPage({ params }: GroupPageProps) {
  const session = await getServerSession(authOptions);
  
  // Kullanıcının giriş yapmış olması gerekiyor
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { id } = await params;

  // Takım erişim yetkisi kontrolü - ADMIN'ler veya takım müdürleri erişebilir
  const canManage = await canManageTeam(id);
  
  // En azından EDITOR rolü gerekiyor
  if (!await hasRequiredRole('EDITOR')) {
    redirect('/dashboard');
  }

  // Takım ve üyelerini çek
  const team = await db.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (!team) {
    redirect('/settings/company/groups');
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            {team.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {canManage ? 'Manage group members' : 'View group members'}
          </p>
        </div>
      </div>

      {/* Üye Ekleme - Sadece yetkili kullanıcılara göster */}
      {canManage && (
      <Card>
        <CardHeader>
          <CardTitle>Add Member</CardTitle>
          <CardDescription>
            Use the search box below to add a new member to the group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserSearch
            onSelect={async (userId) => {
              'use server';
              await addUserToTeam(team.id, userId);
            }}
          />
        </CardContent>
      </Card>
      )}

      {/* Üye Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
          <CardDescription>
            List of members in this group
          </CardDescription>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No members in this group yet.
            </div>
          ) : (
            <div className="space-y-4">
              {team.members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium">{member.user.name}</h3>
                    <p className="text-sm text-gray-500">
                      {member.user.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Role: {member.user.role} {member.user.departmentRole && `• ${member.user.departmentRole}`}
                    </p>
                  </div>
                  {/* Kaldırma butonu - Sadece yetkili kullanıcılara göster */}
                  {canManage && (
                  <form action={async () => {
                    'use server';
                    await removeUserFromTeam(team.id, member.userId);
                  }}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove from group"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yetki bilgilendirme mesajı */}
      {!canManage && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800 text-sm">
              <strong>Info:</strong> You can view this group's members, but editing permissions are limited to system administrators and group managers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 