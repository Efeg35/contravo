import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosyayı public/uploads klasörüne kaydet
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(process.cwd(), 'public/uploads', fileName);
    
    await writeFile(filePath, buffer);
    
    // Public URL oluştur
    const fileUrl = `/uploads/${fileName}`;

    console.log(`File uploaded: ${fileName}`);

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      name: file.name,
      size: file.size
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Upload failed' 
    });
  }
} 