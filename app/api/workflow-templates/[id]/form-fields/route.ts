import { NextRequest, NextResponse } from 'next/server';
import { addFormFieldToTemplate, addFieldToLaunchForm } from '@/src/lib/actions/workflow-template-actions';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const templateId = params.id;
    
    const template = await db.workflowTemplate.findUnique({
      where: { id: templateId },
      include: { formFields: true }
    });
    
    if (!template) {
      return NextResponse.json({ success: false, message: 'Template bulunamadı.' }, { status: 404 });
    }
    
    const formFields = await db.formField.findMany({
      where: { templateId },
      select: {
        id: true,
        label: true,
        type: true,
        isRequired: true,
        helpText: true,
        placeholder: true,
        options: true,
        order: true,
        propertyId: true,
        property: {
          select: {
            id: true,
            label: true,
            type: true,
            helpText: true,
            isRequired: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { label: 'asc' }
      ]
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        template: template,
        formFields: formFields
      }
    });
  } catch (error) {
    console.error('API form fields getirme hatası:', error);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const templateId = params.id;
    
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Geçersiz JSON verisi.' }, { status: 400 });
    }
    
    // Sol panelden gelen property tabanlı istek mi?
    if (body.property && body.action === 'addFromProperty') {
      const { property } = body;
      if (!property.name || !property.type) {
        return NextResponse.json({ success: false, message: 'Property name ve type zorunlu.' }, { status: 400 });
      }
      
      const result = await addFieldToLaunchForm({ templateId, property });
      return NextResponse.json(result);
    }
    
    // Manuel alan ekleme isteği
    const { 
      name, 
      type, 
      required, 
      description, 
      options,
      sectionId,
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
    } = body;
    
    if (!templateId || !name || !type) {
      return NextResponse.json({ success: false, message: 'Eksik parametre.' }, { status: 400 });
    }
    
    const result = await addFormFieldToTemplate({
      templateId,
      name,
      type,
      required,
      description,
      options,
      sectionId,
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
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API alan ekleme hatası:', error);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
} 