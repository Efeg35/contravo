import { NextRequest, NextResponse } from 'next/server';
import { addFormFieldToTemplate, addFieldToLaunchForm } from '@/src/lib/actions/workflow-template-actions';

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
    const { name, type, required, description, options } = body;
    if (!templateId || !name || !type) {
      return NextResponse.json({ success: false, message: 'Eksik parametre.' }, { status: 400 });
    }
    const result = await addFormFieldToTemplate({
      templateId,
      name,
      type,
      required,
      description,
      options
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API alan ekleme hatası:', error);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
} 