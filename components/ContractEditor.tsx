'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { 
  Plus, 
  BookOpen, 
  Search,
  Filter,
  Copy,
  Eye,
  Edit,
  Save,
  FileText,
  Lightbulb,
  ChevronRight,
  X,
  Check
} from 'lucide-react';

// Types
interface Clause {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  visibility: string;
  variables: ClauseVariable[];
  usageCount: number;
}

interface ClauseVariable {
  id: string;
  name: string;
  label: string;
  type: string;
  defaultValue?: string;
  isRequired: boolean;
  description?: string;
}

interface ContractEditorProps {
  contractId?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  className?: string;
  isEditable?: boolean;
}

// Category labels in Turkish
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

const ContractEditor: React.FC<ContractEditorProps> = ({
  contractId,
  initialContent = '',
  onSave,
  className,
  isEditable = true
}) => {
  // Editor state
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  
  // Clause library state
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [filteredClauses, setFilteredClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showClauseLibrary, setShowClauseLibrary] = useState(false);
  
  // Variable filling state
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showVariableModal, setShowVariableModal] = useState(false);

  // Fetch clauses
  const fetchClauses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clauses');
      const data = await response.json();
      
      if (response.ok) {
        setClauses(data.clauses || []);
        setFilteredClauses(data.clauses || []);
      }
    } catch (error) {
      console.error('Clause listesi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter clauses
  useEffect(() => {
    let filtered = clauses;
    
    if (searchTerm) {
      filtered = filtered.filter(clause =>
        clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clause.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clause.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(clause => clause.category === selectedCategory);
    }
    
    setFilteredClauses(filtered);
  }, [clauses, searchTerm, selectedCategory]);

  // Load clauses when clause library is opened
  useEffect(() => {
    if (showClauseLibrary && clauses.length === 0) {
      fetchClauses();
    }
  }, [showClauseLibrary, clauses.length, fetchClauses]);

  // Handle clause selection
  const handleClauseSelect = (clause: Clause) => {
    if (clause.variables.length > 0) {
      // Show variable filling modal
      setSelectedClause(clause);
      const initialValues: Record<string, string> = {};
      clause.variables.forEach(variable => {
        initialValues[variable.name] = variable.defaultValue || '';
      });
      setVariableValues(initialValues);
      setShowVariableModal(true);
    } else {
      // Insert clause directly
      insertClause(clause, {});
    }
  };

  // Insert clause into editor
  const insertClause = (clause: Clause, values: Record<string, string>) => {
    let clauseContent = clause.content;
    
    // Replace variables with values
    clause.variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      const value = values[variable.name] || variable.defaultValue || `[${variable.label}]`;
      clauseContent = clauseContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Insert at cursor position or append
    const cursorPosition = content.length;
    const newContent = content.slice(0, cursorPosition) + '\n\n' + clauseContent + '\n\n' + content.slice(cursorPosition);
    setContent(newContent);
    
    // Close modals
    setShowVariableModal(false);
    setShowClauseLibrary(false);
    setSelectedClause(null);
  };

  // Handle variable modal submit
  const handleVariableSubmit = () => {
    if (selectedClause) {
      insertClause(selectedClause, variableValues);
    }
  };

  // Save content
  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(content);
        toast.success('Sözleşme içeriği başarıyla kaydedildi!');
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Sözleşme Editörü</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditable && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowClauseLibrary(!showClauseLibrary)}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Smart Clauses
              </Button>
              
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Kaydet
              </Button>
            </>
          )}
          
          {!isEditable && (
            <div className="flex items-center gap-2 text-gray-500">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Salt Okunur</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Editor */}
        <div className={showClauseLibrary ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sözleşme İçeriği
                {!isEditable && (
                  <Badge variant="secondary" className="text-xs">
                    Salt Okunur
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isEditable 
                  ? "Sözleşme metnini yazın veya Smart Clauses'dan hazır maddeler ekleyin"
                  : "Bu sözleşme imzalanmış olduğu için içeriği değiştirilemez"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={isEditable ? (e) => setContent(e.target.value) : undefined}
                placeholder={isEditable ? "Sözleşme içeriğinizi buraya yazın..." : "Bu sözleşme imzalanmış olduğu için düzenlenemez"}
                rows={20}
                className={`min-h-[500px] font-mono text-sm ${!isEditable ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : ''}`}
                readOnly={!isEditable}
                disabled={!isEditable}
              />
            </CardContent>
          </Card>
        </div>

        {/* Clause Library Sidebar */}
        {showClauseLibrary && isEditable && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Smart Clauses
                </CardTitle>
                <CardDescription>
                  Hazır clause'ları seçin ve ekleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Clause ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clause List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Yükleniyor...</p>
                    </div>
                  ) : filteredClauses.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Clause bulunamadı</p>
                    </div>
                  ) : (
                    filteredClauses.map((clause) => (
                      <div
                        key={clause.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleClauseSelect(clause)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{clause.title}</h4>
                            {clause.description && (
                              <p className="text-xs text-gray-600 mt-1">{clause.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {categoryLabels[clause.category] || clause.category}
                              </Badge>
                              {clause.variables.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {clause.variables.length} değişken
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Variable Filling Modal */}
      {showVariableModal && selectedClause && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Değişkenleri Doldurun</CardTitle>
                  <CardDescription>
                    "{selectedClause.title}" clause'u için değişken değerlerini girin
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVariableModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedClause.variables.map((variable) => (
                <div key={variable.id}>
                  <Label htmlFor={variable.name}>
                    {variable.label}
                    {variable.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id={variable.name}
                    value={variableValues[variable.name] || ''}
                    onChange={(e) => setVariableValues({
                      ...variableValues,
                      [variable.name]: e.target.value
                    })}
                    placeholder={variable.defaultValue || `${variable.label} girin`}
                  />
                  {variable.description && (
                    <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                  )}
                </div>
              ))}
              
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVariableModal(false)}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  onClick={handleVariableSubmit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Clause'u Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContractEditor; 