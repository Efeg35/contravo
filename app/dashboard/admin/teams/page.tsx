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

export default async function TeamsPage() {
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Takım Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? 'Takımları oluşturun ve yönetin' : 'Üye olduğunuz takımları görüntüleyin ve yönetin'}
          </p>
        </div>
      </div>

      {/* Yeni Takım Oluşturma Formu - Sadece Admin'ler için */}
      {isAdmin && (
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
      )}

      {/* Takım Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'Tüm Takımlar' : 'Takımlarım'}
          </CardTitle>
          <CardDescription>
            {isAdmin ? 'Sistemdeki tüm takımların listesi' : 'Üye olduğunuz takımların listesi'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isAdmin 
                ? 'Henüz hiç takım oluşturulmamış.' 
                : 'Henüz hiçbir takımın üyesi değilsiniz.'}
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
                      {isAdmin ? 'Takımı Yönet' : 'Takımı Görüntüle'}
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
              <strong>Bilgi:</strong> Takım müdürü olarak sadece üye olduğunuz takımları görebilir ve yönetebilirsiniz. 
              Yeni takım oluşturma yetkisi sadece sistem yöneticilerine aittir.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 