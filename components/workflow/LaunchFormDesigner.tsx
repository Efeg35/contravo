import React, { useEffect, useState } from 'react';
import LaunchFormRenderer from './LaunchFormRenderer';
import { PropertyEditorModal } from './PropertyEditorModal';
import { addFormFieldToTemplate, addSectionToLaunchForm } from '../../src/lib/actions/workflow-template-actions';
import { PropertiesAndConditions } from './PropertiesAndConditions';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  FormSection, 
  SectionDisplayMode, 
  SectionVisibilityCondition 
} from '../../types/workflow';

interface AddFieldModalProps {
  templateId: string;
  onFieldAdded: () => void;
  sectionId?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({ templateId, onFieldAdded, sectionId, isOpen, setIsOpen }) => {
  const [fieldData, setFieldData] = useState({
    name: '',
    type: 'TEXT',
    required: false,
    placeholder: '',
    helpText: '',
    minLength: '',
    maxLength: '',
    minValue: '',
    maxValue: '',
    pattern: '',
    customError: '',
    options: [] as string[],
    // Sprint 2: Enhanced validation and rules
    defaultValue: '',
    isReadOnly: false,
    isHidden: false,
    errorMessage: '',
    warningMessage: '',
    successMessage: '',
    fieldGroup: '',
    priority: 0,
    realTimeValidation: false,
    isConditional: false
  });
  const [optionInput, setOptionInput] = useState('');

  const fieldTypes = [
    { value: 'TEXT', label: 'Metin (Kısa)' },
    { value: 'TEXTAREA', label: 'Metin (Uzun)' },
    { value: 'EMAIL', label: 'E-posta' },
    { value: 'URL', label: 'Web Adresi' },
    { value: 'PHONE', label: 'Telefon' },
    { value: 'NUMBER', label: 'Sayı' },
    { value: 'DATE', label: 'Tarih' },
    { value: 'DATE_RANGE', label: 'Tarih Aralığı' },
    { value: 'SINGLE_SELECT', label: 'Tek Seçim' },
    { value: 'MULTI_SELECT', label: 'Çoklu Seçim' },
    { value: 'CHECKBOX', label: 'Onay Kutusu' },
    { value: 'FILE_UPLOAD', label: 'Dosya Yükleme' },
    { value: 'USER_PICKER', label: 'Kullanıcı Seçici' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/workflow-templates/${templateId}/form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fieldData.name,
          type: fieldData.type,
          required: fieldData.required,
          placeholder: fieldData.placeholder || undefined,
          helpText: fieldData.helpText || undefined,
          minLength: fieldData.minLength ? parseInt(fieldData.minLength) : undefined,
          maxLength: fieldData.maxLength ? parseInt(fieldData.maxLength) : undefined,
          minValue: fieldData.minValue ? parseFloat(fieldData.minValue) : undefined,
          maxValue: fieldData.maxValue ? parseFloat(fieldData.maxValue) : undefined,
          pattern: fieldData.pattern || undefined,
          customError: fieldData.customError || undefined,
          options: fieldData.options.length > 0 ? fieldData.options : undefined,
          // Sprint 2: Enhanced validation and rules
          defaultValue: fieldData.defaultValue || undefined,
          isReadOnly: fieldData.isReadOnly || false,
          isHidden: fieldData.isHidden || false,
          errorMessage: fieldData.errorMessage || undefined,
          warningMessage: fieldData.warningMessage || undefined,
          successMessage: fieldData.successMessage || undefined,
          fieldGroup: fieldData.fieldGroup || undefined,
          priority: fieldData.priority ? parseInt(fieldData.priority.toString()) : 0,
          realTimeValidation: fieldData.realTimeValidation || false,
          isConditional: fieldData.isConditional || false,
          sectionId: sectionId || undefined
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setIsOpen(false);
        setFieldData({
          name: '',
          type: 'TEXT',
          required: false,
          placeholder: '',
          helpText: '',
          minLength: '',
          maxLength: '',
          minValue: '',
          maxValue: '',
          pattern: '',
          customError: '',
          options: [],
          // Sprint 2: Enhanced validation and rules
          defaultValue: '',
          isReadOnly: false,
          isHidden: false,
          errorMessage: '',
          warningMessage: '',
          successMessage: '',
          fieldGroup: '',
          priority: 0,
          realTimeValidation: false,
          isConditional: false
        });
        onFieldAdded();
      } else {
        alert(result.message || 'Alan eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Alan ekleme hatası:', error);
      alert('Sunucu hatası');
    }
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setFieldData(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()]
      }));
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setFieldData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const needsOptions = ['SINGLE_SELECT', 'MULTI_SELECT', 'USER_PICKER'].includes(fieldData.type);
  const needsValidation = ['TEXT', 'TEXTAREA', 'EMAIL', 'URL', 'PHONE', 'NUMBER'].includes(fieldData.type);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* <Button variant="outline" size="sm">+ Add question to form</Button> */}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Form Alanı Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Alan Adı *</Label>
            <Input
              id="name"
              value={fieldData.name}
              onChange={(e) => setFieldData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="örn: Sözleşme Değeri"
            />
          </div>

          <div>
            <Label htmlFor="type">Alan Tipi *</Label>
            <Select value={fieldData.type} onValueChange={(value) => setFieldData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="required"
              checked={fieldData.required}
              onChange={(e) => setFieldData(prev => ({ ...prev, required: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="required">Zorunlu alan</Label>
          </div>

          <div>
            <Label htmlFor="placeholder">Placeholder Metni</Label>
            <Input
              id="placeholder"
              value={fieldData.placeholder}
              onChange={(e) => setFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
              placeholder="Kullanıcının göreceği yardımcı metin"
            />
          </div>

          <div>
            <Label htmlFor="helpText">Yardım Metni</Label>
            <Textarea
              id="helpText"
              value={fieldData.helpText}
              onChange={(e) => setFieldData(prev => ({ ...prev, helpText: e.target.value }))}
              placeholder="Bu alan hakkında açıklama"
              rows={2}
            />
          </div>

          {needsOptions && (
            <div>
              <Label>Seçenekler</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="Yeni seçenek ekle"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                />
                <Button type="button" onClick={addOption}>Ekle</Button>
              </div>
              <div className="space-y-1">
                {fieldData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1">{option}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-500"
                    >
                      Sil
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {needsValidation && (
            <div className="grid grid-cols-2 gap-4">
              {['TEXT', 'TEXTAREA', 'EMAIL', 'URL', 'PHONE'].includes(fieldData.type) && (
                <>
                  <div>
                    <Label htmlFor="minLength">Min. Karakter</Label>
                    <Input
                      id="minLength"
                      type="number"
                      value={fieldData.minLength}
                      onChange={(e) => setFieldData(prev => ({ ...prev, minLength: e.target.value }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLength">Max. Karakter</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={fieldData.maxLength}
                      onChange={(e) => setFieldData(prev => ({ ...prev, maxLength: e.target.value }))}
                      min="0"
                    />
                  </div>
                </>
              )}
              
              {fieldData.type === 'NUMBER' && (
                <>
                  <div>
                    <Label htmlFor="minValue">Min. Değer</Label>
                    <Input
                      id="minValue"
                      type="number"
                      step="any"
                      value={fieldData.minValue}
                      onChange={(e) => setFieldData(prev => ({ ...prev, minValue: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxValue">Max. Değer</Label>
                    <Input
                      id="maxValue"
                      type="number"
                      step="any"
                      value={fieldData.maxValue}
                      onChange={(e) => setFieldData(prev => ({ ...prev, maxValue: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="pattern">Regex Pattern (İsteğe bağlı)</Label>
            <Input
              id="pattern"
              value={fieldData.pattern}
              onChange={(e) => setFieldData(prev => ({ ...prev, pattern: e.target.value }))}
              placeholder="örn: ^[A-Z]{2}[0-9]{6}$ (kimlik numarası formatı)"
            />
          </div>

          <div>
            <Label htmlFor="customError">Özel Hata Mesajı</Label>
            <Input
              id="customError"
              value={fieldData.customError}
              onChange={(e) => setFieldData(prev => ({ ...prev, customError: e.target.value }))}
              placeholder="Geçersiz giriş durumunda gösterilecek mesaj"
            />
          </div>

          {/* Sprint 2: Enhanced Validation and Rules */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Gelişmiş Validasyon Ayarları</h4>
            
            <div>
              <Label htmlFor="defaultValue">Varsayılan Değer</Label>
              <Input
                id="defaultValue"
                value={fieldData.defaultValue}
                onChange={(e) => setFieldData(prev => ({ ...prev, defaultValue: e.target.value }))}
                placeholder="Bu alanın varsayılan değeri"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isReadOnly"
                  checked={fieldData.isReadOnly}
                  onChange={(e) => setFieldData(prev => ({ ...prev, isReadOnly: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isReadOnly" className="text-sm">Salt Okunur</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={fieldData.isHidden}
                  onChange={(e) => setFieldData(prev => ({ ...prev, isHidden: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isHidden" className="text-sm">Gizli</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="realTimeValidation"
                  checked={fieldData.realTimeValidation}
                  onChange={(e) => setFieldData(prev => ({ ...prev, realTimeValidation: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="realTimeValidation" className="text-sm">Anlık Validasyon</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fieldGroup">Alan Grubu</Label>
                <Input
                  id="fieldGroup"
                  value={fieldData.fieldGroup}
                  onChange={(e) => setFieldData(prev => ({ ...prev, fieldGroup: e.target.value }))}
                  placeholder="Grup adı (örn: Sözleşme Bilgileri)"
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Öncelik Seviyesi</Label>
                <Input
                  id="priority"
                  type="number"
                  value={fieldData.priority}
                  onChange={(e) => setFieldData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  placeholder="0-100 arası"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="errorMessage">Hata Mesajı</Label>
              <Input
                id="errorMessage"
                value={fieldData.errorMessage}
                onChange={(e) => setFieldData(prev => ({ ...prev, errorMessage: e.target.value }))}
                placeholder="Validasyon başarısız olduğunda gösterilecek mesaj"
              />
            </div>

            <div>
              <Label htmlFor="warningMessage">Uyarı Mesajı</Label>
              <Input
                id="warningMessage"
                value={fieldData.warningMessage}
                onChange={(e) => setFieldData(prev => ({ ...prev, warningMessage: e.target.value }))}
                placeholder="Uyarı durumunda gösterilecek mesaj"
              />
            </div>

            <div>
              <Label htmlFor="successMessage">Başarı Mesajı</Label>
              <Input
                id="successMessage"
                value={fieldData.successMessage}
                onChange={(e) => setFieldData(prev => ({ ...prev, successMessage: e.target.value }))}
                placeholder="Validasyon başarılı olduğunda gösterilecek mesaj"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isConditional"
                checked={fieldData.isConditional}
                onChange={(e) => setFieldData(prev => ({ ...prev, isConditional: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isConditional">Koşullu Alan (Diğer alanlara bağlı gösterim)</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              İptal
            </Button>
            <Button type="submit">
              Alan Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Sprint 4: AddSectionModal Component
interface AddSectionModalProps {
  templateId: string;
  onSectionAdded: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AddSectionModal: React.FC<AddSectionModalProps> = ({ templateId, onSectionAdded, isOpen, setIsOpen }) => {
  const [sectionData, setSectionData] = useState({
    name: '',
    description: '',
    icon: '',
    displayMode: 'EXPANDED' as SectionDisplayMode,
    isCollapsible: true,
    isExpanded: true,
    visibilityCondition: 'ALWAYS' as SectionVisibilityCondition,
    order: 0,
    backgroundColor: '',
    borderColor: '',
    textColor: ''
  });

  const displayModes = [
    { value: 'EXPANDED', label: 'Genişletilmiş' },
    { value: 'COLLAPSED', label: 'Katlanmış' },
    { value: 'TABS', label: 'Sekmeler' },
    { value: 'ACCORDION', label: 'Akordeon' }
  ];

  const visibilityConditions = [
    { value: 'ALWAYS', label: 'Her Zaman Göster' },
    { value: 'CONDITIONAL', label: 'Koşullu Göster' },
    { value: 'NEVER', label: 'Hiç Gösterme' }
  ];

  const iconOptions = [
    '📋', '📄', '👤', '🏢', '💰', '📅', '⚖️', '📝', '🔒', '📊'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/workflow-templates/${templateId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData)
      });
      
      const result = await response.json();
      if (result.success) {
        setIsOpen(false);
        setSectionData({
          name: '',
          description: '',
          icon: '',
          displayMode: 'EXPANDED' as SectionDisplayMode,
          isCollapsible: true,
          isExpanded: true,
          visibilityCondition: 'ALWAYS' as SectionVisibilityCondition,
          order: 0,
          backgroundColor: '',
          borderColor: '',
          textColor: ''
        });
        onSectionAdded();
      } else {
        alert(result.message || 'Section eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Section ekleme hatası:', error);
      alert('Sunucu hatası');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Section Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sectionName">Section Adı *</Label>
            <Input
              id="sectionName"
              value={sectionData.name}
              onChange={(e) => setSectionData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="örn: Sözleşme Bilgileri"
            />
          </div>

          <div>
            <Label htmlFor="sectionDescription">Açıklama</Label>
            <Textarea
              id="sectionDescription"
              value={sectionData.description}
              onChange={(e) => setSectionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Section açıklaması"
            />
          </div>

          <div>
            <Label htmlFor="sectionIcon">İkon</Label>
            <div className="flex gap-2 mt-2">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSectionData(prev => ({ ...prev, icon }))}
                  className={`w-10 h-10 border rounded text-lg ${
                    sectionData.icon === icon ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="displayMode">Görüntüleme Modu</Label>
            <Select value={sectionData.displayMode} onValueChange={(value: SectionDisplayMode) => setSectionData(prev => ({ ...prev, displayMode: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {displayModes.map(mode => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="visibilityCondition">Görünürlük</Label>
            <Select value={sectionData.visibilityCondition} onValueChange={(value: SectionVisibilityCondition) => setSectionData(prev => ({ ...prev, visibilityCondition: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityConditions.map(condition => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isCollapsible"
                checked={sectionData.isCollapsible}
                onChange={(e) => setSectionData(prev => ({ ...prev, isCollapsible: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isCollapsible">Katlanabilir</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isExpanded"
                checked={sectionData.isExpanded}
                onChange={(e) => setSectionData(prev => ({ ...prev, isExpanded: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isExpanded">Başlangıçta Açık</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="order">Sıralama</Label>
            <Input
              id="order"
              type="number"
              value={sectionData.order}
              onChange={(e) => setSectionData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              İptal
            </Button>
            <Button type="submit">
              Section Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const LaunchFormDesigner: React.FC<{ templateId: string; refreshForm?: () => void }> = ({ templateId, refreshForm }) => {
  const [formFields, setFormFields] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [displayConditions, setDisplayConditions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [newField, setNewField] = useState<any>(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ name: '', description: '', columns: [{ name: '', type: 'text', required: false }] });
  const [workflowSchema, setWorkflowSchema] = useState<any>(null);

  const doRefreshForm = () => {
    setLoading(true);
    
    // Template verilerini yükle
    fetch(`/api/workflow-templates/${templateId}`)
      .then(res => res.json())
      .then(data => {
        setFormFields(data.formFields || []);
        setLayout(data.launchFormLayout || null);
        const dc: Record<string, any> = {};
        (data.formFields || []).forEach((f: any) => {
          if (f.displayConditions && f.displayConditions.length > 0) {
            dc[f.id] = f.displayConditions[0];
          }
        });
        setDisplayConditions(dc);
        setWorkflowSchema(data.workflowSchema || null);
      })
      .catch(() => {
        setFormFields([]);
        setLayout(null);
        setDisplayConditions({});
        setWorkflowSchema(null);
      });

    // Sections'ları yükle
    fetch(`/api/workflow-templates/${templateId}/sections`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.sections)) {
          setSections(data.sections);
        } else {
          setSections([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setSections([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!templateId) return;
    doRefreshForm();
  }, [templateId]);

  const handleAddField = async (field: any) => {
    try {
      const response = await fetch(`/api/workflow-templates/${templateId}/form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: field.name,
          type: String(field.type).toUpperCase(),
          required: !!field.required,
          description: field.description,
          options: field.options || [],
          sectionId: selectedSectionId || undefined
        })
      });
      const result = await response.json();
      if (result && result.success) {
        setIsAddFieldModalOpen(false);
        setLoading(true);
        doRefreshForm();
      } else {
        alert(result.message || 'Alan eklenirken bir hata oluştu.');
      }
    } catch (e) {
      alert('Sunucuya ulaşılamadı veya beklenmeyen bir hata oluştu.');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflow-templates/${templateId}/form-fields/${fieldId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result && result.success) {
        doRefreshForm();
      } else {
        alert(result.message || 'Soru silinirken bir hata oluştu.');
      }
    } catch (e) {
      alert('Sunucuya ulaşılamadı veya beklenmeyen bir hata oluştu.');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Bu section\'ı silmek istediğinizden emin misiniz? Section içindeki tüm sorular da silinecektir.')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflow-templates/${templateId}/sections/${sectionId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result && result.success) {
        doRefreshForm();
      } else {
        alert(result.message || 'Section silinirken bir hata oluştu.');
      }
    } catch (e) {
      alert('Sunucuya ulaşılamadı veya beklenmeyen bir hata oluştu.');
    }
  };

  const openAddQuestionModalForSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setIsAddFieldModalOpen(true);
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen py-12">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 mb-12 flex flex-col gap-2 transition-all hover:shadow-3xl hover:-translate-y-1">
          <h2 className="text-2xl font-bold mb-1 text-gray-900 text-center">Başlatma Formu Tasarımcısı</h2>
          <p className="text-gray-500 mb-0 text-center text-base">
            Forma alan eklemek için soldaki <b>"Attributes"</b> panelini kullanın.
          </p>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8 shadow-lg divide-y divide-gray-100">
          {loading ? (
            <div className="text-center text-gray-400">Yükleniyor...</div>
          ) : (
            <>
              <AddFieldModal
                templateId={templateId}
                onFieldAdded={() => {
                  setSelectedSectionId(null);
                  refreshForm?.();
                }}
                sectionId={selectedSectionId || undefined}
                isOpen={isAddFieldModalOpen}
                setIsOpen={setIsAddFieldModalOpen}
              />
              <LaunchFormRenderer 
                formFields={formFields} 
                layout={layout} 
                displayConditions={displayConditions} 
                onDeleteField={handleDeleteField} 
                onDeleteSection={handleDeleteSection}
                sections={sections}
                onAddQuestionToSection={openAddQuestionModalForSection}
              />
              <div className="flex gap-4 justify-center mt-12">
                <button
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-3 rounded-md shadow-xs text-sm transition-all focus:ring-2 focus:ring-green-200 min-h-0 min-w-0"
                  onClick={() => setIsAddFieldModalOpen(true)}
                  type="button"
                >
                  <span className="text-base">✚</span> Add question to form
                </button>
                <button
                  className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-md border border-gray-200 shadow-xs text-sm transition-all focus:ring-2 focus:ring-blue-100 min-h-0 min-w-0"
                  onClick={() => setIsAddSectionModalOpen(true)}
                  type="button"
                >
                  <span className="text-base">➕</span> Add section to form
                </button>
                <button
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-md shadow-xs text-sm transition-all focus:ring-2 focus:ring-blue-200 min-h-0 min-w-0"
                  onClick={() => setIsAddTableModalOpen(true)}
                  type="button"
                >
                  <span className="text-base">📋</span> Add table to form
                </button>
              </div>
              {/* Section Modal */}
              {isAddSectionModalOpen && (
                <AddSectionModal
                  templateId={templateId}
                  onSectionAdded={() => {
                    setIsAddSectionModalOpen(false);
                    doRefreshForm();
                  }}
                  isOpen={isAddSectionModalOpen}
                  setIsOpen={setIsAddSectionModalOpen}
                />
              )}
              {/* Table Modal */}
              {isAddTableModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
                    <h3 className="text-lg font-bold mb-4">Add Table</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Table Name</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={tableForm.name}
                        onChange={e => setTableForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Payment Schedule"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Table Description <span className="text-xs text-gray-400">(optional)</span></label>
                      <textarea
                        className="w-full border rounded px-3 py-2"
                        value={tableForm.description}
                        onChange={e => setTableForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe this table..."
                        rows={2}
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Columns</label>
                      {tableForm.columns.map((col, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 items-center">
                          <input
                            type="text"
                            className="border rounded px-2 py-1 flex-1"
                            value={col.name}
                            onChange={e => setTableForm(f => {
                              const cols = [...f.columns];
                              cols[idx].name = e.target.value;
                              return { ...f, columns: cols };
                            })}
                            placeholder={`Column ${idx + 1} name`}
                            required
                          />
                          <select
                            className="border rounded px-2 py-1"
                            value={col.type}
                            onChange={e => setTableForm(f => {
                              const cols = [...f.columns];
                              cols[idx].type = e.target.value;
                              return { ...f, columns: cols };
                            })}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={col.required}
                              onChange={e => setTableForm(f => {
                                const cols = [...f.columns];
                                cols[idx].required = e.target.checked;
                                return { ...f, columns: cols };
                              })}
                            />
                            Required
                          </label>
                          <button
                            className="text-red-500 hover:text-red-700 text-xs"
                            onClick={() => setTableForm(f => ({ ...f, columns: f.columns.filter((_, i) => i !== idx) }))}
                            type="button"
                            disabled={tableForm.columns.length === 1}
                          >Remove</button>
                        </div>
                      ))}
                      <button
                        className="mt-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs"
                        onClick={() => setTableForm(f => ({ ...f, columns: [...f.columns, { name: '', type: 'text', required: false }] }))}
                        type="button"
                      >+ Add Column</button>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                        onClick={() => setIsAddTableModalOpen(false)}
                        type="button"
                      >Cancel</button>
                      <button
                        className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
                        onClick={async () => {
                          const result = await addFormFieldToTemplate({
                            templateId,
                            name: tableForm.name,
                            type: 'TABLE',
                            required: false,
                            options: tableForm.columns
                          });
                          if (result.success) {
                            setIsAddTableModalOpen(false);
                            setTableForm({ name: '', description: '', columns: [{ name: '', type: 'text', required: false }] });
                            setTimeout(() => setFormFields([]), 100);
                          }
                        }}
                        type="button"
                        disabled={!tableForm.name.trim() || tableForm.columns.some(c => !c.name.trim())}
                      >Add Table</button>
                    </div>
                  </div>
                </div>
              )}
              <PropertiesAndConditions
                schema={workflowSchema}
                onSchemaChange={setWorkflowSchema}
                templateId={templateId}
                refreshForm={doRefreshForm}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaunchFormDesigner; 