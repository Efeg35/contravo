import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getCurrentUser } from '../../../../lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get contract statistics
    const [
      totalContracts,
      signedContracts,
      inReviewContracts,
      draftContracts,
      totalValue
    ] = await Promise.all([
      prisma.contract.count({
        where: {
          OR: [
            { createdById: user.id },
            {
              company: {
                OR: [
                  { createdById: user.id },
                  {
                    users: {
                      some: {
                        userId: user.id
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }),
      prisma.contract.count({
        where: {
          status: 'SIGNED',
          OR: [
            { createdById: user.id },
            {
              company: {
                OR: [
                  { createdById: user.id },
                  {
                    users: {
                      some: {
                        userId: user.id
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }),
      prisma.contract.count({
        where: {
          status: 'IN_REVIEW',
          OR: [
            { createdById: user.id },
            {
              company: {
                OR: [
                  { createdById: user.id },
                  {
                    users: {
                      some: {
                        userId: user.id
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }),
      prisma.contract.count({
        where: {
          status: 'DRAFT',
          OR: [
            { createdById: user.id },
            {
              company: {
                OR: [
                  { createdById: user.id },
                  {
                    users: {
                      some: {
                        userId: user.id
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }),
      prisma.contract.aggregate({
        where: {
          OR: [
            { createdById: user.id },
            {
              company: {
                OR: [
                  { createdById: user.id },
                  {
                    users: {
                      some: {
                        userId: user.id
                      }
                    }
                  }
                ]
              }
            }
          ]
        },
        _sum: {
          value: true
        }
      })
    ])

    return NextResponse.json({
      totalContracts,
      signedContracts,
      inReviewContracts,
      draftContracts,
      totalValue: totalValue._sum.value || 0
    })
  } catch (error) {
    console.error('Error fetching contract stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 