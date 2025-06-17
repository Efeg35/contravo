'use server';

import { isAdmin } from 'src/lib/permissions';
import prisma from '@/lib/prisma';
import { Role, User } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from "next/navigation";

async function updateUserRole(userId: string, newRole: Role) {
  await isAdmin();
  
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  
  revalidatePath('/dashboard/admin/users');
}

type UserWithRole = Pick<User, 'id' | 'name' | 'email' | 'role' | 'createdAt'>;

export default async function AdminUsersPage() {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    redirect('/dashboard');
  }
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  }) as UserWithRole[];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Kullanıcı Yönetimi</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kullanıcı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kayıt Tarihi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'İsimsiz Kullanıcı'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <form action={async (formData) => {
                    const newRole = formData.get('role') as Role;
                    await updateUserRole(user.id, newRole);
                  }}>
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      {Object.values(Role).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Güncelle
                    </button>
                  </form>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 