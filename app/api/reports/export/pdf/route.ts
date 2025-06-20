import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Veri kaynağına göre mevcut alanlar
const AVAILABLE_FIELDS = {
  contracts: [
    { key: 'title', label: 'Başlık' },
    { key: 'status', label: 'Durum' },
    { key: 'expirationDate', label: 'Bitiş Tarihi' },
    { key: 'createdAt', label: 'Oluşturulma Tarihi' },
    { key: 'author', label: 'Oluşturan Kişi' },
    { key: 'company', label: 'Şirket' },
    { key: 'value', label: 'Değer' },
    { key: 'category', label: 'Kategori' }
  ],
  users: [
    { key: 'name', label: 'Ad' },
    { key: 'email', label: 'E-posta' },
    { key: 'role', label: 'Rol' },
    { key: 'createdAt', label: 'Kayıt Tarihi' },
    { key: 'lastLogin', label: 'Son Giriş' },
    { key: 'isActive', label: 'Aktif' }
  ],
  teams: [
    { key: 'name', label: 'Takım Adı' },
    { key: 'memberCount', label: 'Üye Sayısı' },
    { key: 'createdAt', label: 'Oluşturulma Tarihi' },
    { key: 'lead', label: 'Takım Lideri' },
    { key: 'department', label: 'Departman' }
  ]
};

// Filter interface
interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

// Alan doğrulama fonksiyonu
function validateFields(dataSource: string, fields: string[]) {
  const availableFields = AVAILABLE_FIELDS[dataSource as keyof typeof AVAILABLE_FIELDS];
  if (!availableFields) return [];
  
  const validFieldKeys = availableFields.map(f => f.key);
  return fields.filter(field => validFieldKeys.includes(field));
}

// URL'den gelen filters parametresini parse et
function parseFilters(filtersParam: string): Filter[] {
  try {
    if (!filtersParam) return [];
    const decoded = decodeURIComponent(filtersParam);
    const parsed = JSON.parse(decoded);
    
    if (!Array.isArray(parsed)) return [];
    
    return parsed.filter(filter => 
      filter && 
      typeof filter.field === 'string' && 
      typeof filter.operator === 'string' && 
      typeof filter.value === 'string'
    );
  } catch (error) {
    console.error('Filtreler parse edilirken hata:', error);
    return [];
  }
}

// Basit where clause oluştur (PDF için temel filtreleme)
function createWhereClause(filters: Filter[]): any {
  if (filters.length === 0) return {};
  
  const whereConditions: any[] = [];
  
  for (const filter of filters) {
    const condition: any = {};
    let value: any = filter.value;
    
    // Temel veri dönüşümleri
    if (filter.value === 'true') value = true;
    else if (filter.value === 'false') value = false;
    else if (!isNaN(Number(filter.value))) value = Number(filter.value);
    
    // Temel operatörler
    switch (filter.operator) {
      case 'equals':
        condition[filter.field] = value;
        break;
      case 'contains':
        condition[filter.field] = { contains: value, mode: 'insensitive' };
        break;
      default:
        continue;
    }
    
    whereConditions.push(condition);
  }
  
  return whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
}

// Prisma select objesi oluşturma
function createSelectObject(dataSource: string, fields: string[]) {
  const select: any = {};
  
  fields.forEach(field => {
    if (field === 'author' && dataSource === 'contracts') {
      select.author = { select: { name: true } };
    } else if (field === 'company' && dataSource === 'contracts') {
      select.company = { select: { name: true } };
    } else {
      select[field] = true;
    }
  });
  
  return select;
}

// Veri çekme fonksiyonu (filtrelerle birlikte)
async function fetchReportData(dataSource: string, fields: string[], filters: Filter[] = []) {
  const validFields = validateFields(dataSource, fields);
  if (validFields.length === 0) return [];
  
  const selectObject = createSelectObject(dataSource, validFields);
  const whereClause = createWhereClause(filters);
  
  try {
    switch (dataSource) {
      case 'contracts':
        return await prisma.contract.findMany({
          select: selectObject,
          where: whereClause,
          take: 50,
          orderBy: { createdAt: 'desc' }
        });
        
      case 'users':
        return await prisma.user.findMany({
          select: selectObject,
          where: whereClause,
          take: 50,
          orderBy: { createdAt: 'desc' }
        });
        
      case 'teams':
        return [];
        
      default:
        return [];
    }
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return [];
  }
}

