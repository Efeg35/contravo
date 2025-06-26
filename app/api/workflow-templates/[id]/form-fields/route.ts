import { NextRequest, NextResponse } from 'next/server';
import { addFormFieldToTemplate } from '@/src/lib/actions/workflow-template-actions';

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