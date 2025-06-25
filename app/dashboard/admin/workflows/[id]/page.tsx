"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from 'react-dom';
import { ChevronLeft, CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { saveTemplateFile } from "@/src/lib/actions/workflow-template-actions";
import DocxPreviewer from "./DocxPreviewer";
import { db } from "@/lib/db";
import type { WorkflowTemplate } from "@prisma/client";

const WorkflowEditorClient = ({ initialTemplate }: { initialTemplate: WorkflowTemplate }) => {
    const [selectedPaperSource, setSelectedPaperSource] = useState<'company' | 'counterparty' | null>(null);
    const workflowSteps = ["Document", "Create", "Review", "Sign", "Archive"];

    useEffect(() => {
        if(initialTemplate.templateFileUrl) {
            setSelectedPaperSource('company');
        }
    }, [initialTemplate.templateFileUrl]);

    // Define the shape of the form state returned from the server action
    interface FormState {
        message: string | null;
        errors?: Record<string, string[]>;
        success: boolean;
        url?: string;
    }

    const initialState: FormState = { message: null, errors: {}, success: false };
    // `saveTemplateFile` is a server action that matches the FormState shape. We cast to any to satisfy TypeScript since
    // the action currently has loose typings.
    const [state, dispatch] = useFormState(saveTemplateFile as any, initialState);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { pending } = useFormStatus();

    // Redirect on successful upload
    useEffect(() => {
        if (state.success) {
            // A simple way to refresh the page data is to just reload.
            // A more advanced solution would use Next.js router to refresh server component data.
            window.location.reload();
        }
    }, [state.success]);

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
                    <Button variant="outline" disabled={pending}>Save</Button>
                    <Button disabled={pending}>Publish</Button>
                </div>
            </header>

            {/* Stepper */}
            <nav className="flex items-center justify-center border-b bg-gray-50">
                {workflowSteps.map((step, index) => (
                <div key={step} className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${step === "Document" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500"}`}>
                    {step}
                    {index < workflowSteps.length - 1 && <ChevronLeft className="h-5 w-5 text-gray-300 ml-6 transform rotate-180" />}
                </div>
                ))}
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Attributes Panel (Simplified) */}
                <aside className="w-[380px] flex-shrink-0 bg-white border-r p-4 overflow-y-auto">
                    <h2 className="text-lg font-bold">Attributes</h2>
                    {/* Simplified content for now */}
                    <p className="text-sm text-gray-500 mt-4">Attributes panel content will be built in a future step.</p>
                </aside>

                {/* Right Panel */}
                <section className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
                    {initialTemplate.templateFileUrl ? (
                        <div className="w-full h-full flex flex-col">
                            <h2 className="text-xl font-bold mb-4 text-center flex-shrink-0">{initialTemplate.documentName}</h2>
                            <div className="flex-grow min-h-0">
                                <DocxPreviewer url={initialTemplate.templateFileUrl} />
                            </div>
                        </div>
                    ) : (
                        <form action={dispatch} className="w-full max-w-2xl text-center">
                            <input type="hidden" name="templateId" value={initialTemplate.id} />
                            <h2 className="text-2xl font-bold mb-4">Select paper source</h2>
                            <p className="text-gray-600 mb-8">
                                Will this workflow use a standard template or will the counterparty provide the main agreement?
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className={`p-6 text-center border-2 ${selectedPaperSource === 'company' ? 'border-blue-600' : 'hover:border-gray-300'}`} onClick={() => setSelectedPaperSource('company')}>
                                    <h3 className="font-semibold text-lg mb-2">My company's paper</h3>
                                    <p className="text-sm text-gray-500 mb-6">Use a template from your company's library.</p>
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                        <div className={`p-10 border-2 border-dashed rounded-lg ${!selectedFile ? 'border-gray-300' : 'border-green-500 bg-green-50'}`}>
                                            <input id="file-upload" name="file" type="file" className="sr-only" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                                            {selectedFile ? (
                                                <div className="text-green-700">
                                                    <FileText className="w-8 h-8 mx-auto mb-2" />
                                                    <p className="text-sm">{selectedFile.name}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-600">Browse to upload a .docx file</p>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </Card>
                                <Card className={`p-6 text-center border-2 ${selectedPaperSource === 'counterparty' ? 'border-blue-600' : 'hover:border-gray-300'}`} onClick={() => setSelectedPaperSource('counterparty')}>
                                    <h3 className="font-semibold text-lg mb-2">Counterparty paper</h3>
                                    <p className="text-sm text-gray-500">The counterparty will provide their own agreement.</p>
                                    <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center">
                                       <CheckCircle2 className="w-8 h-8 text-gray-400" />
                                    </div>
                                </Card>
                            </div>
                            <Button className="mt-8" type="submit" disabled={pending || !selectedFile}>
                                {pending ? "Saving..." : "Save paper source"}
                            </Button>
                            {state?.message && !state.success && <p className="mt-4 text-red-500 text-sm">{state.message}</p>}
                            {state?.errors?.file && <p className="mt-2 text-red-500 text-sm">{state.errors.file[0]}</p>}
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
};

export default async function WorkflowEditorPage({ params }: { params: { id: string } }) {
    // This is a server component, so we can fetch data directly.
    const template = await db.workflowTemplate.findUnique({ where: { id: params.id } });
    if (!template) {
        // A real app should handle this more gracefully (e.g., redirect to a 404 page)
        return <div>Template not found.</div>;
    }
    return <WorkflowEditorClient initialTemplate={template} />;
} 