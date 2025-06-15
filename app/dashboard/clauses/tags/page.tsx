'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Tag, 
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Hash,
  Palette,
  TrendingUp,
  Users,
  Eye
} from 'lucide-react';

// Types
interface ClauseTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSystem: boolean;
  usageCount: number;
  clauseCount: number;
  createdAt: string;
  relatedTags: string[];
}

const TagsPage = () => {
  const router = useRouter();
  
  // State
  const [tags, setTags] = useState<ClauseTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<ClauseTag | null>(null);
  const [newTagModalOpen, setNewTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Predefined colors
  const tagColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  // Fetch tags
  const fetchTags = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockTags: ClauseTag[] = [
        {
          id: '1',
          name: 'Gizlilik',
          color: '#3B82F6',
          description: 'Gizlilik ve veri koruma ile ilgili maddeler',
          isSystem: true,
          usageCount: 45,
          clauseCount: 12,
          createdAt: '2024-01-01T00:00:00Z',
          relatedTags: ['veri-koruma', 'gdpr']
        },
        {
          id: '2',
          name: 'Ödeme',
          color: '#10B981',
          description: 'Ödeme koşulları ve faturalandırma',
          isSystem: true,
          usageCount: 38,
          clauseCount: 8,
          createdAt: '2024-01-01T00:00:00Z',
          relatedTags: ['fatura', 'vade']
        },
        {
          id: '3',
          name: 'Fesih',
          color: '#EF4444',
          description: 'Sözleşme fesih koşulları',
          isSystem: true,
          usageCount: 32,
          clauseCount: 6,
          createdAt: '2024-01-01T00:00:00Z',
          relatedTags: ['sonlandırma', 'ihbar']
        },
        {
          id: '4',
          name: 'Sorumluluk',
          color: '#F59E0B',
          description: 'Sorumluluk sınırlamaları',
          isSystem: true,
          usageCount: 28,
          clauseCount: 5,
          createdAt: '2024-01-01T00:00:00Z',
          relatedTags: ['tazminat', 'zarar']
        },
        {
          id: '5',
          name: 'GDPR',
          color: '#8B5CF6',
          description: 'GDPR uyumluluk maddeleri',
          isSystem: false,
          usageCount: 22,
          clauseCount: 4,
          createdAt: '2024-01-05T00:00:00Z',
          relatedTags: ['gizlilik', 'veri-koruma']
        },
        {
          id: '6',
          name: 'Teslimat',
          color: '#06B6D4',
          description: 'Teslimat ve kargo koşulları',
          isSystem: false,
          usageCount: 18,
          clauseCount: 3,
          createdAt: '2024-01-08T00:00:00Z',
          relatedTags: ['kargo', 'süre']
        }
      ];
      
      setTags(mockTags);
    } catch (error) {
      console.error('Etiketler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tags
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Create new tag
  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    
    const newTag: ClauseTag = {
      id: Date.now().toString(),
      name: newTagName,
      color: newTagColor,
      description: newTagDescription,
      isSystem: false,
      usageCount: 0,
      clauseCount: 0,
      createdAt: new Date().toISOString(),
      relatedTags: []
    };
    
    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setNewTagDescription('');
    setNewTagColor('#3B82F6');
    setNewTagModalOpen(false);
  };

  // Delete tag
  const handleDeleteTag = (tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  useEffect(() => {
    fetchTags();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Etiketler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-blue-600" />
              Etiket Yönetimi
            </h1>
            <p className="text-gray-600">
              Clause etiketlerini yönetin ve organize edin
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={newTagModalOpen} onOpenChange={setNewTagModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Etiket
              </Button>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Yeni Etiket Oluştur</DialogTitle>
                <DialogDescription>
                  Clause'ları organize etmek için yeni bir etiket oluşturun
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Etiket Adı</label>
                  <Input
                    placeholder="Etiket adını girin..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Açıklama</label>
                  <Input
                    placeholder="Etiket açıklaması..."
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Renk</label>
                  <div className="flex items-center gap-2">
                    {tagColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newTagColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setNewTagModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleCreateTag}>
                    Oluştur
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Etiket</p>
                <p className="text-xl font-bold">{tags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Hash className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sistem Etiketleri</p>
                <p className="text-xl font-bold text-green-600">
                  {tags.filter(t => t.isSystem).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kullanıcı Etiketleri</p>
                <p className="text-xl font-bold text-purple-600">
                  {tags.filter(t => !t.isSystem).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Kullanım</p>
                <p className="text-xl font-bold text-orange-600">
                  {tags.reduce((sum, t) => sum + t.usageCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Etiket ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags.map((tag) => (
          <Card key={tag.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">{tag.name}</CardTitle>
                    {tag.isSystem && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Sistem
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!tag.isSystem && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {tag.description && (
                  <p className="text-sm text-gray-600">{tag.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Kullanım:</span>
                    <span className="ml-1">{tag.usageCount}</span>
                  </div>
                  <div>
                    <span className="font-medium">Clause:</span>
                    <span className="ml-1">{tag.clauseCount}</span>
                  </div>
                </div>
                
                {tag.relatedTags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">İlgili Etiketler:</p>
                    <div className="flex flex-wrap gap-1">
                      {tag.relatedTags.map((relatedTag) => (
                        <Badge key={relatedTag} variant="secondary" className="text-xs">
                          {relatedTag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Etiket bulunamadı</h3>
          <p className="text-gray-500">
            Arama kriterlerinize uygun etiket bulunamadı
          </p>
        </div>
      )}

      {/* Tag Details Modal */}
      {selectedTag && (
        <Dialog open={!!selectedTag} onOpenChange={() => setSelectedTag(null)}>
          <DialogContent className="backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedTag.color }}
                />
                {selectedTag.name}
              </DialogTitle>
              <DialogDescription>
                Etiket detayları ve kullanım istatistikleri
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedTag.description && (
                <div>
                  <h4 className="font-medium mb-2">Açıklama</h4>
                  <p className="text-sm text-gray-600">{selectedTag.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">İstatistikler</h4>
                  <div className="space-y-1 text-sm">
                    <div>Kullanım: {selectedTag.usageCount}</div>
                    <div>Clause Sayısı: {selectedTag.clauseCount}</div>
                    <div>Oluşturulma: {new Date(selectedTag.createdAt).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
                
                {selectedTag.relatedTags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">İlgili Etiketler</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTag.relatedTags.map((relatedTag) => (
                        <Badge key={relatedTag} variant="secondary" className="text-xs">
                          {relatedTag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TagsPage; 