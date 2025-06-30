"use client";

import { useState, useTransition } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TemplateUploaderProps {
  templateId: string;
  onUploadComplete?: () => void;
}

export const TemplateUploader = ({ templateId, onUploadComplete }: TemplateUploaderProps) => {
  const [isPending, startTransition] = useTransition();

  const handleUploadComplete = (res: any) => {
    console.log("Upload completed, response:", res);
    if (res && res.length > 0) {
      const uploadedFile = res[0];
      console.log("Uploaded file details:", uploadedFile);
      
      if (templateId === "new") {
        // Otomatik olarak yeni template oluştur ve dosya bilgisini ekle
        startTransition(async () => {
          // 1. Yeni template oluştur
          const response = await fetch('/api/workflow-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Untitled workflow configuration ${Date.now()}`,
              description: 'A new workflow template.'
            })
          });
          if (response.ok) {
            const newTemplate = await response.json();
            // 2. Dosya bilgisini template'e ekle
            const docRes = await fetch(`/api/workflow-templates/${newTemplate.id}/document`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documentUrl: uploadedFile.url,
                documentName: uploadedFile.name
              })
            });
            if (docRes.ok) {
              toast.success("Dosya ve şablon başarıyla kaydedildi! Yönlendiriliyorsunuz...");
              // 3. Yeni template'in düzenleme ekranına yönlendir
              window.location.href = `/dashboard/admin/workflows/${newTemplate.id}`;
            } else {
              toast.error("Dosya şablona eklenirken hata oluştu.");
            }
          } else {
            toast.error("Yeni şablon oluşturulamadı.");
          }
        });
      } else {
        // Normal template için direkt kaydet
        startTransition(async () => {
          const response = await fetch(`/api/workflow-templates/${templateId}/document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentUrl: uploadedFile.url,
              documentName: uploadedFile.name
            })
          });

          if (response.ok) {
            toast.success("Dosya başarıyla yüklendi! Sayfa yeniden yüklenecek.");
            // İsteğe bağlı callback
            onUploadComplete?.();
            // Sayfayı yenileyerek güncel veriyi göster
            window.location.reload();
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.error || "Dosya URL'si kaydedilirken hata oluştu.");
          }
        });
      }
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error details:", error);
    toast.error(`Yükleme Hatası: ${error.message}`);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file);
      toast.info(`Dosya yükleniyor: ${file.name}`);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log("Upload successful:", result);
          const uploadResponse = [{
            url: result.url,
            name: result.name
          }];
          
          handleUploadComplete(uploadResponse);
        } else {
          toast.error(`Upload hatası: ${result.message}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Upload sırasında hata oluştu");
      }
    }
  };

  return (
    <div className="mt-6 p-6 border-2 border-dashed rounded-lg border-gray-300 text-center bg-white">
      <FileText className="w-8 h-8 mx-auto mb-4 text-gray-400" />
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">
          Şablon dosyanızı seçin ve yükleyin
        </p>
        
        <input 
          type="file" 
          onChange={handleFileSelect}
          accept=".doc,.docx,.pdf,.txt"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      {isPending && (
        <div className="mt-4 text-sm text-blue-600">
          Dosya işleniyor...
        </div>
      )}
    </div>
  );
}; 