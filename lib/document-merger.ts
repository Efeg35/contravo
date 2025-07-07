export interface FormFieldValue {
  id: string;
  name: string;
  value: string | number | boolean | string[];
  type: string;
}

export interface PropertyTag {
  id: string;
  label: string;
  description?: string;
}

export interface DocumentMergeResult {
  success: boolean;
  mergedContent: string;
  replacedTags: string[];
  errors: string[];
}

export class DocumentMerger {
  /**
   * Document içeriğindeki property tag'leri form field değerleriyle değiştirir
   */
  static mergeDocument(
    documentContent: string,
    formFields: FormFieldValue[],
    propertyTags: PropertyTag[]
  ): DocumentMergeResult {
    const result: DocumentMergeResult = {
      success: true,
      mergedContent: documentContent,
      replacedTags: [],
      errors: []
    };

    try {
      // Property tag'leri bul ve değiştir
      for (const property of propertyTags) {
        const tagPattern = new RegExp(`\\{\\{${property.label}\\}\\}`, 'gi');
        
        // Bu property için form field değerini bul
        const formField = formFields.find(field => 
          field.name === property.label || 
          field.id === property.id
        );

        if (formField) {
          // Değeri formatla
          const formattedValue = this.formatFieldValue(formField);
          
          // Tag'i değiştir
          result.mergedContent = result.mergedContent.replace(tagPattern, formattedValue);
          result.replacedTags.push(property.label);
          
          console.log(`✅ Property tag "${property.label}" → "${formattedValue}" ile değiştirildi`);
        } else {
          // Form field bulunamadı
          result.errors.push(`Form field bulunamadı: ${property.label}`);
          console.warn(`⚠️ Form field bulunamadı: ${property.label}`);
        }
      }

      // Genel property tag pattern'ini de kontrol et
      const generalTagPattern = /\{\{([^}]+)\}\}/g;
      const remainingTags = result.mergedContent.match(generalTagPattern);
      
      if (remainingTags) {
        result.errors.push(`Değiştirilmemiş tag'ler: ${remainingTags.join(', ')}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Merge hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      console.error('❌ Document merge hatası:', error);
    }

    return result;
  }

  /**
   * Form field değerini uygun formatta döndürür
   */
  private static formatFieldValue(field: FormFieldValue): string {
    switch (field.type) {
      case 'DATE':
        if (field.value && typeof field.value === 'string') {
          try {
            const date = new Date(field.value);
            return date.toLocaleDateString('tr-TR');
          } catch {
            return String(field.value);
          }
        }
        return String(field.value || '');

      case 'NUMBER':
        if (typeof field.value === 'number') {
          return field.value.toLocaleString('tr-TR');
        }
        return String(field.value || '');

      case 'MULTI_SELECT':
        if (Array.isArray(field.value)) {
          return field.value.join(', ');
        }
        return String(field.value || '');

      case 'CHECKBOX':
        return field.value ? 'Evet' : 'Hayır';

      case 'USER_PICKER':
        // Kullanıcı adını döndür (gerçek implementasyonda user lookup yapılır)
        return String(field.value || '');

      default:
        return String(field.value || '');
    }
  }

  /**
   * Document'teki tüm property tag'leri listeler
   */
  static extractPropertyTags(documentContent: string): string[] {
    const tagPattern = /\{\{([^}]+)\}\}/g;
    const tags: string[] = [];
    let match;

    while ((match = tagPattern.exec(documentContent)) !== null) {
      tags.push(match[1]);
    }

    return [...new Set(tags)]; // Duplicate'leri kaldır
  }

  /**
   * Property tag'lerin form field'larla eşleşip eşleşmediğini kontrol eder
   */
  static validatePropertyMapping(
    documentContent: string,
    formFields: FormFieldValue[],
    propertyTags: PropertyTag[]
  ): {
    valid: boolean;
    mappedTags: string[];
    unmappedTags: string[];
    unusedFields: string[];
  } {
    const documentTags = this.extractPropertyTags(documentContent);
    const formFieldNames = formFields.map(f => f.name);
    const propertyNames = propertyTags.map(p => p.label);

    const mappedTags: string[] = [];
    const unmappedTags: string[] = [];
    const unusedFields: string[] = [];

    // Document tag'lerini kontrol et
    for (const tag of documentTags) {
      if (formFieldNames.includes(tag) || propertyNames.includes(tag)) {
        mappedTags.push(tag);
      } else {
        unmappedTags.push(tag);
      }
    }

    // Kullanılmayan form field'ları bul
    for (const fieldName of formFieldNames) {
      if (!documentTags.includes(fieldName)) {
        unusedFields.push(fieldName);
      }
    }

    return {
      valid: unmappedTags.length === 0,
      mappedTags,
      unmappedTags,
      unusedFields
    };
  }
} 