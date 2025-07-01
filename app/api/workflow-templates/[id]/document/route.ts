import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id: templateId } = await params;
    const contentType = req.headers.get('content-type');

    // JSON ile gelen pending upload data'sı
    if (contentType?.includes('application/json')) {
      const { documentUrl, documentName } = await req.json();

      if (!documentUrl || !documentName) {
        return NextResponse.json({ error: 'Document URL ve Name gereklidir.' }, { status: 400 });
      }

      const updatedTemplate = await db.workflowTemplate.update({
        where: { id: templateId },
        data: {
          templateFileUrl: documentUrl,
          documentName: documentName,
        },
      });

      return NextResponse.json(updatedTemplate);
    }

    // FormData ile gelen dosya upload'ı 
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const source = formData.get('source');

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    }

    // Sadece .docx dosyası kabul et
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith('.docx');
    if (!isDocx) {
      return NextResponse.json({ error: 'Sadece DOCX dosyası yükleyebilirsiniz.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/workflows');
    const savePath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/workflows/${filename}`;
    
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });

    await writeFile(savePath, buffer);

    // Docx içeriğini HTML'e çevir
    let documentHtml = '';
    if (isDocx) {
      try {
        const result = await mammoth.convertToHtml({ buffer }, {
          styleMap: [
            // Madde işaretleri için özel stil mapping
            "p[style-name='List Paragraph'] => ul > li",
            "p[style-name='ListParagraph'] => ul > li", 
            "p[style-name='Bullet List'] => ul > li",
            "p[style-name='BulletList'] => ul > li",
            "p[style-name='Numbered List'] => ol > li",
            "p[style-name='NumberedList'] => ol > li",
            // Başlık stilleri
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2", 
            "p[style-name='Heading 3'] => h3",
            "p[style-name='Heading 4'] => h4",
            // Kalın ve italik
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
          ],
          includeDefaultStyleMap: true,
          convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer
              };
            });
          })
        });
        documentHtml = result.value; // The generated HTML
        
        // Ek post-processing: mammoth'un kaçırdığı formatlamaları düzelt
        documentHtml = postProcessHTML(documentHtml);
        
      } catch (error) {
        console.error("Error converting docx to html", error);
      }
    }

    let updatedTemplate;
    try {
      updatedTemplate = await db.workflowTemplate.update({
        where: { id: templateId },
        data: {
          templateFileUrl: publicUrl,
          documentName: file.name,
          documentHtml: documentHtml,
        } as any,
      });
    } catch (dbError: any) {
      // Eğer kayıt bulunamadıysa (P2025), yeni bir template oluştur
      if (dbError.code === 'P2025' || dbError.message?.includes('Record to update not found')) {
        const uniqueName = `Untitled workflow ${Date.now()}`;
        updatedTemplate = await db.workflowTemplate.create({
          data: {
            name: uniqueName,
            templateFileUrl: publicUrl,
            documentName: file.name,
            documentHtml: documentHtml,
            status: 'UNPUBLISHED',
          } as any,
        });
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ ...updatedTemplate, documentHtml });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Dosya yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    const { id } = await params;

    const updatedTemplate = await db.workflowTemplate.update({
      where: { id: id },
      data: {
        documentName: null,
        documentUrl: null,
      },
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Doküman silinirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const templateId = params.id;
    const { documentHtml, documentProperties, generateDocument, formData } = await req.json();
    
    // Eğer generateDocument flag'i varsa, form data'sını kullanarak document generate et
    if (generateDocument && formData) {
      const generatedHtml = await generateDocumentFromFormData(documentHtml, formData);
      
      // Generate edilmiş document'ı kaydet
      const template = await db.workflowTemplate.update({
        where: { id: templateId },
        data: { 
          documentHtml: generatedHtml,
          documentProperties: JSON.stringify(documentProperties || [])
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        documentHtml: generatedHtml,
        message: 'Document başarıyla generate edildi!' 
      });
    }
    
    // Normal document update
    const template = await db.workflowTemplate.update({
      where: { id: templateId },
      data: { 
        documentHtml,
        documentProperties: JSON.stringify(documentProperties || [])
      }
    });
    
    return NextResponse.json({ success: true, documentHtml: template.documentHtml });
  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json({ success: false, message: 'Document güncellenirken hata oluştu' }, { status: 500 });
  }
}

// Form data'sını kullanarak document generate eden function
async function generateDocumentFromFormData(documentHtml: string, formData: Record<string, any>): Promise<string> {
  if (!documentHtml) return '';
  
  let generatedHtml = documentHtml;
  
  // Property tag'leri bulup replace et
  // Pattern: <span data-property-tag="true" id="propertyId">PropertyLabel</span>
  const propertyTagRegex = /<span[^>]*data-property-tag="true"[^>]*id="([^"]*)"[^>]*>([^<]*)<\/span>/g;
  
  generatedHtml = generatedHtml.replace(propertyTagRegex, (match, propertyId, propertyLabel) => {
    // Form data'da bu property'nin value'sunu ara
    const value = formData[propertyId] || formData[propertyLabel];
    
    if (value !== undefined && value !== null && value !== '') {
      // Value'yu uygun formatta döndür
      let formattedValue = formatPropertyValue(value, propertyId);
      
      // Property tag'i gerçek value ile replace et
      return `<span class="generated-property" data-original-property="${propertyId}" style="background: #e1f5fe; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${formattedValue}</span>`;
    } else {
      // Value yoksa placeholder göster
      return `<span class="missing-property" data-property="${propertyId}" style="background: #ffebee; padding: 2px 6px; border-radius: 4px; border: 1px dashed #f44336; color: #c62828;">[${propertyLabel} - Değer Girilmemiş]</span>`;
    }
  });
  
  return generatedHtml;
}

