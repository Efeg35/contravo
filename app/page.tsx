import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navigation */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Contravo
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#ozellikler" className="text-gray-600 hover:text-indigo-600 transition-all duration-200 font-medium">
                Özellikler
              </a>
              <a href="#cozumler" className="text-gray-600 hover:text-indigo-600 transition-all duration-200 font-medium">
                Çözümler
              </a>
              <a href="#fiyatlandirma" className="text-gray-600 hover:text-indigo-600 transition-all duration-200 font-medium">
                Fiyatlandırma
              </a>
              <Link 
                href="/auth/login"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-200 font-medium"
              >
                Giriş Yap
              </Link>
              <Link 
                href="/auth/register"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
              >
                Ücretsiz Başlayın
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-20">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute top-20 right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
            <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                  🚀 Türkiye'nin #1 Sözleşme Yönetim Platformu
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Sözleşme Yönetiminde
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Devrim Yaratın
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
                Türk hukuk sistemine uygun, yapay zeka destekli sözleşme yönetim platformu ile 
                işletmenizi dijital dönüşümde öne çıkarın.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link 
                  href="/auth/register"
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>14 Gün Ücretsiz Deneyin</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link 
                  href="/auth/login"
                  className="group border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Canlı Demo İzleyin</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>ISO 27001 Sertifikalı</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>KVKK Uyumlu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>7/24 Türkçe Destek</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="ozellikler" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Güçlü Özellikler, Basit Kullanım
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Kurumsal düzeyde güvenlik ve performansla sözleşme süreçlerinizi otomatikleştirin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "🤖",
                  title: "Yapay Zeka Destekli Analiz",
                  description: "Sözleşmelerinizi otomatik analiz ederek risk alanlarını tespit edin ve öneriler alın",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: "🔐",
                  title: "Bankacılık Düzeyinde Güvenlik",
                  description: "256-bit SSL şifreleme ve çok faktörlü kimlik doğrulama ile verileriniz güvende",
                  color: "from-green-500 to-emerald-500"
                },
                {
                  icon: "📊",
                  title: "Gelişmiş Raporlama & Analitik",
                  description: "Gerçek zamanlı dashboard'lar ve özelleştirilebilir raporlarla performansınızı izleyin",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: "⚡",
                  title: "Otomatik İş Akışları",
                  description: "Onay süreçlerini otomatikleştirin, hatırlatmalar alın ve verimliliği artırın",
                  color: "from-orange-500 to-red-500"
                },
                {
                  icon: "🌐",
                  title: "Entegrasyon Merkezi",
                  description: "SAP, Oracle, Microsoft 365 ve 100+ uygulama ile sorunsuz entegrasyon",
                  color: "from-indigo-500 to-purple-500"
                },
                {
                  icon: "📱",
                  title: "Mobil & Bulut Erişimi",
                  description: "Her yerden, her cihazdan güvenli erişim. Offline çalışma desteği",
                  color: "from-teal-500 to-blue-500"
                }
              ].map((feature, index) => (
                <div key={index} className="group relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Dijital Dönüşümünüze Hemen Başlayın
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto">
              Binlerce şirketin tercih ettiği Contravo ile sözleşme süreçlerinizi modernleştirin. 
              Kurulum ücretsiz, kullanım kolay.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/auth/register"
                className="bg-white text-indigo-900 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Ücretsiz Hesap Oluşturun
              </Link>
              <Link 
                href="/auth/login"
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all duration-300"
              >
                Demo Talep Edin
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <h3 className="text-2xl font-bold">Contravo</h3>
              </div>
              <p className="text-gray-400 max-w-md">
                Türkiye'nin en gelişmiş sözleşme yaşam döngüsü yönetimi platformu. 
                Hukuk teknolojilerinde öncü çözümler sunuyoruz.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Ürün</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Entegrasyonlar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Güvenlik</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Destek</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Canlı Destek</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Eğitim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 Contravo. Tüm hakları saklıdır.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Kullanım Şartları</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">KVKK</a>
            </div>
          </div>
        </div>
      </footer>


    </div>
  )
} 