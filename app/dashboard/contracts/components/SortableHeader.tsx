'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  sortKey: 'title' | 'status' | 'createdAt' | 'updatedAt' | 'expirationDate';
}

export default function SortableHeader({ label, sortKey }: SortableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentOrder = searchParams.get('order') || 'desc';

  const handleSort = () => {
    const newOrder = currentSortBy === sortKey && currentOrder === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortKey);
    params.set('order', newOrder);
    router.push(`?${params.toString()}`);
  };

  const getSortIcon = () => {
    if (currentSortBy !== sortKey) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return currentOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <button
      onClick={handleSort}
      className="flex items-center font-medium hover:text-blue-600 transition-colors"
    >
      {label}
      {getSortIcon()}
    </button>
  );
} 