import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import NewReportClient from './components/NewReportClient';

// Veri kaynağına göre mevcut alanlar
const AVAILABLE_FIELDS = {
  contracts: [
    { key: 'title', label: 'Başlık', description: 'Sözleşme başlığı' },
    { key: 'status', label: 'Durum', description: 'Mevcut sözleşme durumu' },
    { key: 'expirationDate', label: 'Bitiş Tarihi', description: 'Sözleşme bitiş tarihi' },
    { key: 'createdAt', label: 'Oluşturulma Tarihi', description: 'Sözleşme oluşturulma tarihi' },
    { key: 'author', label: 'Oluşturan Kişi', description: 'Sözleşmeyi oluşturan kullanıcı' },
    { key: 'company', label: 'Şirket', description: 'İlgili şirket bilgisi' },
    { key: 'value', label: 'Değer', description: 'Sözleşme değeri' },
    { key: 'category', label: 'Kategori', description: 'Sözleşme kategorisi' }
  ],
  users: [
    { key: 'name', label: 'Ad', description: 'Kullanıcı adı' },
    { key: 'email', label: 'E-posta', description: 'E-posta adresi' },
    { key: 'role', label: 'Rol', description: 'Kullanıcı rolü' },
    { key: 'createdAt', label: 'Kayıt Tarihi', description: 'Hesap oluşturulma tarihi' },
    { key: 'lastLogin', label: 'Son Giriş', description: 'Son giriş tarihi' },
    { key: 'isActive', label: 'Aktif Durum', description: 'Kullanıcı aktif mi?' }
  ],
  teams: [
    { key: 'name', label: 'Takım Adı', description: 'Takım adı' },
    { key: 'memberCount', label: 'Üye Sayısı', description: 'Takım üye sayısı' },
    { key: 'createdAt', label: 'Oluşturulma Tarihi', description: 'Takım oluşturulma tarihi' },
    { key: 'lead', label: 'Takım Lideri', description: 'Takım lideri' },
    { key: 'department', label: 'Departman', description: 'Bağlı departman' }
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

// Güvenlik: İzin verilen filtreleri kontrol et ve geçerli filtreleri döndür
function validateFilters(dataSource: string, filters: Filter[]): Filter[] {
  const availableFields = AVAILABLE_FIELDS[dataSource as keyof typeof AVAILABLE_FIELDS];
  if (!availableFields) return [];
  
  const allowedFieldKeys = availableFields.map(f => f.key);
  
  return filters.filter(filter => {
    // Alan geçerli mi?
    if (!allowedFieldKeys.includes(filter.field)) return false;
    
    // Operator geçerli mi?
    const allowedOperators = ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte'];
    if (!allowedOperators.includes(filter.operator)) return false;
    
    // Value var mı?
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
    
    // Nested field handling
    let fieldPath = filter.field;
    if (filter.field === 'author' && dataSource === 'contracts') {
      fieldPath = 'author.name';
    } else if (filter.field === 'company' && dataSource === 'contracts') {
      fieldPath = 'company.name';
    } else if (filter.field === 'lead' && dataSource === 'teams') {
      fieldPath = 'lead.name';
    }
    
    // Value processing
    let value: any = filter.value;
    
    // Boolean conversion
    if (filter.value === 'true') {
      value = true;
    } else if (filter.value === 'false') {
      value = false;
    } 
    // Number conversion
    else if (filter.field === 'value' || filter.field === 'memberCount') {
      const numValue = parseFloat(filter.value);
      if (!isNaN(numValue)) {
        value = numValue;
      }
    }
    // Date conversion
    else if (filter.field.includes('Date') || filter.field.includes('At') || filter.field === 'lastLogin') {
      const dateValue = new Date(filter.value);
      if (!isNaN(dateValue.getTime())) {
        value = dateValue;
      }
    }
    
    // Operator mapping
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
        continue; // Skip unknown operators
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
  
  const selectObj: any = { id: true }; // Her zaman ID'yi dahil et
  
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
          take: 50, // İlk 50 kayıt
          orderBy: { createdAt: 'desc' }
        });
      
      case 'users':
        return await prisma.user.findMany({
          select: selectObj,
          where: whereClause,
          take: 50,
          orderBy: { createdAt: 'desc' }
        });
      
      case 'teams':
        // Teams tablosu olmadığı için şimdilik boş dönelim
        return [];
      
      default:
        return [];
    }
  } catch (error) {
    console.error('Rapor verisi çekilirken hata:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewReportPage({ searchParams }: PageProps) {
  // Auth kontrolü
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }

  // Search params'ı await ile çöz
  const resolvedSearchParams = await searchParams;
  
  // URL parametrelerini oku
  const dataSource = typeof resolvedSearchParams.dataSource === 'string' ? resolvedSearchParams.dataSource : '';
  const fieldsParam = typeof resolvedSearchParams.fields === 'string' ? resolvedSearchParams.fields : '';
  const filtersParam = typeof resolvedSearchParams.filters === 'string' ? resolvedSearchParams.filters : '';
  
  const fields = fieldsParam ? fieldsParam.split(',').filter(Boolean) : [];
  const filters = parseFilters(filtersParam);

  // Eğer hem veri kaynağı hem de alanlar seçildiyse, veriyi çek
  let reportData: any[] = [];
  if (dataSource && fields.length > 0) {
    reportData = await fetchReportData(dataSource, fields, filters);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              {/* Left side - Navigation & Title */}
              <div className="flex items-center space-x-6">
                <Link
                  href="/dashboard/reports"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200 group"
                >
                  <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Raporlar</span>
                </Link>
                
                <div className="w-px h-6 bg-white/30"></div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Özel Rapor Oluşturucu</h1>
                    <p className="text-white/70 text-sm">Kişiselleştirilmiş analitik raporları oluşturun</p>
                  </div>
                </div>
              </div>

              {/* Right side - Actions - Bu client component'te olacak */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <NewReportClient 
            initialDataSource={dataSource}
            initialFields={fields}
            initialFilters={filters}
            reportData={reportData}
            availableFields={AVAILABLE_FIELDS}
          />
        </Suspense>
      </main>
    </div>
  );
} 