'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: {
    name?: string;
    email: string;
  };
}

interface AttachmentListProps {
  contractId: string;
  refreshTrigger?: number;
}

export default function AttachmentList({ contractId, refreshTrigger }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('text')) return '📃';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contractId}/attachments`);
      
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      } else {
        console.error('Failed to fetch attachments');
        toast.error('Dosyalar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error('Dosyalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  const handleDownload = (attachment: Attachment) => {
    // Create a download link
    const link = document.createElement('a');
    link.href = attachment.filePath;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contracts/${contractId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Dosya başarıyla silindi');
        fetchAttachments(); // Refresh the list
      } else {
        toast.error('Dosya silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Dosya silinirken hata oluştu');
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [contractId, refreshTrigger, fetchAttachments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Dosyalar yükleniyor...</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Henüz dosya yok</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Bu sözleşmeye henüz dosya eklenmemiş.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="text-2xl">
              {getFileIcon(attachment.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {attachment.originalName}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(attachment.fileSize)}</span>
                <span>•</span>
                <span>{formatDate(attachment.createdAt)}</span>
                <span>•</span>
                <span>{attachment.uploadedBy.name || attachment.uploadedBy.email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownload(attachment)}
              className="inline-flex items-center p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="İndir"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(attachment.id)}
              className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Sil"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 