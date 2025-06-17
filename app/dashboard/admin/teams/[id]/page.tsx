import { hasRequiredRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addUserToTeam, removeUserFromTeam } from '../../../../../src/lib/actions/team-actions';
import { UserSearch } from '@/components/UserSearch';
import { Users, X } from 'lucide-react';

interface TeamPageProps {
  params: {
    id: string;
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  // Admin yetkisi kontrolü
  if (!await hasRequiredRole('ADMIN')) {
    redirect('/dashboard');
  }

  // Takım ve üyelerini çek
  const team = await db.team.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (!team) {
    redirect('/dashboard/admin/teams');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            {team.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Takım üyelerini yönetin
          </p>
        </div>
      </div>

      {/* Üye Ekleme */}
      <Card>
        <CardHeader>
          <CardTitle>Üye Ekle</CardTitle>
          <CardDescription>
            Takıma yeni bir üye eklemek için aşağıdaki arama kutusunu kullanın
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

      {/* Üye Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Takım Üyeleri</CardTitle>
          <CardDescription>
            Bu takımda yer alan üyelerin listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Bu takımda henüz üye bulunmuyor.
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
                  </div>
                  <form action={async () => {
                    'use server';
                    await removeUserFromTeam(team.id, member.userId);
                  }}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 