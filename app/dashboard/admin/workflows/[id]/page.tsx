"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Mail, CalendarDays, TextCursorInput, Timer, Repeat, ShieldQuestion, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

// Simple stepper component based on the screenshot
const StageStepper = ({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: string;
}) => (
  <nav className="flex items-center justify-center border-b bg-gray-50">
    {steps.map((step, index) => (
      <div
        key={step}
        className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
          step === currentStep
            ? "border-blue-600 text-blue-600 bg-white"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }`}
      >
        {step}
        {index < steps.length - 1 && (
          <ChevronRight className="h-5 w-5 text-gray-300 ml-6" />
        )}
      </div>
    ))}
  </nav>
);

const attributeIcons: { [key: string]: React.ReactNode } = {
    "fx": <Mail className="w-4 h-4 text-gray-600" />,
    "Date": <CalendarDays className="w-4 h-4 text-gray-600" />,
    "Text": <TextCursorInput className="w-4 h-4 text-gray-600" />,
    "Term": <Timer className="w-4 h-4 text-gray-600" />,
    "Renewal": <Repeat className="w-4 h-4 text-gray-600" />,
    "Condition": <ShieldQuestion className="w-4 h-4 text-gray-600" />,
};

const mockProperties = {
    "PROPERTIES (1)": [{ name: "Counterparty Name", type: "Text" }],
    "COUNTERPARTY SIGNER (2)": [{ name: "Counterparty Signer Email", type: "Text" }, { name: "Counterparty Signer Name", type: "Text" }],
    "PROPERTIES (11)": [
        { name: "Contract Owner", type: "fx" },
        { name: "Effective Date", type: "Date" },
        { name: "Expiration Date", type: "Date" },
        { name: "Initial Term Length", type: "Term" },
        { name: "Other Renewal Type", type: "Text" },
        { name: "Renewal Opt Out Date", type: "Date" },
    ],
    "CONDITIONS (6)": [
        { name: "Renewal Type is Auto-Renew", type: "Condition"},
        { name: "Renewal Type is Auto-Renew OR Opti...", type: "Condition" },
        { name: "Renewal Type is None", type: "Condition" },
    ]
};

const WorkflowEditorPage = ({ params }: { params: { id: string } }) => {
    const [currentStep, setCurrentStep] = useState("Document");
    const [selectedPaperSource, setSelectedPaperSource] = useState<string | null>(null);
    const workflowSteps = ["Document", "Create", "Review", "Sign", "Archive"];

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">Untitled workflow configuration</h1>
                    <Badge variant="outline" className="font-normal">Unpublished</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">Preview</Button>
                    <Button variant="outline">Save</Button>
                    <Button>Publish</Button>
                </div>
            </header>

            {/* Stepper */}
             <StageStepper steps={workflowSteps} currentStep={currentStep} />

            {/* Two-column layout */}
            <main className="flex flex-1 overflow-hidden">
                {/* Left "Attributes" Panel */}
                <aside className="w-[380px] flex-shrink-0 bg-white border-r overflow-y-auto p-4 space-y-4">
                    <Tabs defaultValue="properties" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="properties">Properties and Conditions</TabsTrigger>
                            <TabsTrigger value="clauses">Clauses</TabsTrigger>
                        </TabsList>

                        <TabsContent value="properties" className="mt-4">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h2 className="text-lg font-bold">Attributes</h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><Plus className="w-5 h-5" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem>Property</DropdownMenuItem>
                                        <DropdownMenuItem>Table</DropdownMenuItem>
                                        <DropdownMenuItem>Condition</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <Accordion type="multiple" defaultValue={["PROPERTIES (11)"]}>
                                 <AccordionItem value="lifecycle-preset" className="border-none">
                                     <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600 space-y-2 mb-2">
                                        <h3 className="font-semibold text-gray-800">LIFECYCLE PRESET (17)</h3>
                                        <p className="text-xs">Monitor and edit any contract's renewals and expirations with an applied set of properties, conditions, and form questions.</p>
                                        <p className="font-bold text-xs">10 questions added. <Button variant="link" className="p-0 h-auto text-xs">Edit launch form</Button></p>
                                        <div className="flex gap-2 pt-2">
                                            <Button variant="outline" size="sm" className="bg-white">Help center</Button>
                                            <Button variant="outline" size="sm" className="bg-white">Remove Lifecycle Preset</Button>
                                        </div>
                                    </div>
                                 </AccordionItem>
                                {Object.entries(mockProperties).map(([category, items]) => (
                                    <AccordionItem value={category} key={category}>
                                        <AccordionTrigger className="text-sm font-bold">{category}</AccordionTrigger>
                                        <AccordionContent>
                                            {items.map(item => (
                                                <div key={item.name} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md group">
                                                    <div className="flex items-center gap-3">
                                                        {attributeIcons[item.type] || <Mail className="w-4 h-4 text-gray-500" />}
                                                        <span className="text-sm">{item.name}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="clauses">
                            <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600 space-y-3 mt-4 text-center">
                                <h3 className="font-semibold text-gray-800">Insert pre-approved clauses from your global Clause Library</h3>
                                <p className="text-xs">Tagging clauses from your Clause Library automatically keeps your templates up to date when language changes. To get started, highlight one or more paragraphs in this template and select Add clause from the menu.</p>
                                <Button variant="outline" size="sm" className="bg-white">Learn more</Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </aside>
                {/* Right Workspace Panel */}
                <section className="flex-1 overflow-y-auto p-8">
                    {currentStep === "Document" && (
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-2">Select paper source</h2>
                            <p className="text-gray-500 mb-6">At least one must be selected</p>
                            <div className="space-y-4">
                                <Card
                                    className={`p-6 cursor-pointer relative ${selectedPaperSource === 'company' ? 'border-green-600 border-2' : 'border'}`}
                                    onClick={() => setSelectedPaperSource('company')}
                                >
                                    {selectedPaperSource === 'company' && <div className="absolute top-2 right-2 p-1 bg-green-600 rounded-full"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                                    <h3 className="font-semibold text-lg mb-2">My company's paper</h3>
                                    {selectedPaperSource === 'company' && (
                                        <div className="mt-4 p-8 border-2 border-dashed rounded-lg text-center text-gray-500 hover:border-blue-500">
                                            <div className="flex justify-center items-center text-blue-600">
                                                <Copy className="w-5 h-5 mr-2"/>
                                                <span>Add files or drop files here</span>
                                            </div>
                                            <p className="text-xs mt-1">DOCX only</p>
                                        </div>
                                    )}
                                </Card>
                                <Card
                                    className={`p-6 cursor-pointer relative ${selectedPaperSource === 'counterparty' ? 'border-green-600 border-2' : 'border'}`}
                                    onClick={() => setSelectedPaperSource('counterparty')}
                                >
                                    {selectedPaperSource === 'counterparty' && <div className="absolute top-2 right-2 p-1 bg-green-600 rounded-full"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                                    <div className="flex justify-between items-center">
                                         <h3 className="font-semibold text-lg">The counterparty's paper</h3>
                                        <Copy className="w-5 h-5 text-blue-600"/>
                                    </div>
                                    {selectedPaperSource === 'counterparty' && (
                                         <p className="mt-4 text-sm text-gray-600">This will be collected in the Launch form</p>
                                    )}
                                </Card>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button size="lg" disabled={!selectedPaperSource}>Save paper source</Button>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default WorkflowEditorPage; 