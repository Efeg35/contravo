'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface ApprovalStatus {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  comment?: string;
  approvedAt?: string;
  createdAt: string;
  approver: {
    id: string;
    name?: string;
    email: string;
  };
}

interface ContractApprovalProps {
  contractId: string;
  contractStatus: string;
  isOwner: boolean;
  onStatusUpdate?: () => void;
}

interface User {
  id: string;
  name?: string;
  email: string;
}

export default function ContractApproval({ 
  contractId, 
  contractStatus, 
  isOwner,
  onStatusUpdate 
}: ContractApprovalProps) {
  const { data: session } = useSession();
  const [approvals, setApprovals] = useState<ApprovalStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);

  const fetchApprovals = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/approvals`);
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.approvals);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchApprovalsCallback = useCallback(fetchApprovals, [contractId, fetchApprovals]);

  useEffect(() => {
    fetchApprovalsCallback();
  }, [fetchApprovalsCallback]);

  const handleRequestApprovals = async () => {
    if (selectedApprovers.length === 0) {
      toast.error('En az bir onaylayıcı seçmelisiniz');
      return;
    }

    setIsRequestingApproval(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approverIds: selectedApprovers,
        }),
      });

      if (response.ok) {
        toast.success('Onay istekleri başarıyla gönderildi!');
        setShowApprovalForm(false);
        setSelectedApprovers([]);
        fetchApprovals();
        onStatusUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Onay istekleri gönderilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error requesting approvals:', error);
      toast.error('Bağlantı hatası oluştu');
    } finally {
      setIsRequestingApproval(false);
    }
  };

  const handleApprovalAction = async (approvalId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comment,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchApprovals();
        onStatusUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'İşlem gerçekleştirilemedi');
      }
    } catch (error) {
      console.error('Error handling approval:', error);
      toast.error('Bağlantı hatası oluştu');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'REVISION_REQUESTED':
        return '🔄';
      case 'PENDING':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Onaylandı';
      case 'REJECTED': return 'Reddedildi';
      case 'REVISION_REQUESTED': return 'Revizyon İstendi';
      case 'PENDING': return 'Beklemede';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'REVISION_REQUESTED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const myPendingApprovals = approvals.filter(
    approval => approval.approver.id === session?.user?.id && ['PENDING', 'REVISION_REQUESTED'].includes(approval.status)
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Onay Süreci
          </h3>
          {isOwner && ['DRAFT', 'IN_REVIEW'].includes(contractStatus) && (
            <button
              onClick={() => {
                setShowApprovalForm(true);
                fetchUsers();
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Onay İste
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        {/* My Pending Approvals */}
        {myPendingApprovals.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-md font-medium text-blue-900 dark:text-blue-200 mb-3">
              Onayınız Bekleniyor
            </h4>
            {myPendingApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between">
                <span className="text-sm text-blue-800 dark:text-blue-300">
                  Bu sözleşmeyi onaylamanız veya reddetmeniz bekleniyor.
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprovalAction(approval.id, 'APPROVED')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                  >
                    ✅ Onayla
                  </button>
                  <button
                    onClick={() => handleApprovalAction(approval.id, 'REJECTED')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                  >
                    ❌ Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approval Request Form */}
        {showApprovalForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Onaylayıcı Seç
            </h4>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {users.map((user) => (
                <label key={user.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedApprovers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApprovers([...selectedApprovers, user.id]);
                      } else {
                        setSelectedApprovers(selectedApprovers.filter(id => id !== user.id));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {user.name || user.email}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRequestApprovals}
                disabled={isRequestingApproval || selectedApprovers.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequestingApproval ? 'Gönderiliyor...' : 'Onay İste'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalForm(false);
                  setSelectedApprovers([]);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Approvals List */}
        {approvals.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Onay Durumları
            </h4>
            {approvals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(approval.status)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {approval.approver.name || approval.approver.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(approval.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                    {getStatusText(approval.status)}
                  </span>
                  {approval.comment && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-40 truncate">
                      {approval.comment}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Henüz onay süreci başlatılmamış</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isOwner ? 'Onay süreci başlatmak için "Onay İste" butonunu kullanın.' : 'Sözleşme sahibi onay süreci başlatabilir.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 