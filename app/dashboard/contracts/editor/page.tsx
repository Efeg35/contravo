'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit3, Users, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CollaborativeEditor = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Edit3 className="h-8 w-8 text-blue-600" />
                  Collaborative Editor
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Google Docs tarzı gerçek zamanlı sözleşme düzenleme
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                3 Aktif Kullanıcı
              </Button>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle>Sözleşme Editörü</CardTitle>
            <CardDescription>
              Gerçek zamanlı işbirliği ile sözleşme düzenleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[500px]">
            <div className="h-full border rounded-md p-4 bg-white">
              <textarea
                className="w-full h-full resize-none border-none outline-none"
                placeholder="Sözleşme içeriğinizi buraya yazın..."
                defaultValue={`HIZMET SÖZLEŞMESİ

Bu sözleşme aşağıdaki taraflar arasında imzalanmıştır:

A) CONTRAVO TEKNOLOJİ A.Ş.
B) MÜŞTERİ FİRMASI

MADDE 1 - KONU VE KAPSAM
Bu sözleşme kapsamında...`}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CollaborativeEditor; 