// PDF oluşturma fonksiyonu
function createPDF(data: any[], fields: string[], dataSource: string) {
  // PDF içeriğini HTML olarak oluştur
  const availableFields = AVAILABLE_FIELDS[dataSource as keyof typeof AVAILABLE_FIELDS];
  const fieldLabels = fields.map(field => 
    availableFields?.find(f => f.key === field)?.label || field
  );

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Contravo Raporu</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 20px; 
                color: #333;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #007bff;
                padding-bottom: 20px;
            }
            .title { 
                color: #007bff; 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px;
            }
            .subtitle { 
                color: #666; 
                font-size: 14px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            th { 
                background-color: #007bff; 
                color: white; 
                padding: 12px 8px; 
                text-align: left; 
                font-weight: bold;
                border: 1px solid #0056b3;
            }
            td { 
                padding: 10px 8px; 
                border: 1px solid #dee2e6;
                background-color: #fff;
            }
            tr:nth-child(even) td { 
                background-color: #f8f9fa; 
            }
            tr:hover td { 
                background-color: #e3f2fd; 
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #dee2e6;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">Contravo Sözleşme Yönetim Sistemi</div>
            <div class="subtitle">Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
        </div>
        
        <table>
            <thead>
                <tr>
                    ${fieldLabels.map(label => `<th>${label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
  `;

  data.forEach(row => {
    html += '<tr>';
    fields.forEach(field => {
      let value = row[field];
      
      // Veri formatlaması
      if (value === null || value === undefined) {
        value = '-';
      } else if (field === 'author' && typeof value === 'object') {
        value = value?.name || '-';
      } else if (field === 'company' && typeof value === 'object') {
        value = value?.name || '-';
      } else if (field.includes('Date') && value) {
        value = new Date(value).toLocaleDateString('tr-TR');
      } else if (typeof value === 'boolean') {
        value = value ? 'Evet' : 'Hayır';
      } else if (typeof value === 'number') {
        if (field === 'value') {
          value = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
          }).format(value);
        } else {
          value = value.toString();
        }
      }
      
      html += `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
    });
    html += '</tr>';
  });

  html += `
            </tbody>
        </table>
        
        <div class="footer">
            <p>Bu rapor Contravo Sözleşme Yönetim Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
            <p>Toplam ${data.length} kayıt listelendi.</p>
        </div>
    </body>
    </html>
  `;

  return html;
}

export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataSource = searchParams.get('dataSource');
    const fieldsParam = searchParams.get('fields');
    const filtersParam = searchParams.get('filters');
    
    if (!dataSource || !fieldsParam) {
      return new NextResponse('Eksik parametreler', { status: 400 });
    }

    const fields = fieldsParam.split(',').filter(Boolean);
    const filters = parseFilters(filtersParam || '');
    
    if (fields.length === 0) {
      return new NextResponse('En az bir alan seçilmeli', { status: 400 });
    }

    // Veriyi çek
    const reportData = await fetchReportData(dataSource, fields, filters);
    
    if (reportData.length === 0) {
      return new NextResponse('Veri bulunamadı', { status: 404 });
    }

    // PDF HTML içeriğini oluştur
    const htmlContent = createPDF(reportData, fields, dataSource);
    
    // Veri kaynağı etiketini belirle
    const dataSourceLabels = {
      contracts: 'Sözleşmeler',
      users: 'Kullanıcılar',
      teams: 'Takımlar'
    };
    
    const label = dataSourceLabels[dataSource as keyof typeof dataSourceLabels] || dataSource;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `contravo-${dataSource}-raporu-${timestamp}.html`;

    // HTML dosyası olarak döndür (PDF converter ile dönüştürülebilir)
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('PDF export hatası:', error);
    return new NextResponse('PDF export sırasında hata oluştu', { status: 500 });
  }
} 