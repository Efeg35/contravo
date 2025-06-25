import { hasRequiredRole } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTeam } from '../../../../src/lib/actions/team-actions';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default async function CompanyGroupsPage() {
  const session = await getServerSession(authOptions);
  
  // En azından EDITOR rolü gerekiyor
  if (!await hasRequiredRole('EDITOR')) {
    redirect('/dashboard');
  }

  const isAdmin = session?.user?.role === 'ADMIN';
  const currentUserId = session?.user?.id;

  // Takımları çek - ADMIN'ler tümünü, EDITOR'lar sadece üye olduklarını görür
  let teams;
  
  if (isAdmin) {
    // Admin tüm takımları görebilir
    teams = await db.team.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  } else {
    // EDITOR'lar sadece üye oldukları takımları görebilir
    teams = await db.team.findMany({
      where: {
        members: {
          some: {
            userId: currentUserId
          }
        }
      },
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            Groups
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Create and manage teams' : 'View and manage your teams'}
          </p>
        </div>
      </div>

      {/* Yeni Takım Oluşturma Formu - Sadece Admin'ler için */}
      {isAdmin && (
      <Card>
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
          <CardDescription>
            Use the form below to create a new team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData: FormData) => {
            'use server';
            await createTeam(formData);
          }} className="flex gap-4">
            <Input
              name="name"
              placeholder="Group Name"
              className="max-w-sm"
              required
            />
            <Button type="submit">
              Create Group
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Takım Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'All Groups' : 'My Groups'}
          </CardTitle>
          <CardDescription>
            {isAdmin ? 'List of all teams in the system' : 'List of teams you are a member of'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isAdmin 
                ? 'No teams have been created yet.' 
                : 'You are not a member of any teams yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium">{team.name}</h3>
                    <p className="text-sm text-gray-500">
                      {team._count.members} members
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/settings/company/groups/${team.id}`}>
                      {isAdmin ? 'Manage Group' : 'View Group'}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bilgilendirme mesajı - EDITOR'lar için */}
      {!isAdmin && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-blue-800 text-sm">
              <strong>Info:</strong> As a team manager, you can only view and manage teams you are a member of. 
              Only system administrators have the authority to create new teams.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 