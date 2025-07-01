import React, { useCallback, useState, useEffect } from "react";
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { BubbleMenu } from "@tiptap/react";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Plus } from 'lucide-react';
import PropertyTag from './PropertyTag';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentToolbar } from './DocumentToolbar';

export interface DocumentEditorProperty {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  type?: string;
}

export interface ClauseOption {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export interface ConditionOption {
  id: string;
  name: string;
  condition: string;
  trueValue: string;
  falseValue: string;
}

// Varsayılan clause seçenekleri
const DEFAULT_CLAUSES: ClauseOption[] = [
  {
    id: 'termination',
    title: 'Fesih Maddesi',
    content: 'Taraflardan herhangi biri, 30 gün önceden yazılı bildirimde bulunarak bu sözleşmeyi feshedebilir.',
    category: 'Genel'
  },
  {
    id: 'confidentiality',
    title: 'Gizlilik Maddesi',
    content: 'Taraflar, işbu sözleşme kapsamında öğrendikleri tüm bilgileri gizli tutmayı ve üçüncü şahıslarla paylaşmamayı taahhüt ederler.',
    category: 'Hukuki'
  },
  {
    id: 'force-majeure',
    title: 'Mücbir Sebep',
    content: 'Doğal afetler, savaş, grev ve benzeri mücbir sebep halleri nedeniyle yükümlülüklerin yerine getirilememesi durumunda taraflar sorumlu tutulmaz.',
    category: 'Risk'
  },
  {
    id: 'liability',
    title: 'Sorumluluk Sınırı',
    content: 'Tarafların bu sözleşmeden doğan toplam sorumluluğu, sözleşme bedeline eşit tutarla sınırlıdır.',
    category: 'Hukuki'
  }
];

// Varsayılan condition seçenekleri
const DEFAULT_CONDITIONS: ConditionOption[] = [
  {
    id: 'payment-type',
    name: 'Ödeme Türü',
    condition: 'Ödeme türü "Taksitli" ise',
    trueValue: 'Ödeme 3 eşit taksitte yapılacaktır.',
    falseValue: 'Ödeme tek seferde yapılacaktır.'
  },
  {
    id: 'contract-duration',
    name: 'Sözleşme Süresi',
    condition: 'Sözleşme süresi 12 aydan fazla ise',
    trueValue: 'Yıllık performans değerlendirmesi yapılacaktır.',
    falseValue: 'Dönem sonunda değerlendirme yapılacaktır.'
  },
  {
    id: 'company-size',
    name: 'Şirket Büyüklüğü',
    condition: 'Müşteri şirket çalışan sayısı 50\'den fazla ise',
    trueValue: 'Kurumsal fiyatlandırma uygulanacaktır.',
    falseValue: 'Standart fiyatlandırma uygulanacaktır.'
  }
];

export default function DocumentEditor({
  editor,
  properties = [],
  templateId,
  zoomLevel,
}: {
  editor: Editor | null;
  properties?: DocumentEditorProperty[];
  templateId?: string;
  zoomLevel: number;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [clauseOpen, setClauseOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [customClause, setCustomClause] = useState({ title: '', content: '' });
  const [customCondition, setCustomCondition] = useState({ name: '', condition: '', trueValue: '', falseValue: '' });

  const handleAddProperty = useCallback(
    async (property: DocumentEditorProperty) => {
      if (!editor) return;
      
      (editor as any).chain().focus().insertPropertyTag({
        id: property.id,
        label: property.label,
        description: property.description,
      }).run();
      setPopoverOpen(false);
      
      await ensurePropertyInLaunchForm(property);
    },
    [editor, templateId]
  );

  // Property'nin launch form'da field olarak var olmasını sağla
  const ensurePropertyInLaunchForm = async (property: DocumentEditorProperty) => {
    try {
      // Mevcut template ID'yi al (parent'tan gelmeli)
      const templateId = getCurrentTemplateId(); // Bu function'ı parent'tan prop olarak alacağız
      
      if (!templateId || templateId === 'new') return;
      
      // Bu property zaten launch form'da var mı kontrol et
      const response = await fetch(`/api/workflow-templates/${templateId}/form-fields`);
      const existingFields = await response.json();
      
      const existsInForm = existingFields.data?.some((field: any) => 
        field.apiKey === property.id || field.label === property.label
      );
      
      if (!existsInForm) {
        // Launch form'a yeni field ekle
        await fetch(`/api/workflow-templates/${templateId}/form-fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: property.label,
            apiKey: property.id,
            type: getFieldTypeFromProperty(property),
            required: property.required || false,
            helpText: property.description || `${property.label} için değer giriniz`,
            placeholder: `${property.label} giriniz...`,
            autoGenerated: true // Bu field otomatik oluşturuldu olarak işaretle
          })
        });
        
        console.log(`✅ Property "${property.label}" launch form'a otomatik eklendi`);
      }
    } catch (error) {
      console.error('Property launch form entegrasyonu hatası:', error);
    }
  };

  // Property tipine göre form field tipi belirle
  const getFieldTypeFromProperty = (property: DocumentEditorProperty) => {
    const propertyType = (property as any).type;
    
    switch (propertyType) {
      case 'email': return 'EMAIL';
      case 'phone': return 'PHONE';
      case 'url': return 'URL';
      case 'date': return 'DATE';
      case 'date_range': return 'DATE_RANGE';
      case 'number': return 'NUMBER';
      case 'select': return 'SINGLE_SELECT';
      case 'multi_select': return 'MULTI_SELECT';
      case 'boolean': return 'CHECKBOX';
      case 'file_upload': return 'FILE_UPLOAD';
      case 'textarea': return 'TEXTAREA';
      case 'user': return 'USER_PICKER';
      default: return 'TEXT';
    }
  };

  // Template ID'yi almak için prop ekleyeceğiz
  const getCurrentTemplateId = () => {
    return templateId || null;
  };

  const handleAddClause = useCallback(
    (clause: ClauseOption) => {
      if (!editor) return;
      const clauseHtml = `<div class="clause-block" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 8px 0; background: #f9fafb;">
        <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">${clause.title}</h4>
        <p style="margin: 0; color: #6b7280;">${clause.content}</p>
      </div>`;
      editor.chain().focus().insertContent(clauseHtml).run();
      setClauseOpen(false);
    },
    [editor]
  );

  const handleAddCustomClause = useCallback(() => {
    if (!editor || !customClause.title || !customClause.content) return;
    const clauseHtml = `<div class="clause-block" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 8px 0; background: #f9fafb;">
      <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">${customClause.title}</h4>
      <p style="margin: 0; color: #6b7280;">${customClause.content}</p>
    </div>`;
    editor.chain().focus().insertContent(clauseHtml).run();
    setCustomClause({ title: '', content: '' });
    setClauseOpen(false);
  }, [editor, customClause]);

  const handleAddCondition = useCallback(
    (condition: ConditionOption) => {
      if (!editor) return;
      const conditionHtml = `<div class="condition-block" style="border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin: 8px 0; background: #eff6ff;">
        <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #1d4ed8;">${condition.name}</h4>
        <p style="margin: 0 0 4px 0; font-style: italic; color: #4b5563;">${condition.condition}</p>
        <p style="margin: 0 0 2px 0; color: #059669;"><strong>Evet ise:</strong> ${condition.trueValue}</p>
        <p style="margin: 0; color: #dc2626;"><strong>Hayır ise:</strong> ${condition.falseValue}</p>
      </div>`;
      editor.chain().focus().insertContent(conditionHtml).run();
      setConditionOpen(false);
    },
    [editor]
  );

  const handleAddCustomCondition = useCallback(() => {
    if (!editor || !customCondition.name || !customCondition.condition) return;
    const conditionHtml = `<div class="condition-block" style="border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin: 8px 0; background: #eff6ff;">
      <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #1d4ed8;">${customCondition.name}</h4>
      <p style="margin: 0 0 4px 0; font-style: italic; color: #4b5563;">${customCondition.condition}</p>
      <p style="margin: 0 0 2px 0; color: #059669;"><strong>Evet ise:</strong> ${customCondition.trueValue}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Hayır ise:</strong> ${customCondition.falseValue}</p>
    </div>`;
    editor.chain().focus().insertContent(conditionHtml).run();
    setCustomCondition({ name: '', condition: '', trueValue: '', falseValue: '' });
    setConditionOpen(false);
  }, [editor, customCondition]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null;
  }

  return (
    <>
      {editor && (
         <BubbleMenu editor={editor} tippyOptions={{ duration: 100, zIndex: 20 }}
           shouldShow={({ editor, from, to }) => {
             if (from === to) return false;
             return true;
           }}
         >
           <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-lg rounded-md p-1">
             <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
               <PopoverTrigger asChild>
                 <Button 
                   size="sm" 
                   variant="ghost"
                   className="h-8 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-0"
                 >
                   Add Property
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[300px] p-0" align="start">
                 <div className="p-4">
                   <h4 className="font-medium mb-3">Property Seç</h4>
                   {properties.length === 0 ? (
                     <p className="text-sm text-gray-500">
                       Henüz property tanımlanmamış. Create sekmesinden launch form fields ekleyin.
                     </p>
                   ) : (
                     <div className="space-y-1 max-h-64 overflow-y-auto">
                       {properties.map((prop) => (
                         <button
                           key={prop.id}
                           onClick={() => handleAddProperty(prop)}
                           className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
                         >
                           <div className="flex flex-col">
                             <span className="font-medium text-sm text-gray-900">{prop.label}</span>
                             {prop.description && (
                               <span className="text-xs text-gray-500 mt-1">{prop.description}</span>
                             )}
                           </div>
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
               </PopoverContent>
             </Popover>

             <div className="w-px h-6 bg-gray-200"></div>

             <Popover open={clauseOpen} onOpenChange={setClauseOpen}>
               <PopoverTrigger asChild>
                 <Button 
                   size="sm" 
                   variant="ghost"
                   className="h-8 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-0"
                 >
                   Add Clause
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[400px] p-0" align="start">
                 <div className="p-4">
                   <h4 className="font-medium mb-3">Madde Ekle</h4>
                   <div className="space-y-2 mb-4">
                     {DEFAULT_CLAUSES.map((clause) => (
                       <div 
                         key={clause.id}
                         className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => handleAddClause(clause)}
                       >
                         <div className="font-medium text-sm">{clause.title}</div>
                         <div className="text-xs text-gray-500 mt-1 line-clamp-2">{clause.content}</div>
                         <div className="text-xs text-blue-600 mt-1">{clause.category}</div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="border-t pt-4">
                     <h5 className="font-medium text-sm mb-2">Özel Madde Oluştur</h5>
                     <div className="space-y-2">
                       <Input
                         placeholder="Madde başlığı..."
                         value={customClause.title}
                         onChange={(e) => setCustomClause(prev => ({ ...prev, title: e.target.value }))}
                       />
                       <Textarea
                         placeholder="Madde içeriği..."
                         value={customClause.content}
                         onChange={(e) => setCustomClause(prev => ({ ...prev, content: e.target.value }))}
                         rows={3}
                       />
                       <Button 
                         size="sm" 
                         onClick={handleAddCustomClause}
                         disabled={!customClause.title || !customClause.content}
                       >
                         Ekle
                       </Button>
                     </div>
                   </div>
                 </div>
               </PopoverContent>
             </Popover>

             <div className="w-px h-6 bg-gray-200"></div>

             <Popover open={conditionOpen} onOpenChange={setConditionOpen}>
               <PopoverTrigger asChild>
                 <Button 
                   size="sm" 
                   variant="ghost"
                   className="h-8 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-0"
                 >
                   Add Condition
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[450px] p-0" align="start">
                 <div className="p-4">
                   <h4 className="font-medium mb-3">Koşul Ekle</h4>
                   <div className="space-y-2 mb-4">
                     {DEFAULT_CONDITIONS.map((condition) => (
                       <div 
                         key={condition.id}
                         className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => handleAddCondition(condition)}
                       >
                         <div className="font-medium text-sm">{condition.name}</div>
                         <div className="text-xs text-gray-500 mt-1">{condition.condition}</div>
                         <div className="text-xs text-green-600 mt-1">✓ {condition.trueValue}</div>
                         <div className="text-xs text-red-600">✗ {condition.falseValue}</div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="border-t pt-4">
                     <h5 className="font-medium text-sm mb-2">Özel Koşul Oluştur</h5>
                     <div className="space-y-2">
                       <Input
                         placeholder="Koşul adı..."
                         value={customCondition.name}
                         onChange={(e) => setCustomCondition(prev => ({ ...prev, name: e.target.value }))}
                       />
                       <Input
                         placeholder="Koşul tanımı (örn: Tutar 10.000 TL'den fazla ise)..."
                         value={customCondition.condition}
                         onChange={(e) => setCustomCondition(prev => ({ ...prev, condition: e.target.value }))}
                       />
                       <Textarea
                         placeholder="Koşul doğru ise gösterilecek metin..."
                         value={customCondition.trueValue}
                         onChange={(e) => setCustomCondition(prev => ({ ...prev, trueValue: e.target.value }))}
                         rows={2}
                       />
                       <Textarea
                         placeholder="Koşul yanlış ise gösterilecek metin..."
                         value={customCondition.falseValue}
                         onChange={(e) => setCustomCondition(prev => ({ ...prev, falseValue: e.target.value }))}
                         rows={2}
                       />
                       <Button 
                         size="sm" 
                         onClick={handleAddCustomCondition}
                         disabled={!customCondition.name || !customCondition.condition}
                       >
                         Ekle
                       </Button>
                     </div>
                   </div>
                 </div>
               </PopoverContent>
             </Popover>
           </div>
         </BubbleMenu>
      )}

      {/* Kağıt: Ironclad'e eşlenmiş sayfa tarzı.
          `transform` ve `transform-origin` (veya `origin-top` class'ı) ile zoom uygulanıyor.
          Wrapper div'i (bir sonraki adımda) ortalamayı sağlayacak.
      */}
      <div 
        className="mx-auto bg-white shadow-[0_4px_24px_0_rgba(60,72,88,0.12)] mb-8 py-[72px] px-[90px] font-serif font-[Source_Serif_Pro] w-[790px] origin-top"
        style={{ 
          fontFamily: "'Source Serif Pro', Georgia, serif", 
          transform: `scale(${zoomLevel / 100})`
        }}
      >
        <EditorContent editor={editor} style={{ fontFamily: "'Source Serif Pro', Georgia, serif" }} />
      </div>
    </>
  );
} 