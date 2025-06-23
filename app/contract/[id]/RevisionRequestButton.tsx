'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { requestRevision } from '@/src/lib/actions/contract-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface RevisionRequestButtonProps {
  contractId: string;
}

export default function RevisionRequestButton({ contractId }: RevisionRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Lütfen revizyon sebebini belirtin.');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await requestRevision(contractId, comment.trim());
      
      if (result.success) {
        setIsOpen(false);
        setComment('');
        router.refresh(); // Sayfayı yenile
        alert('Revizyon talebi başarıyla gönderildi!');
      }
    } catch (error) {
      console.error('Revizyon talep etme hatası:', error);
      alert('Revizyon talep edilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Revizyon Talep Et
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Revizyon Talep Et</DialogTitle>
          <DialogDescription>
            Bu sözleşme için revizyon talep ediyorsunuz. Lütfen yapılması gereken değişiklikleri detaylıca açıklayın.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="comment">
              Revizyon Sebebi <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Lütfen yapılması gereken değişiklikleri detaylıca açıklayın..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Bu açıklama sözleşme sahibine gönderilecek ve revizyon gerekçesi olarak kaydedilecektir.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading || !comment.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Gönderiliyor...' : 'Talebi Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 