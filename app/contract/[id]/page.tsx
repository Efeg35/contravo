'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  XMarkIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import ContractEditor from '@/components/ContractEditor';

interface Contract {
  id: string;
  title: string;
  content: string;
  status: string;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
  otherPartyName?: string;
  otherPartyEmail?: string;
  contractValue?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  expirationDate?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApprovalStep {
  id: string;
  stepName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approver: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  comments?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface Attachment {
  id: string;
  filename: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: {
    name: string;
  };
}

interface Clause {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  visibility: string;
  createdBy: {
    name: string;
    email: string;
  };
  addedAt: string;
}

const TABS = [
  { key: 'details', label: 'Detaylar', icon: DocumentTextIcon },
  { key: 'approvals', label: 'Onay Akışı', icon: CheckCircleIcon },
  { key: 'comments', label: 'Yorumlar', icon: ChatBubbleLeftRightIcon },
  { key: 'attachments', label: 'Ekler', icon: PaperClipIcon },
  { key: 'clauses', label: 'Maddeler', icon: BookOpenIcon },
];

export default function ContractFocusPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [approvals, setApprovals] = useState<ApprovalStep[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchContract();
    fetchApprovals();
    fetchComments();
    fetchAttachments();
    fetchClauses();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`);
      if (response.ok) {
        const data = await response.json();
        setContract(data);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/approvals`);
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.approvals || []);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchClauses = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/clauses`);
      if (response.ok) {
        const data = await response.json();
        setClauses(data.clauses || []);
      }
    } catch (error) {
      console.error('Error fetching clauses:', error);
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleClose = () => {
    router.push('/dashboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED': return 'bg-green-100 text-green-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageDisplay = (stage: string) => {
    const stageMap = {
      'DRAFT': 'Taslak',
      'IN_REVIEW': 'İncelemede',
      'APPROVED': 'Onaylandı',
      'SIGNED': 'İmzalandı',
      'ARCHIVED': 'Arşivlendi',
      'REJECTED': 'Reddedildi'
    };
    return stageMap[stage as keyof typeof stageMap] || stage;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sözleşme bulunamadı</h2>
          <p className="text-gray-600 mb-4">Aradığınız sözleşme mevcut değil veya erişim yetkiniz yok.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Control Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-96">
                {contract.title}
              </h1>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                  {getStageDisplay(contract.currentStage)}
                </span>
                {contract.otherPartyName && (
                  <span className="text-sm text-gray-500">
                    • {contract.otherPartyName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isEditing ? <EyeIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Contract Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto">
            {isEditing ? (
              <ContractEditor
                contractId={contractId}
                initialContent={contract?.content || ''}
                onSave={async (content: string) => {
                  // Save contract content
                  const response = await fetch(`/api/contracts/${contractId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content }),
                  });
                  
                  if (response.ok) {
                    // Refresh contract data
                    fetchContract();
                  }
                }}
                isEditable={true}
              />
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                  {contract.content || 'Sözleşme içeriği henüz yüklenmedi...'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Tabbed Panel */}
        <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
          {/* Tab Headers */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-white">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Temel Bilgiler</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Oluşturulma: {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Güncelleme: {new Date(contract.updatedAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    {contract.expirationDate && (
                      <div className="flex items-center space-x-2">
                        <ExclamationCircleIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Vade: {new Date(contract.expirationDate).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {contract.otherPartyName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Diğer Taraf</h3>
                    <div className="flex items-center space-x-2">
                      <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contract.otherPartyName}</p>
                        {contract.otherPartyEmail && (
                          <p className="text-xs text-gray-500">{contract.otherPartyEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {contract.contractValue && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Sözleşme Değeri</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {contract.contractValue.toLocaleString('tr-TR')} {contract.currency || 'TL'}
                    </p>
                  </div>
                )}

                {contract.assignedTo && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Sorumlu</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {contract.assignedTo.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contract.assignedTo.name}</p>
                        <p className="text-xs text-gray-500">{contract.assignedTo.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Onay Süreci</h3>
                {approvals.length > 0 ? (
                  <div className="space-y-4">
                    {approvals.map((approval, index) => (
                      <div key={approval.id} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          approval.status === 'APPROVED' ? 'bg-green-100' :
                          approval.status === 'REJECTED' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          {approval.status === 'APPROVED' ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          ) : approval.status === 'REJECTED' ? (
                            <XMarkIcon className="w-5 h-5 text-red-600" />
                          ) : (
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{approval.stepName}</p>
                          <p className="text-xs text-gray-500">{approval.approver.name}</p>
                          {approval.approvedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(approval.approvedAt).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                          {approval.comments && (
                            <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                              {approval.comments}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Henüz onay süreci başlatılmamış.</p>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Yorumlar</h3>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {comment.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">{comment.user.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Henüz yorum yapılmamış.</p>
                )}
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Ekler</h3>
                {attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                        <PaperClipIcon className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.uploadedBy.name} • {new Date(attachment.uploadedAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          İndir
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Henüz ek dosya bulunmuyor.</p>
                )}
              </div>
            )}

            {activeTab === 'clauses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Sözleşme Maddeleri</h3>
                  <span className="text-xs text-gray-500">{clauses.length} madde</span>
                </div>
                
                {clauses.length > 0 ? (
                  <div className="space-y-4">
                    {clauses.map((clause) => (
                      <div key={clause.id} className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{clause.title}</h4>
                            {clause.description && (
                              <p className="text-sm text-gray-600 mb-3">{clause.description}</p>
                            )}
                            
                            {/* Category and visibility badges */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {clause.category}
                              </span>
                              {clause.visibility === 'PUBLIC' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Herkese Açık
                                </span>
                              )}
                              {clause.visibility === 'COMPANY' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Şirket İçi
                                </span>
                              )}
                            </div>
                            
                            {/* Clause content preview */}
                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                              <p className="line-clamp-3">{clause.content}</p>
                            </div>
                            
                            {/* Meta information */}
                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <span>Oluşturan: {clause.createdBy.name}</span>
                              </div>
                              <span>
                                Eklenme: {new Date(clause.addedAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz madde eklenmemiş</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Bu sözleşmeye henüz Smart Clause eklenmemiş.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 