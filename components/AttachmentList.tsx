'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentPreview from './DocumentPreview';

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
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
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    fileName: string;
    mimeType: string;
  } | null>(null);

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
    link.href = attachment.url;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dosya indiriliyor...');
  };

  const handlePreview = (attachment: Attachment) => {
    // Check if file type is supported for preview
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];

    if (supportedTypes.includes(attachment.mimeType)) {
      setPreviewFile({
        url: attachment.url,
        fileName: attachment.originalName,
        mimeType: attachment.mimeType
      });
    } else {
      toast.error('Bu dosya türü için önizleme desteklenmiyor');
    }
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

  const isPreviewSupported = (mimeType: string) => {
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    return supportedTypes.includes(mimeType);
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
    <>
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
              {/* Preview Button */}
              {isPreviewSupported(attachment.mimeType) && (
                <button
                  onClick={() => handlePreview(attachment)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Önizle"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              
              {/* Download Button */}
              <button
                onClick={() => handleDownload(attachment)}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                title="İndir"
              >
                <Download className="h-4 w-4" />
              </button>
              
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(attachment.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview Modal */}
      {previewFile && (
        <DocumentPreview
          fileUrl={previewFile.url}
          fileName={previewFile.fileName}
          mimeType={previewFile.mimeType}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
} 