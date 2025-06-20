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

// Filter interface
interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

// Güvenlik: İzin verilen alanları kontrol et
function validateFields(dataSource: string, fields: string[]): string[] {
  const availableFields = AVAILABLE_FIELDS[dataSource as keyof typeof AVAILABLE_FIELDS];
  if (!availableFields) return [];
  
  const allowedFieldKeys = availableFields.map(f => f.key);
  return fields.filter(field => allowedFieldKeys.includes(field));
}

// Güvenlik: İzin verilen filtreleri kontrol et
function validateFilters(dataSource: string, filters: Filter[]): Filter[] {
  const availableFields = AVAILABLE_FIELDS[dataSource as keyof typeof AVAILABLE_FIELDS];
  if (!availableFields) return [];
  
  const allowedFieldKeys = availableFields.map(f => f.key);
  
  return filters.filter(filter => {
    if (!allowedFieldKeys.includes(filter.field)) return false;
    const allowedOperators = ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte'];
    if (!allowedOperators.includes(filter.operator)) return false;
    if (!filter.value && filter.value !== '0' && filter.value !== 'false') return false;
    return true;
  });
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

// Prisma where clause oluştur
function createWhereClause(dataSource: string, filters: Filter[]): any {
  const validatedFilters = validateFilters(dataSource, filters);
  
  if (validatedFilters.length === 0) return {};
  
  const whereConditions: any[] = [];
  
  for (const filter of validatedFilters) {
    const condition: any = {};
    
    let fieldPath = filter.field;
    if (filter.field === 'author' && dataSource === 'contracts') {
      fieldPath = 'author.name';
    } else if (filter.field === 'company' && dataSource === 'contracts') {
      fieldPath = 'company.name';
    } else if (filter.field === 'lead' && dataSource === 'teams') {
      fieldPath = 'lead.name';
    }
    
    let value: any = filter.value;
    
    if (filter.value === 'true') {
      value = true;
    } else if (filter.value === 'false') {
      value = false;
    } else if (filter.field === 'value' || filter.field === 'memberCount') {
      const numValue = parseFloat(filter.value);
      if (!isNaN(numValue)) {
        value = numValue;
      }
    } else if (filter.field.includes('Date') || filter.field.includes('At') || filter.field === 'lastLogin') {
      const dateValue = new Date(filter.value);
      if (!isNaN(dateValue.getTime())) {
        value = dateValue;
      }
    }
    
    switch (filter.operator) {
      case 'equals':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { equals: value } };
        } else {
          condition[fieldPath] = { equals: value };
        }
        break;
      case 'notEquals':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { not: value } };
        } else {
          condition[fieldPath] = { not: value };
        }
        break;
      case 'contains':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { contains: value, mode: 'insensitive' } };
        } else {
          condition[fieldPath] = { contains: value, mode: 'insensitive' };
        }
        break;
      case 'startsWith':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { startsWith: value, mode: 'insensitive' } };
        } else {
          condition[fieldPath] = { startsWith: value, mode: 'insensitive' };
        }
        break;
      case 'endsWith':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { endsWith: value, mode: 'insensitive' } };
        } else {
          condition[fieldPath] = { endsWith: value, mode: 'insensitive' };
        }
        break;
      case 'gt':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { gt: value } };
        } else {
          condition[fieldPath] = { gt: value };
        }
        break;
      case 'gte':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { gte: value } };
        } else {
          condition[fieldPath] = { gte: value };
        }
        break;
      case 'lt':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { lt: value } };
        } else {
          condition[fieldPath] = { lt: value };
        }
        break;
      case 'lte':
        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          condition[parent] = { [child]: { lte: value } };
        } else {
          condition[fieldPath] = { lte: value };
        }
        break;
      default:
        continue;
    }
    
    whereConditions.push(condition);
  }
  
  if (whereConditions.length === 0) return {};
  
  return whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
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

// Veritabanından veri çek (filtrelerle birlikte)
async function fetchReportData(dataSource: string, fields: string[], filters: Filter[] = []) {
  try {
    const selectObj = createSelectObject(dataSource, fields);
    if (!selectObj) return [];

    const whereClause = createWhereClause(dataSource, filters);

    switch (dataSource) {
      case 'contracts':
        return await prisma.contract.findMany({
          select: selectObj,
          where: whereClause,
          take: 1000, // CSV için daha fazla kayıt
          orderBy: { createdAt: 'desc' }
        });
      
      case 'users':
        return await prisma.user.findMany({
          select: selectObj,
          where: whereClause,
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
    const filtersParam = searchParams.get('filters');
    
    if (!dataSource || !fieldsParam) {
      return new NextResponse('Invalid parameters', { status: 400 });
    }

    const fields = fieldsParam.split(',').filter(Boolean);
    const filters = parseFilters(filtersParam || '');
    
    // Veriyi çek
    const reportData = await fetchReportData(dataSource, fields, filters);
    
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