// Property value'sunu uygun formatta döndüren function
function formatPropertyValue(value: any, propertyId: string): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object' && value !== null) {
    // Date object ise
    if (value instanceof Date) {
      return value.toLocaleDateString('tr-TR');
    }
    // Object ise JSON'a çevir
    return JSON.stringify(value);
  }
  
  // Boolean ise
  if (typeof value === 'boolean') {
    return value ? 'Evet' : 'Hayır';
  }
  
  // Number ise ve para formatı gibiyse
  if (typeof value === 'number' && propertyId.toLowerCase().includes('tutar')) {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY' 
    }).format(value);
  }
  
  return String(value);
}

// Post-processing function: mammoth'un kaçırdığı formatlamaları düzelt
function postProcessHTML(html: string): string {
  let processedHtml = html;
  
  // Ardışık madde işaretli paragrafları ul/li yapısına çevir
  processedHtml = processedHtml.replace(
    /(<p>•\s*(.+?)<\/p>(\s*<p>•\s*(.+?)<\/p>)*)/g,
    (match) => {
      const items = match.match(/<p>•\s*(.+?)<\/p>/g);
      if (items) {
        const listItems = items.map(item => 
          item.replace(/<p>•\s*(.+?)<\/p>/, '<li>$1</li>')
        ).join('');
        return `<ul>${listItems}</ul>`;
      }
      return match;
    }
  );
  
  // Numaralı liste işaretlerini düzelt (1., 2., 3. vs.)
  processedHtml = processedHtml.replace(
    /(<p>\d+\.\s*(.+?)<\/p>(\s*<p>\d+\.\s*(.+?)<\/p>)*)/g,
    (match) => {
      const items = match.match(/<p>\d+\.\s*(.+?)<\/p>/g);
      if (items) {
        const listItems = items.map(item => 
          item.replace(/<p>\d+\.\s*(.+?)<\/p>/, '<li>$1</li>')
        ).join('');
        return `<ol>${listItems}</ol>`;
      }
      return match;
    }
  );
  
  // Girintili paragrafları koruma
  processedHtml = processedHtml.replace(
    /<p style="margin-left:(\d+)px">/g,
    '<p style="margin-left:$1px; padding-left:$1px;">'
  );
  
  return processedHtml;
} 