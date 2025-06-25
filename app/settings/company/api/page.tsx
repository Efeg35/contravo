export default function CompanyAPIPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API</h1>
        <p className="text-gray-600 mt-1">Manage your API keys and access settings</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Bu özellik yakında eklenecek</h2>
        <p className="text-gray-500">API yönetimi özellikleri şu anda geliştirme aşamasındadır.</p>
      </div>
    </div>
  );
} 