"use server";

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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

export async function addFieldToLaunchForm({
    templateId,
    fieldId
}: {
    templateId: string,
    fieldId: string
}) {
    if (!templateId || !fieldId) {
        throw new Error('Template ID ve Field ID gereklidir.');
    }
    try {
        const template = await db.workflowTemplate.findUnique({
            where: { id: templateId },
            select: { launchFormLayout: true }
        });
        let layout: any;
        if (typeof template?.launchFormLayout === 'string') {
            layout = JSON.parse(template.launchFormLayout);
        } else {
            layout = template?.launchFormLayout || { fieldOrder: [] };
        }
        if (!Array.isArray(layout.fieldOrder)) layout.fieldOrder = [];
        if (!layout.fieldOrder.includes(fieldId)) {
            layout.fieldOrder.push(fieldId);
        }
        await db.workflowTemplate.update({
            where: { id: templateId },
            data: { launchFormLayout: layout }
        });
        revalidatePath(`/dashboard/admin/workflows/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error('Launch form alanı eklenirken hata:', error);
        return { success: false, message: 'Server Error: Alan eklenemedi.' };
    }
}

export async function addDisplayConditionToField({
    fieldId,
    field,
    operator,
    value,
    stepId
}: {
    fieldId: string,
    field: string,
    operator: string,
    value: string,
    stepId: string
}) {
    if (!fieldId || !field || !operator || !stepId) {
        throw new Error('Field ID, field, operator ve stepId zorunludur.');
    }
    try {
        // Önce aynı fieldId için varsa eski condition'ı sil
        await db.condition.deleteMany({ where: { displayConditionForFieldId: fieldId } });
        // Yeni condition ekle
        await db.condition.create({
            data: {
                field,
                operator,
                value,
                displayConditionForFieldId: fieldId,
                stepId
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Display condition eklenirken hata:', error);
        return { success: false, message: 'Server Error: Display condition eklenemedi.' };
    }
}

export async function addFormFieldToTemplate({
    templateId,
    name,
    type,
    required,
    description,
    options
}: {
    templateId: string,
    name: string,
    type: string,
    required: boolean,
    description?: string,
    options?: any[]
}) {
    if (!templateId || !name || !type) {
        throw new Error('Template ID, name ve type zorunludur.');
    }
    try {
        // Mevcut alan sayısını bul
        const count = await db.formField.count({ where: { templateId } });
        await db.formField.create({
            data: {
                templateId,
                label: name,
                apiKey: name.toLowerCase().replace(/\s+/g, '_'),
                type: type as any,
                isRequired: required,
                options: options && options.length > 0 ? options : undefined,
                order: count + 1
            }
        });
        return { success: true };
    } catch (error) {
        console.error('FormField eklenirken hata:', error);
        return { success: false, message: 'Server Error: FormField eklenemedi.', error: error instanceof Error ? error.message + '\n' + error.stack : String(error) };
    }
}

export async function addSectionToLaunchForm({
    templateId,
    name,
    description
}: {
    templateId: string,
    name: string,
    description?: string
}) {
    if (!templateId || !name) {
        throw new Error('Template ID ve name zorunludur.');
    }
    try {
        const template = await db.workflowTemplate.findUnique({
            where: { id: templateId },
            select: { launchFormLayout: true }
        });
        let layout: any;
        if (typeof template?.launchFormLayout === 'string') {
            layout = JSON.parse(template.launchFormLayout);
        } else {
            layout = template?.launchFormLayout || { fieldOrder: [] };
        }
        if (!Array.isArray(layout.fieldOrder)) layout.fieldOrder = [];
        const sectionId = uuidv4();
        layout.fieldOrder.push({
            id: sectionId,
            type: 'section',
            name,
            description: description || '',
            fields: []
        });
        await db.workflowTemplate.update({
            where: { id: templateId },
            data: { launchFormLayout: layout }
        });
        return { success: true };
    } catch (error) {
        console.error('Section eklenirken hata:', error);
        return { success: false, message: 'Server Error: Section eklenemedi.' };
    }
} 