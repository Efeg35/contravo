'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  GitBranch, 
  History, 
  ArrowLeft,
  Search,
  Filter,
  Eye,
  RotateCcw,
  GitCompare,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';

// Types
interface ClauseVersion {
  id: string;
  clauseId: string;
  clauseTitle: string;
  version: string;
  content: string;
  changeDescription: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isCurrentVersion: boolean;
  changes: Array<{
    type: 'ADDED' | 'REMOVED' | 'MODIFIED';
    field: string;
    oldValue?: string;
    newValue?: string;
  }>;
}

const ClauseVersionsPage = () => {
  const router = useRouter();
  
  // State
  const [versions, setVersions] = useState<ClauseVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Fetch versions
  const fetchVersions = async () => {
    setLoading(true);
    try {
      // Mock data - in real app this would be an API call
      const mockVersions: ClauseVersion[] = [
        {
          id: '1',
          clauseId: 'clause-1',
          clauseTitle: 'Standart Gizlilik Maddesi',
          version: '3.0',
          content: 'Bu sözleşme kapsamında taraflar arasında paylaşılan tüm bilgiler gizli kabul edilir ve üçüncü şahıslarla paylaşılamaz. Gizlilik yükümlülüğü sözleşme sona erdikten sonra da {{confidentiality_period}} süreyle devam eder.',
          changeDescription: 'Gizlilik süresini değişken olarak güncellendi',
          createdBy: 'user-1',
          createdByName: 'Ahmet Yılmaz',
          createdAt: '2024-01-15T10:30:00Z',
          status: 'ACTIVE',
          isCurrentVersion: true,
          changes: [
            {
              type: 'MODIFIED',
              field: 'content',
              oldValue: '5 yıl süreyle',
              newValue: '{{confidentiality_period}} süreyle'
            }
          ]
        },
        {
          id: '2',
          clauseId: 'clause-1',
          clauseTitle: 'Standart Gizlilik Maddesi',
          version: '2.1',
          content: 'Bu sözleşme kapsamında taraflar arasında paylaşılan tüm bilgiler gizli kabul edilir ve üçüncü şahıslarla paylaşılamaz. Gizlilik yükümlülüğü sözleşme sona erdikten sonra da 5 yıl süreyle devam eder.',
          changeDescription: 'Küçük düzeltmeler ve yazım hatası giderildi',
          createdBy: 'user-2',
          createdByName: 'Ayşe Demir',
          createdAt: '2024-01-10T14:20:00Z',
          status: 'ARCHIVED',
          isCurrentVersion: false,
          changes: [
            {
              type: 'MODIFIED',
              field: 'content',
              oldValue: 'paylaşılmaz',
              newValue: 'paylaşılamaz'
            }
          ]
        },
        {
          id: '3',
          clauseId: 'clause-2',
          clauseTitle: 'Ödeme Koşulları',
          version: '1.2',
          content: 'Ödeme {{payment_term}} gün içinde {{payment_method}} ile yapılacaktır. Geç ödemeler için %{{late_fee}} gecikme faizi uygulanır.',
          changeDescription: 'Gecikme faizi oranı değişken yapıldı',
          createdBy: 'user-3',
          createdByName: 'Mehmet Kaya',
          createdAt: '2024-01-12T16:45:00Z',
          status: 'ACTIVE',
          isCurrentVersion: true,
          changes: [
            {
              type: 'MODIFIED',
              field: 'content',
              oldValue: '%2',
              newValue: '%{{late_fee}}'
            }
          ]
        }
      ];
      
      setVersions(mockVersions);
    } catch (error) {
      console.error('Versiyonlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter versions
  const filteredVersions = versions.filter(version => {
    const matchesSearch = version.clauseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         version.changeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         version.createdByName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || version.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group versions by clause
  const groupedVersions = filteredVersions.reduce((acc, version) => {
    if (!acc[version.clauseId]) {
      acc[version.clauseId] = [];
    }
    acc[version.clauseId].push(version);
    return acc;
  }, {} as Record<string, ClauseVersion[]>);

  // Handle version selection for comparison
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-3 w-3" />;
      case 'DRAFT': return <Clock className="h-3 w-3" />;
      case 'ARCHIVED': return <AlertCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Versiyonlar yükleniyor...</p>
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
              <GitBranch className="h-6 w-6 text-blue-600" />
              Clause Versiyonları
            </h1>
            <p className="text-gray-600">
              Clause geçmişi ve versiyon yönetimi
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedVersions.length === 2 && (
            <Button
              onClick={() => setCompareModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Karşılaştır
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Clause ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="DRAFT">Taslak</SelectItem>
            <SelectItem value="ARCHIVED">Arşivlenmiş</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Version Groups */}
      <div className="space-y-6">
        {Object.entries(groupedVersions).map(([clauseId, clauseVersions]) => (
          <Card key={clauseId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {clauseVersions[0].clauseTitle}
              </CardTitle>
              <CardDescription>
                {clauseVersions.length} versiyon mevcut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clauseVersions
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((version) => (
                  <div 
                    key={version.id} 
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedVersions.includes(version.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${version.isCurrentVersion ? 'ring-2 ring-green-200' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              v{version.version}
                            </Badge>
                            <Badge className={getStatusColor(version.status)}>
                              {getStatusIcon(version.status)}
                              <span className="ml-1">
                                {version.status === 'ACTIVE' ? 'Aktif' : 
                                 version.status === 'DRAFT' ? 'Taslak' : 'Arşivlenmiş'}
                              </span>
                            </Badge>
                            {version.isCurrentVersion && (
                              <Badge className="bg-green-100 text-green-800">
                                Güncel Versiyon
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {version.changeDescription}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.createdByName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(version.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        
                        {/* Changes */}
                        {version.changes.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {version.changes.map((change, index) => (
                              <div key={index} className="text-xs">
                                <Badge 
                                  variant="outline" 
                                  className={
                                    change.type === 'ADDED' ? 'text-green-600 border-green-200' :
                                    change.type === 'REMOVED' ? 'text-red-600 border-red-200' :
                                    'text-blue-600 border-blue-200'
                                  }
                                >
                                  {change.type === 'ADDED' ? 'Eklendi' :
                                   change.type === 'REMOVED' ? 'Silindi' : 'Değiştirildi'}
                                </Badge>
                                <span className="ml-2 text-gray-600">
                                  {change.field}: {change.newValue || 'Değişiklik yapıldı'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVersionSelect(version.id)}
                          className={selectedVersions.includes(version.id) ? 'bg-blue-100' : ''}
                        >
                          <input
                            type="checkbox"
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => {}}
                            className="mr-2"
                          />
                          Seç
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl backdrop-blur-sm">
                            <DialogHeader>
                              <DialogTitle>
                                {version.clauseTitle} - v{version.version}
                              </DialogTitle>
                              <DialogDescription>
                                {version.changeDescription}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">İçerik:</h4>
                              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                                {version.content}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {!version.isCurrentVersion && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => console.log('Restore version:', version.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compare Modal */}
      <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <DialogContent className="max-w-4xl backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Versiyon Karşılaştırması</DialogTitle>
            <DialogDescription>
              Seçilen versiyonlar arasındaki farkları görüntüleyin
            </DialogDescription>
          </DialogHeader>
          {selectedVersions.length === 2 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {selectedVersions.map((versionId) => {
                const version = versions.find(v => v.id === versionId);
                if (!version) return null;
                
                return (
                  <div key={versionId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span className="text-sm font-medium">{version.clauseTitle}</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                      {version.content}
                    </div>
                    <div className="text-xs text-gray-500">
                      {version.createdByName} - {new Date(version.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredVersions.length === 0 && (
        <div className="text-center py-12">
          <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Versiyon bulunamadı</p>
        </div>
      )}
    </div>
  );
};

export default ClauseVersionsPage; 