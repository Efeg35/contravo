"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronLeft, FileText, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateUploader } from "@/components/upload/TemplateUploader";
import DocxPreviewer from "./DocxPreviewer";
import type { WorkflowTemplate as PrismaWorkflowTemplate } from "@prisma/client";
import { useRouter } from "next/navigation";
import { PropertiesAndConditions } from "@/components/workflow/PropertiesAndConditions";
import { DEFAULT_WORKFLOW_SCHEMA } from "@/lib/workflow-defaults";
import { WorkflowSchema } from "@/types/workflow";
import { LaunchFormDesigner } from '@/components/workflow/LaunchFormDesigner';
import DocumentEditor from '@/components/workflow/DocumentEditor';
import type { DocumentEditorProperty } from '@/components/workflow/DocumentEditor';
import PaperSourceSelector from '@/components/workflow/PaperSourceSelector';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type WorkflowTemplateWithFields = PrismaWorkflowTemplate & { 
  formFields?: any[];
  documentHtml?: string | null;
};

export const WorkflowEditorClient = ({ initialTemplate }: { initialTemplate: WorkflowTemplateWithFields }) => {
    const [selectedPaperSource, setSelectedPaperSource] = useState<'company' | 'counterparty' | null>(null);
    const workflowSteps = ["Document", "Create", "Review", "Sign", "Archive"];
    const [isPending, startTransition] = useTransition();
    const [currentTemplate, setCurrentTemplate] = useState<WorkflowTemplateWithFields>(initialTemplate);
    const [workflowSchema, setWorkflowSchema] = useState<WorkflowSchema>(DEFAULT_WORKFLOW_SCHEMA);
    const router = useRouter();
    const [activeStep, setActiveStep] = useState("Document");
    const [editorHtml, setEditorHtml] = useState<string>(currentTemplate.documentHtml || "");
    const [showPreview, setShowPreview] = useState(false);
    const [editorMode, setEditorMode] = useState<'tag' | 'edit'>('tag');
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [formDataForGeneration, setFormDataForGeneration] = useState<Record<string, any>>({});

    useEffect(() => {
        if(currentTemplate.templateFileUrl) {
            setSelectedPaperSource('company');
        }
    }, [currentTemplate.templateFileUrl]);

    // Template'den gelen property groups'ları yükle
    useEffect(() => {
        if (currentTemplate.launchFormLayout) {
            const layout = currentTemplate.launchFormLayout as any;
            if (layout.propertyGroups && Array.isArray(layout.propertyGroups)) {
                setWorkflowSchema(prevSchema => ({
                    ...prevSchema,
                    propertyGroups: layout.propertyGroups,
                    conditions: layout.conditions || prevSchema.conditions
                }));
            }
        }
    }, [currentTemplate.launchFormLayout]);

    // currentTemplate.documentHtml değiştiğinde editör içeriğini güncelle
    useEffect(() => {
        setEditorHtml(currentTemplate.documentHtml || "");
    }, [currentTemplate.documentHtml]);

    const handleSave = async () => {
        startTransition(async () => {
            try {
                // Sadece mevcut template güncellemesi
                if (currentTemplate.id !== 'new') {
                    const response = await fetch(`/api/workflow-templates/${currentTemplate.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: currentTemplate.name,
                            description: currentTemplate.description
                        })
                    });
                    if (response.ok) {
                        alert('Workflow başarıyla güncellendi!');
                    }
                }
            } catch (error) {
                console.error('Save error:', error);
                alert('Kaydetme sırasında hata oluştu!');
            }
        });
    };

    const handleGoBack = () => {
        router.push('/dashboard/admin/workflows');
    };

    // formFields'tan property listesi oluştur
    const formFieldProperties: DocumentEditorProperty[] = (currentTemplate.formFields || []).map((f: any) => ({
        id: f.apiKey || f.id,
        label: f.label,
        description: f.helpText || '',
        fieldId: f.id,
        type: f.type,
        required: f.isRequired,
    }));

    // Workflow schema'daki properties'leri de ekle
    const schemaProperties: DocumentEditorProperty[] = workflowSchema.propertyGroups.flatMap(group =>
        group.properties.map(prop => ({
            id: prop.id,
            label: prop.name,
            description: prop.description || '',
            type: prop.type,
            required: prop.required || false,
        }))
    );

    // İki listeyi birleştir ve unique hale getir
    const allProperties = [...formFieldProperties, ...schemaProperties];
    const propertyList = allProperties.filter((prop, index, self) => 
        index === self.findIndex(p => p.id === prop.id)
    );

    // Debug için properties'leri logla
    console.log('DEBUG - currentTemplate.formFields:', currentTemplate.formFields);
    console.log('DEBUG - formFieldProperties:', formFieldProperties);
    console.log('DEBUG - schemaProperties:', schemaProperties);
    console.log('DEBUG - final propertyList:', propertyList);

    // Save butonuna basınca doküman HTML'ini ve property/tag id'lerini backend'e kaydet
    const handleDocumentSave = async () => {
        if (!currentTemplate.id || currentTemplate.id === 'new') return;
        // Property/tag id'lerini HTML'den çıkar
        const parser = new DOMParser();
        const doc = parser.parseFromString(editorHtml, 'text/html');
        const propertyTags = Array.from(doc.querySelectorAll('[data-property-tag]'));
        const propertyIds = propertyTags.map(el => el.getAttribute('id')).filter(Boolean);
        startTransition(async () => {
            try {
                const response = await fetch(`/api/workflow-templates/${currentTemplate.id}/document`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documentHtml: editorHtml, documentProperties: propertyIds })
                });
                if (response.ok) {
                    const updated = await response.json();
                    setCurrentTemplate((prev) => ({ ...prev, ...updated }));
                    alert('Doküman başarıyla kaydedildi!');
                } else {
                    alert('Doküman kaydedilirken hata oluştu!');
                }
            } catch (error) {
                alert('Doküman kaydedilirken hata oluştu!');
            }
        });
    };

    // Create sekmesindeki form data'sını almak için function
    const handleGeneratePreview = () => {
        // Form data boşsa sample data kullan
        const dataToUse = Object.keys(formDataForGeneration).length > 0 
            ? formDataForGeneration 
            : {
                'counterparty-name': 'ABC Şirketi Ltd.',
                'contract-owner': 'Ali Veli',
                'effective-date': '2025-01-01',
                'expiration-date': '2025-12-31',
                'Counterparty Name': 'ABC Şirketi Ltd.',
                'Contract Owner': 'Ali Veli',
                'Effective Date': '2025-01-01',
                'Expiration Date': '2025-12-31'
            };
        
        const generatedHtml = generateDocumentFromFormData(editorHtml, dataToUse);
        setPreviewHtml(generatedHtml);
        setShowPreview(true);
    };

    // Client-side document generation function
    const generateDocumentFromFormData = (documentHtml: string, formData: Record<string, any>): string => {
        if (!documentHtml) return '';
        
        let generatedHtml = documentHtml;
        
        // Property tag'leri bulup replace et
        // Pattern: <span data-property-tag="true" id="propertyId">PropertyLabel</span>
        const propertyTagRegex = /<span[^>]*data-property-tag="true"[^>]*id="([^"]*)"[^>]*>([^<]*)<\/span>/g;
        
        generatedHtml = generatedHtml.replace(propertyTagRegex, (match, propertyId, propertyLabel) => {
            // Form data'da bu property'nin value'sunu ara
            const value = formData[propertyId] || formData[propertyLabel] || formData[propertyLabel.toLowerCase()];
            
            if (value !== undefined && value !== null && value !== '') {
                // Value'yu uygun formatta döndür
                let formattedValue = formatPropertyValue(value, propertyId);
                
                // Property tag'i gerçek value ile replace et
                return `<span class="generated-property" data-original-property="${propertyId}" style="background: #e1f5fe; padding: 2px 6px; border-radius: 4px; font-weight: 500; color: #0d47a1;">${formattedValue}</span>`;
            } else {
                // Value yoksa placeholder göster
                return `<span class="missing-property" data-property="${propertyId}" style="background: #ffebee; padding: 2px 6px; border-radius: 4px; border: 1px dashed #f44336; color: #c62828;">[${propertyLabel} - Değer Girilmemiş]</span>`;
            }
        });
        
        return generatedHtml;
    };

    // Property value'sunu uygun formatta döndüren function
    const formatPropertyValue = (value: any, propertyId: string): string => {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        
        if (typeof value === 'object' && value !== null) {
            // Date object ise
            if (value instanceof Date) {
                return value.toLocaleDateString('tr-TR');
            }
            // Object ise JSON'a çevir
            return JSON.stringify(value);
        }
        
        // Boolean ise
        if (typeof value === 'boolean') {
            return value ? 'Evet' : 'Hayır';
        }
        
        // Number ise ve para formatı gibiyse
        if (typeof value === 'number' && propertyId.toLowerCase().includes('tutar')) {
            return new Intl.NumberFormat('tr-TR', { 
                style: 'currency', 
                currency: 'TRY' 
            }).format(value);
        }
        
        return String(value);
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handleGoBack}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">{initialTemplate.name || 'Untitled workflow configuration'}</h1>
                    <Badge variant="outline" className="font-normal">Unpublished</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleGeneratePreview}>Generate Document</Button>
                    <Button variant="outline" disabled={isPending} onClick={handleSave}>
                        {isPending ? "Kaydediliyor..." : "Save"}
                    </Button>
                    <Button disabled={isPending}>Publish</Button>
                </div>
            </header>

            {/* Stepper */}
            <nav className="flex items-center justify-center border-b bg-white shadow-sm">
                {workflowSteps.map((step) => (
                    <button
                        key={step}
                        className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 focus:outline-none transition-colors ${activeStep === step ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        onClick={() => setActiveStep(step)}
                        type="button"
                    >
                        {step}
                    </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Attributes Panel */}
                <PropertiesAndConditions 
                    schema={workflowSchema}
                    onSchemaChange={setWorkflowSchema}
                    isEditable={true}
                    templateId={currentTemplate.id}
                />

                {/* Right Panel */}
                <section className="flex-1 flex flex-col items-center bg-gray-100 p-6 overflow-y-auto">
                    {activeStep === "Document" && (
                        currentTemplate.documentHtml ? (
                            <div className="w-full max-w-4xl mx-auto">
                                <div className="flex items-center justify-between bg-white p-3 rounded-t-lg border-b border-gray-200">
                                  <h2 className="text-base font-medium text-gray-700">{currentTemplate.documentName}</h2>
                                  <div className="flex items-center space-x-1 border border-gray-200 rounded-md p-0.5">
                                       <Button
                                          variant={editorMode === 'tag' ? 'secondary' : 'ghost'}
                                          size="sm"
                                          onClick={() => setEditorMode('tag')}
                                          className="px-3 py-1 text-xs h-7"
                                       >
                                          Tag
                                       </Button>
                                       <Button
                                           variant={editorMode === 'edit' ? 'secondary' : 'ghost'}
                                           size="sm"
                                           onClick={() => setEditorMode('edit')}
                                           className="px-3 py-1 text-xs h-7"
                                       >
                                          Edit
                                       </Button>
                                  </div>
                                </div>
                                <div className="bg-white p-2">
                                  <DocumentEditor
                                    mode={editorMode}
                                    properties={propertyList}
                                    value={editorHtml}
                                    onChange={setEditorHtml}
                                    onSave={handleDocumentSave}
                                    onPreview={handleGeneratePreview}
                                    templateId={currentTemplate.id}
                                  />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-2xl">
                              <PaperSourceSelector
                                onSave={async (source, file) => {
                                  startTransition(async () => {
                                    // Dosya upload işlemi
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('source', source);
                                    const res = await fetch(`/api/workflow-templates/${currentTemplate.id}/document`, {
                                      method: 'POST',
                                      body: formData
                                    });
                                    if (res.ok) {
                                      const updated = await res.json();
                                      if (currentTemplate.id === 'new') {
                                        router.push(`/dashboard/admin/workflows/${updated.id}`);
                                      } else {
                                        setCurrentTemplate((prev) => ({ ...prev, ...updated }));
                                      }
                                    } else {
                                      alert('Dosya yüklenirken hata oluştu!');
                                    }
                                  });
                                }}
                              />
                            </div>
                        )
                    )}
                    {activeStep === "Create" && (
                        <div className="w-full max-w-4xl mx-auto space-y-6">
                            <LaunchFormDesigner templateId={currentTemplate.id} />
                        </div>
                    )}
                </section>
            </main>

            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl w-full">
                    <DialogTitle className="text-xl font-bold mb-4">Doküman Önizleme</DialogTitle>
                    <div className="prose max-w-none max-h-[70vh] overflow-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    <div className="flex justify-end mt-6">
                        <Button variant="outline" onClick={() => setShowPreview(false)}>Kapat</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}; 