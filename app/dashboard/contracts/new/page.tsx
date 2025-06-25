'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewContractPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState<{
    id: string;
    title: string;
    description?: string;
    content?: string;
    category: string;
  } | null>(null);
  const [loading, setLoading] = useState(!!templateId);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'DRAFT',
    type: 'general',
    value: '',
    startDate: '',
    endDate: '',
    expirationDate: '',     // 📅 SONA ERİŞ TARİHİ - Anahtar Tarih Takibi
    noticePeriodDays: '',   // 📢 FESİH İHBAR SÜRESİ - Kritik Tarih Hesaplaması
    renewalDate: '',
    reminderDays: [90, 60, 30, 7],
    autoRenewal: false,
    otherPartyName: '',
    otherPartyEmail: '',
    content: ''
  });
  const [potentialApprovers, setPotentialApprovers] = useState<any[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([]);
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Load template if templateId is provided
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (response.ok) {
          const templateData = await response.json();
          setTemplate(templateData);
          
          // Pre-fill form with template data
          setFormData(prev => ({
            ...prev,
            title: `${templateData.title} - Yeni Sözleşme`,
            description: templateData.description || '',
            content: templateData.content || '',
            type: getTypeFromCategory(templateData.category)
          }));
          
          toast.success(`"${templateData.title}" şablonu yüklendi`);
        } else {
          toast.error('Şablon yüklenirken hata oluştu');
        }
      } catch (error) {
        console.error('Template fetch error:');
        toast.error('Şablon yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  useEffect(() => {
    // Kullanıcı listesini çek (sadece kendi departmanındakileri getirir)
    fetch('/api/users/search?q=') // q parametresi boş
      .then(res => res.json())
      .then(data => {
        // API'den gelen veriyi kontrol et
        if (data && Array.isArray(data.users)) {
          setPotentialApprovers(data.users);
        } else {
          console.error('API\'den gelen kullanıcı verisi beklenen formatta değil:', data);
          setPotentialApprovers([]); // Boş array olarak ayarla
        }
      })
      .catch(error => {
        console.error('Kullanıcı listesi yüklenirken hata:', error);
        setPotentialApprovers([]); // Hata durumunda boş array olarak ayarla
      });
  }, []);

  useEffect(() => {
    // Onay akışı şablonlarını çek
    fetch('/api/workflow-templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWorkflowTemplates(data);
        } else {
          console.error('API\'den gelen şablon verisi beklenen formatta değil:', data);
          setWorkflowTemplates([]);
        }
      })
      .catch(error => {
        console.error('Onay akışı şablonları yüklenirken hata:', error);
        setWorkflowTemplates([]);
      });
  }, []);

  const getTypeFromCategory = (category: string) => {
    const categoryMap: Record<string, string> = {
      'EMPLOYMENT': 'employment',
      'SERVICE': 'service',
      'NDA': 'nda',
      'PARTNERSHIP': 'partnership',
      'SALES': 'sales',
      'RENTAL': 'rental',
      'CONSULTING': 'service',
      'SUPPLY': 'procurement',
      'OTHER': 'general'
    };
    return categoryMap[category] || 'general';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApproverChange = (userId: string) => {
    setSelectedApprovers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Lütfen sözleşme başlığını girin');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...formData, 
          approverIds: selectedApprovers,
          workflowTemplateId: selectedWorkflowTemplate || null
        }),
      });
      if (response.ok) {
        const contract = await response.json();
        router.push(`/dashboard/contracts/${contract.id}`);
      } else {
        console.error('Sözleşme oluşturma hatası');
        alert('Sözleşme oluşturulurken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Sözleşme oluşturma hatası:');
      alert('Sözleşme oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {templateId ? 'Şablon yükleniyor...' : 'Yükleniyor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/contracts"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Sözleşmeler
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {template ? `${template.title} - Yeni Sözleşme` : 'Yeni Sözleşme'}
                </h1>
                {template && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Şablondan oluşturuluyor: {template.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Sözleşme Bilgileri
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Sol kolon */}
                  <div className="space-y-6">
                    {/* Başlık */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sözleşme Başlığı *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: Tedarik Sözleşmesi"
                      />
                    </div>

                    {/* Sözleşme Türü */}
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sözleşme Türü
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="general">Genel Sözleşme</option>
                        <option value="procurement">Tedarik Sözleşmesi</option>
                        <option value="service">Hizmet Sözleşmesi</option>
                        <option value="sales">Satış Sözleşmesi</option>
                        <option value="employment">İş Sözleşmesi</option>
                        <option value="partnership">Ortaklık Sözleşmesi</option>
                        <option value="nda">Gizlilik Anlaşması (NDA)</option>
                        <option value="rental">Kira Sözleşmesi</option>
                      </select>
                    </div>

                    {/* Diğer Taraf */}
                    <div>
                      <label htmlFor="otherPartyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Karşı Taraf (Şirket/Kişi)
                      </label>
                      <input
                        type="text"
                        id="otherPartyName"
                        name="otherPartyName"
                        value={formData.otherPartyName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: ABC Ltd. Şti."
                      />
                    </div>

                    {/* Diğer Taraf E-posta */}
                    <div>
                      <label htmlFor="otherPartyEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Karşı Taraf E-posta
                      </label>
                      <input
                        type="email"
                        id="otherPartyEmail"
                        name="otherPartyEmail"
                        value={formData.otherPartyEmail}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: info@abc.com"
                      />
                    </div>
                  </div>

                  {/* Sağ kolon */}
                  <div className="space-y-6">
                    {/* Durum */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Durum
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="DRAFT">Taslak</option>
                        <option value="REVIEW">İncelemede</option>
                        <option value="SIGNING">İmza Sürecinde</option>
                      </select>
                    </div>

                    {/* Değer */}
                    <div>
                      <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Değer (TL)
                      </label>
                      <input
                        type="number"
                        id="value"
                        name="value"
                        value={formData.value}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: 50000"
                      />
                    </div>

                    {/* Başlangıç Tarihi */}
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* Bitiş Tarihi */}
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* 📅 SONA ERİŞ TARİHİ - Anahtar Tarih Takibi */}
                    <div>
                      <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📅 Bitiş Tarihi
                        <span className="text-gray-500 text-xs block">Sözleşmenin sona ereceği kritik tarih</span>
                      </label>
                      <input
                        type="date"
                        id="expirationDate"
                        name="expirationDate"
                        value={formData.expirationDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* 📢 FESİH İHBAR SÜRESİ - Kritik Tarih Hesaplaması */}
                    <div>
                      <label htmlFor="noticePeriodDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📢 İhbar Süresi (gün)
                        <span className="text-gray-500 text-xs block">Fesih için gerekli önceden bildirim süresi</span>
                      </label>
                      <input
                        type="number"
                        id="noticePeriodDays"
                        name="noticePeriodDays"
                        value={formData.noticePeriodDays}
                        onChange={handleChange}
                        min="0"
                        max="365"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: 30"
                      />
                    </div>

                    {/* 🚀 YENİLEME TARİHİ - "Kör Depolama" Probleminin Çözümü */}
                    <div>
                      <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🔄 Yenileme Tarihi
                        <span className="text-gray-500 text-xs block">Proaktif takip için kritik</span>
                      </label>
                      <input
                        type="date"
                        id="renewalDate"
                        name="renewalDate"
                        value={formData.renewalDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* 🔄 OTOMATİK YENİLEME */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.autoRenewal}
                          onChange={(e) => setFormData({...formData, autoRenewal: e.target.checked})}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🔄 Otomatik Yenileme</span>
                          <p className="text-xs text-gray-500">Süre dolduğunda otomatik yenilensin</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Açıklama - Tam genişlik */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Sözleşme hakkında kısa açıklama..."
                  />
                </div>

                {/* Sözleşme İçeriği - Template'den geliyorsa */}
                {template && (
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sözleşme İçeriği (Şablondan)
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      rows={12}
                      value={formData.content}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                      placeholder="Sözleşme içeriği..."
                    />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Bu içerik seçtiğiniz şablondan geliyor. Değişkenleri (örn: {`{{COMPANY_NAME}}`}) gerçek değerlerle değiştirebilirsiniz.
                    </p>
                  </div>
                )}

                {/* Onay Akışı Şablonu (İsteğe bağlı) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🔄 Onay Akışı Şablonu (İsteğe bağlı)
                    <span className="text-gray-500 text-xs block">Önceden tanımlanmış onay akışı şablonlarından birini seçebilirsiniz</span>
                  </label>
                  <select
                    value={selectedWorkflowTemplate}
                    onChange={(e) => setSelectedWorkflowTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Manuel onaylayıcı seçimi</option>
                    {workflowTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                        {template.description && ` - ${template.description}`}
                      </option>
                    ))}
                  </select>
                  {selectedWorkflowTemplate && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-center text-sm text-blue-800 dark:text-blue-200">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Seçilen şablon kullanılacak. Manuel onaylayıcı seçimi devre dışı.
                      </div>
                    </div>
                  )}
                </div>

                {/* Onaylayıcılar */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                    Onaylayıcıları Seç (Ad-hoc)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Bu sözleşmeyi ayrıca onaylaması gereken kişileri seçin. Bu seçim, seçili onay akışı şablonuna ek olarak çalışır.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {potentialApprovers.map(approver => (
                      <div key={approver.id} className="flex items-center">
                        <input
                          id={`approver-${approver.id}`}
                          name="approvers"
                          type="checkbox"
                          checked={selectedApprovers.includes(approver.id)}
                          onChange={() => handleApproverChange(approver.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`approver-${approver.id}`} className="ml-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          {approver.name}
                          {approver.departmentRole && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({approver.departmentRole})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Birden fazla onaylayıcı seçebilirsiniz. Boş bırakabilirsiniz.</p>
                </div>

                {/* Yardım paneli */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Sözleşme Oluşturma İpuçları
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Başlık alanı zorunludur ve sözleşmenizi tanımlayıcı olmalıdır.</li>
                          <li>Sözleşme türünü doğru seçin, bu sonradan şablonlar için kullanılacaktır.</li>
                          <li>Tüm alanları doldurmanız gerekmez, sonradan düzenleyebilirsiniz.</li>
                          <li>Oluşturduktan sonra sözleşmenizi detay sayfasında düzenleyebilirsiniz.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-6">
                  <Link
                    href="/dashboard/contracts"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    İptal
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Oluşturuluyor...
                      </>
                    ) : (
                      'Sözleşme Oluştur'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 