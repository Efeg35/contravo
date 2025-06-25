"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronLeft, FileText, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadButton } from "@uploadthing/react";
import { saveTemplateFileUrl } from "@/src/lib/actions/workflow-template-actions";
import DocxPreviewer from "./DocxPreviewer";
import type { WorkflowTemplate } from "@prisma/client";
import { toast } from "sonner";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export const WorkflowEditorClient = ({ initialTemplate }: { initialTemplate: WorkflowTemplate }) => {
    const [selectedPaperSource, setSelectedPaperSource] = useState<'company' | 'counterparty' | null>(null);
    const workflowSteps = ["Document", "Create", "Review", "Sign", "Archive"];
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if(initialTemplate.templateFileUrl) {
            setSelectedPaperSource('company');
        }
    }, [initialTemplate.templateFileUrl]);

    const handleUploadComplete = (res: any) => {
        if (res && res.length > 0) {
            const uploadedFile = res[0];
            startTransition(async () => {
                const result = await saveTemplateFileUrl({
                    templateId: initialTemplate.id,
                    fileUrl: uploadedFile.url,
                    fileName: uploadedFile.name
                });

                if (result.success) {
                    toast.success("File uploaded successfully! The page will now reload.");
                    window.location.reload();
                } else {
                    toast.error(result.message || "Failed to save the file URL.");
                }
            });
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">{initialTemplate.name || 'Untitled workflow configuration'}</h1>
                    <Badge variant="outline" className="font-normal">Unpublished</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">Preview</Button>
                    <Button variant="outline" disabled={isPending}>Save</Button>
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
                <aside className="w-[380px] flex-shrink-0 bg-white border-r p-6 overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Properties and Conditions</h2>
                        {/* Placeholder for future tabs like "Clauses" */}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="font-semibold text-gray-800">LIFECYCLE PRESET (17)</h3>
                        <p className="text-sm text-gray-500 mt-2">Monitor and edit any contract's renewals and expirations with an applied set of properties, conditions, and date questions.</p>
                        <a href="#" className="text-sm text-blue-600 mt-2 block">10 questions added. Edit launch form</a>
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="bg-white">Help center</Button>
                            <Button variant="outline" size="sm" className="bg-white">Remove Lifecycle Preset</Button>
                        </div>
                    </div>

                    <Accordion type="multiple" className="w-full mt-4" defaultValue={['item-2', 'item-3', 'item-4', 'item-5']}>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>PROPERTIES (1)</AccordionTrigger>
                            <AccordionContent><div className="px-4 py-2 hover:bg-gray-100 rounded-md">Counterparty Name</div></AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>COUNTERPARTY SIGNER (2)</AccordionTrigger>
                            <AccordionContent>
                                <div className="px-4 py-2 hover:bg-gray-100 rounded-md">Counterparty Signer Email</div>
                                <div className="px-4 py-2 mt-1 hover:bg-gray-100 rounded-md">Counterparty Signer Name</div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>PROPERTIES (11)</AccordionTrigger>
                            <AccordionContent>
                                <div className="px-4 py-2 hover:bg-gray-100 rounded-md">Contract Owner</div>
                                <div className="px-4 py-2 mt-1 hover:bg-gray-100 rounded-md">Effective Date</div>
                                <div className="px-4 py-2 mt-1 hover:bg-gray-100 rounded-md">Initial Term Length</div>
                                {/* Add other properties as needed */}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>CONDITIONS (6)</AccordionTrigger>
                            <AccordionContent>
                                <div className="px-4 py-2 hover:bg-gray-100 rounded-md">Renewal Type is Auto-Renew</div>
                                {/* Add other conditions as needed */}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </aside>

                {/* Right Panel */}
                <section className="flex-1 flex flex-col items-center bg-gray-50 p-8 overflow-y-auto">
                    {initialTemplate.templateFileUrl ? (
                        <div className="w-full h-full flex flex-col">
                            <h2 className="text-xl font-bold mb-4 text-center flex-shrink-0">{initialTemplate.documentName}</h2>
                            <div className="flex-grow min-h-0">
                                <DocxPreviewer url={initialTemplate.templateFileUrl} />
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
                                        <div className="mt-6 p-6 border-2 border-dashed rounded-lg border-gray-300 text-center bg-white">
                                            <FileText className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                                            <UploadButton<OurFileRouter, "workflowTemplateUploader">
                                                    endpoint="workflowTemplateUploader"
                                                    onClientUploadComplete={handleUploadComplete}
                                                    onUploadError={(error: Error) => {
                                                        toast.error(`Upload Failed: ${error.message}`);
                                                    }}
                                                />
                                        </div>
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