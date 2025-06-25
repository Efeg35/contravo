"use server";

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveTemplateFileUrl({ 
    templateId, 
    fileUrl, 
    fileName 
}: { 
    templateId: string, 
    fileUrl: string, 
    fileName: string 
}) {
    if (!templateId || !fileUrl || !fileName) {
        throw new Error('Template ID, File URL, and File Name are required.');
    }

    try {
        await db.workflowTemplate.update({
            where: { id: templateId },
            data: {
                templateFileUrl: fileUrl,
                documentName: fileName
            },
        });

        revalidatePath(`/dashboard/admin/workflows/${templateId}`);
        
        return { success: true };

    } catch (error) {
        console.error('Error saving file URL:', error);
        return { success: false, message: 'Server Error: Could not save file URL.' };
    }
} 