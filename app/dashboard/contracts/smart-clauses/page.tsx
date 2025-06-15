'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  Plus,
  BookOpen,
  Zap,
  Star,
  Copy,
  Edit3,
  Trash2,
  Tag,
  TrendingUp,
  Brain,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types
interface SmartClause {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usage_count: number;
  rating: number;
  is_ai_generated: boolean;
  variables: ClauseVariable[];
  conditions: ClauseCondition[];
  created_at: string;
  updated_at: string;
  created_by: {
    name: string;
  };
}

interface ClauseVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  default_value?: string;
  description: string;
  required: boolean;
}

interface ClauseCondition {
  id: string;
  condition: string;
  action: string;
  description: string;
}

const SmartClausesPage = () => {
  const router = useRouter();

  // Mock data
  const mockClauses: SmartClause[] = [
    {
      id: '1',
      title: 'Ödeme Koşulları - Standart',
      content: `Hizmet bedeli {{amount}} {{currency}} + KDV olarak belirlenmiştir. 
Ödemeler {{payment_frequency}} yapılacaktır. 
{{#if early_payment_discount}}
Erken ödeme durumunda %{{discount_rate}} indirim uygulanacaktır.
{{/if}}
Gecikme durumunda günlük %{{late_fee_rate}} gecikme faizi uygulanacaktır.`,
      category: 'Ödeme',
      tags: ['ödeme', 'standart', 'gecikme', 'indirim'],
      usage_count: 156,
      rating: 4.8,
      is_ai_generated: false,
      variables: [
        { name: 'amount', type: 'number', description: 'Ödeme tutarı', required: true },
        { name: 'currency', type: 'text', default_value: 'TL', description: 'Para birimi', required: true },
        { name: 'payment_frequency', type: 'text', default_value: 'aylık', description: 'Ödeme sıklığı', required: true },
        { name: 'early_payment_discount', type: 'boolean', default_value: 'false', description: 'Erken ödeme indirimi var mı?', required: false },
        { name: 'discount_rate', type: 'number', default_value: '5', description: 'İndirim oranı', required: false },
        { name: 'late_fee_rate', type: 'number', default_value: '0.1', description: 'Gecikme faiz oranı', required: true }
      ],
      conditions: [
        {
          id: '1',
          condition: 'early_payment_discount == true',
          action: 'Show early payment discount clause',
          description: 'Erken ödeme indirimi aktifse ilgili maddeyi göster'
        }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
      created_by: { name: 'Hukuk Departmanı' }
    },
    {
      id: '2',
      title: 'KVKK Uyumluluk Maddesi',
      content: `Taraflar, bu sözleşme kapsamında işlenen kişisel verilerin 6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun olarak işleneceğini kabul eder.
{{company_name}} veri sorumlusu sıfatıyla, {{#if data_processing_purpose}}{{data_processing_purpose}}{{else}}sözleşmenin ifası{{/if}} amacıyla kişisel verileri işleyecektir.
Veri sahibi, KVKK'da öngörülen haklarını {{contact_email}} adresine başvurarak kullanabilir.`,
      category: 'Hukuki Uyumluluk',
      tags: ['kvkk', 'kişisel veri', 'uyumluluk', 'gdpr'],
      usage_count: 89,
      rating: 4.9,
      is_ai_generated: true,
      variables: [
        { name: 'company_name', type: 'text', description: 'Şirket adı', required: true },
        { name: 'data_processing_purpose', type: 'text', description: 'Veri işleme amacı', required: false },
        { name: 'contact_email', type: 'text', description: 'İletişim e-postası', required: true }
      ],
      conditions: [
        {
          id: '1',
          condition: 'data_processing_purpose != null',
          action: 'Use custom processing purpose',
          description: 'Özel veri işleme amacı varsa onu kullan'
        }
      ],
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-18T11:15:00Z',
      created_by: { name: 'AI Assistant' }
    },
    {
      id: '3',
      title: 'Fesih Koşulları - Esnek',
      content: `Bu sözleşme aşağıdaki durumlarda feshedilebilir:
1. Tarafların karşılıklı anlaşması ile
2. {{notice_period}} gün önceden yazılı bildirimde bulunulması ile
{{#if breach_termination}}
3. Sözleşme ihlali durumunda {{breach_notice_period}} gün süre tanınarak
{{/if}}
{{#if immediate_termination_conditions}}
4. Aşağıdaki durumlarda derhal fesih:
   {{immediate_termination_conditions}}
{{/if}}`,
      category: 'Fesih',
      tags: ['fesih', 'bildirim', 'ihlal', 'derhal'],
      usage_count: 134,
      rating: 4.6,
      is_ai_generated: false,
      variables: [
        { name: 'notice_period', type: 'number', default_value: '30', description: 'Bildirim süresi (gün)', required: true },
        { name: 'breach_termination', type: 'boolean', default_value: 'true', description: 'İhlal durumunda fesih var mı?', required: false },
        { name: 'breach_notice_period', type: 'number', default_value: '15', description: 'İhlal bildirim süresi', required: false },
        { name: 'immediate_termination_conditions', type: 'text', description: 'Derhal fesih koşulları', required: false }
      ],
      conditions: [
        {
          id: '1',
          condition: 'breach_termination == true',
          action: 'Show breach termination clause',
          description: 'İhlal feshi aktifse ilgili maddeyi göster'
        },
        {
          id: '2',
          condition: 'immediate_termination_conditions != null',
          action: 'Show immediate termination conditions',
          description: 'Derhal fesih koşulları varsa göster'
        }
      ],
      created_at: '2024-01-12T14:20:00Z',
      updated_at: '2024-01-22T16:45:00Z',
      created_by: { name: 'Ahmet Yılmaz' }
    }
  ];

  const categories = ['all', 'Ödeme', 'Hukuki Uyumluluk', 'Fesih', 'Sorumluluk', 'Gizlilik'];

  // Copy clause to clipboard
  const handleCopyClause = (clause: SmartClause) => {
    navigator.clipboard.writeText(clause.content);
    console.log('Clause copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Brain className="h-8 w-8 text-blue-600" />
                  Smart Clauses
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Dinamik ve akıllı clause kütüphanesi ile sözleşmelerinizi hızla oluşturun
                </p>
              </div>
            </div>
            
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Zap className="h-4 w-4 mr-2" />
              AI ile Üret
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Clause</p>
                  <p className="text-2xl font-bold">{mockClauses.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI Üretimi</p>
                  <p className="text-2xl font-bold">{mockClauses.filter(c => c.is_ai_generated).length}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Kullanım</p>
                  <p className="text-2xl font-bold">{mockClauses.reduce((sum, c) => sum + c.usage_count, 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ortalama Rating</p>
                  <p className="text-2xl font-bold">
                    {(mockClauses.reduce((sum, c) => sum + c.rating, 0) / mockClauses.length).toFixed(1)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clauses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockClauses.map((clause) => (
            <Card key={clause.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      {clause.title}
                      {clause.is_ai_generated && (
                        <Badge variant="secondary" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {clause.category}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    {clause.rating}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Content Preview */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {clause.content.substring(0, 150)}...
                    </p>
                  </div>
                  
                  {/* Variables */}
                  <div>
                    <p className="text-sm font-medium mb-2">Değişkenler ({clause.variables.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {clause.variables.slice(0, 3).map((variable) => (
                        <Badge key={variable.name} variant="outline" className="text-xs">
                          {variable.name}
                        </Badge>
                      ))}
                      {clause.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{clause.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {clause.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {clause.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{clause.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {clause.usage_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(clause.updated_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyClause(clause)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopyala
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Empty State */}
        {mockClauses.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz clause bulunmuyor
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              İlk smart clause'unuzu oluşturmak için AI'dan yardım alın
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Zap className="h-4 w-4 mr-2" />
              AI ile İlk Clause'u Oluştur
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartClausesPage; 