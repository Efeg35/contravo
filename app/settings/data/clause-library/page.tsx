'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  ChevronDown,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Clause {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  visibility: string;
  approvalStatus: string;
  isActive: boolean;
  version: number;
  usageCount: number;
  createdBy: {
    name: string;
    email: string;
  };
  company?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    usageStats: number;
    contracts: number;
  };
}

interface ClauseFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  visibility: string;
}

export default function ClauseLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<ClauseFormData>({
    title: '',
    description: '',
    content: '',
    category: '',
    visibility: 'COMPANY'
  });

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Categories/Types for dropdown
  const categories = [
    'Governing Law',
    'Indemnification',
    'Limitation of Liability',
    'Termination',
    'Payment Terms',
    'Confidentiality',
    'Warranty',
    'Dispute Resolution',
    'Other'
  ];

  // Fetch all clauses
  const fetchClauses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clauses');
      const data = await response.json();
      
      if (response.ok) {
        setClauses(data.clauses || []);
      } else {
        toast.error('Clause\'lar yüklenemedi');
      }
    } catch (error) {
      console.error('Clauses fetch error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Create new clause
  const handleCreateClause = async () => {
    try {
      const response = await fetch('/api/admin/clauses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Clause başarıyla oluşturuldu');
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          content: '',
          category: '',
          visibility: 'COMPANY'
        });
        fetchClauses();
      } else {
        toast.error('Clause oluşturulamadı');
      }
    } catch (error) {
      console.error('Create clause error:', error);
      toast.error('Bir hata oluştu');
    }
  };

  // Filter clauses
  const filteredClauses = clauses.filter(clause => {
    const matchesSearch = clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clause.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || clause.category === typeFilter;
    
    return matchesSearch && matchesType;
  });

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchClauses();
    }
  }, [session]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clause library</h1>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              New clause
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Clause</DialogTitle>
              <DialogDescription>
                Add a new clause to your library
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter clause title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clause type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clause Text
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the clause content"
                  rows={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANY">Company</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClause}>
                Create Clause
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-blue-500 text-blue-600 py-2 px-1 text-sm font-medium">
            Clauses
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium">
            Types
          </button>
        </nav>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Type
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Loading clauses...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clause Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClauses.map((clause) => (
                  <tr key={clause.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {clause.title}
                          </div>
                          {clause.description && (
                            <div className="text-sm text-gray-500">
                              {clause.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        {clause.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {clause.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clause._count?.usageStats || 0} configuration{(clause._count?.usageStats || 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clause.createdBy.name} • {formatDate(clause.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredClauses.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-500">No clauses found</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 