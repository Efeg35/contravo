'use client';

import { useState } from 'react';
import {
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
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApprovalStep {
  id: string;
  stepName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  approver: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  comments?: string;
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

interface DigitalSignature {
  id: string;
  userId: string;
  status: string;
  signedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ContractFocusClientProps {
  contract: Contract;
  approvals: ApprovalStep[];
  attachments: Attachment[];
  digitalSignatures: DigitalSignature[];
}

const TABS = [
  { key: 'details', label: 'Detaylar', icon: DocumentTextIcon },
  { key: 'approvals', label: 'Onay Akışı', icon: CheckCircleIcon },
  { key: 'comments', label: 'Yorumlar', icon: ChatBubbleLeftRightIcon },
  { key: 'attachments', label: 'Ekler', icon: PaperClipIcon },
  { key: 'signatures', label: 'İmzalar', icon: BookOpenIcon },
];

export default function ContractFocusClient({
  contract,
  approvals,
  attachments,
  digitalSignatures
}: ContractFocusClientProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (content: string) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        console.log('Sözleşme başarıyla güncellendi');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Sözleşme güncelleme hatası:', error);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Column - Contract Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-medium text-gray-700">Sözleşme İçeriği</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              isEditing 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isEditing ? 'Görüntüleme Modu' : 'Düzenleme Modu'}
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          {isEditing ? (
            <ContractEditor
              contractId={contract.id}
              initialContent={contract.content}
              onSave={handleSave}
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
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Değer</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {contract.contractValue.toLocaleString('tr-TR')} {contract.currency || 'TRY'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Onay Akışı</h3>
              {approvals.length === 0 ? (
                <p className="text-sm text-gray-500">Henüz onay akışı tanımlanmamış.</p>
              ) : (
                <div className="space-y-3">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {approval.approver.name}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          approval.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          approval.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          approval.status === 'REVISION_REQUESTED' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {approval.status === 'APPROVED' ? 'Onaylandı' :
                           approval.status === 'REJECTED' ? 'Reddedildi' :
                           approval.status === 'REVISION_REQUESTED' ? 'Revizyon Talep Edildi' :
                           'Bekliyor'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{approval.approver.email}</p>
                      {approval.comments && (
                        <p className="text-sm text-gray-700 mt-2">{approval.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Ekler</h3>
              {attachments.length === 0 ? (
                <p className="text-sm text-gray-500">Henüz ek dosya yüklenmemiş.</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <PaperClipIcon className="w-4 h-4 text-gray-400" />
                        <a 
                          href={attachment.fileUrl}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {attachment.filename}
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {attachment.uploadedBy.name} tarafından {new Date(attachment.uploadedAt).toLocaleDateString('tr-TR')} tarihinde yüklendi
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'signatures' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Dijital İmzalar</h3>
              {digitalSignatures.length === 0 ? (
                <p className="text-sm text-gray-500">Henüz imza süreci başlatılmamış.</p>
              ) : (
                <div className="space-y-3">
                  {digitalSignatures.map((signature) => (
                    <div key={signature.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {signature.user.name}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          signature.status === 'SIGNED' ? 'bg-green-100 text-green-800' :
                          signature.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {signature.status === 'SIGNED' ? 'İmzalandı' :
                           signature.status === 'DECLINED' ? 'Reddedildi' : 'Bekliyor'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{signature.user.email}</p>
                      {signature.signedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          İmza tarihi: {new Date(signature.signedAt).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Yorumlar</h3>
              <p className="text-sm text-gray-500">Yorum sistemi yakında eklenecek.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 