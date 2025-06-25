import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { getNextAction } from '@/src/lib/contract-helper';
import { db } from '@/src/lib/db';
import ContractFocusClient from './ContractFocusClient';
import SmartActionButton from '@/components/SmartActionButton';
import RevisionRequestButton from './RevisionRequestButton';
import {
  ArrowLeftIcon,
  XMarkIcon,
  DocumentTextIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getContract(contractId: string) {
  try {
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        company: {
          select: { id: true, name: true }
        },
        workflowTemplate: {
          select: { id: true, name: true }
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true }
            }
          }
        },
        digitalSignatures: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return contract;
  } catch (error) {
    console.error('Sözleşme getirme hatası:', error);
    return null;
  }
}

function getStatusColor(status: string) {
    switch (status) {
      case 'SIGNED': return 'bg-green-100 text-green-800';
      case 'SENT_FOR_SIGNATURE': return 'bg-purple-100 text-purple-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
}

function getStageDisplay(stage: string) {
    const stageMap = {
      'DRAFT': 'Taslak',
      'IN_REVIEW': 'İncelemede',
      'APPROVED': 'Onaylandı',
      'SENT_FOR_SIGNATURE': 'İmzada',
      'SIGNED': 'İmzalandı',
      'ARCHIVED': 'Arşivlendi',
      'REJECTED': 'Reddedildi'
    };
    return stageMap[stage as keyof typeof stageMap] || stage;
}

export default async function ContractFocusPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  // Sıradaki eylemi hesapla
  const nextAction = await getNextAction(id, user.id);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Control Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-96">
                {contract.title}
              </h1>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                  {getStageDisplay(contract.status)}
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

        {/* Sağ üst köşe - SmartActionButton ve diğer kontroller */}
        <div className="flex items-center space-x-3">
          {/* Akıllı Eylem Butonu */}
          <SmartActionButton 
            contractId={contract.id}
            nextAction={nextAction}
            workflowTemplateId={(contract as any).workflowTemplateId}
            approvals={contract.approvals}
          />
          
          {/* Revizyon Talep Et Butonu - Sadece onaycı sırasında göster */}
          {nextAction.action === 'APPROVE_CONTRACT' && (
            <RevisionRequestButton contractId={contract.id} />
          )}
          
          {/* Diğer kontrol butonları */}
          <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <EyeIcon className="w-5 h-5" />
          </button>
          
            <Link
              href="/dashboard"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Ana İçerik - Client Component'e Delegate Et */}
      <ContractFocusClient 
        contract={{
          id: contract.id,
          title: contract.title,
          content: contract.content || '',
          status: contract.status,
          currentStage: contract.status,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
          otherPartyName: contract.otherPartyName || undefined,
          otherPartyEmail: contract.otherPartyEmail || undefined,
          contractValue: contract.value || undefined,
          currency: 'TRY',
          startDate: contract.startDate?.toISOString(),
          endDate: contract.endDate?.toISOString(),
          expirationDate: contract.expirationDate?.toISOString(),
          createdBy: contract.createdBy ? {
            id: contract.createdBy.id,
            name: contract.createdBy.name || '',
            email: contract.createdBy.email
          } : undefined
        }}
        approvals={contract.approvals.map(approval => ({
          id: approval.id,
          stepName: `Onay - ${approval.approver.name}`,
          status: approval.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
          approver: {
            name: approval.approver.name || '',
            email: approval.approver.email
          },
          approvedAt: approval.approvedAt?.toISOString(),
          comments: approval.comment || undefined
        }))}
        attachments={contract.attachments.map(attachment => ({
          id: attachment.id,
          filename: attachment.fileName,
          fileUrl: attachment.url,
          uploadedAt: attachment.createdAt.toISOString(),
          uploadedBy: {
            name: attachment.uploadedBy.name || ''
          }
        }))}
        digitalSignatures={contract.digitalSignatures.map(signature => ({
          id: signature.id,
          userId: signature.userId,
          status: signature.status,
          signedAt: signature.signedAt?.toISOString(),
          user: {
            id: signature.user.id,
            name: signature.user.name || '',
            email: signature.user.email
          }
        }))}
      />
    </div>
  );
} 