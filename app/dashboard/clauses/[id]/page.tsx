'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  FileText,
  Tag,
  History,
  Edit,
  Share,
  Download,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Types
interface ClauseDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  lastModifiedBy: {
    id: string;
    name: string;
    email: string;
  };
  usageCount: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
}

const ClauseDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const clauseId = params.id as string;

  // State
  const [clause, setClause] = useState<ClauseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch clause details
  const fetchClauseDetails = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockClause: ClauseDetail = {
        id: clauseId,
        title: clauseId === '1' ? 'Gizlilik ve Veri Koruma Maddesi' :
               clauseId === '2' ? 'Sorumluluk Reddi Maddesi' :
               clauseId === '3' ? 'Ödeme Koşulları Maddesi' :
               clauseId === '4' ? 'Fesih Koşulları Maddesi' :
               'Clause Başlığı',
        content: `Bu madde, ${clauseId === '1' ? 'kişisel verilerin korunması' :
                              clauseId === '2' ? 'sorumluluk sınırlamaları' :
                              clauseId === '3' ? 'ödeme koşulları' :
                              clauseId === '4' ? 'fesih koşulları' :
                              'genel hükümler'} ile ilgili detaylı düzenlemeleri içermektedir.

Taraflar, bu madde kapsamında aşağıdaki hususları kabul ederler:

1. ${clauseId === '1' ? 'Kişisel veriler, KVKK hükümlerine uygun olarak işlenecektir.' :
      clauseId === '2' ? 'Sorumluluk, sözleşme değerinin %50\'si ile sınırlıdır.' :
      clauseId === '3' ? 'Ödemeler, fatura tarihinden itibaren 30 gün içinde yapılacaktır.' :
      clauseId === '4' ? 'Fesih, 30 gün önceden yazılı bildirimle yapılabilir.' :
      'Genel hükümler uygulanacaktır.'}

2. ${clauseId === '1' ? 'Veri güvenliği için gerekli teknik ve idari tedbirler alınacaktır.' :
      clauseId === '2' ? 'Mücbir sebep durumlarında sorumluluk söz konusu olmayacaktır.' :
      clauseId === '3' ? 'Gecikme durumunda günlük %0,1 gecikme faizi uygulanacaktır.' :
      clauseId === '4' ? 'Fesih durumunda karşılıklı yükümlülükler sona erecektir.' :
      'Ek düzenlemeler yapılabilir.'}

3. ${clauseId === '1' ? 'Veri ihlali durumunda ilgili kişiler derhal bilgilendirilecektir.' :
      clauseId === '2' ? 'Dolaylı zararlardan sorumluluk kabul edilmemektedir.' :
      clauseId === '3' ? 'Ödeme gecikmeleri sözleşme feshi sebebi sayılabilir.' :
      clauseId === '4' ? 'Fesih sonrası gizlilik yükümlülükleri devam edecektir.' :
      'Diğer hükümler saklıdır.'}

Bu madde, Türk Hukuku'na tabi olup, İstanbul Mahkemeleri yetkilidir.`,
        category: clauseId === '1' ? 'Gizlilik' :
                  clauseId === '2' ? 'Sorumluluk' :
                  clauseId === '3' ? 'Finansal' :
                  clauseId === '4' ? 'Fesih' :
                  'Genel',
        subcategory: clauseId === '1' ? 'Veri Koruma' :
                     clauseId === '2' ? 'Sorumluluk Reddi' :
                     clauseId === '3' ? 'Ödeme Koşulları' :
                     clauseId === '4' ? 'Fesih Koşulları' :
                     'Genel Hükümler',
        version: clauseId === '1' ? 1 :
                 clauseId === '2' ? 2 :
                 clauseId === '3' ? 3 :
                 clauseId === '4' ? 1 : 1,
        status: clauseId === '1' ? 'PENDING_APPROVAL' :
                clauseId === '2' ? 'ACTIVE' :
                clauseId === '3' ? 'DRAFT' :
                clauseId === '4' ? 'ARCHIVED' : 'DRAFT',
        riskLevel: clauseId === '1' ? 'HIGH' :
                   clauseId === '2' ? 'MEDIUM' :
                   clauseId === '3' ? 'HIGH' :
                   clauseId === '4' ? 'LOW' : 'MEDIUM',
        tags: clauseId === '1' ? ['KVKK', 'Gizlilik', 'Veri Koruma'] :
              clauseId === '2' ? ['Sorumluluk', 'Sınırlama', 'Hukuki'] :
              clauseId === '3' ? ['Ödeme', 'Finansal', 'Koşullar'] :
              clauseId === '4' ? ['Fesih', 'Sonlandırma', 'Hukuki'] :
              ['Genel', 'Hükümler'],
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: {
          id: '1',
          name: 'Ahmet Yılmaz',
          email: 'ahmet@contravo.com'
        },
        lastModifiedBy: {
          id: '2',
          name: 'Ayşe Demir',
          email: 'ayse@contravo.com'
        },
        usageCount: parseInt(clauseId) * 12 + 5,
        approvalStatus: clauseId === '1' ? 'PENDING' :
                       clauseId === '2' ? 'APPROVED' :
                       clauseId === '3' ? 'REVISION_REQUESTED' :
                       clauseId === '4' ? 'REJECTED' : undefined
      };

      setClause(mockClause);
    } catch (error) {
      console.error('Clause detayları yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clauseId) {
      fetchClauseDetails();
    }
  }, [clauseId]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING_APPROVAL':
        return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get risk level color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Clause detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!clause) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Clause bulunamadı</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            Geri Dön
          </Button>
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
              <FileText className="h-6 w-6 text-blue-600" />
              {clause.title}
            </h1>
            <p className="text-gray-600">
              {clause.category} • {clause.subcategory} • v{clause.version}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Paylaş
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            İndir
          </Button>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <Badge className={getStatusColor(clause.status)}>
                  {clause.status === 'ACTIVE' ? 'Aktif' :
                   clause.status === 'DRAFT' ? 'Taslak' :
                   clause.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' :
                   'Arşivlendi'}
                </Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Seviyesi</p>
                <Badge className={getRiskColor(clause.riskLevel)}>
                  {clause.riskLevel === 'HIGH' ? 'Yüksek' :
                   clause.riskLevel === 'MEDIUM' ? 'Orta' :
                   'Düşük'}
                </Badge>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kullanım</p>
                <p className="text-2xl font-bold">{clause.usageCount}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Versiyon</p>
                <p className="text-2xl font-bold">v{clause.version}</p>
              </div>
              <History className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Clause İçeriği</CardTitle>
          <CardDescription>
            Son güncelleme: {new Date(clause.updatedAt).toLocaleDateString('tr-TR')} - {clause.lastModifiedBy.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {clause.content}
            </div>
          </div>
          
          {/* Tags */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Etiketler</h4>
            <div className="flex flex-wrap gap-2">
              {clause.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClauseDetailPage; 