"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { ChevronLeft, FileText, ClipboardCopy, RefreshCw } from "lucide-react";
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
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import PropertyTag from "@/components/workflow/PropertyTag";
import { DocumentToolbar } from "@/components/workflow/DocumentToolbar";
import { ConditionBuilder, Condition } from '@/components/workflow/ConditionBuilder';
import { MultiUserAutocomplete } from '@/components/ui/MultiUserAutocomplete';
import toast from 'react-hot-toast';

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
    const [editorHtml, setEditorHtml] = useState<string>(initialTemplate.documentHtml || "");
    const [showPreview, setShowPreview] = useState(false);
    const [editorMode, setEditorMode] = useState<'tag' | 'edit'>('edit');
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [formDataForGeneration, setFormDataForGeneration] = useState<Record<string, any>>({});
    const [zoomLevel, setZoomLevel] = useState(100);
    const [reviewTab, setReviewTab] = useState('Approvers');
    const [approversInOrder, setApproversInOrder] = useState(true);
    const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
    const [showAdvancedModal, setShowAdvancedModal] = useState<number | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    // Approvers sekmesi için state
    type UserType = { id: string; name: string; email: string; type?: 'user' | 'role' | 'group' };
    type ApproverType = {
        id: number;
        title: string;
        instructions: string;
        showInstructions: boolean;
        whenToApprove: string;
        whenToApproveConditions: Condition[];
        resetWhen: string;
        resetWhenConditions: Condition[];
        whoCanApprove: UserType[];
        advancedConditions: Condition[];
        assignmentType: string;
        key: number;
    };
    const [approvers, setApprovers] = useState<ApproverType[]>([
        { id: 1, title: 'Legal', instructions: '', showInstructions: false, whenToApprove: 'Always', whenToApproveConditions: [], resetWhen: 'Always', resetWhenConditions: [], whoCanApprove: [], advancedConditions: [], assignmentType: '', key: Math.random() },
    ]);

    const handleZoomChange = (value: string) => {
      setZoomLevel(parseInt(value, 10));
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // StarterKit'teki liste extensions'larını devre dışı bırak ki kendimiz kontrol edelim
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            // Liste extensions'larını manuel olarak yapılandır
            BulletList.configure({
                HTMLAttributes: {
                    class: 'ironclad-bullet-list',
                },
            }),
            OrderedList.configure({
                HTMLAttributes: {
                    class: 'ironclad-ordered-list',
                },
            }),
            ListItem.configure({
                HTMLAttributes: {
                    class: 'ironclad-list-item',
                },
            }),
            Underline,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Table, TableRow, TableCell, TableHeader,
            Link.configure({ openOnClick: false }),
            Highlight,
            Placeholder.configure({
                placeholder: "Sözleşme metninizi buraya yazın veya property ekleyin...",
            }),
            PropertyTag,
        ],
        content: editorHtml,
        onUpdate: ({ editor }) => {
            setEditorHtml(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class:
                    "prose font-serif leading-relaxed max-w-none min-h-[400px] focus:outline-none",
            },
        },
    });

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

    useEffect(() => {
        if (editor) {
            editor.setEditable(editorMode === 'edit');
        }
    }, [editorMode, editor]);

    // Backend'den adımları çek
    useEffect(() => {
        if (!currentTemplate.id || currentTemplate.id === 'new') return;
        fetch(`/api/admin/workflow-templates/${currentTemplate.id}/steps`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setApprovers(data.map((step: any, idx: number) => ({
                        id: idx + 1,
                        title: step.title || step.approverRole || step.team?.name || `Approver ${idx + 1}`,
                        instructions: step.instructions || '',
                        showInstructions: !!step.instructions,
                        whenToApprove: step.whenToApprove || 'Always',
                        whenToApproveConditions: step.whenToApproveConditions || [],
                        resetWhen: step.resetWhen || 'Always',
                        resetWhenConditions: step.resetWhenConditions || [],
                        whoCanApprove: step.whoCanApprove || [],
                        advancedConditions: step.advancedConditions || [],
                        assignmentType: step.assignmentType || '',
                        key: Math.random(),
                    })));
                }
            });
    }, [currentTemplate.id]);

    // Approvers'ı backend'e kaydet
    const handleSaveApprovers = async () => {
        if (!currentTemplate.id || currentTemplate.id === 'new') return;
        try {
            const payload = approvers.map((a, idx) => ({
                order: idx + 1,
                title: a.title,
                instructions: a.instructions,
                whenToApprove: a.whenToApprove,
                whenToApproveConditions: a.whenToApproveConditions,
                resetWhen: a.resetWhen,
                resetWhenConditions: a.resetWhenConditions,
                whoCanApprove: a.whoCanApprove,
                advancedConditions: a.advancedConditions,
                assignmentType: a.assignmentType,
            }));
            const res = await fetch(`/api/admin/workflow-templates/${currentTemplate.id}/steps`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ steps: payload })
            });
            if (res.ok) {
                toast.success('Onaycılar başarıyla kaydedildi!');
            } else {
                toast.error('Onaycılar kaydedilemedi!');
            }
        } catch (e) {
            toast.error('Sunucu hatası!');
        }
    };

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

    const DROPDOWN_OPTIONS = [
        "Always",
        "Renewal Type is Auto-Renew",
        "Renewal Type is Auto-Renew OR Optional Extension",
        "Renewal Type is None",
        "Renewal Type is not Evergreen",
        "Renewal Type is Optional Extension",
        "Renewal Type is Other"
    ];
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedDropdown, setSelectedDropdown] = useState(DROPDOWN_OPTIONS[0]);

    // Onaycı silme fonksiyonu
    const removeApprover = (id: number) => {
        setApprovers(prev => prev.filter(a => a.id !== id));
    };
    // Onaycı kopyalama
    const copyApprover = (idx: number) => {
        setApprovers(prev => {
            const copy = { ...prev[idx], id: Date.now(), key: Math.random() };
            return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
        });
    };
    // Onaycıyı yukarı/ aşağı taşıma
    const moveApprover = (from: number, to: number) => {
        setApprovers(prev => {
            const arr = [...prev];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return arr;
        });
    };
    // Başlık güncelleme
    const updateTitle = (id: number, value: string) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, title: value } : a));
    };
    // Instructions toggle
    const toggleInstructions = (id: number) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, showInstructions: !a.showInstructions } : a));
    };
    // Instructions güncelleme
    const updateInstructions = (id: number, value: string) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, instructions: value } : a));
    };
    // When to approve/reset güncelleme
    const updateWhen = (id: number, field: 'whenToApprove' | 'resetWhen', value: string) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };
    // Who can approve güncelleme
    const updateWho = (id: number, users: UserType[]) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, whoCanApprove: users } : a));
    };
    // Assignment type güncelleme
    const updateAssignment = (id: number, value: string) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, assignmentType: value } : a));
    };
    // Condition güncelleyiciler
    const updateWhenToApproveConditions = (id: number, conds: Condition[]) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, whenToApproveConditions: conds } : a));
    };
    const updateResetWhenConditions = (id: number, conds: Condition[]) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, resetWhenConditions: conds } : a));
    };
    const updateAdvancedConditions = (id: number, conds: Condition[]) => {
        setApprovers(prev => prev.map(a => a.id === id ? { ...a, advancedConditions: conds } : a));
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
                    <Button variant="outline" disabled={isPending} onClick={handleSaveApprovers}>
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
                <section className="flex-1 flex flex-col items-start bg-gray-100">
                    {activeStep === "Document" && (
                        currentTemplate.documentHtml ? (
                            <>
                                {/* Başlık Barı: Tam genişlik, sticky, gri fon */}
                                <div className="bg-gray-100 w-full px-8 pt-4 pb-2 flex justify-between items-center border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">{currentTemplate.documentName}</h2>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={handleGeneratePreview} className="h-9 px-4 text-sm font-medium">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Generate document
                                        </Button>
                                        <div className="relative">
                                            <button
                                                className="h-9 px-3 text-sm font-medium border border-gray-300 bg-white text-gray-700 rounded-none focus:outline-none flex items-center hover:bg-gray-50 min-w-[180px] justify-between"
                                                onClick={() => setDropdownOpen((v) => !v)}
                                                type="button"
                                            >
                                                {selectedDropdown}
                                                <svg className="ml-1 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                            {dropdownOpen && (
                                                <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 shadow-lg z-10 rounded-none">
                                                    {DROPDOWN_OPTIONS.map((option) => (
                                                        <button
                                                            key={option}
                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${selectedDropdown === option ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'}`}
                                                            onClick={() => {
                                                                setSelectedDropdown(option);
                                                                setDropdownOpen(false);
                                                            }}
                                                            type="button"
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* İçerik Container: Scroll edilebilir */}
                                <div className="w-full overflow-y-auto flex-1">
                                    <div className="p-8 pt-2">
                                        {selectedPaperSource && (
                                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                                                {/* Toolbar Alanı */}
                                                <div className="p-2 border-b flex justify-center items-center sticky top-0 bg-white z-10">
                                                    {editor && (
                                                        <DocumentToolbar 
                                                            editor={editor} 
                                                            zoomLevel={zoomLevel} 
                                                            onZoomChange={handleZoomChange}
                                                            editorMode={editorMode}
                                                            onEditorModeChange={setEditorMode}
                                                        />
                                                    )}
                                                </div>

                                                {/* DocumentEditor'ı içeren container */}
                                                <div className="p-4 md:p-8 flex justify-center bg-gray-50/50">
                                                    <DocumentEditor
                                                        editor={editor}
                                                        properties={propertyList}
                                                        templateId={currentTemplate.id}
                                                        zoomLevel={zoomLevel}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full flex justify-center items-center min-h-[500px]">
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
                    {activeStep === "Review" && (
                        <div className="w-full max-w-5xl mx-auto py-8">
                            {/* Ironclad sekme barı */}
                            <div className="flex border-b mb-6">
                                {['Approvers', 'Settings', 'Create Custom Email'].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none ${reviewTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setReviewTab(tab)}
                                        type="button"
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            {/* Approvers sekmesi ana iskeleti */}
                            {reviewTab === 'Approvers' && (
                                <div className="bg-white rounded-lg shadow-sm border p-8 min-h-[400px]">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold">Approvers</h2>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700">Collect approvals in order</span>
                                            <button
                                                type="button"
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${approversInOrder ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                onClick={() => setApproversInOrder(v => !v)}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${approversInOrder ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        {approvers.map((approver, idx) => (
                                            <div key={approver.key} className="border rounded-xl p-6 shadow-sm mb-4 bg-white hover:shadow-md transition-shadow relative group">
                                                {/* Sıra ve başlık */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            {approversInOrder ? 
                                                                (idx === 0 ? '1ST' : 
                                                                 idx === 1 ? '2ND' : 
                                                                 idx === 2 ? '3RD' : 
                                                                 `${idx + 1}TH`) : '•'
                                                            }
                                                        </span>
                                                        {editingTitleId === approver.id ? (
                                                            <input
                                                                className="text-lg font-semibold border-b border-blue-300 focus:outline-none focus:border-blue-600 bg-transparent"
                                                                value={approver.title}
                                                                onChange={e => updateTitle(approver.id, e.target.value)}
                                                                onBlur={() => setEditingTitleId(null)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span className="text-lg font-semibold cursor-pointer hover:underline" onClick={() => setEditingTitleId(approver.id)}>{approver.title}</span>
                                                        )}
                                                    </div>
                                                    {/* Sağ üst ikonlar */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button disabled={idx === 0} onClick={() => moveApprover(idx, idx - 1)} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30" title="Yukarı taşı">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l7 7-1.41 1.41L10 5.83l-5.59 5.58L3 10l7-7z"/></svg>
                                                        </button>
                                                        <button disabled={idx === approvers.length - 1} onClick={() => moveApprover(idx, idx + 1)} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30" title="Aşağı taşı">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l-7-7 1.41-1.41L10 14.17l5.59-5.58L17 10l-7 7z"/></svg>
                                                        </button>
                                                        <button onClick={() => copyApprover(idx)} className="p-1 text-gray-400 hover:text-blue-600" title="Kopyala">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8zM3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L14.586 13H19v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11.586V9a1 1 0 00-1-1H9.414l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 11H15z"/></svg>
                                                        </button>
                                                        <button onClick={() => removeApprover(approver.id)} className="p-1 text-gray-400 hover:text-red-600" title="Sil">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                        </button>
                                                        <button className="p-1 text-gray-400 hover:text-gray-600" title="Daha fazla seçenek">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Instructions toggle ve alanı */}
                                                <div className="mb-2 flex items-center gap-2">
                                                    <button onClick={() => toggleInstructions(approver.id)} className="text-xs text-blue-600 hover:underline">{approver.showInstructions ? 'Hide instructions' : 'Add instructions'}</button>
                                                    {approver.showInstructions && (
                                                        <input
                                                            className="ml-2 flex-1 border-b border-gray-300 focus:outline-none focus:border-blue-600 bg-transparent text-sm"
                                                            placeholder="Instructions..."
                                                            value={approver.instructions}
                                                            onChange={e => updateInstructions(approver.id, e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                                {/* When to approve ve reset alanları */}
                                                <div className="flex gap-8 mb-2">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500 mb-1">When is initial approval required?</label>
                                                        <select value={approver.whenToApprove} onChange={e => updateWhen(approver.id, 'whenToApprove', e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
                                                            <option>Always</option>
                                                            <option>Renewal Type is Auto-Renew</option>
                                                            <option>Renewal Type is Auto-Renew OR Optional Extension</option>
                                                            <option>Renewal Type is None</option>
                                                            <option>Renewal Type is not Evergreen</option>
                                                            <option>Renewal Type is Optional Extension</option>
                                                            <option>Renewal Type is Other</option>
                                                        </select>
                                                        {approver.whenToApprove === 'Condition...' && (
                                                            <div className="mt-2">
                                                                <ConditionBuilder
                                                                    conditions={approver.whenToApproveConditions || []}
                                                                    onChange={conds => updateWhenToApproveConditions(approver.id, conds)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500 mb-1">When should approval be reset?</label>
                                                        <select value={approver.resetWhen} onChange={e => updateWhen(approver.id, 'resetWhen', e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
                                                            <option>Always</option>
                                                            <optgroup label="WORKFLOW PROCESS UPDATES">
                                                                <option>Draft documents update</option>
                                                                <option>Workflow reverts to Review</option>
                                                            </optgroup>
                                                            <optgroup label="FIELD CHANGES">
                                                                <option>Counterparty Name</option>
                                                                <option>Effective Date</option>
                                                                <option>Expiration Date</option>
                                                                <option>Termination Notice Period</option>
                                                                <option>Initial Term Length</option>
                                                            </optgroup>
                                                        </select>
                                                        {approver.resetWhen === 'Condition...' && (
                                                            <div className="mt-2">
                                                                <ConditionBuilder
                                                                    conditions={approver.resetWhenConditions || []}
                                                                    onChange={conds => updateResetWhenConditions(approver.id, conds)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Who can approve autocomplete */}
                                                <div className="mb-4">
                                                    <label className="block text-xs text-gray-500 mb-1">Who can approve</label>
                                                    <MultiUserAutocomplete
                                                        value={approver.whoCanApprove}
                                                        onChange={users => updateWho(approver.id, users)}
                                                        placeholder="Select by user, group, or role name"
                                                    />
                                                    {approver.whoCanApprove.some(u => u.type === 'user') && (
                                                        <div className="mt-2 flex items-center text-xs text-gray-500">
                                                            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                                            Yeni kullanıcıları Contravo'ya davet et
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Atama şekli dropdown */}
                                                <div className="mb-4">
                                                    <div className="flex gap-2 mb-1">
                                                        <label className="block text-xs text-gray-500">How will the approver be assigned?</label>
                                                        {approver.whoCanApprove.length > 0 && (
                                                            <span className="text-xs text-gray-400">
                                                                Assigned to {approver.whoCanApprove[0]?.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <select value={approver.assignmentType} onChange={e => updateAssignment(approver.id, e.target.value)} className="border rounded px-2 py-1 text-sm w-64">
                                                        <option value="">Select</option>
                                                        <option value={`Assigned to ${approver.whoCanApprove[0]?.name || 'user'}`}>
                                                            Assigned to {approver.whoCanApprove[0]?.name || 'user'}
                                                        </option>
                                                        <option value="Self-select">Self-select</option>
                                                        <option value="Round robin">Round robin</option>
                                                    </select>
                                                    {approver.assignmentType && (
                                                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                                            {approver.assignmentType === 'Self-select' && "Users in the selected group/role can self-assign this approval task."}
                                                            {approver.assignmentType === 'Round robin' && "Approval tasks will be automatically distributed among selected users in rotation."}
                                                            {approver.assignmentType.startsWith('Assigned to') && `This approval will be specifically assigned to ${approver.whoCanApprove[0]?.name || 'the selected user'}.`}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Advanced conditions butonu */}
                                                <div className="mb-2">
                                                    <button onClick={() => setShowAdvancedModal(approver.id)} className="text-xs text-blue-600 hover:underline">Add advanced conditions</button>
                                                    {showAdvancedModal === approver.id && (
                                                        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
                                                            <div className="bg-white border rounded shadow-lg p-6 min-w-[350px] relative">
                                                                <div className="mb-2 font-semibold">Advanced Conditions</div>
                                                                <ConditionBuilder
                                                                    conditions={approver.advancedConditions || []}
                                                                    onChange={conds => updateAdvancedConditions(approver.id, conds)}
                                                                />
                                                                <div className="flex gap-2 justify-end mt-4">
                                                                    <button onClick={() => setShowAdvancedModal(null)} className="px-3 py-1 bg-gray-200 rounded">Kapat</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Yeni onaycı ekleme butonu */}
                                    <div className="mt-8 flex gap-4 items-center">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                            onClick={() => setApprovers(prev => [...prev, { id: Date.now(), title: 'Approver', instructions: '', showInstructions: false, whenToApprove: 'Always', whenToApproveConditions: [], resetWhen: 'Always', resetWhenConditions: [], whoCanApprove: [], advancedConditions: [], assignmentType: '', key: Math.random() }])}
                                        >
                                            Add approver
                                        </button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                                            onClick={() => setApprovers(prev => [...prev, { id: Date.now(), title: 'Approver', instructions: '', showInstructions: false, whenToApprove: 'Always', whenToApproveConditions: [], resetWhen: 'Always', resetWhenConditions: [], whoCanApprove: [], advancedConditions: [], assignmentType: '', key: Math.random() }])}
                                        >
                                            Add next approver
                                        </button>
                                        <div className="ml-auto">
                                            <button
                                                type="button"
                                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                                onClick={handleSaveApprovers}
                                                disabled={isPending}
                                            >
                                                {isPending ? 'Saving...' : 'Save Approvers'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Settings sekmesi placeholder */}
                            {reviewTab === 'Settings' && (
                                <div className="bg-white rounded-lg shadow-sm border p-8 min-h-[400px]">
                                    <h2 className="text-xl font-semibold mb-4">Settings</h2>
                                    <div className="text-gray-400 italic">(Settings sekmesi burada olacak)</div>
                                </div>
                            )}
                            {/* Create Custom Email sekmesi placeholder */}
                            {reviewTab === 'Create Custom Email' && (
                                <div className="bg-white rounded-lg shadow-sm border p-8 min-h-[400px]">
                                    <h2 className="text-xl font-semibold mb-4">Create Custom Email</h2>
                                    <div className="text-gray-400 italic">(Custom Email sekmesi burada olacak)</div>
                                </div>
                            )}
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