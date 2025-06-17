import { hasRequiredRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTeam } from '../../../../src/lib/actions/team-actions';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default async function TeamsPage() {
  // Admin yetkisi kontrolü
  if (!await hasRequiredRole('ADMIN')) {
    redirect('/dashboard');
  }

  // Takımları ve üye sayılarını çek
  const teams = await db.team.findMany({
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Takım Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">
            Takımları oluşturun ve yönetin
          </p>
        </div>
      </div>

      {/* Yeni Takım Oluşturma Formu */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Takım Oluştur</CardTitle>
          <CardDescription>
            Yeni bir takım oluşturmak için aşağıdaki formu kullanın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData: FormData) => {
            'use server';
            await createTeam(formData);
          }} className="flex gap-4">
            <Input
              name="name"
              placeholder="Takım Adı"
              className="max-w-sm"
              required
            />
            <Button type="submit">
              Takım Oluştur
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Takım Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Takımlar</CardTitle>
          <CardDescription>
            Mevcut takımların listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz hiç takım oluşturulmamış.
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
                      {team._count.members} üye
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/admin/teams/${team.id}`}>
                      Takımı Yönet
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 