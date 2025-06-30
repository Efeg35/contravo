import { PrismaClient } from '@prisma/client';
import { FormFieldType } from '@prisma/client';

const db = new PrismaClient();

async function createCompleteProcurementWorkflow() {
  console.log('🚀 EKSIKSIZ Tedarik/Alım Sözleşmesi Workflow\'u oluşturuluyor...');

  try {
    // 1. Workflow Template Oluştur
    const template = await db.workflowTemplate.create({
      data: {
        name: 'Eksiksiz Tedarik/Alım Sözleşmesi',
        description: 'Ironclad seviyesinde tam özellikli tedarik/alım sözleşmesi workflow\'u. Property groups, conditions, form fields ve launch form ile birlikte.',
        status: 'PUBLISHED'
      }
    });

    console.log(`✅ Template oluşturuldu: ${template.id}`);

    // 2. Form Sections Oluştur (Property Groups benzeri)
    const sections = [
      {
        name: 'supplier_info',
        title: 'Tedarikçi Bilgileri',
        description: 'Supplier/Vendor Information',
        order: 1,
        isRequired: true,
        icon: 'building',
        color: '#3B82F6' // blue
      },
      {
        name: 'contract_details',
        title: 'Sözleşme Detayları', 
        description: 'Contract Details & Scope',
        order: 2,
        isRequired: true,
        icon: 'document-text',
        color: '#10B981' // green
      },
      {
        name: 'financial_info',
        title: 'Finansal Bilgiler',
        description: 'Financial Information',
        order: 3,
        isRequired: true,
        icon: 'currency-dollar',
        color: '#F59E0B' // yellow
      },
      {
        name: 'signature_info',
        title: 'İmza Bilgileri',
        description: 'Signature Information',
        order: 4,
        isRequired: true,
        icon: 'pencil',
        color: '#6B7280' // gray
      }
    ];

    const sectionIds: string[] = [];
    for (const sectionData of sections) {
      const section = await db.formSection.create({
        data: {
          ...sectionData,
          templateId: template.id
        }
      });
      sectionIds.push(section.id);
      console.log(`  ✅ Section oluşturuldu: ${section.title}`);
    }

    // 3. Form Fields Oluştur
    const formFields = [
      // Tedarikçi Bilgileri - Section 0
      {
        label: 'Tedarikçi Şirket Adı',
        apiKey: 'supplier_company_name',
        type: FormFieldType.TEXT,
        isRequired: true,
        placeholder: 'Örn: ABC Tedarik Ltd. Şti.',
        order: 1,
        sectionIndex: 0,
        minLength: 2,
        maxLength: 200,
        helpText: 'Tedarikçi şirketin resmi ticaret unvanını giriniz'
      },
      {
        label: 'Vergi Numarası',
        apiKey: 'supplier_tax_number',
        type: FormFieldType.TEXT,
        isRequired: true,
        placeholder: '1234567890',
        order: 2,
        sectionIndex: 0,
        pattern: '^[0-9]{10}$',
        customError: 'Vergi numarası 10 haneli olmalıdır',
        helpText: 'Tedarikçi şirketin 10 haneli vergi numarası'
      },
      {
        label: 'Tedarikçi E-posta',
        apiKey: 'supplier_email',
        type: FormFieldType.EMAIL,
        isRequired: true,
        placeholder: 'contact@supplier.com',
        order: 3,
        sectionIndex: 0,
        helpText: 'Resmi iletişim e-posta adresi'
      },
      {
        label: 'Tedarikçi Kategorisi',
        apiKey: 'supplier_category',
        type: FormFieldType.SINGLE_SELECT,
        isRequired: true,
        order: 4,
        sectionIndex: 0,
        options: ['Stratejik Partner', 'Tercihli Tedarikçi', 'Onaylı Tedarikçi', 'Yeni Tedarikçi', 'Tek Seferlik'],
        helpText: 'Tedarikçi sınıflandırması'
      },

      // Sözleşme Detayları - Section 1  
      {
        label: 'Sözleşme Başlığı',
        apiKey: 'contract_title',
        type: FormFieldType.TEXT,
        isRequired: true,
        placeholder: 'Örn: Ofis Malzemeleri Tedarik Sözleşmesi',
        order: 1,
        sectionIndex: 1,
        minLength: 5,
        maxLength: 200,
        helpText: 'Sözleşme başlığı/konusu'
      },
      {
        label: 'Sözleşme Türü',
        apiKey: 'contract_type',
        type: FormFieldType.SINGLE_SELECT,
        isRequired: true,
        order: 2,
        sectionIndex: 1,
        options: ['Mal Alım', 'Hizmet Alım', 'Danışmanlık', 'Lisans', 'Bakım-Onarım', 'Yazılım', 'Donanım', 'Lojistik'],
        helpText: 'Sözleşme kategorisi'
      },
      {
        label: 'Sözleşme Değeri (TL)',
        apiKey: 'contract_value',
        type: FormFieldType.NUMBER,
        isRequired: true,
        placeholder: '100000',
        order: 3,
        sectionIndex: 1,
        minValue: 0,
        maxValue: 10000000,
        helpText: 'Toplam sözleşme bedeli (KDV Hariç)'
      },
      {
        label: 'Başlangıç Tarihi',
        apiKey: 'start_date',
        type: FormFieldType.DATE,
        isRequired: true,
        order: 4,
        sectionIndex: 1,
        helpText: 'Sözleşme yürürlük başlangıç tarihi'
      },
      {
        label: 'Bitiş Tarihi',
        apiKey: 'end_date',
        type: FormFieldType.DATE,
        isRequired: true,
        order: 5,
        sectionIndex: 1,
        helpText: 'Sözleşme bitiş tarihi'
      },

      // Finansal Bilgiler - Section 2
      {
        label: 'Ödeme Koşulları',
        apiKey: 'payment_terms',
        type: FormFieldType.SINGLE_SELECT,
        isRequired: true,
        order: 1,
        sectionIndex: 2,
        options: ['Peşin', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Avans + Bakiye'],
        helpText: 'Ödeme vadesi'
      },
      {
        label: 'KDV Oranı',
        apiKey: 'vat_rate',
        type: FormFieldType.SINGLE_SELECT,
        isRequired: true,
        order: 2,
        sectionIndex: 2,
        options: ['%0', '%1', '%8', '%10', '%18', '%20'],
        defaultValue: '%18',
        helpText: 'Uygulanacak KDV oranı'
      },
      {
        label: 'Bütçe Onay Durumu',
        apiKey: 'budget_approval_status',
        type: FormFieldType.SINGLE_SELECT,
        isRequired: true,
        order: 3,
        sectionIndex: 2,
        options: ['Bütçe Var', 'Bütçe Ayrılacak', 'Ek Bütçe Gerekiyor', 'Onay Bekliyor'],
        helpText: 'Bütçe tahsisi durumu'
      },

      // İmza Bilgileri - Section 3
      {
        label: 'Şirket İmzacı E-posta',
        apiKey: 'company_signer_email',
        type: FormFieldType.EMAIL,
        isRequired: true,
        order: 1,
        sectionIndex: 3,
        helpText: 'Şirket imzacısının e-posta adresi'
      },
      {
        label: 'Karşı Taraf İmzacı E-posta',
        apiKey: 'counterparty_signer_email',
        type: FormFieldType.EMAIL,
        isRequired: true,
        order: 2,
        sectionIndex: 3,
        helpText: 'Tedarikçi imzacısının e-posta adresi'
      },
      {
        label: 'Sözleşme Sahibi',
        apiKey: 'contract_owner',
        type: FormFieldType.USER,
        isRequired: true,
        order: 3,
        sectionIndex: 3,
        helpText: 'Sözleşme sürecini yöneten kişi'
      }
    ];

    // Form Fields'ları oluştur
    const fieldIds: string[] = [];
    for (const fieldData of formFields) {
      const field = await db.formField.create({
        data: {
          label: fieldData.label,
          apiKey: fieldData.apiKey,
          type: fieldData.type,
          isRequired: fieldData.isRequired,
          placeholder: fieldData.placeholder,
          order: fieldData.order,
          templateId: template.id,
          sectionId: sectionIds[fieldData.sectionIndex],
          minLength: fieldData.minLength,
          maxLength: fieldData.maxLength,
          minValue: fieldData.minValue,
          maxValue: fieldData.maxValue,
          pattern: fieldData.pattern,
          customError: fieldData.customError,
          helpText: fieldData.helpText,
          options: fieldData.options,
          defaultValue: fieldData.defaultValue
        }
      });
      fieldIds.push(field.id);
      console.log(`    ✅ Form Field oluşturuldu: ${field.label}`);
    }

    // 4. Workflow Steps Oluştur
    const steps = [
      {
        order: 1,
        approverRole: 'PROCUREMENT_TEAM'
      },
      {
        order: 2,
        approverRole: 'FINANCE_TEAM'
      },
      {
        order: 3,
        approverRole: 'LEGAL_TEAM'
      },
      {
        order: 4,
        approverRole: 'C_LEVEL'
      }
    ];

    const stepIds: string[] = [];
    for (const stepData of steps) {
      const step = await db.workflowTemplateStep.create({
        data: {
          ...stepData,
          templateId: template.id
        }
      });
      stepIds.push(step.id);
      console.log(`  ✅ Workflow Step oluşturuldu: Step ${step.order}`);
    }

    // 5. Conditions Oluştur (Business Logic)
    const conditions = [
      {
        field: 'contract_value',
        operator: 'GREATER_THAN',
        value: '25000',
        stepId: stepIds[2] // Legal team step
      },
      {
        field: 'contract_value', 
        operator: 'GREATER_THAN',
        value: '100000',
        stepId: stepIds[3] // C-Level step
      },
      {
        field: 'supplier_category',
        operator: 'EQUALS',
        value: 'Yeni Tedarikçi',
        stepId: stepIds[0] // Procurement team step
      }
    ];

    for (const condData of conditions) {
      const condition = await db.condition.create({
        data: {
          field: condData.field,
          operator: condData.operator,
          value: condData.value,
          stepId: condData.stepId
        }
      });
      console.log(`    ✅ Condition oluşturuldu: ${condition.field} ${condition.operator} ${condition.value}`);
    }

    // 6. Launch Form Layout Oluştur
    const launchFormLayout = {
      fieldOrder: fieldIds,
      sections: sections.map((section, index) => ({
        id: sectionIds[index],
        name: section.name,
        title: section.title,
        description: section.description,
        icon: section.icon,
        color: section.color,
        order: section.order,
        isRequired: section.isRequired,
        isCollapsible: true,
        isExpanded: index < 2 // İlk 2 section açık başlasın
      })),
      validationRules: {
        requiredFields: fieldIds.filter((_, index) => formFields[index].isRequired),
        conditionalLogic: conditions.map(c => ({
          fieldId: c.field,
          operator: c.operator,
          value: c.value
        }))
      },
      uiSettings: {
        theme: 'professional',
        showProgressBar: true,
        enableAutoSave: true,
        enableRealTimeValidation: true,
        showFieldCount: true,
        compactMode: false
      }
    };

    await db.workflowTemplate.update({
      where: { id: template.id },
      data: { 
        launchFormLayout: launchFormLayout,
        enableRealTimeValidation: true,
        showValidationSummary: true
      }
    });

    console.log('✅ Launch Form Layout oluşturuldu');

    console.log('\n🎉 EKSIKSIZ TEDAİK/ALIM SÖZLEŞMESİ WORKFLOW\'U BAŞARIYLA OLUŞTURULDU!');
    console.log(`📋 Template ID: ${template.id}`);
    console.log(`🔗 URL: http://localhost:3000/dashboard/admin/workflows/${template.id}`);
    console.log('\n📊 Oluşturulan Bileşenler:');
    console.log(`  • ${steps.length} Workflow Step`);
    console.log(`  • ${sections.length} Form Section`);
    console.log(`  • ${formFields.length} Form Field`);
    console.log(`  • ${conditions.length} Business Logic Condition`);
    console.log(`  • 1 Launch Form Layout`);
    
    console.log('\n🎯 Test Edilebilir Özellikler:');
    console.log('  ✅ PropertySelectorModal - Mevcut property\'lerin listesi');
    console.log('  ✅ Form field types - TEXT, EMAIL, NUMBER, DATE, SINGLE_SELECT, USER');
    console.log('  ✅ Validation rules - minLength, maxLength, pattern, required');
    console.log('  ✅ Conditional logic - Contract value based workflows');
    console.log('  ✅ Section grouping - Professional UI organization');
    console.log('  ✅ Business conditions - Approval rules based on values');
    console.log('  ✅ Launch form layout - Responsive, collapsible sections');

    return template.id;

  } catch (error) {
    console.error('❌ Workflow oluşturulurken hata:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Script çalıştır
createCompleteProcurementWorkflow()
  .then((templateId) => {
    console.log(`\n🚀 WORKFLOW BAŞARIYLA OLUŞTURULDU: ${templateId}`);
    console.log('\n✨ Test adımları:');
    console.log('1. http://localhost:3000/dashboard/admin/workflows sayfasını açın');
    console.log('2. "Eksiksiz Tedarik/Alım Sözleşmesi" workflow\'unu bulun');
    console.log('3. PropertySelectorModal\'ı test edin (+ butonuna tıklayın)');
    console.log('4. Farklı property tiplerini launch form\'a ekleyin');
    console.log('5. Form validasyonlarını test edin');
    console.log('6. Section collapse/expand özelliklerini test edin');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script hatası:', error);
    process.exit(1);
  }); 