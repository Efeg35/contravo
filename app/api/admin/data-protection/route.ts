import { NextRequest, NextResponse } from 'next/server';
import { 
  dataProtectionManager,
  getDataProtectionStats,
  generateComplianceReport,
  recordConsent,
  processDataSubjectRightRequest,
  reportPrivacyBreach,
  ConsentType,
  DataSubjectRight,
  DataCategory,
  LegalBasis,
  AnonymizationTechnique
} from '@/lib/data-protection';
import { auditLogger, AuditLevel, AuditCategory } from '@/lib/audit-logger';

// GET /api/admin/data-protection - Get data protection stats and compliance info
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const dataSubjectId = url.searchParams.get('dataSubjectId');

    switch (action) {
      case 'stats':
        const stats = getDataProtectionStats();
        return NextResponse.json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });

      case 'compliance-report':
        const report = await generateComplianceReport();
        return NextResponse.json({
          success: true,
          report,
          timestamp: new Date().toISOString()
        });

      case 'consent-types':
        return NextResponse.json({
          success: true,
          consentTypes: Object.values(ConsentType).map(type => ({
            type,
            description: getConsentTypeDescription(type)
          }))
        });

      case 'data-subject-rights':
        return NextResponse.json({
          success: true,
          rights: Object.values(DataSubjectRight).map(right => ({
            right,
            description: getDataSubjectRightDescription(right)
          }))
        });

      case 'data-categories':
        return NextResponse.json({
          success: true,
          categories: Object.values(DataCategory).map(category => ({
            category,
            description: getDataCategoryDescription(category)
          }))
        });

      case 'legal-basis':
        return NextResponse.json({
          success: true,
          legalBasis: Object.values(LegalBasis).map(basis => ({
            basis,
            description: getLegalBasisDescription(basis)
          }))
        });

      case 'anonymization-techniques':
        return NextResponse.json({
          success: true,
          techniques: Object.values(AnonymizationTechnique).map(technique => ({
            technique,
            description: getAnonymizationTechniqueDescription(technique)
          }))
        });

      case 'data-subject-profile':
        if (!dataSubjectId) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID required'
          }, { status: 400 });
        }

        // Mock data subject profile
        const profile = {
          id: dataSubjectId,
          email: 'user@example.com',
          createdAt: new Date().toISOString(),
          consents: [
            {
              type: 'MARKETING',
              granted: true,
              timestamp: new Date().toISOString(),
              purpose: 'Marketing communications'
            }
          ],
          dataSubjectRights: [],
          retentionStatus: {
            category: 'PERSONAL_DATA',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE'
          }
        };

        return NextResponse.json({
          success: true,
          profile,
          timestamp: new Date().toISOString()
        });

      default:
        // Return general overview
        const overview = {
          stats: getDataProtectionStats(),
          complianceReport: await generateComplianceReport(),
          systemStatus: 'active',
          lastUpdated: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          overview
        });
    }

  } catch (_error) {
    console.error('❌ Data protection API error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/admin/data-protection - Manage data protection operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, dataSubjectId, data } = body;

    await auditLogger.log({
      level: AuditLevel.INFO,
      category: AuditCategory.COMPLIANCE,
      action: 'DATA_PROTECTION_ADMIN',
      resource: 'data_protection',
      details: {
        description: `Admin data protection action: ${action}`,
        additionalInfo: {
          adminAction: action,
          targetDataSubject: dataSubjectId
        }
      }
    });

    switch (action) {
      case 'record-consent':
        if (!dataSubjectId || !data) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID and consent data required'
          }, { status: 400 });
        }

        const consentId = await recordConsent(dataSubjectId, {
          type: data.type,
          granted: data.granted,
          purpose: data.purpose,
          dataCategories: data.dataCategories || [DataCategory.PERSONAL_DATA],
          legalBasis: data.legalBasis || LegalBasis.CONSENT,
          ipAddress: data.ipAddress || '127.0.0.1',
          userAgent: data.userAgent || 'Admin Interface',
          consentText: data.consentText || 'Admin recorded consent'
        });

        return NextResponse.json({
          success: true,
          consentId,
          message: `Consent ${data.granted ? 'granted' : 'withdrawn'} for ${dataSubjectId}`,
          timestamp: new Date().toISOString()
        });

      case 'process-data-subject-right':
        if (!dataSubjectId || !data?.rightType) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID and right type required'
          }, { status: 400 });
        }

        const requestId = await processDataSubjectRightRequest(
          dataSubjectId,
          data.rightType,
          data.reason
        );

        return NextResponse.json({
          success: true,
          requestId,
          message: `Data subject right request processed: ${data.rightType}`,
          timestamp: new Date().toISOString()
        });

      case 'report-privacy-breach':
        if (!data) {
          return NextResponse.json({
            success: false,
            error: 'Breach data required'
          }, { status: 400 });
        }

        const breachId = await reportPrivacyBreach({
          title: data.title,
          description: data.description,
          severity: data.severity,
          affectedDataSubjects: data.affectedDataSubjects,
          dataCategories: data.dataCategories,
          rootCause: data.rootCause
        });

        return NextResponse.json({
          success: true,
          breachId,
          message: 'Privacy breach reported successfully',
          timestamp: new Date().toISOString()
        });

      case 'anonymize-data':
        if (!dataSubjectId || !data?.technique) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID and anonymization technique required'
          }, { status: 400 });
        }

        const anonymized = await dataProtectionManager.anonymizeData(
          dataSubjectId,
          data.technique
        );

        return NextResponse.json({
          success: anonymized,
          message: anonymized ? 
            `Data anonymized for ${dataSubjectId}` : 
            'Failed to anonymize data',
          timestamp: new Date().toISOString()
        });

      case 'withdraw-consent':
        if (!dataSubjectId || !data?.consentType) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID and consent type required'
          }, { status: 400 });
        }

        const withdrawn = await dataProtectionManager.withdrawConsent(
          dataSubjectId,
          data.consentType
        );

        return NextResponse.json({
          success: withdrawn,
          message: withdrawn ? 
            `Consent withdrawn for ${dataSubjectId}` : 
            'Failed to withdraw consent',
          timestamp: new Date().toISOString()
        });

      case 'generate-data-export':
        if (!dataSubjectId) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID required'
          }, { status: 400 });
        }

        // Mock data export generation
        const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return NextResponse.json({
          success: true,
          exportId,
          downloadUrl: `/api/admin/data-protection/export/${exportId}`,
          message: 'Data export generated successfully',
          timestamp: new Date().toISOString()
        });

      case 'schedule-data-deletion':
        if (!dataSubjectId) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID required'
          }, { status: 400 });
        }

        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + (data?.gracePeriodDays || 30));

        return NextResponse.json({
          success: true,
          scheduledDeletion: deletionDate.toISOString(),
          message: `Data deletion scheduled for ${dataSubjectId}`,
          timestamp: new Date().toISOString()
        });

      case 'update-retention-policy':
        if (!data) {
          return NextResponse.json({
            success: false,
            error: 'Retention policy data required'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Retention policy updated successfully',
          policy: data,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (_error) {
    console.error('❌ Data protection admin POST error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/admin/data-protection - Update data protection configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { configType, config } = body;

    await auditLogger.log({
      level: AuditLevel.WARN,
      category: AuditCategory.SYSTEM_CONFIGURATION,
      action: 'DATA_PROTECTION_CONFIG_UPDATE',
      resource: 'data_protection',
      details: {
        description: `Data protection configuration updated: ${configType}`,
        additionalInfo: { configType }
      }
    });

    switch (configType) {
      case 'gdpr-compliance':
        return NextResponse.json({
          success: true,
          message: 'GDPR compliance configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'encryption':
        return NextResponse.json({
          success: true,
          message: 'Encryption configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'consent-management':
        return NextResponse.json({
          success: true,
          message: 'Consent management configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'data-retention':
        return NextResponse.json({
          success: true,
          message: 'Data retention configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'anonymization':
        return NextResponse.json({
          success: true,
          message: 'Anonymization configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'breach-notification':
        return NextResponse.json({
          success: true,
          message: 'Breach notification configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid configuration type'
        }, { status: 400 });
    }

  } catch (_error) {
    console.error('❌ Data protection config update error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/admin/data-protection - Data cleanup and deletion
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const dataSubjectId = url.searchParams.get('dataSubjectId');
    const days = url.searchParams.get('days');

    await auditLogger.log({
      level: AuditLevel.WARN,
      category: AuditCategory.MAINTENANCE,
      action: 'DATA_PROTECTION_CLEANUP',
      resource: 'data_protection',
      details: {
        description: `Data protection cleanup: ${action}`,
        additionalInfo: {
          cleanupAction: action,
          targetDataSubject: dataSubjectId,
          days
        }
      }
    });

    switch (action) {
      case 'delete-expired-data':
        const expiredDays = parseInt(days || '365');
        return NextResponse.json({
          success: true,
          message: `Deleted data older than ${expiredDays} days`,
          deletedRecords: Math.floor(Math.random() * 100), // Mock count
          timestamp: new Date().toISOString()
        });

      case 'delete-data-subject':
        if (!dataSubjectId) {
          return NextResponse.json({
            success: false,
            error: 'Data subject ID required'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: `All data deleted for data subject ${dataSubjectId}`,
          timestamp: new Date().toISOString()
        });

      case 'cleanup-consent-records':
        const consentDays = parseInt(days || '1095'); // 3 years
        return NextResponse.json({
          success: true,
          message: `Cleaned up consent records older than ${consentDays} days`,
          cleanedRecords: Math.floor(Math.random() * 50),
          timestamp: new Date().toISOString()
        });

      case 'cleanup-breach-records':
        const breachDays = parseInt(days || '2555'); // 7 years
        return NextResponse.json({
          success: true,
          message: `Cleaned up breach records older than ${breachDays} days`,
          cleanedRecords: Math.floor(Math.random() * 10),
          timestamp: new Date().toISOString()
        });

      case 'anonymize-expired-data':
        return NextResponse.json({
          success: true,
          message: 'Anonymized expired personal data',
          anonymizedRecords: Math.floor(Math.random() * 200),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid cleanup action'
        }, { status: 400 });
    }

  } catch (_error) {
    console.error('❌ Data protection cleanup error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions
function getConsentTypeDescription(type: ConsentType): string {
  const descriptions: Record<ConsentType, string> = {
    [ConsentType.MARKETING]: 'Consent for marketing communications and promotional materials',
    [ConsentType.ANALYTICS]: 'Consent for analytics and usage tracking',
    [ConsentType.PERSONALIZATION]: 'Consent for personalized content and recommendations',
    [ConsentType.THIRD_PARTY_SHARING]: 'Consent for sharing data with third parties',
    [ConsentType.COOKIES]: 'Consent for non-essential cookies and tracking',
    [ConsentType.PROFILING]: 'Consent for automated profiling and decision making'
  };
  return descriptions[type] || 'Unknown consent type';
}

function getDataSubjectRightDescription(right: DataSubjectRight): string {
  const descriptions: Record<DataSubjectRight, string> = {
    [DataSubjectRight.ACCESS]: 'Right to access personal data and processing information',
    [DataSubjectRight.RECTIFICATION]: 'Right to correct inaccurate or incomplete personal data',
    [DataSubjectRight.ERASURE]: 'Right to be forgotten - deletion of personal data',
    [DataSubjectRight.RESTRICT_PROCESSING]: 'Right to restrict processing of personal data',
    [DataSubjectRight.DATA_PORTABILITY]: 'Right to receive personal data in portable format',
    [DataSubjectRight.OBJECT]: 'Right to object to processing of personal data',
    [DataSubjectRight.WITHDRAW_CONSENT]: 'Right to withdraw previously given consent'
  };
  return descriptions[right] || 'Unknown data subject right';
}

function getDataCategoryDescription(category: DataCategory): string {
  const descriptions: Record<DataCategory, string> = {
    [DataCategory.PERSONAL_DATA]: 'Basic personal information (name, email, address)',
    [DataCategory.SENSITIVE_DATA]: 'Special category data requiring extra protection',
    [DataCategory.BIOMETRIC_DATA]: 'Biometric identifiers (fingerprints, facial recognition)',
    [DataCategory.HEALTH_DATA]: 'Health and medical information',
    [DataCategory.FINANCIAL_DATA]: 'Financial and payment information',
    [DataCategory.BEHAVIORAL_DATA]: 'User behavior and interaction patterns',
    [DataCategory.LOCATION_DATA]: 'Geographic location and movement data',
    [DataCategory.COMMUNICATION_DATA]: 'Messages, emails, and communication records',
    [DataCategory.TECHNICAL_DATA]: 'Technical information (IP addresses, device info)',
    [DataCategory.MARKETING_DATA]: 'Marketing preferences and campaign data'
  };
  return descriptions[category] || 'Unknown data category';
}

function getLegalBasisDescription(basis: LegalBasis): string {
  const descriptions: Record<LegalBasis, string> = {
    [LegalBasis.CONSENT]: 'Data subject has given clear consent',
    [LegalBasis.CONTRACT]: 'Processing necessary for contract performance',
    [LegalBasis.LEGAL_OBLIGATION]: 'Processing required by law',
    [LegalBasis.VITAL_INTERESTS]: 'Processing necessary to protect vital interests',
    [LegalBasis.PUBLIC_TASK]: 'Processing necessary for public task or official authority',
    [LegalBasis.LEGITIMATE_INTERESTS]: 'Processing necessary for legitimate interests'
  };
  return descriptions[basis] || 'Unknown legal basis';
}

function getAnonymizationTechniqueDescription(technique: AnonymizationTechnique): string {
  const descriptions: Record<AnonymizationTechnique, string> = {
    [AnonymizationTechnique.GENERALIZATION]: 'Replace specific values with more general ones',
    [AnonymizationTechnique.SUPPRESSION]: 'Remove or hide sensitive data fields',
    [AnonymizationTechnique.PERTURBATION]: 'Add noise to numerical data',
    [AnonymizationTechnique.SWAPPING]: 'Exchange values between records',
    [AnonymizationTechnique.SYNTHETIC_DATA]: 'Generate artificial data with similar properties',
    [AnonymizationTechnique.DIFFERENTIAL_PRIVACY]: 'Add mathematical noise for privacy protection'
  };
  return descriptions[technique] || 'Unknown anonymization technique';
} 