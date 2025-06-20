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

// Veritabanından veri çek
async function fetchReportData(dataSource: string, fields: string[]) {
  try {
    const selectObj = createSelectObject(dataSource, fields);
    if (!selectObj) return [];

    switch (dataSource) {
      case 'contracts':
        return await prisma.contract.findMany({
          select: selectObj,
          take: 50, // İlk 50 kayıt
          orderBy: { createdAt: 'desc' }
        });
      
      case 'users':
        return await prisma.user.findMany({
          select: selectObj,
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
  const fields = fieldsParam ? fieldsParam.split(',').filter(Boolean) : [];

  // Eğer hem veri kaynağı hem de alanlar seçildiyse, veriyi çek
  let reportData: any[] = [];
  if (dataSource && fields.length > 0) {
    reportData = await fetchReportData(dataSource, fields);
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
            reportData={reportData}
            availableFields={AVAILABLE_FIELDS}
          />
        </Suspense>
      </main>
    </div>
  );
} 