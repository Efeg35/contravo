import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Yetkilendirme gerekli.' }, { status: 401 });
    }

    // templateId ve libraryOnly query parametrelerini al
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const libraryOnly = searchParams.get('libraryOnly') === 'true';

    if (!templateId) {
      return NextResponse.json({ success: false, message: 'templateId zorunlu.' }, { status: 400 });
    }

    let properties;

    if (libraryOnly) {
      // Sadece merkezi kütüphanedeki property'leri çek
      // Global Properties Library template'indeki property'leri çek
      console.log('🔍 Global Properties Library aranıyor...');
      console.log('👤 Session user:', session.user);
      console.log('🏢 Company ID:', (session.user as any).companyId);
      
      const globalTemplate = await db.workflowTemplate.findFirst({
        where: {
          name: 'Global Properties Library'
          // companyId'yi şimdilik kaldırdık çünkü farklı company'ler olabilir
        }
      });

      console.log('📋 Global template bulundu:', globalTemplate?.id);

      if (globalTemplate) {
        console.log('🔍 Global template\'deki property\'ler aranıyor...');
        properties = await db.formField.findMany({
          where: {
            templateId: globalTemplate.id, // Global template'deki property'ler
          },
          select: {
            id: true,
            label: true,
            apiKey: true,
            type: true,
            helpText: true, // description olarak kullanılacak
            isRequired: true,
            options: true,
            templateId: true,
            placeholder: true,
            minLength: true,
            maxLength: true,
            minValue: true,
            maxValue: true,
            pattern: true,
            customError: true,
            dependsOn: true,
            dependsOnValue: true,
            isConditional: true,
            validationRules: true,
            defaultValue: true,
            isReadOnly: true,
            isHidden: true,
            showWhen: true,
            hideWhen: true,
            validateWhen: true,
            errorMessage: true,
            warningMessage: true,
            successMessage: true,
            fieldGroup: true,
            priority: true,
            realTimeValidation: true,
            sectionId: true,
            order: true
          },
          orderBy: [
            { order: 'asc' },
            { label: 'asc' }
          ]
        });
        console.log(`✅ ${properties.length} property bulundu`);
      } else {
        console.log('❌ Global template bulunamadı');
        properties = [];
      }
    } else {
      // Eski davranış: Tüm FormField'ları çek (geriye uyumluluk için)
      properties = await db.formField.findMany({
        where: {
          OR: [
            { templateId: undefined },
            { templateId: templateId }
          ]
        },
        select: {
          id: true,
          label: true,
          apiKey: true,
          type: true,
          helpText: true,
          isRequired: true,
          options: true,
          templateId: true,
          placeholder: true,
          minLength: true,
          maxLength: true,
          minValue: true,
          maxValue: true,
          pattern: true,
          customError: true,
          dependsOn: true,
          dependsOnValue: true,
          isConditional: true,
          validationRules: true,
          defaultValue: true,
          isReadOnly: true,
          isHidden: true,
          showWhen: true,
          hideWhen: true,
          validateWhen: true,
          errorMessage: true,
          warningMessage: true,
          successMessage: true,
          fieldGroup: true,
          priority: true,
          realTimeValidation: true,
          sectionId: true,
          order: true
        },
        orderBy: [
          { templateId: 'desc' },
          { order: 'asc' },
          { label: 'asc' }
        ]
      });

      // Aynı apiKey'e sahip propertyleri uniq yap (öncelik template'e özel)
      const uniqMap = new Map();
      for (const prop of properties) {
        if (!uniqMap.has(prop.apiKey)) {
          uniqMap.set(prop.apiKey, prop);
        }
      }
      properties = Array.from(uniqMap.values());
    }

    return NextResponse.json({
      success: true,
      properties: properties,
      count: properties.length,
      libraryOnly: libraryOnly
    });

  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Özellikler yüklenirken hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Yetkilendirme gerekli.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, description, options, required, templateId } = body;

    if (!name || !type) {
      return NextResponse.json({ success: false, message: 'Name ve type zorunlu.' }, { status: 400 });
    }

    // API key oluştur (camelCase)
    const apiKey = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word: string, index: number) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    // Önce global property template'ini bul veya oluştur
    let globalTemplate = await db.workflowTemplate.findFirst({
      where: {
        name: 'Global Properties Library',
        companyId: (session.user as any).companyId
      }
    });

    if (!globalTemplate) {
      globalTemplate = await db.workflowTemplate.create({
        data: {
          name: 'Global Properties Library',
          description: 'Merkezi property kütüphanesi',
          companyId: (session.user as any).companyId,
          createdById: session.user.id,
          status: 'ACTIVE'
        }
      });
    }

    // Yeni property'yi merkezi kütüphaneye ekle
    const newProperty = await db.formField.create({
      data: {
        label: name,
        apiKey: apiKey,
        type: type.toUpperCase(),
        helpText: description || '',
        isRequired: required || false,
        options: options || [],
        templateId: globalTemplate.id, // Global template'e bağla
        placeholder: `${name} giriniz...`,
        order: 0
      }
    });

    return NextResponse.json({
      success: true,
      property: newProperty,
      message: 'Property başarıyla oluşturuldu.'
    });

  } catch (error) {
    console.error('Property oluşturma hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Property oluşturulurken hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 