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
    { key: 'isActive', label: 'Aktif Durum' }
  ],
  teams: [
    { key: 'name', label: 'Takım Adı' },
    { key: 'memberCount', label: 'Üye Sayısı' },
    { key: 'createdAt', label: 'Oluşturulma Tarihi' },
    { key: 'lead', label: 'Takım Lideri' },
    { key: 'department', label: 'Departman' }
  ]
};

// Güvenlik: İzin verilen alanları kontrol et
function validateFields(dataSource: string, fields: string[]): string[] {
  const availableFields = AVAILABLE_FIELDS[dataSource as keyof typeof AVAILABLE_FIELDS];
  if (!availableFields) return [];
  
  const allowedFieldKeys = availableFields.map(f => f.key);
  return fields.filter(field => allowedFieldKeys.includes(field));
}

// Dinamik select objesi oluştur
function createSelectObject(dataSource: string, fields: string[]): any {
  const validatedFields = validateFields(dataSource, fields);
  
  if (validatedFields.length === 0) return undefined;
  
  const selectObj: any = { id: true };
  
  for (const field of validatedFields) {
    if (field === 'author' && dataSource === 'contracts') {
      selectObj.author = { select: { name: true, email: true } };
    } else if (field === 'company' && dataSource === 'contracts') {
      selectObj.company = { select: { name: true } };
    } else if (field === 'lead' && dataSource === 'teams') {
      selectObj.lead = { select: { name: true, email: true } };
    } else {
      selectObj[field] = true;
    }
  }
  
  return selectObj;
}

// Veritabanından veri çek
async function fetchReportData(dataSource: string, fields: string[]) {
  try {
    const selectObj = createSelectObject(dataSource, fields);
    if (!selectObj) return [];

    switch (dataSource) {
      case 'contracts':
        return await prisma.contract.findMany({
          select: selectObj,
          take: 1000, // CSV için daha fazla kayıt
          orderBy: { createdAt: 'desc' }
        });
      
      case 'users':
        return await prisma.user.findMany({
          select: selectObj,
          take: 1000,
          orderBy: { createdAt: 'desc' }
        });
      
      case 'teams':
        return [];
      
      default:
        return [];
    }
  } catch (error) {
    console.error('Rapor verisi çekilirken hata:', error);
    return [];
  }
}

// Veri formatla
function formatCellData(data: any, fieldKey: string): string {
  if (!data) return '';
  
  // Nested object handling
  if (typeof data === 'object' && data !== null) {
    if (data.name) return data.name;
    if (data.email) return data.email;
    return JSON.stringify(data);
  }
  
  // Date formatting
  if (fieldKey.includes('Date') || fieldKey.includes('At')) {
    try {
      return new Date(data).toLocaleDateString('tr-TR');
    } catch {
      return String(data);
    }
  }
  
  // Boolean values
  if (typeof data === 'boolean') {
    return data ? 'Evet' : 'Hayır';
  }
  
  return String(data);
}

// CSV formatına çevir
function convertToCSV(data: any[], fields: string[], dataSource: string): string {
  const availableFields = AVAILABLE_FIELDS[dataSource as keyof typeof AVAILABLE_FIELDS];
  if (!availableFields) return '';
  
  // Header satırı
  const headers = fields.map(field => {
    const fieldInfo = availableFields.find(f => f.key === field);
    return fieldInfo ? fieldInfo.label : field;
  });
  
  // Veri satırları
  const rows = data.map(row => {
    return fields.map(field => {
      const cellData = formatCellData(row[field], field);
      // CSV için özel karakterleri escape et
      return `"${cellData.replace(/"/g, '""')}"`;
    });
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
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
    
    if (!dataSource || !fieldsParam) {
      return new NextResponse('Invalid parameters', { status: 400 });
    }

    const fields = fieldsParam.split(',').filter(Boolean);
    
    // Veriyi çek
    const reportData = await fetchReportData(dataSource, fields);
    
    if (reportData.length === 0) {
      return new NextResponse('No data found', { status: 404 });
    }

    // CSV formatına çevir
    const csvContent = convertToCSV(reportData, fields, dataSource);
    
    // Dosya adı oluştur
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${dataSource}_raporu_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { dataSource, fields } = body;

    if (!dataSource || !fields || !Array.isArray(fields)) {
      return new NextResponse('Invalid parameters', { status: 400 });
    }

    // Veriyi çek
    const reportData = await fetchReportData(dataSource, fields);
    
    if (reportData.length === 0) {
      return new NextResponse('No data found', { status: 404 });
    }

    // CSV formatına çevir
    const csvContent = convertToCSV(reportData, fields, dataSource);
    
    // Dosya adı oluştur
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${dataSource}_raporu_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 