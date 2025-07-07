import { DocumentMerger } from '../lib/document-merger';

// Test senaryosu
const testDocumentMerge = () => {
  console.log('🧪 Document Merge Test Başlıyor...\n');

  // Test document içeriği (property tag'lerle)
  const documentContent = `
    <h1>Sözleşme Başlığı: {{contractTitle}}</h1>
    
    <p>Bu sözleşme <strong>{{counterpartyName}}</strong> şirketi ile yapılmıştır.</p>
    
    <h2>Sözleşme Detayları</h2>
    <ul>
      <li><strong>Sözleşme Değeri:</strong> {{contractValue}} TL</li>
      <li><strong>Başlangıç Tarihi:</strong> {{startDate}}</li>
      <li><strong>Bitiş Tarihi:</strong> {{endDate}}</li>
      <li><strong>Sözleşme Sahibi:</strong> {{contractOwner}}</li>
    </ul>
    
    <p>Bu sözleşme {{renewalType}} yenileme koşullarına sahiptir.</p>
    
    <h3>İletişim Bilgileri</h3>
    <p>E-posta: {{contactEmail}}</p>
    <p>Telefon: {{contactPhone}}</p>
  `;

  // Test form field değerleri
  const formFields = [
    {
      id: 'contractTitle',
      name: 'contractTitle',
      value: 'Pazarlama Ajansı Hizmet Sözleşmesi',
      type: 'TEXT'
    },
    {
      id: 'counterpartyName',
      name: 'counterpartyName',
      value: 'ABC Reklam Ajansı A.Ş.',
      type: 'TEXT'
    },
    {
      id: 'contractValue',
      name: 'contractValue',
      value: 50000,
      type: 'NUMBER'
    },
    {
      id: 'startDate',
      name: 'startDate',
      value: '2024-01-15',
      type: 'DATE'
    },
    {
      id: 'endDate',
      name: 'endDate',
      value: '2024-12-31',
      type: 'DATE'
    },
    {
      id: 'contractOwner',
      name: 'contractOwner',
      value: 'Ahmet Yılmaz',
      type: 'USER_PICKER'
    },
    {
      id: 'renewalType',
      name: 'renewalType',
      value: 'Auto-Renew',
      type: 'SINGLE_SELECT'
    },
    {
      id: 'contactEmail',
      name: 'contactEmail',
      value: 'info@abcreklam.com',
      type: 'EMAIL'
    },
    {
      id: 'contactPhone',
      name: 'contactPhone',
      value: '+90 212 555 0123',
      type: 'PHONE'
    }
  ];

  // Test property tag'leri
  const propertyTags = [
    {
      id: 'contractTitle',
      label: 'contractTitle',
      description: 'Sözleşme başlığı'
    },
    {
      id: 'counterpartyName',
      label: 'counterpartyName',
      description: 'Karşı taraf şirket adı'
    },
    {
      id: 'contractValue',
      label: 'contractValue',
      description: 'Sözleşme değeri'
    },
    {
      id: 'startDate',
      label: 'startDate',
      description: 'Başlangıç tarihi'
    },
    {
      id: 'endDate',
      label: 'endDate',
      description: 'Bitiş tarihi'
    },
    {
      id: 'contractOwner',
      label: 'contractOwner',
      description: 'Sözleşme sahibi'
    },
    {
      id: 'renewalType',
      label: 'renewalType',
      description: 'Yenileme tipi'
    },
    {
      id: 'contactEmail',
      label: 'contactEmail',
      description: 'İletişim e-postası'
    },
    {
      id: 'contactPhone',
      label: 'contactPhone',
      description: 'İletişim telefonu'
    }
  ];

  console.log('📄 Orijinal Document:');
  console.log(documentContent);
  console.log('\n📋 Form Field Değerleri:');
  formFields.forEach(field => {
    console.log(`  ${field.name}: ${field.value} (${field.type})`);
  });

  // Document merge işlemini gerçekleştir
  console.log('\n🔄 Document Merge İşlemi Başlıyor...');
  const mergeResult = DocumentMerger.mergeDocument(documentContent, formFields, propertyTags);

  console.log('\n✅ Merge Sonucu:');
  console.log('Başarılı:', mergeResult.success);
  console.log('Değiştirilen Tag\'ler:', mergeResult.replacedTags);
  if (mergeResult.errors.length > 0) {
    console.log('Hatalar:', mergeResult.errors);
  }

  console.log('\n📄 Merge Edilmiş Document:');
  console.log(mergeResult.mergedContent);

  // Property mapping validation
  console.log('\n🔍 Property Mapping Validation:');
  const validation = DocumentMerger.validatePropertyMapping(documentContent, formFields, propertyTags);
  console.log('Geçerli:', validation.valid);
  console.log('Eşleşen Tag\'ler:', validation.mappedTags);
  console.log('Eşleşmeyen Tag\'ler:', validation.unmappedTags);
  console.log('Kullanılmayan Field\'lar:', validation.unusedFields);

  // Document'teki tüm tag'leri listele
  console.log('\n🏷️ Document\'teki Tüm Property Tag\'ler:');
  const allTags = DocumentMerger.extractPropertyTags(documentContent);
  console.log(allTags);

  console.log('\n✅ Test Tamamlandı!');
};

// Test'i çalıştır
testDocumentMerge(); 