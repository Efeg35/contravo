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

interface AddFieldModalProps {
  templateId: string;
  onFieldAdded: () => void;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({ templateId, onFieldAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
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
    options: [] as string[]
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
          options: fieldData.options.length > 0 ? fieldData.options : undefined
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
          options: []
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
        <Button variant="outline" size="sm">+ Add question to form</Button>
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

export const LaunchFormDesigner: React.FC<{ templateId: string; refreshForm?: () => void }> = ({ templateId, refreshForm }) => {
  const [formFields, setFormFields] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>(null);
  const [displayConditions, setDisplayConditions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newField, setNewField] = useState<any>(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ name: '', description: '', columns: [{ name: '', type: 'text', required: false }] });
  const [workflowSchema, setWorkflowSchema] = useState<any>(null);

  const doRefreshForm = () => {
    setLoading(true);
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
        setLoading(false);
      })
      .catch(() => {
        setFormFields([]);
        setLayout(null);
        setDisplayConditions({});
        setWorkflowSchema(null);
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
          options: field.options || []
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Launch Form</h3>
        <AddFieldModal templateId={templateId} onFieldAdded={() => refreshForm?.()} />
      </div>
      <div className="w-full max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Başlatma Formu Tasarımcısı</h2>
        <p className="text-gray-600 mb-8 text-center">
          Forma alan eklemek için soldaki <b>"Attributes"</b> panelini kullanın.
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-[200px] bg-white p-4">
          {loading ? (
            <div className="text-center text-gray-400">Yükleniyor...</div>
          ) : (
            <>
              <LaunchFormRenderer formFields={formFields} layout={layout} displayConditions={displayConditions} />
              <div className="flex gap-4 justify-center mt-8">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded shadow"
                  onClick={() => setIsAddSectionModalOpen(true)}
                  type="button"
                >
                  Add section to form
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
                  onClick={() => setIsAddTableModalOpen(true)}
                  type="button"
                >
                  Add table to form
                </button>
              </div>
              <PropertyEditorModal
                isOpen={isAddFieldModalOpen}
                onClose={() => setIsAddFieldModalOpen(false)}
                onSave={handleAddField}
                property={newField}
              />
              {/* Section Modal */}
              {isAddSectionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">Add Section</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Section Name</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={sectionForm.name}
                        onChange={e => setSectionForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Counterparty Information"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-1">Section Description <span className="text-xs text-gray-400">(optional)</span></label>
                      <textarea
                        className="w-full border rounded px-3 py-2"
                        value={sectionForm.description}
                        onChange={e => setSectionForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe this section..."
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                        onClick={() => setIsAddSectionModalOpen(false)}
                        type="button"
                      >Cancel</button>
                      <button
                        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        onClick={async () => {
                          const result = await addSectionToLaunchForm({
                            templateId,
                            name: sectionForm.name,
                            description: sectionForm.description
                          });
                          if (result.success) {
                            setIsAddSectionModalOpen(false);
                            setSectionForm({ name: '', description: '' });
                            setTimeout(() => setFormFields([]), 100);
                          }
                        }}
                        type="button"
                        disabled={!sectionForm.name.trim()}
                      >Add Section</button>
                    </div>
                  </div>
                </div>
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