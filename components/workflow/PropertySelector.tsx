"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, FileText, Calendar, Hash, Mail, Globe, Phone, CheckSquare, ChevronDown, Upload, User } from 'lucide-react';

interface PropertyDefinition {
  id: string;
  label: string;
  apiKey: string;
  type: string;
  description?: string;
  isRequired: boolean;
  options?: any[];
  templateId: string;
}

interface PropertySelectorProps {
  templateId: string;
  onPropertySelect: (property: PropertyDefinition) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// Property tipi ikonları
const getPropertyIcon = (type: string) => {
  switch (type) {
    case 'TEXT':
    case 'TEXTAREA':
      return <FileText className="w-4 h-4" />;
    case 'DATE':
    case 'DATE_RANGE':
      return <Calendar className="w-4 h-4" />;
    case 'NUMBER':
      return <Hash className="w-4 h-4" />;
    case 'EMAIL':
      return <Mail className="w-4 h-4" />;
    case 'URL':
      return <Globe className="w-4 h-4" />;
    case 'PHONE':
      return <Phone className="w-4 h-4" />;
    case 'CHECKBOX':
    case 'SINGLE_SELECT':
    case 'MULTI_SELECT':
      return <CheckSquare className="w-4 h-4" />;
    case 'FILE_UPLOAD':
      return <Upload className="w-4 h-4" />;
    case 'USER_PICKER':
    case 'USER':
      return <User className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

// Property tipi renkleri
const getPropertyColor = (type: string) => {
  switch (type) {
    case 'TEXT':
    case 'TEXTAREA':
      return 'bg-blue-100 text-blue-700';
    case 'DATE':
    case 'DATE_RANGE':
      return 'bg-green-100 text-green-700';
    case 'NUMBER':
      return 'bg-purple-100 text-purple-700';
    case 'EMAIL':
      return 'bg-orange-100 text-orange-700';
    case 'URL':
      return 'bg-indigo-100 text-indigo-700';
    case 'PHONE':
      return 'bg-teal-100 text-teal-700';
    case 'CHECKBOX':
    case 'SINGLE_SELECT':
    case 'MULTI_SELECT':
      return 'bg-pink-100 text-pink-700';
    case 'FILE_UPLOAD':
      return 'bg-yellow-100 text-yellow-700';
    case 'USER_PICKER':
    case 'USER':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Property tipi etiketleri
const getPropertyTypeLabel = (type: string) => {
  switch (type) {
    case 'TEXT':
      return 'Metin';
    case 'TEXTAREA':
      return 'Uzun Metin';
    case 'DATE':
      return 'Tarih';
    case 'DATE_RANGE':
      return 'Tarih Aralığı';
    case 'NUMBER':
      return 'Sayı';
    case 'EMAIL':
      return 'E-posta';
    case 'URL':
      return 'Web Adresi';
    case 'PHONE':
      return 'Telefon';
    case 'CHECKBOX':
      return 'Onay Kutusu';
    case 'SINGLE_SELECT':
      return 'Tek Seçim';
    case 'MULTI_SELECT':
      return 'Çoklu Seçim';
    case 'FILE_UPLOAD':
      return 'Dosya Yükleme';
    case 'USER_PICKER':
      return 'Kullanıcı Seçici';
    case 'USER':
      return 'Kullanıcı';
    default:
      return type;
  }
};

export const PropertySelector: React.FC<PropertySelectorProps> = ({
  templateId,
  onPropertySelect,
  isOpen,
  setIsOpen
}) => {
  const [properties, setProperties] = useState<PropertyDefinition[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyDefinition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: 'TEXT',
    description: '',
    required: false
  });

  // Merkezi kütüphanedeki property'leri yükle
  const loadProperties = async () => {
    setLoading(true);
    try {
      console.log('🔍 PropertySelector: Property\'ler yükleniyor...');
      const response = await fetch(`/api/workflow-templates/properties?templateId=${templateId}&libraryOnly=true`);
      if (response.ok) {
        const data = await response.json();
        console.log('📋 PropertySelector API response:', data);
        if (data.success) {
          setProperties(data.properties || []);
          setFilteredProperties(data.properties || []);
          console.log(`✅ PropertySelector: ${data.properties?.length || 0} property yüklendi`);
        } else {
          console.error('❌ PropertySelector: Property yükleme hatası:', data.message);
        }
      } else {
        console.error('❌ PropertySelector: API response error:', response.status);
      }
    } catch (error) {
      console.error('❌ PropertySelector: Property\'ler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProperties();
    }
  }, [isOpen, templateId]);

  // Arama filtreleme
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(property =>
        property.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.apiKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPropertyTypeLabel(property.type).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  const handlePropertySelect = (property: PropertyDefinition) => {
    onPropertySelect(property);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddProperty = async () => {
    if (!newProperty.name || !newProperty.type) {
      alert('Property adı ve tipi zorunludur.');
      return;
    }

    try {
      const response = await fetch('/api/workflow-templates/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProperty.name,
          type: newProperty.type,
          description: newProperty.description,
          required: newProperty.required,
          templateId: templateId
        })
      });

      const result = await response.json();
      if (result.success) {
        // Property listesini yenile
        await loadProperties();
        // Formu sıfırla
        setNewProperty({
          name: '',
          type: 'TEXT',
          description: '',
          required: false
        });
        setShowAddForm(false);
        alert('Property başarıyla oluşturuldu!');
      } else {
        alert(result.message || 'Property oluşturulurken hata oluştu.');
      }
    } catch (error) {
      console.error('Property oluşturma hatası:', error);
      alert('Property oluşturulurken beklenmeyen bir hata oluştu.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Merkezi Kütüphaneden Özellik Seç</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Formunuza eklemek istediğiniz özelliği arayın ve seçin veya yeni bir özellik oluşturun.
          </p>
        </DialogHeader>

        {/* Arama ve Yeni Ekleme */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Özellik adı, API anahtarı veya açıklama ile arayın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Yeni Özellik
          </Button>
        </div>

        {/* Yeni Property Ekleme Formu */}
        {showAddForm && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Yeni Özellik Oluştur</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Özellik Adı *</label>
                <Input
                  value={newProperty.name}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="örn: Sözleşme Değeri"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tip *</label>
                <select
                  value={newProperty.type}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="TEXT">Metin</option>
                  <option value="TEXTAREA">Uzun Metin</option>
                  <option value="EMAIL">E-posta</option>
                  <option value="URL">Web Adresi</option>
                  <option value="PHONE">Telefon</option>
                  <option value="NUMBER">Sayı</option>
                  <option value="DATE">Tarih</option>
                  <option value="SINGLE_SELECT">Tek Seçim</option>
                  <option value="MULTI_SELECT">Çoklu Seçim</option>
                  <option value="CHECKBOX">Onay Kutusu</option>
                  <option value="FILE_UPLOAD">Dosya Yükleme</option>
                  <option value="USER_PICKER">Kullanıcı Seçici</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Açıklama</label>
                <textarea
                  value={newProperty.description}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Bu özellik hakkında açıklama..."
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProperty.required}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, required: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Zorunlu alan</span>
                </label>
                <Button onClick={handleAddProperty} size="sm">
                  Oluştur
                </Button>
                <Button 
                  onClick={() => setShowAddForm(false)} 
                  variant="outline" 
                  size="sm"
                >
                  İptal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Özellik Listesi */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Yükleniyor...</div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Arama kriterlerinize uygun özellik bulunamadı.' : 'Henüz özellik tanımlanmamış.'}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => handlePropertySelect(property)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getPropertyColor(property.type)} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      {getPropertyIcon(property.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                          {property.label}
                        </h3>
                        {property.isRequired && (
                          <Badge variant="destructive" className="text-xs">Zorunlu</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getPropertyTypeLabel(property.type)}
                        </Badge>
                        <span className="text-xs text-gray-500 font-mono">
                          {property.apiKey}
                        </span>
                      </div>
                      
                      {property.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {property.description}
                        </p>
                      )}
                      
                      {property.options && property.options.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Seçenekler: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {property.options.slice(0, 3).map((option, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {typeof option === 'string' ? option : option.label || option.value}
                              </Badge>
                            ))}
                            {property.options.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{property.options.length - 3} daha
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alt Bilgi */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {filteredProperties.length} özellik gösteriliyor
              {searchTerm && ` (${properties.length} toplam)`}
            </span>
            <span>Seçilen özellik forma soru olarak eklenecek</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 