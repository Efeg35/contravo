'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Database,
  ArrowLeft
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
  clauseId: string;
  clause: {
    id: string;
    title: string;
    category: string;
  };
}

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

const VariablesPage = () => {
  const router = useRouter();
  
  // State
  const [variables, setVariables] = useState<ClauseVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVariable, setEditingVariable] = useState<ClauseVariable | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'STRING' as keyof typeof variableTypeLabels,
    defaultValue: '',
    description: '',
    isRequired: false
  });

  // Fetch variables - Mock data for now
  const fetchVariables = async () => {
    setLoading(true);
    try {
      // Mock data - in real app this would be an API call
      const mockVariables: ClauseVariable[] = [
        {
          id: '1',
          name: 'company_name',
          label: 'Şirket Adı',
          type: 'STRING',
          defaultValue: '',
          isRequired: true,
          description: 'Sözleşmeye taraf olan şirketin adı',
          clauseId: '1',
          clause: {
            id: '1',
            title: 'Gizlilik Maddesi',
            category: 'CONFIDENTIALITY'
          }
        },
        {
          id: '2',
          name: 'contract_amount',
          label: 'Sözleşme Tutarı',
          type: 'CURRENCY',
          defaultValue: '0',
          isRequired: true,
          description: 'Sözleşmenin toplam tutarı',
          clauseId: '2',
          clause: {
            id: '2',
            title: 'Ödeme Maddesi',
            category: 'PAYMENT'
          }
        },
        {
          id: '3',
          name: 'deadline_date',
          label: 'Son Tarih',
          type: 'DATE',
          defaultValue: '',
          isRequired: true,
          description: 'Projenin teslim tarihi',
          clauseId: '3',
          clause: {
            id: '3',
            title: 'Teslimat Maddesi',
            category: 'DELIVERY'
          }
        }
      ];
      
      setVariables(mockVariables);
    } catch (error) {
      console.error('Değişkenler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariables();
  }, []);

  // Filter variables
  const filteredVariables = variables.filter(variable => {
    const matchesSearch = !searchTerm || 
      variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variable.clause.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || variable.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Handle edit variable
  const handleEditVariable = (variable: ClauseVariable) => {
    setFormData({
      name: variable.name,
      label: variable.label,
      type: variable.type,
      defaultValue: variable.defaultValue || '',
      description: variable.description || '',
      isRequired: variable.isRequired
    });
    setEditingVariable(variable);
    setShowCreateModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      type: 'STRING',
      defaultValue: '',
      description: '',
      isRequired: false
    });
  };

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
              <Database className="h-6 w-6 text-blue-600" />
              Değişken Yönetimi
            </h1>
            <p className="text-gray-600">
              Clause değişkenlerini yönetin ve düzenleyin
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Değişken ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType || "all"} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm Tipler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                {Object.entries(variableTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
              variant="outline"
            >
              Filtreleri Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variables List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aktif Değişkenler ({filteredVariables.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-gray-500 mt-2">Yükleniyor...</p>
            </div>
          ) : filteredVariables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Değişken bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVariables.map((variable) => (
                <div key={variable.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {`{{${variable.name}}}`}
                        </code>
                        <Badge variant="secondary">
                          {variableTypeLabels[variable.type]}
                        </Badge>
                        {variable.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Zorunlu
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium">{variable.label}</h4>
                      
                      {variable.description && (
                        <p className="text-sm text-gray-600 mt-1">{variable.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Clause: {variable.clause.title}</span>
                        {variable.defaultValue && (
                          <span>Varsayılan: {variable.defaultValue}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditVariable(variable)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Variable Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Değişkeni Düzenle</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingVariable(null);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Değişken Adı *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="company_name"
                  />
                </div>
                
                <div>
                  <Label>Etiket *</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Şirket Adı"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tip</Label>
                  <Select
                    value={formData.type || "STRING"}
                    onValueChange={(value) => setFormData({ ...formData, type: value as keyof typeof variableTypeLabels })}
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
                    value={formData.defaultValue}
                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                    placeholder="Varsayılan değer"
                  />
                </div>
              </div>
              
              <div>
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu değişkenin ne için kullanıldığını açıklayın"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                />
                <Label>Zorunlu alan</Label>
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingVariable(null);
                    resetForm();
                  }}
                >
                  İptal
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VariablesPage; 