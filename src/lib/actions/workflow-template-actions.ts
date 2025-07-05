"use server";

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { FormFieldType } from '@prisma/client';

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
function mapToFormFieldType(type: string): FormFieldType {
    const normalized = type.toLowerCase().trim();
    
    // Property tiplerini FormFieldType'a map et
    const typeMapping: Record<string, FormFieldType> = {
        'text': FormFieldType.TEXT,
        'textarea': FormFieldType.TEXTAREA,
        'email': FormFieldType.EMAIL,
        'url': FormFieldType.URL,
        'phone': FormFieldType.PHONE,
        'date': FormFieldType.DATE,
        'date_range': FormFieldType.DATE_RANGE,
        'duration': FormFieldType.TEXT, // duration -> TEXT olarak map ediyoruz
        'number': FormFieldType.NUMBER,
        'user': FormFieldType.USER,
        'select': FormFieldType.SELECT,
        'single_select': FormFieldType.SINGLE_SELECT,
        'multi_select': FormFieldType.MULTI_SELECT,
        'boolean': FormFieldType.CHECKBOX,
        'checkbox': FormFieldType.CHECKBOX,
        'file_upload': FormFieldType.FILE_UPLOAD,
        'user_picker': FormFieldType.USER_PICKER,
        'table': FormFieldType.TABLE
    };
    
    if (!(normalized in typeMapping)) {
        console.warn(`Bilinmeyen property tipi: ${type}, TEXT olarak varsayılan atanıyor`);
        return FormFieldType.TEXT;
    }
    
    return typeMapping[normalized];
}

export async function addFieldToLaunchForm({
    templateId,
    property,
    sectionId
}: {
    templateId: string,
    property: {
        id: string,
        name: string,
        type: string,
        required: boolean,
        description?: string,
        options?: any[]
    },
    sectionId?: string
}) {
    if (!templateId || !property || !property.name || !property.type) {
        throw new Error('Template ID ve property bilgileri gereklidir.');
    }
    try {
        // 1. Önce FormField oluştur
        const count = await db.formField.count({ where: { templateId } });
        
        // Debug için type mapping sonucunu loglayalım
        const mappedType = mapToFormFieldType(property.type);
        console.log('[addFieldToLaunchForm] mapped type', mappedType);
        
        const result = await addFormFieldToTemplate({
            templateId,
            name: property.name,
            type: property.type,
            required: property.required,
            description: property.description,
            options: property.options,
            sectionId,
            priority: 0
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
        if (!layout.fieldOrder.includes(result.formFieldId)) {
            layout.fieldOrder.push(result.formFieldId);
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
    stepId?: string
}) {
    console.log('addDisplayConditionToField params:', { fieldId, field, operator, value, stepId });

    if (!fieldId || !field || !operator) {
        throw new Error('Field ID, field ve operator zorunludur.');
    }
    try {
        // Önce aynı fieldId için varsa eski condition'ı sil
        await db.condition.deleteMany({ where: { displayConditionForFieldId: fieldId } });
        // Eğer stepId boş veya undefined ise, alanın ait olduğu template'in ilk adımını kullan
        let finalStepId = stepId;
        if (!finalStepId) {
            // fieldId'den templateId'yi bul
            const field = await db.formField.findUnique({ where: { id: fieldId }, select: { templateId: true } });
            if (!field) {
                throw new Error('FormField bulunamadı, stepId çözümlenemedi.');
            }
            const firstStep = await db.workflowTemplateStep.findFirst({
                where: { templateId: field.templateId },
                orderBy: { order: 'asc' }
            });
            if (!firstStep) {
                throw new Error('İlgili WorkflowTemplate için step bulunamadı.');
            }
            finalStepId = firstStep.id;
        }
        // Yeni condition ekle
        await db.condition.create({
            data: {
                field,
                operator,
                value,
                displayConditionForFieldId: fieldId,
                stepId: finalStepId
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
    realTimeValidation,
    sectionId
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
    realTimeValidation?: boolean,
    sectionId?: string
}) {
    if (!templateId || !name || !type) {
        throw new Error('Template ID, name ve type zorunludur.');
    }
    try {
        // Mevcut alan sayısını bul
        const count = await db.formField.count({ where: { templateId } });
        // Debug için type mapping sonucunu loglayalım
        const mappedType = mapToFormFieldType(type);
        console.log(`🔍 Debug addFormFieldToTemplate - Input type: "${type}", Mapped type: "${mappedType}"`);
        
        const formField = await db.formField.create({
            data: {
                templateId,
                label: name,
                apiKey: name.toLowerCase().replace(/\s+/g, '_'),
                type: mappedType,
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
                realTimeValidation: realTimeValidation || false,
                sectionId: sectionId || undefined
            }
        });
        return { success: true, formFieldId: formField.id };
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