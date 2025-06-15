'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Copy, 
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  Download,
  Upload,
  Filter,
  FileText,
  Users,
  Building2,
  TrendingUp
} from 'lucide-react';

// Types
interface ClauseTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  isSystem: boolean;
  usageCount: number;
  rating: number;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  variables: string[];
}

const TemplatesPage = () => {
  const router = useRouter();
  
  // State
  const [templates, setTemplates] = useState<ClauseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ClauseTemplate | null>(null);
  const [newTemplateModalOpen, setNewTemplateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'GENERAL',
    tags: '',
    isPublic: false
  });

  // Categories
  const categories = [
    { value: 'all', label: 'Tüm Kategoriler' },
    { value: 'CONFIDENTIALITY', label: 'Gizlilik' },
    { value: 'PAYMENT', label: 'Ödeme' },
    { value: 'TERMINATION', label: 'Fesih' },
    { value: 'LIABILITY', label: 'Sorumluluk' },
    { value: 'DELIVERY', label: 'Teslimat' },
    { value: 'GENERAL', label: 'Genel' }
  ];

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockTemplates: ClauseTemplate[] = [
        {
          id: '1',
          title: 'Standart Gizlilik Maddesi',
          description: 'Genel amaçlı gizlilik ve veri koruma maddesi',
          content: `Bu sözleşme kapsamında {{company_name}} tarafından paylaşılan tüm bilgiler gizli kabul edilir. 

Taraflar, edindikleri gizli bilgileri:
- Sadece sözleşme amaçları için kullanacak
- Üçüncü kişilerle paylaşmayacak  
- Gerekli güvenlik önlemlerini alacak
- Sözleşme sona erdikten sonra {{confidentiality_period}} süre boyunca gizli tutacaktır.

Bu yükümlülük {{contract_end_date}} tarihinden itibaren {{confidentiality_years}} yıl süreyle devam edecektir.`,
          category: 'CONFIDENTIALITY',
          tags: ['gizlilik', 'veri-koruma', 'standart'],
          isPublic: true,
          isSystem: true,
          usageCount: 156,
          rating: 4.8,
          createdBy: {
            id: 'system',
            name: 'Sistem'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          variables: ['company_name', 'confidentiality_period', 'contract_end_date', 'confidentiality_years']
        },
        {
          id: '2',
          title: 'Ödeme Koşulları Şablonu',
          description: 'Standart ödeme koşulları ve vade bilgileri',
          content: `Ödeme Koşulları:

1. Toplam sözleşme bedeli {{contract_amount}} TL'dir.
2. Ödemeler {{payment_schedule}} şeklinde yapılacaktır.
3. Her fatura {{payment_due_days}} gün içinde ödenmelidir.
4. Geç ödeme durumunda günlük %{{late_fee_rate}} gecikme faizi uygulanır.
5. Ödemeler {{bank_account}} numaralı hesaba yapılacaktır.

Fatura bilgileri:
- Fatura adresi: {{billing_address}}
- Vergi dairesi: {{tax_office}}
- Vergi numarası: {{tax_number}}`,
          category: 'PAYMENT',
          tags: ['ödeme', 'fatura', 'vade'],
          isPublic: true,
          isSystem: true,
          usageCount: 134,
          rating: 4.6,
          createdBy: {
            id: 'system',
            name: 'Sistem'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-08T00:00:00Z',
          variables: ['contract_amount', 'payment_schedule', 'payment_due_days', 'late_fee_rate', 'bank_account', 'billing_address', 'tax_office', 'tax_number']
        },
        {
          id: '3',
          title: 'Fesih Koşulları',
          description: 'Sözleşme fesih koşulları ve ihbar süreleri',
          content: `Fesih Koşulları:

1. Bu sözleşme {{contract_duration}} süreyle geçerlidir.
2. Taraflar {{notice_period}} önceden yazılı bildirimde bulunarak sözleşmeyi feshedebilir.
3. Aşağıdaki durumlarda sözleşme derhal feshedilebilir:
   - Maddi sözleşme ihlali
   - İflas veya konkordato
   - {{termination_conditions}}

4. Fesih durumunda:
   - Tüm yükümlülükler {{settlement_period}} içinde yerine getirilir
   - Gizlilik yükümlülükleri devam eder
   - {{post_termination_obligations}}

5. Fesih bildirimi {{notification_method}} ile yapılmalıdır.`,
          category: 'TERMINATION',
          tags: ['fesih', 'ihbar', 'sonlandırma'],
          isPublic: true,
          isSystem: true,
          usageCount: 98,
          rating: 4.5,
          createdBy: {
            id: 'system',
            name: 'Sistem'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-12T00:00:00Z',
          variables: ['contract_duration', 'notice_period', 'termination_conditions', 'settlement_period', 'post_termination_obligations', 'notification_method']
        },
        {
          id: '4',
          title: 'Özel Teslimat Maddesi',
          description: 'E-ticaret için özelleştirilmiş teslimat koşulları',
          content: `Teslimat Koşulları:

1. Ürünler {{delivery_timeframe}} içinde teslim edilecektir.
2. Teslimat adresi: {{delivery_address}}
3. Kargo firması: {{shipping_company}}
4. Teslimat ücreti: {{shipping_cost}}

Özel koşullar:
- {{special_delivery_conditions}}
- Hasarlı teslimat durumunda {{damage_policy}}
- İade koşulları: {{return_policy}}`,
          category: 'DELIVERY',
          tags: ['teslimat', 'kargo', 'e-ticaret'],
          isPublic: false,
          isSystem: false,
          usageCount: 23,
          rating: 4.2,
          createdBy: {
            id: '1',
            name: 'Ahmet Yılmaz'
          },
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          variables: ['delivery_timeframe', 'delivery_address', 'shipping_company', 'shipping_cost', 'special_delivery_conditions', 'damage_policy', 'return_policy']
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Şablonlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Create new template
  const handleCreateTemplate = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    const newTemplate: ClauseTemplate = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      content: formData.content,
      category: formData.category,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPublic: formData.isPublic,
      isSystem: false,
      usageCount: 0,
      rating: 0,
      createdBy: {
        id: '1',
        name: 'Kullanıcı'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variables: []
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    setFormData({
      title: '',
      description: '',
      content: '',
      category: 'GENERAL',
      tags: '',
      isPublic: false
    });
    setNewTemplateModalOpen(false);
  };

  // Use template
  const handleUseTemplate = (template: ClauseTemplate) => {
    // Copy to clipboard
    navigator.clipboard.writeText(template.content);
    
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ));
    
    // Could also redirect to contract editor with template
    console.log('Template kullanıldı:', template.title);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Şablonlar yükleniyor...</p>
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
              <Copy className="h-6 w-6 text-blue-600" />
              Clause Şablonları
            </h1>
            <p className="text-gray-600">
              Hazır clause şablonlarını kullanın ve yeni şablonlar oluşturun
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
          </Button>
          
          <Dialog open={newTemplateModalOpen} onOpenChange={setNewTemplateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Şablon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Yeni Clause Şablonu</DialogTitle>
                <DialogDescription>
                  Yeniden kullanılabilir clause şablonu oluşturun
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Şablon Adı</label>
                    <Input
                      placeholder="Şablon adını girin..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Kategori</label>
                    <Select value={formData.category || ""} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Açıklama</label>
                  <Input
                    placeholder="Şablon açıklaması..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">İçerik</label>
                  <Textarea
                    placeholder="Clause içeriğini girin... ({{variable_name}} formatında değişkenler kullanabilirsiniz)"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Etiketler</label>
                  <Input
                    placeholder="Etiketleri virgülle ayırın..."
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                  <label htmlFor="isPublic" className="text-sm">Herkese açık şablon</label>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setNewTemplateModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleCreateTemplate}>
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
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Şablon</p>
                <p className="text-xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Herkese Açık</p>
                <p className="text-xl font-bold text-green-600">
                  {templates.filter(t => t.isPublic).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sistem Şablonları</p>
                <p className="text-xl font-bold text-purple-600">
                  {templates.filter(t => t.isSystem).length}
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
                  {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Şablon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-1">
                  {template.isSystem && (
                    <Badge variant="outline" className="text-xs">
                      Sistem
                    </Badge>
                  )}
                  {template.isPublic && (
                    <Badge variant="secondary" className="text-xs">
                      Herkese Açık
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{template.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>{template.usageCount} kullanım</span>
                  </div>
                </div>
                
                {/* Variables */}
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Değişkenler:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map((variable) => (
                        <code key={variable} className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {`{{${variable}}}`}
                        </code>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="text-xs text-gray-500">+{template.variables.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Kullan
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setPreviewModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {!template.isSystem && (
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Copy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Şablon bulunamadı</h3>
          <p className="text-gray-500">
            Arama kriterlerinize uygun şablon bulunamadı
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogContent className="max-w-4xl backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.title}</DialogTitle>
              <DialogDescription>
                {selectedTemplate.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{selectedTemplate.content}</pre>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Oluşturan: {selectedTemplate.createdBy.name}</span>
                  <span>Kullanım: {selectedTemplate.usageCount}</span>
                  <span>Değerlendirme: {selectedTemplate.rating.toFixed(1)}/5</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewModalOpen(false)}
                  >
                    Kapat
                  </Button>
                  <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Kullan
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TemplatesPage; 