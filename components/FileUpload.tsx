'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  contractId: string;
  onUploadSuccess: () => void;
}

export default function FileUpload({ contractId, onUploadSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/pdf',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ];



  const validateFile = (file: File) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'den büyük olamaz');
      return false;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      toast.error('Bu dosya tipi desteklenmiyor. PDF, Word, resim veya metin dosyası yükleyin.');
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/contracts/${contractId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Dosya başarıyla yüklendi!');
        onUploadSuccess();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Dosya yüklenemedi');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Dosya yüklenirken bir hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        className="hidden"
        disabled={isUploading}
      />

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragActive 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Dosya yükleniyor...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dosya yüklemek için tıklayın veya sürükleyip bırakın
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              PDF, Word, resim veya metin dosyası (Maks. 10MB)
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
              <span className="flex items-center">📄 PDF</span>
              <span className="flex items-center">📝 Word</span>
              <span className="flex items-center">🖼️ Resim</span>
              <span className="flex items-center">📃 Metin</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Desteklenen formatlar: PDF, DOC, DOCX, JPG, PNG, TXT
      </div>
    </div>
  );
} 