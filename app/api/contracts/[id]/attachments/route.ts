import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../../lib/prisma'
import { authOptions } from '../../../../../lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { getCurrentUser, userHasPermission } from '../../../../../lib/auth-helpers'
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '../../../../../lib/permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    
    // Sözleşmenin var olduğunu ve kullanıcının sahip olduğunu kontrol et
    const contract = await prisma.contract.findUnique({
      where: { 
        id,
        createdById: user.id
      }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // File validation
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' }, 
        { status: 400 }
      )
    }

    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' }, 
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueName = `${crypto.randomUUID()}.${fileExtension}`
    
    // Create upload path
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadDir, uniqueName)
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Save to database
    const attachment = await prisma.contractAttachment.create({
      data: {
        contractId: id,
        fileName: uniqueName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: user.id,
        url: `/uploads/${uniqueName}`
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: contractId } = await params

    // Get current user with department info
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can view all contracts
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Build department-based access control for contract
    const contractAccessWhere: any = {
      id: contractId,
      ...((!canViewAll) ? {
        OR: (() => {
          const accessConditions: any[] = [
            { createdById: user.id }
          ];

          const companyAccess = {
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
          };

          // If user has department and department role, add department-based filtering
          if ((user as any).department && (user as any).departmentRole) {
            const accessibleContractTypes: string[] = [];
            
            Object.entries(CONTRACT_TYPE_DEPARTMENT_MAPPING).forEach(([contractType, departments]) => {
              if (departments.includes((user as any).department as Department)) {
                if (PermissionManager.canAccessContractByType(
                  contractType, 
                  (user as any).department as Department, 
                  (user as any).departmentRole
                )) {
                  accessibleContractTypes.push(contractType);
                }
              }
            });

            if (accessibleContractTypes.length > 0) {
              accessConditions.push({
                ...companyAccess,
                type: {
                  in: accessibleContractTypes
                }
              });
            }
          } else {
            accessConditions.push(companyAccess);
          }

          return accessConditions;
        })()
      } : {})
    };

    // Check if user has access to this contract - WITH DEPARTMENT FILTERING
    const contract = await prisma.contract.findFirst({
      where: contractAccessWhere
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 })
    }

    const attachments = await prisma.contractAttachment.findMany({
      where: { contractId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 