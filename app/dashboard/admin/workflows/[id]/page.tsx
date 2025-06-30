import { db } from "@/lib/db";
import { WorkflowEditorClient } from "./WorkflowEditorClient";
import { notFound } from "next/navigation";
import { WorkflowTemplate } from "@prisma/client";

interface WorkflowEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowEditorPage({ params }: WorkflowEditorPageProps) {
    const { id } = await params;
    if (id === 'new') {
        const newTemplate = {
            id: 'new',
            name: 'Yeni İş Akışı',
            description: '',
            companyId: '', // Bu alanlar oturumdan gelmeli, şimdilik boş
            createdById: '', // Bu alanlar oturumdan gelmeli, şimdilik boş
            templateFileUrl: null,
            documentName: null,
            documentUrl: null,
            status: 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date(),
            launchFormLayout: null,
        } as any;
        return <WorkflowEditorClient initialTemplate={newTemplate} />;
    }

    const template = await db.workflowTemplate.findUnique({ 
        where: { id: id },
        include: {
            formFields: true
        }
    });

    if (!template) {
        notFound();
    }

    return <WorkflowEditorClient initialTemplate={template} />;
} 