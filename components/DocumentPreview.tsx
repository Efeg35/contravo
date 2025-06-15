'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  MessageSquare,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentPreviewProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  onClose: () => void;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  page: number;
  text: string;
  createdAt: Date;
  author: string;
}

export default function DocumentPreview({ 
  fileUrl, 
  fileName, 
  mimeType, 
  onClose 
}: DocumentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationPosition, setAnnotationPosition] = useState({ x: 0, y: 0 });
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [textContent, setTextContent] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocument = useRef<any>(null);

  useEffect(() => {
    if (mimeType === 'application/pdf') {
      loadPDF();
    } else if (mimeType.startsWith('image/')) {
      // Image files are handled directly in JSX
      setLoading(false);
    } else if (
      mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Word files - show download option with preview note
      setLoading(false);
    } else if (mimeType === 'text/plain') {
      // Text files can be loaded directly
      loadTextFile();
    } else {
      setError('Bu dosya türü önizleme desteklenmiyor');
      setLoading(false);
    }
  }, [fileUrl, mimeType]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // PDF.js import (dinamik import)
      const pdfjsLib = await import('pdfjs-dist');
      
      // Worker path ayarla - CDN veya local
      const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      // Load document with CORS handling
      const loadingTask = pdfjsLib.getDocument({
        url: fileUrl,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      pdfDocument.current = pdf;
      setTotalPages(pdf.numPages);
      
      renderPage(1);
    } catch (err) {
      console.error('PDF yükleme hatası:', err);
      setError('PDF dosyası yüklenirken hata oluştu. Dosyayı indirerek görüntüleyebilirsiniz.');
      setLoading(false);
    }
  };

  const loadTextFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(fileUrl);
      const text = await response.text();
      setTextContent(text);
      setLoading(false);
    } catch (err) {
      console.error('Text dosyası yükleme hatası:', err);
      setError('Text dosyası yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument.current || !canvasRef.current) return;

    try {
      setLoading(true);
      const page = await pdfDocument.current.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Viewport hesaplama
      const viewport = page.getViewport({ 
        scale: zoom,
        rotation: rotation 
      });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      setCurrentPage(pageNumber);
      setLoading(false);
    } catch (err) {
      console.error('Sayfa render hatası:', err);
      setError('Sayfa görüntülenirken hata oluştu');
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.25, 3);
    setZoom(newZoom);
    if (mimeType === 'application/pdf') {
      renderPage(currentPage);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom * 0.8, 0.5);
    setZoom(newZoom);
    if (mimeType === 'application/pdf') {
      renderPage(currentPage);
    }
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (mimeType === 'application/pdf') {
      renderPage(currentPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      renderPage(currentPage + 1);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dosya indiriliyor...');
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setAnnotationPosition({ x, y });
    setShowAnnotationForm(true);
  };

  const handleAddAnnotation = () => {
    if (!newAnnotationText.trim()) return;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      x: annotationPosition.x,
      y: annotationPosition.y,
      page: currentPage,
      text: newAnnotationText,
      createdAt: new Date(),
      author: 'Mevcut Kullanıcı' // Gerçek uygulamada session'dan alınır
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setNewAnnotationText('');
    setShowAnnotationForm(false);
    toast.success('Not eklendi');
  };

  const getCurrentPageAnnotations = () => {
    return annotations.filter(ann => ann.page === currentPage);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Önizleme Hatası
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50 ${
        isFullscreen ? 'bg-black' : ''
      }`}
    >
      {/* Header Toolbar */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold truncate max-w-md">{fileName}</h3>
          {mimeType === 'application/pdf' && (
            <div className="flex items-center space-x-2 text-sm">
              <span>{currentPage} / {totalPages}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation Controls */}
          {mimeType === 'application/pdf' && (
            <>
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="h-6 border-l border-gray-600 mx-2"></div>

              {/* Zoom Controls */}
                             {/* Zoom Controls - Available for all file types */}
               <button
                 onClick={handleZoomOut}
                 className="p-2 rounded-md hover:bg-gray-700"
                 title="Küçült"
               >
                 <ZoomOut className="h-5 w-5" />
               </button>
               
               <span className="text-sm px-2 min-w-[60px] text-center">
                 {Math.round(zoom * 100)}%
               </span>
               
               <button
                 onClick={handleZoomIn}
                 className="p-2 rounded-md hover:bg-gray-700"
                 title="Büyüt"
               >
                 <ZoomIn className="h-5 w-5" />
               </button>

               {/* Rotate - Available for PDF and Images */}
               {(mimeType === 'application/pdf' || mimeType.indexOf('image/') === 0) && (
                 <button
                   onClick={handleRotate}
                   className="p-2 rounded-md hover:bg-gray-700"
                   title="Döndür"
                 >
                   <RotateCw className="h-5 w-5" />
                 </button>
               )}

              <div className="h-6 border-l border-gray-600 mx-2"></div>
            </>
          )}

          {/* Utility Controls */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-md hover:bg-gray-700"
            title="İndir"
          >
            <Download className="h-5 w-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md hover:bg-gray-700"
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-700 text-red-400"
            title="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {loading && (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Belge yükleniyor...</p>
          </div>
        )}

        {mimeType === 'application/pdf' && !loading && (
          <div className="relative">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="max-w-full max-h-full shadow-2xl cursor-crosshair"
            />
            
            {/* Annotations */}
            {getCurrentPageAnnotations().map((annotation) => (
              <div
                key={annotation.id}
                className="absolute bg-yellow-200 border border-yellow-400 rounded p-2 max-w-xs shadow-lg z-10"
                style={{
                  left: annotation.x,
                  top: annotation.y,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="flex items-start justify-between">
                  <MessageSquare className="h-4 w-4 text-yellow-600 mr-1 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-gray-800 font-medium mb-1">{annotation.text}</p>
                    <p className="text-gray-600">
                      {annotation.author} - {annotation.createdAt.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Annotation Form */}
            {showAnnotationForm && (
              <div
                className="absolute bg-white rounded-lg p-4 shadow-xl z-20 min-w-[300px]"
                style={{
                  left: annotationPosition.x,
                  top: annotationPosition.y,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Not Ekle</h4>
                  <button
                    onClick={() => setShowAnnotationForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <textarea
                  value={newAnnotationText}
                  onChange={(e) => setNewAnnotationText(e.target.value)}
                  placeholder="Notunuzu yazın..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                  rows={3}
                  autoFocus
                />
                
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => setShowAnnotationForm(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAddAnnotation}
                    disabled={!newAnnotationText.trim()}
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Preview */}
        {mimeType.startsWith('image/') && !loading && (
          <div className="max-w-full max-h-full">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain shadow-2xl"
              style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
            />
          </div>
        )}

        {/* Text File Preview */}
        {mimeType === 'text/plain' && !loading && (
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-full overflow-auto">
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {textContent}
              </pre>
            </div>
          </div>
        )}

        {/* Word/Unsupported Files */}
        {!mimeType.startsWith('image/') && 
         mimeType !== 'application/pdf' && 
         mimeType !== 'text/plain' && 
         !loading && (
          <div className="text-white text-center">
            <div className="bg-gray-800 rounded-lg p-8">
              <div className="text-6xl mb-4">
                {mimeType.includes('word') || mimeType.includes('document') ? '📝' : '📄'}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {mimeType.includes('word') || mimeType.includes('document') 
                  ? 'Word Belgesi' 
                  : 'Önizleme Desteklenmiyor'}
              </h3>
              <p className="text-gray-300 mb-4">
                {mimeType.includes('word') || mimeType.includes('document')
                  ? 'Word belgeleri için tam önizleme henüz desteklenmiyor. Dosyayı indirerek görüntüleyebilirsiniz.'
                  : `Bu dosya türü (${mimeType}) için önizleme henüz desteklenmiyor.`}
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Dosyayı İndir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      {!loading && (
        <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
          <div className="text-sm text-gray-300">
            {mimeType === 'application/pdf' && 'PDF üzerine tıklayarak not ekleyebilirsiniz'}
            {mimeType.startsWith('image/') && 'Resim dosyası önizlemesi'}
            {mimeType === 'text/plain' && 'Text dosyası içeriği'}
            {(mimeType.includes('word') || mimeType.includes('document')) && 'Word belgesi - tam önizleme için indirin'}
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            {mimeType === 'application/pdf' && (
              <>
                <span>{getCurrentPageAnnotations().length} not</span>
                <span>•</span>
                <span>Sayfa {currentPage}/{totalPages}</span>
                <span>•</span>
              </>
            )}
            {mimeType === 'text/plain' && (
              <>
                <span>{textContent.length} karakter</span>
                <span>•</span>
              </>
            )}
            <span>{(zoom * 100).toFixed(0)}% zoom</span>
            <span>•</span>
            <span>{rotation}° döndürme</span>
          </div>
        </div>
      )}
    </div>
  );
} 