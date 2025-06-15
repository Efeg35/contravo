'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, 
  Star, 
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Copy,
  BookmarkPlus,
  Calendar,
  User,
  FileText,
  Clock
} from 'lucide-react';

// Types
interface FavoriteClause {
  id: string;
  clauseId: string;
  title: string;
  description: string;
  category: string;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    label: string;
  }>;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  favoriteAddedAt: string;
  usageCount: number;
  lastUsed?: string;
  tags: string[];
}

const ClauseFavoritesPage = () => {
  const router = useRouter();
  
  // State
  const [favorites, setFavorites] = useState<FavoriteClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Category labels
  const categoryLabels: Record<string, string> = {
    LEGAL: 'Yasal',
    COMMERCIAL: 'Ticari',
    TECHNICAL: 'Teknik',
    CONFIDENTIALITY: 'Gizlilik',
    TERMINATION: 'Fesih',
    LIABILITY: 'Sorumluluk',
    INTELLECTUAL_PROPERTY: 'Fikri Mülkiyet',
    PAYMENT: 'Ödeme',
    DELIVERY: 'Teslimat',
    COMPLIANCE: 'Uyumluluk',
    DISPUTE: 'Uyuşmazlık',
    FORCE_MAJEURE: 'Mücbir Sebep',
    OTHER: 'Diğer'
  };

  // Fetch favorites
  const fetchFavorites = async () => {
    setLoading(true);
    try {
      // Mock data - in real app this would be an API call
      const mockFavorites: FavoriteClause[] = [
        {
          id: '1',
          clauseId: 'clause-1',
          title: 'Standart Gizlilik Maddesi',
          description: 'Genel amaçlı gizlilik koşulları',
          category: 'CONFIDENTIALITY',
          content: 'Bu sözleşme kapsamında taraflar arasında paylaşılan tüm bilgiler gizli kabul edilir ve üçüncü şahıslarla paylaşılamaz. Gizlilik yükümlülüğü sözleşme sona erdikten sonra da {{confidentiality_period}} süreyle devam eder.',
          variables: [
            { name: 'confidentiality_period', type: 'STRING', label: 'Gizlilik Süresi' }
          ],
          createdBy: 'user-1',
          createdByName: 'Ahmet Yılmaz',
          createdAt: '2024-01-10T10:30:00Z',
          favoriteAddedAt: '2024-01-15T14:20:00Z',
          usageCount: 28,
          lastUsed: '2024-01-15T10:30:00Z',
          tags: ['gizlilik', 'standart', 'genel']
        },
        {
          id: '2',
          clauseId: 'clause-2',
          title: 'Ödeme Koşulları',
          description: 'Standart ödeme şartları ve gecikme faizi',
          category: 'PAYMENT',
          content: 'Ödeme {{payment_term}} gün içinde {{payment_method}} ile yapılacaktır. Geç ödemeler için %{{late_fee}} gecikme faizi uygulanır.',
          variables: [
            { name: 'payment_term', type: 'NUMBER', label: 'Ödeme Vadesi' },
            { name: 'payment_method', type: 'STRING', label: 'Ödeme Yöntemi' },
            { name: 'late_fee', type: 'PERCENTAGE', label: 'Gecikme Faizi' }
          ],
          createdBy: 'user-2',
          createdByName: 'Ayşe Demir',
          createdAt: '2024-01-08T15:45:00Z',
          favoriteAddedAt: '2024-01-14T09:15:00Z',
          usageCount: 22,
          lastUsed: '2024-01-14T15:45:00Z',
          tags: ['ödeme', 'vade', 'faiz']
        },
        {
          id: '3',
          clauseId: 'clause-3',
          title: 'Fesih Şartları',
          description: 'Sözleşme fesih koşulları ve ihbar süreleri',
          category: 'TERMINATION',
          content: 'Bu sözleşme {{notice_period}} gün önceden yazılı ihbar ile feshedilebilir. Fesih durumunda {{settlement_period}} gün içinde hesaplaşma yapılır.',
          variables: [
            { name: 'notice_period', type: 'NUMBER', label: 'İhbar Süresi' },
            { name: 'settlement_period', type: 'NUMBER', label: 'Hesaplaşma Süresi' }
          ],
          createdBy: 'user-3',
          createdByName: 'Mehmet Kaya',
          createdAt: '2024-01-05T11:20:00Z',
          favoriteAddedAt: '2024-01-12T16:30:00Z',
          usageCount: 18,
          lastUsed: '2024-01-13T09:20:00Z',
          tags: ['fesih', 'ihbar', 'hesaplaşma']
        },
        {
          id: '4',
          clauseId: 'clause-4',
          title: 'Sorumluluk Sınırlaması',
          description: 'Tarafların sorumluluk sınırları',
          category: 'LIABILITY',
          content: 'Tarafların sorumluluğu {{liability_limit}} ile sınırlıdır. {{liability_exceptions}} durumlarında bu sınırlama uygulanmaz.',
          variables: [
            { name: 'liability_limit', type: 'CURRENCY', label: 'Sorumluluk Limiti' },
            { name: 'liability_exceptions', type: 'STRING', label: 'İstisna Durumları' }
          ],
          createdBy: 'user-1',
          createdByName: 'Ahmet Yılmaz',
          createdAt: '2024-01-03T14:15:00Z',
          favoriteAddedAt: '2024-01-11T12:45:00Z',
          usageCount: 15,
          lastUsed: '2024-01-12T14:10:00Z',
          tags: ['sorumluluk', 'limit', 'istisna']
        }
      ];
      
      setFavorites(mockFavorites);
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort favorites
  const filteredAndSortedFavorites = favorites
    .filter(favorite => {
      const matchesSearch = favorite.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           favorite.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           favorite.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || favorite.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.favoriteAddedAt).getTime() - new Date(a.favoriteAddedAt).getTime();
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  // Remove from favorites
  const handleRemoveFromFavorites = (favoriteId: string) => {
    setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    console.log('Removed from favorites:', favoriteId);
  };

  // Copy clause content
  const handleCopyClause = (content: string) => {
    navigator.clipboard.writeText(content);
    console.log('Clause copied to clipboard');
  };

  // Use clause in contract
  const handleUseClause = (clauseId: string) => {
    console.log('Using clause in contract:', clauseId);
    // In real app, this would redirect to contract editor with clause
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Favoriler yükleniyor...</p>
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
              <Heart className="h-6 w-6 text-red-500" />
              Favori Clause'lar
            </h1>
            <p className="text-gray-600">
              Sık kullandığınız ve favori clause'larınız
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredAndSortedFavorites.length} favori
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Favori clause ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Son Eklenen</SelectItem>
            <SelectItem value="usage">En Çok Kullanılan</SelectItem>
            <SelectItem value="alphabetical">Alfabetik</SelectItem>
            <SelectItem value="category">Kategoriye Göre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedFavorites.map((favorite) => (
          <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {favorite.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {favorite.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromFavorites(favorite.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Category and Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {categoryLabels[favorite.category]}
                  </Badge>
                  {favorite.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {favorite.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{favorite.tags.length - 2}
                    </Badge>
                  )}
                </div>

                {/* Variables */}
                {favorite.variables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Değişkenler:</h4>
                    <div className="flex flex-wrap gap-1">
                      {favorite.variables.slice(0, 3).map((variable) => (
                        <Badge key={variable.name} variant="secondary" className="text-xs">
                          {variable.label}
                        </Badge>
                      ))}
                      {favorite.variables.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{favorite.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {favorite.createdByName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {favorite.usageCount} kullanım
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(favorite.favoriteAddedAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseClause(favorite.clauseId)}
                    className="flex-1"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Kullan
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyClause(favorite.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log('View clause:', favorite.clauseId)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedFavorites.length === 0 && (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Henüz favori clause yok</h3>
          <p className="text-gray-500 mb-4">
            Clause'ları favorilerinize ekleyerek hızlı erişim sağlayabilirsiniz
          </p>
          <Button onClick={() => router.push('/dashboard/clauses')}>
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Clause'lara Göz At
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClauseFavoritesPage; 