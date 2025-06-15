import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock approval data
    const mockApprovals = [
      {
        id: '1',
        clauseId: '1',
        status: 'PENDING',
        requestedBy: {
          id: '1',
          name: 'Ahmet Yılmaz',
          email: 'ahmet@contravo.com',
          avatar: null
        },
        assignedTo: {
          id: '2',
          name: 'Ayşe Demir',
          email: 'ayse@contravo.com',
          avatar: null
        },
        comments: 'Yeni gizlilik maddesi için onay talep ediyorum.',
        requestedAt: '2024-01-15T10:00:00Z',
        clause: {
          id: '1',
          title: 'Gizlilik ve Veri Koruma Maddesi',
          category: 'Gizlilik',
          version: 1
        }
      },
      {
        id: '2',
        clauseId: '2',
        status: 'APPROVED',
        requestedBy: {
          id: '2',
          name: 'Ayşe Demir',
          email: 'ayse@contravo.com',
          avatar: null
        },
        assignedTo: {
          id: '1',
          name: 'Ahmet Yılmaz',
          email: 'ahmet@contravo.com',
          avatar: null
        },
        comments: 'Standart sorumluluk reddi maddesi.',
        requestedAt: '2024-01-14T14:30:00Z',
        respondedAt: '2024-01-14T16:45:00Z',
        clause: {
          id: '2',
          title: 'Sorumluluk Reddi Maddesi',
          category: 'Sorumluluk',
          version: 2
        }
      },
      {
        id: '3',
        clauseId: '3',
        status: 'REVISION_REQUESTED',
        requestedBy: {
          id: '3',
          name: 'Mehmet Kaya',
          email: 'mehmet@contravo.com',
          avatar: null
        },
        assignedTo: {
          id: '1',
          name: 'Ahmet Yılmaz',
          email: 'ahmet@contravo.com',
          avatar: null
        },
        comments: 'Ödeme koşulları güncellenmiş hali.',
        requestedAt: '2024-01-13T09:15:00Z',
        respondedAt: '2024-01-13T11:30:00Z',
        clause: {
          id: '3',
          title: 'Ödeme Koşulları Maddesi',
          category: 'Finansal',
          version: 3
        }
      },
      {
        id: '4',
        clauseId: '4',
        status: 'REJECTED',
        requestedBy: {
          id: '4',
          name: 'Fatma Özkan',
          email: 'fatma@contravo.com',
          avatar: null
        },
        assignedTo: {
          id: '2',
          name: 'Ayşe Demir',
          email: 'ayse@contravo.com',
          avatar: null
        },
        comments: 'Fesih koşulları için yeni madde önerisi.',
        requestedAt: '2024-01-12T16:20:00Z',
        respondedAt: '2024-01-12T17:45:00Z',
        clause: {
          id: '4',
          title: 'Fesih Koşulları Maddesi',
          category: 'Fesih',
          version: 1
        }
      }
    ];

    return NextResponse.json({
      success: true,
      approvals: mockApprovals,
      total: mockApprovals.length
    });

  } catch (error) {
    console.error('Approvals fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 