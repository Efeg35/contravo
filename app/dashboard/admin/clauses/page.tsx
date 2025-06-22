'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { 
  Plus, 
  BookOpen, 
  Edit, 
  Trash2, 
  Search,
  Building2,
  Users,
  Globe,
  TrendingUp,
  CheckCheck
} from 'lucide-react';

interface Clause {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  visibility: string;
  approvalStatus: string;
  isActive: boolean;
  version: number;
  usageCount: number;
  createdBy: {
    name: string;
    email: string;
  };
  company?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    modifiedUsages: number;
  };
}

interface ClauseFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  visibility: string;
}

const AdminClausesPage = () => {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<ClauseFormData>({
    title: '',
    description: '',
    content: '',
    category: '',
    visibility: 'COMPANY'
  });

  // Categories for dropdown
  const categories = [
    'Genel Hükümler',
    'Ödeme Koşulları',
    'Teslimat',
    'Garanti',
    'Sorumluluk',
    'Gizlilik',
    'Fesih',
    'Uyuşmazlık Çözümü',
    'Diğer'
  ];

  // Fetch all clauses (admin can see all)
  const fetchClauses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clauses');
      const data = await response.json();
      
      if (response.ok) {
        setClauses(data.clauses || []);
      } else {
        console.error('Clause\'lar yüklenemedi');
      }
    } catch (error) {
      console.error('Clauses fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new clause
  const handleCreateClause = async () => {
    try {
      const response = await fetch('/api/admin/clauses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Clause başarıyla oluşturuldu');
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          content: '',
          category: '',
          visibility: 'COMPANY'
        });
        fetchClauses();
      } else {
        console.error('Clause oluşturulamadı');
      }
    } catch (error) {
      console.error('Create clause error:', error);
    }
  };

  // Filter clauses
  const filteredClauses = clauses.filter(clause => {
    const matchesSearch = clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clause.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clause.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || clause.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchClauses();
  }, []);

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Globe className="w-3 h-3 mr-1" />Herkese Açık</Badge>;
      case 'COMPANY':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Building2 className="w-3 h-3 mr-1" />Şirket İçi</Badge>;
      case 'PRIVATE':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Users className="w-3 h-3 mr-1" />Özel</Badge>;
      default:
        return <Badge variant="secondary">{visibility}</Badge>;
    }
  };

  const getStatusBadge = (approvalStatus: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Devre Dışı</Badge>;
    }
    
    switch (approvalStatus) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600"><CheckCheck className="w-3 h-3 mr-1" />Onaylandı</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Onay Bekliyor</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Taslak</Badge>;
      default:
        return <Badge variant="secondary">{approvalStatus}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Clause Kütüphanesi Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">
            Tüm akıllı clause'ları yönetin, düzenleyin ve onaylayın
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Yeni Clause Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Clause Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir akıllı clause oluşturun ve kütüphaneye ekleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Başlık</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Clause başlığı"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Açıklama</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Clause açıklaması"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Görünürlük</label>
                <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Herkese Açık</SelectItem>
                    <SelectItem value="COMPANY">Şirket İçi</SelectItem>
                    <SelectItem value="PRIVATE">Özel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">İçerik</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Clause içeriği"
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateClause}>
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Clause'larda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clauses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clause'lar ({filteredClauses.length})</CardTitle>
          <CardDescription>
            Tüm clause'ları görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görünürlük</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Kullanım
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <Edit className="h-4 w-4" />
                        Değiştirilme %
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClauses.map((clause) => (
                    <tr key={clause.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{clause.title}</div>
                          {clause.description && (
                            <div className="text-sm text-gray-500">{clause.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{clause.category}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVisibilityBadge(clause.visibility)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(clause.approvalStatus, clause.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-2xl font-bold text-blue-600">{clause.usageCount || 0}</span>
                          <span className="text-xs text-gray-500">kez</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(() => {
                          const usageCount = clause.usageCount || 0;
                          const modifiedCount = clause._count?.modifiedUsages || 0;
                          const modificationRate = usageCount > 0 ? Math.round((modifiedCount / usageCount) * 100) : 0;
                          
                          return (
                            <div className="inline-flex items-center gap-2">
                              <span className={`text-lg font-semibold ${
                                modificationRate > 50 ? 'text-red-600' : 
                                modificationRate > 25 ? 'text-yellow-600' : 
                                'text-green-600'
                              }`}>
                                %{modificationRate}
                              </span>
                              <div className="text-xs text-gray-500">
                                {modifiedCount}/{usageCount}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{clause.createdBy.name}</div>
                          {clause.company && (
                            <div className="text-xs text-gray-500">{clause.company.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(clause.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClausesPage;
