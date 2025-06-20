import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportTemplate, ReportData } from '@/components/pdf/ReportTemplate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import React from 'react';

interface ReportRequestBody {
  title: string;
  dataSource: 'contracts' | 'clauses';
  fields: string[];
  filters: {
    dateRange?: {
      from: string;
      to: string;
    };
    status?: string[];
    companies?: string[];
    departments?: string[];
    tags?: string[];
  };
  groupBy?: string;
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const body: ReportRequestBody = await request.json();
    const { title, dataSource, fields, filters, sortBy } = body;

    // Kullanıcı bilgilerini al
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        companyUsers: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Eğer kullanıcının hiç şirketi yoksa ilk şirketi oluştur (demo amaçlı)
    let userCompany: any;
    if (!user.companyUsers.length) {
      // Demo şirket oluştur
      const demoCompany = await db.company.create({
        data: {
          name: 'Demo Şirket',
          description: 'Otomatik oluşturulan demo şirket',
          createdById: user.id,
        },
      });

      // Kullanıcıyı şirkete ekle
      await db.companyUser.create({
        data: {
          userId: user.id,
          companyId: demoCompany.id,
          role: 'ADMIN',
        },
      });



      userCompany = demoCompany;
    } else {
      userCompany = user.companyUsers[0].company;
    }
    let reportData: ReportData[] = [];

    // Veri kaynağına göre veri çek
    if (dataSource === 'contracts') {
      // Sözleşme verilerini çek
      const whereClause: Prisma.ContractWhereInput = {
        companyId: userCompany.id,
      };

      // Filtreleri uygula
      if (filters.dateRange) {
        whereClause.createdAt = {
          gte: new Date(filters.dateRange.from),
          lte: new Date(filters.dateRange.to),
        };
      }

      if (filters.status && filters.status.length > 0) {
        whereClause.status = {
          in: filters.status,
        };
      }

      // Sıralama
      const orderBy: Prisma.ContractOrderByWithRelationInput = {};
      if (sortBy) {
        switch (sortBy.field) {
          case 'title':
            orderBy.title = sortBy.direction;
            break;
          case 'status':
            orderBy.status = sortBy.direction;
            break;
          case 'createdAt':
            orderBy.createdAt = sortBy.direction;
            break;
          case 'expirationDate':
            orderBy.expirationDate = sortBy.direction;
            break;
          default:
            orderBy.createdAt = 'desc';
        }
      } else {
        orderBy.createdAt = 'desc';
      }

      const contracts = await db.contract.findMany({
        where: whereClause,
        include: {
          company: true,
        },
        orderBy,
        take: 1000, // Maksimum 1000 kayıt
      });

      // Eğer hiç sözleşme yoksa demo sözleşmeler oluştur
      if (contracts.length === 0) {
        await db.contract.createMany({
          data: [
            {
              title: 'Mobil Uygulama Geliştirme Projesi',
              description: 'iOS ve Android uygulama geliştirme hizmetleri',
              status: 'SIGNED',
              type: 'SERVICE',
              value: 75000,
              startDate: new Date('2024-01-01'),
              expirationDate: new Date('2024-12-31'),
              companyId: userCompany.id,
              createdById: user.id,
            },
            {
              title: 'Web Sitesi Tasarım ve Geliştirme',
              description: 'Kurumsal web sitesi tasarım ve geliştirme',
              status: 'ACTIVE',
              type: 'SERVICE',
              value: 45000,
              startDate: new Date('2024-03-01'),
              expirationDate: new Date('2024-09-01'),
              companyId: userCompany.id,
              createdById: user.id,
            },
            {
              title: 'E-ticaret Platformu Entegrasyonu',
              description: 'Mevcut sistemle e-ticaret platformu entegrasyonu',
              status: 'DRAFT',
              type: 'SERVICE',
              value: 30000,
              startDate: new Date('2024-07-01'),
              expirationDate: new Date('2024-12-01'),
              companyId: userCompany.id,
              createdById: user.id,
            },
          ],
        });

        // Tekrar sorgula
        const newContracts = await db.contract.findMany({
          where: whereClause,
          include: {
            company: true,
          },
          orderBy,
          take: 1000,
        });



        reportData = newContracts.map((contract) => ({
          id: contract.id,
          title: contract.title,
          status: contract.status,
          company: contract.company ? { name: contract.company.name } : undefined,
          createdAt: contract.createdAt.toISOString(),
          value: contract.value ? Number(contract.value) : undefined,
          expirationDate: contract.expirationDate?.toISOString(),
        }));
      } else {
        reportData = contracts.map((contract) => ({
          id: contract.id,
          title: contract.title,
          status: contract.status,
          company: contract.company ? { name: contract.company.name } : undefined,
          createdAt: contract.createdAt.toISOString(),
          value: contract.value ? Number(contract.value) : undefined,
          expirationDate: contract.expirationDate?.toISOString(),
        }));
      }

    } else if (dataSource === 'clauses') {
      // Madde verilerini çek
      const whereClause: Prisma.ClauseWhereInput = {
        companyId: userCompany.id,
      };

      if (filters.dateRange) {
        whereClause.createdAt = {
          gte: new Date(filters.dateRange.from),
          lte: new Date(filters.dateRange.to),
        };
      }

      const clauses = await db.clause.findMany({
        where: whereClause,
        include: {
          company: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1000,
      });

      reportData = clauses.map((clause) => ({
        id: clause.id,
        title: clause.title,
        status: clause.approvalStatus || 'ACTIVE',
        company: clause.company ? { name: clause.company.name } : undefined,
        createdAt: clause.createdAt.toISOString(),
      }));
    }



    // PDF oluştur
    const filterInfo = {
      dateRange: filters.dateRange 
        ? `${new Date(filters.dateRange.from).toLocaleDateString('tr-TR')} - ${new Date(filters.dateRange.to).toLocaleDateString('tr-TR')}` 
        : undefined,
      status: filters.status?.join(', '),
      company: filters.companies?.join(', '),
    };

    const userInfo = {
      name: user.name || user.email,
      email: user.email,
      company: userCompany.name,
    };

    const pdfElement = React.createElement(ReportTemplate, {
      title,
      data: reportData,
      filters: filterInfo,
      selectedFields: fields, // Seçilen alanları da gönder
      generatedAt: new Date().toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      userInfo,
    });

    // PDF'i buffer'a çevir
    const pdfBuffer = await renderToBuffer(pdfElement);

    // Dosya adını oluştur (sadece ASCII karakterleri kullan)
    const sanitizedTitle = title
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[şŞ]/g, 's')
      .replace(/[ıİ]/g, 'i')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${sanitizedTitle}_${timestamp}.pdf`;

    // Buffer'ı Uint8Array'e çevir
    const uint8Buffer = new Uint8Array(pdfBuffer);

    // PDF'i döndür
    return new Response(uint8Buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8Buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'PDF oluşturulurken bir hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 