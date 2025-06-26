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

// FormField type mapping function - Prisma enum değerlerine dönüştürür
function mapToFormFieldType(type: string): string {
    const typeMap: { [key: string]: string } = {
        'TEXT': 'TEXT',
        'EMAIL': 'EMAIL',
        'URL': 'URL',
        'PHONE': 'PHONE',
        'TEXTAREA': 'TEXTAREA', 
        'NUMBER': 'NUMBER',
        'DATE': 'DATE',
        'DATE_RANGE': 'DATE_RANGE',
        'SELECT': 'SINGLE_SELECT',
        'SINGLE_SELECT': 'SINGLE_SELECT',
        'MULTI_SELECT': 'MULTI_SELECT',
        'CHECKBOX': 'CHECKBOX',
        'FILE_UPLOAD': 'FILE_UPLOAD',
        'USER': 'USER_PICKER', // User picker
        'USER_PICKER': 'USER_PICKER',
        'TABLE': 'TABLE'
    };
    
    const upperType = type.toUpperCase();
    const mappedType = typeMap[upperType] || 'TEXT';
    
    // Prisma enum değerlerini kontrol et
    const validTypes = [
        'TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'EMAIL', 'URL', 'PHONE',
        'SINGLE_SELECT', 'MULTI_SELECT', 'CHECKBOX', 'FILE_UPLOAD', 
        'USER_PICKER', 'DATE_RANGE', 'TABLE'
    ];
    
    if (!validTypes.includes(mappedType)) {
        console.warn(`Geçersiz form field tipi: ${type}, varsayılan TEXT kullanılıyor`);
        return 'TEXT';
    }
    
    return mappedType;
}

export async function addFieldToLaunchForm({
    templateId,
    property
}: {
    templateId: string,
    property: {
        id: string,
        name: string,
        type: string,
        required: boolean,
        description?: string,
        options?: any[]
    }
}) {
    if (!templateId || !property || !property.name || !property.type) {
        throw new Error('Template ID ve property bilgileri gereklidir.');
    }
    try {
        // 1. Önce FormField oluştur
        const count = await db.formField.count({ where: { templateId } });
        const formField = await db.formField.create({
            data: {
                templateId,
                label: property.name,
                apiKey: property.name.toLowerCase().replace(/\s+/g, '_'),
                type: mapToFormFieldType(property.type) as any,
                isRequired: property.required,
                options: property.options && property.options.length > 0 ? property.options : undefined,
                order: count + 1
            }
        });

        // 2. Ardından layout'a ekle
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
        
        // FormField'in ID'sini layout'a ekle
        if (!layout.fieldOrder.includes(formField.id)) {
            layout.fieldOrder.push(formField.id);
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
    options,
    placeholder,
    minLength,
    maxLength,
    minValue,
    maxValue,
    pattern,
    customError,
    dependsOn,
    dependsOnValue,
    helpText,
    // Sprint 2: Enhanced validation and rules
    isConditional,
    validationRules,
    defaultValue,
    isReadOnly,
    isHidden,
    showWhen,
    hideWhen,
    validateWhen,
    errorMessage,
    warningMessage,
    successMessage,
    fieldGroup,
    priority,
    realTimeValidation
}: {
    templateId: string,
    name: string,
    type: string,
    required: boolean,
    description?: string,
    options?: any[],
    placeholder?: string,
    minLength?: number,
    maxLength?: number,
    minValue?: number,
    maxValue?: number,
    pattern?: string,
    customError?: string,
    dependsOn?: string,
    dependsOnValue?: string,
    helpText?: string,
    // Sprint 2: Enhanced validation and rules
    isConditional?: boolean,
    validationRules?: any,
    defaultValue?: string,
    isReadOnly?: boolean,
    isHidden?: boolean,
    showWhen?: any,
    hideWhen?: any,
    validateWhen?: any,
    errorMessage?: string,
    warningMessage?: string,
    successMessage?: string,
    fieldGroup?: string,
    priority?: number,
    realTimeValidation?: boolean
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
                type: mapToFormFieldType(type) as any,
                isRequired: required,
                placeholder,
                options: options && options.length > 0 ? options : undefined,
                order: count + 1,
                minLength,
                maxLength,
                minValue,
                maxValue,
                pattern,
                customError,
                dependsOn,
                dependsOnValue,
                helpText,
                // Sprint 2: Enhanced validation and rules
                isConditional: isConditional || false,
                validationRules: validationRules || undefined,
                defaultValue,
                isReadOnly: isReadOnly || false,
                isHidden: isHidden || false,
                showWhen: showWhen || undefined,
                hideWhen: hideWhen || undefined,
                validateWhen: validateWhen || undefined,
                errorMessage,
                warningMessage,
                successMessage,
                fieldGroup,
                priority: priority || 0,
                realTimeValidation: realTimeValidation || false
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