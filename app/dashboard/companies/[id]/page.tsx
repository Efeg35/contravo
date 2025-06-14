"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Settings } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

interface CompanyMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo: string | null;
  createdAt: string;
  members: CompanyMember[];
}

export default function CompanyDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: companyData, refetch } = useQuery<Company>({
    queryKey: ["company", params.id],
    queryFn: async () => {
      const response = await api.get(`/companies/${params.id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (companyData) {
      setCompany(companyData);
      setLoading(false);
    }
  }, [companyData]);

  const handleAddMember = async () => {
    try {
      await api.post(`/companies/${params.id}/members`, {
        email: newMemberEmail,
        role: newMemberRole,
      });
      toast.success("Üye başarıyla eklendi");
      setNewMemberEmail("");
      setNewMemberRole("MEMBER");
      refetch();
    } catch (_error) {
      toast.error("Üye eklenirken bir hata oluştu");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.delete(`/companies/${params.id}/members/${memberId}`);
      toast.success("Üye başarıyla kaldırıldı");
      refetch();
    } catch (_error) {
      toast.error("Üye kaldırılırken bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Şirket bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {company.logo && (
            <Image
              src={company.logo}
              alt={company.name}
              className="w-16 h-16 rounded-lg object-cover"
              width={64}
              height={64}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-gray-500">{company.description}</p>
          </div>
        </div>
        {company.website && (
          <Button variant="outline" asChild>
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="members">Üyeler</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Şirket Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(company.createdAt).toLocaleDateString("tr-TR")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Toplam Üye</dt>
                    <dd className="mt-1 text-sm text-gray-900">{company.members.length}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Üye Ekle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={newMemberRole}
                      onValueChange={(value: "ADMIN" | "MEMBER") => setNewMemberRole(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rol seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Üye</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddMember}>
                    <Plus className="w-4 h-4 mr-2" />
                    Üye Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Üye Listesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {company.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {member.user.image ? (
                          <Image
                            src={member.user.image}
                            alt={member.user.name || ''}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {member.user.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{member.user.name || member.user.email}</p>
                          <p className="text-sm text-gray-500">
                            {member.role === "ADMIN" ? "Admin" : "Üye"} •{" "}
                            {member.status === "ACTIVE" ? "Aktif" : "Pasif"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Şirket Ayarları</CardTitle>
                <p className="text-sm text-gray-600">Şirket ayarlarını yönetmek için ayarlar sayfasına gidin</p>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/dashboard/companies/${company.id}/settings`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Ayarları Yönet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 