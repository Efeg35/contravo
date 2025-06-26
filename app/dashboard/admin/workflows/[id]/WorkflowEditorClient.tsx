"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronLeft, FileText, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateUploader } from "@/components/upload/TemplateUploader";
import DocxPreviewer from "./DocxPreviewer";
import type { WorkflowTemplate } from "@prisma/client";
import { useRouter } from "next/navigation";
import { PropertiesAndConditions } from "@/components/workflow/PropertiesAndConditions";
import { DEFAULT_WORKFLOW_SCHEMA } from "@/lib/workflow-defaults";
import { WorkflowSchema } from "@/types/workflow";

export const WorkflowEditorClient = ({ initialTemplate }: { initialTemplate: WorkflowTemplate }) => {
    const [selectedPaperSource, setSelectedPaperSource] = useState<'company' | 'counterparty' | null>(null);
    const workflowSteps = ["Document", "Create", "Review", "Sign", "Archive"];
    const [isPending, startTransition] = useTransition();
    const [currentTemplate, setCurrentTemplate] = useState(initialTemplate);
    const [workflowSchema, setWorkflowSchema] = useState<WorkflowSchema>(DEFAULT_WORKFLOW_SCHEMA);
    const router = useRouter();

    useEffect(() => {
        if(currentTemplate.templateFileUrl) {
            setSelectedPaperSource('company');
        }
    }, [currentTemplate.templateFileUrl]);

    const handleSave = async () => {
        startTransition(async () => {
            try {
                if (currentTemplate.id === 'new') {
                    // Yeni template oluştur
                    const response = await fetch('/api/workflow-templates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: currentTemplate.name,
                            description: currentTemplate.description
                        })
                    });
                    
                    if (response.ok) {
                        const savedTemplate = await response.json();
                        setCurrentTemplate(savedTemplate);
                        
                        // Pending upload varsa uygula
                        const pendingUpload = localStorage.getItem('pendingUpload');
                        if (pendingUpload) {
                            const uploadData = JSON.parse(pendingUpload);
                            
                            // Upload'ı template'e bağla
                            const uploadResponse = await fetch(`/api/workflow-templates/${savedTemplate.id}/document`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    documentUrl: uploadData.fileUrl,
                                    documentName: uploadData.fileName
                                })
                            });
                            
                            if (uploadResponse.ok) {
                                localStorage.removeItem('pendingUpload');
                                alert('Workflow ve dosya başarıyla kaydedildi!');
                            }
                        } else {
                            alert('Workflow başarıyla kaydedildi!');
                        }
                        
                        // URL'yi güncelle
                        window.history.replaceState({}, '', `/dashboard/admin/workflows/${savedTemplate.id}`);
                    }
                } else {
                    // Mevcut template'i güncelle
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
                    <Button variant="outline">Preview</Button>
                    <Button variant="outline" disabled={isPending} onClick={handleSave}>
                        {isPending ? "Kaydediliyor..." : "Save"}
                    </Button>
                    <Button disabled={isPending}>Publish</Button>
                </div>
            </header>

            {/* Stepper */}
            <nav className="flex items-center justify-center border-b bg-white shadow-sm">
                {workflowSteps.map((step, index) => (
                <a href="#" key={step} className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 ${step === "Document" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    {step}
                </a>
                ))}
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Attributes Panel */}
                <PropertiesAndConditions 
                    schema={workflowSchema}
                    onSchemaChange={setWorkflowSchema}
                    isEditable={true}
                />

                {/* Right Panel */}
                <section className="flex-1 flex flex-col items-center bg-gray-50 p-8 overflow-y-auto">
                    {currentTemplate.templateFileUrl ? (
                        <div className="w-full h-full flex flex-col">
                            <h2 className="text-xl font-bold mb-4 text-center flex-shrink-0">{currentTemplate.documentName}</h2>
                            <div className="flex-grow min-h-0">
                                <DocxPreviewer url={currentTemplate.templateFileUrl} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl">
                             <h2 className="text-2xl font-bold mb-2 text-center">Select paper source</h2>
                            <p className="text-gray-600 mb-8 text-center">
                                At least one must be selected
                            </p>
                            <div className="space-y-4">
                                <div 
                                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${selectedPaperSource === 'company' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                    onClick={() => setSelectedPaperSource('company')}
                                >
                                    <h3 className="font-semibold text-lg">My company's paper</h3>
                                    {selectedPaperSource === 'company' && (
                                        <TemplateUploader 
                                            templateId={currentTemplate.id} 
                                            onUploadComplete={() => {
                                                // Upload sonrası state'i güncelle
                                                const pendingUpload = localStorage.getItem('pendingUpload');
                                                if (pendingUpload && currentTemplate.id === 'new') {
                                                    const uploadData = JSON.parse(pendingUpload);
                                                    setCurrentTemplate(prev => ({
                                                        ...prev,
                                                        templateFileUrl: uploadData.fileUrl,
                                                        documentName: uploadData.fileName
                                                    }));
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                                <div
                                    className={`p-6 border-2 rounded-lg cursor-pointer flex justify-between items-center transition-all ${selectedPaperSource === 'counterparty' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                    onClick={() => setSelectedPaperSource('counterparty')}
                                >
                                    <h3 className="font-semibold text-lg">The counterparty's paper</h3>
                                    <ClipboardCopy className="w-6 h-6 text-gray-500" />
                                </div>
                            </div>
                             <div className="mt-8 flex justify-end">
                                <Button size="lg" disabled={!selectedPaperSource || isPending}>Save paper source</Button>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}; 