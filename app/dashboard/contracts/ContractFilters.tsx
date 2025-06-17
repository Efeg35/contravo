"use client";

import { useRouter, useSearchParams } from 'next/navigation';

function ContractFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || 'all';
  const type = searchParams.get('type') || 'all';

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`?${params.toString()}`);
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Sözleşme ara..."
            value={q}
            onChange={e => updateParam('q', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={e => updateParam('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="DRAFT">Taslak</option>
            <option value="IN_REVIEW">İncelemede</option>
            <option value="APPROVED">Onaylandı</option>
            <option value="SIGNED">İmzalandı</option>
            <option value="ARCHIVED">Arşivlendi</option>
          </select>
          <select
            value={type}
            onChange={e => updateParam('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Türler</option>
            <option value="NDA">Gizlilik</option>
            <option value="SERVICE">Hizmet</option>
            <option value="EMPLOYMENT">İş</option>
            <option value="PARTNERSHIP">Ortaklık</option>
            <option value="SALES">Satış</option>
            <option value="LEASE">Kira</option>
            <option value="OTHER">Diğer</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ContractFilters; 