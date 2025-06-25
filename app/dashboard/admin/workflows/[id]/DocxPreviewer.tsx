"use client";

import { useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxPreviewerProps {
  url: string;
}

const DocxPreviewer = ({ url }: DocxPreviewerProps) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current && url) {
      // Fetch the docx file as a blob
      fetch(url)
        .then(response => {
            if (!response.ok) {
                // To get more details on CORS or other network errors
                console.error('Network response error:', response);
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
          // Render the blob content
          if (previewRef.current) {
            renderAsync(blob, previewRef.current, undefined, {
              className: "docx-wrapper", 
              inWrapper: true, 
              breakPages: true, 
              experimental: true, // Needed for better rendering
            });
          }
        })
        .catch(error => {
          console.error('Error fetching or rendering document:', error);
          if (previewRef.current) {
              previewRef.current.innerText = 'Doküman önizlenirken bir hata oluştu. CORS ayarlarınızı veya dosya URL\'sini kontrol edin.';
          }
        });
    }
  }, [url]);

  return <div ref={previewRef} className="w-full h-full bg-white p-8 overflow-auto border" />;
};

export default DocxPreviewer; 