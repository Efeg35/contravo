'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Save, 
  ArrowLeft, 
  BookOpen, 
  Eye,
  AlertCircle,
  Info,
  Trash2,
  Lightbulb
} from 'lucide-react';

// Types
interface ClauseVariable {
  id: string;
  name: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'EMAIL' | 'PHONE' | 'CURRENCY' | 'PERCENTAGE';
  defaultValue?: string;
  isRequired: boolean;
  description?: string;
}

type ClauseCategory = 
  | 'LEGAL'
  | 'COMMERCIAL'
  | 'TECHNICAL'
  | 'CONFIDENTIALITY'
  | 'TERMINATION'
  | 'LIABILITY'
  | 'INTELLECTUAL_PROPERTY'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'COMPLIANCE'
  | 'DISPUTE'
  | 'FORCE_MAJEURE'
  | 'OTHER';

// Category labels in Turkish
const categoryLabels: Record<ClauseCategory, string> = {
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

// Variable type labels
const variableTypeLabels = {
  STRING: 'Metin',
  NUMBER: 'Sayı',
  DATE: 'Tarih',
  BOOLEAN: 'Evet/Hayır',
  EMAIL: 'E-posta',
  PHONE: 'Telefon',
  CURRENCY: 'Para Birimi',
  PERCENTAGE: 'Yüzde'
};

const NewClausePage = () => {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '' as ClauseCategory | '',
    visibility: 'COMPANY' as 'PUBLIC' | 'COMPANY' | 'PRIVATE'
  });
  
  const [variables, setVariables] = useState<ClauseVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  // Add new variable
  const addVariable = () => {
    const newVariable: ClauseVariable = {
      id: `var_${Date.now()}`,
      name: '',
      label: '',
      type: 'STRING',
      defaultValue: '',
      isRequired: false,
      description: ''
    };
    setVariables([...variables, newVariable]);
  };

  // Remove variable
  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  // Update variable
  const updateVariable = (id: string, field: keyof ClauseVariable, value: any) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  // Extract variables from content
  const extractVariablesFromContent = () => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...formData.content.matchAll(regex)];
    const extractedVars = matches.map(match => match[1].trim());
    
    // Add missing variables
    extractedVars.forEach(varName => {
      if (!variables.find(v => v.name === varName)) {
        const newVariable: ClauseVariable = {
          id: `var_${Date.now()}_${varName}`,
          name: varName,
          label: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'STRING',
          defaultValue: '',
          isRequired: true,
          description: ''
        };
        setVariables(prev => [...prev, newVariable]);
      }
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gereklidir';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'İçerik gereklidir';
    }
    
    if (!formData.category) {
      newErrors.category = 'Kategori seçimi gereklidir';
    }
    
    // Validate variables
    variables.forEach((variable, index) => {
      if (!variable.name.trim()) {
        newErrors[`variable_${index}_name`] = 'Değişken adı gereklidir';
      }
      if (!variable.label.trim()) {
        newErrors[`variable_${index}_label`] = 'Değişken etiketi gereklidir';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/clauses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          variables: variables.map(v => ({
            name: v.name,
            label: v.label,
            type: v.type,
            defaultValue: v.defaultValue,
            isRequired: v.isRequired,
            description: v.description
          }))
        }),
      });
      
      if (response.ok) {
        router.push('/dashboard/clauses');
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Clause oluşturulamadı' });
      }
    } catch (error) {
      setErrors({ submit: 'Bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  // Render preview
  const renderPreview = () => {
    let previewContent = formData.content;
    
    variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      const replacement = variable.defaultValue || `[${variable.label}]`;
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), replacement);
    });
    
    return previewContent;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
              <BookOpen className="h-6 w-6 text-blue-600" />
              Yeni Smart Clause Oluştur
            </h1>
            <p className="text-gray-600">
              Yeniden kullanılabilir sözleşme maddesi oluşturun
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Düzenle' : 'Önizleme'}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{errors.submit}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {!previewMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Temel Bilgiler</CardTitle>
                  <CardDescription>
                    Clause'unuzun temel özelliklerini belirleyin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Başlık *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Örn: Gizlilik ve Veri Koruma Maddesi"
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Açıklama</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Bu clause'un ne için kullanıldığını açıklayın"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Kategori *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value as ClauseCategory })}
                      >
                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="visibility">Görünürlük</Label>
                      <Select
                        value={formData.visibility}
                        onValueChange={(value) => setFormData({ ...formData, visibility: value as any })}
                      >
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
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Clause İçeriği</CardTitle>
                  <CardDescription>
                    Clause metnini yazın. Değişkenler için {`{{variable_name}}`} formatını kullanın.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="content">İçerik *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      onBlur={extractVariablesFromContent}
                      placeholder="Örn: Taraflar, bu sözleşme kapsamında edindikleri tüm gizli bilgileri {confidentiality_period} süreyle gizli tutmayı taahhüt ederler..."
                      rows={8}
                      className={errors.content ? 'border-red-500' : ''}
                    />
                    {errors.content && (
                      <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      💡 İpucu: {`{{variable_name}}`} formatında değişkenler kullanabilirsiniz
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Variables */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Değişkenler</CardTitle>
                      <CardDescription>
                        Clause'unuzda kullanılan değişkenleri tanımlayın
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addVariable}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Değişken Ekle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {variables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Henüz değişken eklenmemiş.</p>
                      <p className="text-sm">İçerikte {`{{variable_name}}`} kullandığınızda otomatik eklenecek.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {variables.map((variable, index) => (
                        <div key={variable.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Değişken #{index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariable(variable.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Değişken Adı *</Label>
                              <Input
                                value={variable.name}
                                onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                                placeholder="company_name"
                                className={errors[`variable_${index}_name`] ? 'border-red-500' : ''}
                              />
                              {errors[`variable_${index}_name`] && (
                                <p className="text-sm text-red-500 mt-1">{errors[`variable_${index}_name`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <Label>Etiket *</Label>
                              <Input
                                value={variable.label}
                                onChange={(e) => updateVariable(variable.id, 'label', e.target.value)}
                                placeholder="Şirket Adı"
                                className={errors[`variable_${index}_label`] ? 'border-red-500' : ''}
                              />
                              {errors[`variable_${index}_label`] && (
                                <p className="text-sm text-red-500 mt-1">{errors[`variable_${index}_label`]}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Tip</Label>
                              <Select
                                value={variable.type}
                                onValueChange={(value) => updateVariable(variable.id, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(variableTypeLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Varsayılan Değer</Label>
                              <Input
                                value={variable.defaultValue}
                                onChange={(e) => updateVariable(variable.id, 'defaultValue', e.target.value)}
                                placeholder="Varsayılan değer"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label>Açıklama</Label>
                            <Input
                              value={variable.description}
                              onChange={(e) => updateVariable(variable.id, 'description', e.target.value)}
                              placeholder="Bu değişkenin ne için kullanıldığını açıklayın"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={variable.isRequired}
                              onCheckedChange={(checked) => updateVariable(variable.id, 'isRequired', checked)}
                            />
                            <Label>Zorunlu alan</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          ) : (
            /* Preview Mode */
            <Card>
              <CardHeader>
                <CardTitle>Önizleme</CardTitle>
                <CardDescription>
                  Clause'unuzun nasıl görüneceğini inceleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{formData.title}</h3>
                    {formData.description && (
                      <p className="text-gray-600 text-sm">{formData.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {formData.category ? categoryLabels[formData.category] : 'Kategori seçilmedi'}
                      </Badge>
                      <Badge variant="outline">
                        {formData.visibility === 'PUBLIC' ? 'Herkese Açık' : 
                         formData.visibility === 'COMPANY' ? 'Şirket İçi' : 'Özel'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">İçerik:</h4>
                    <p className="whitespace-pre-wrap">{renderPreview()}</p>
                  </div>
                  
                  {variables.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Değişkenler:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {variables.map((variable) => (
                          <div key={variable.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">{`{{${variable.name}}}`}</span>
                            <span className="text-sm text-gray-600">{variable.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                İpuçları
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Değişkenler için {`{{variable_name}}`} formatını kullanın</p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Açık ve anlaşılır başlıklar seçin</p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Kategorileri doğru seçerek organize edin</p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Varsayılan değerler örnek olarak gösterilir</p>
              </div>
            </CardContent>
          </Card>

          {/* Variable Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Örnek Değişkenler</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="font-mono bg-gray-100 p-2 rounded">{`{{company_name}}`}</div>
              <div className="font-mono bg-gray-100 p-2 rounded">{`{{contract_date}}`}</div>
              <div className="font-mono bg-gray-100 p-2 rounded">{`{{payment_amount}}`}</div>
              <div className="font-mono bg-gray-100 p-2 rounded">{`{{deadline_days}}`}</div>
              <div className="font-mono bg-gray-100 p-2 rounded">{`{{other_party}}`}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewClausePage; 