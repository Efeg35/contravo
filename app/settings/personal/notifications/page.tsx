export default function PersonalNotificationsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">Manage your personal notification preferences</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 16l4-4m0 0l4-4m-4 4h12" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Bu özellik yakında eklenecek</h2>
        <p className="text-gray-500">Bildirim ayarları özellikleri şu anda geliştirme aşamasındadır.</p>
      </div>
    </div>
  );
} 