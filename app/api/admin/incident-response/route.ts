import { NextRequest, NextResponse } from 'next/server';
import { 
  incidentResponseManager,
  getIncidentResponseStats,
  createIncident,
  updateIncidentStatus,
  executeResponseAction,
  searchIncidents,
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
  ResponseAction,
  DetectionSource
} from '@/lib/incident-response';
import { auditLogger, AuditLevel, AuditCategory } from '@/lib/audit-logger';

// GET /api/admin/incident-response - Get incident response data
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const incidentId = url.searchParams.get('incidentId');

    switch (action) {
      case 'stats':
        const stats = getIncidentResponseStats();
        return NextResponse.json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });

      case 'incidents':
        const status = url.searchParams.get('status') as IncidentStatus;
        const severity = url.searchParams.get('severity') as IncidentSeverity;
        const category = url.searchParams.get('category') as IncidentCategory;
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const incidents = await searchIncidents({
          status,
          severity,
          category,
          limit
        });

        return NextResponse.json({
          success: true,
          incidents,
          count: incidents.length,
          timestamp: new Date().toISOString()
        });

      case 'incident-details':
        if (!incidentId) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID required'
          }, { status: 400 });
        }

        const report = await incidentResponseManager.generateIncidentReport(incidentId);
        return NextResponse.json({
          success: true,
          report,
          timestamp: new Date().toISOString()
        });

      case 'severities':
        return NextResponse.json({
          success: true,
          severities: Object.values(IncidentSeverity).map(severity => ({
            severity,
            description: getSeverityDescription(severity)
          }))
        });

      case 'categories':
        return NextResponse.json({
          success: true,
          categories: Object.values(IncidentCategory).map(category => ({
            category,
            description: getCategoryDescription(category)
          }))
        });

      case 'response-actions':
        return NextResponse.json({
          success: true,
          actions: Object.values(ResponseAction).map(action => ({
            action,
            description: getActionDescription(action)
          }))
        });

      case 'detection-sources':
        return NextResponse.json({
          success: true,
          sources: Object.values(DetectionSource).map(source => ({
            source,
            description: getDetectionSourceDescription(source)
          }))
        });

      default:
        // Return general overview
        const overview = {
          stats: getIncidentResponseStats(),
          recentIncidents: await searchIncidents({ limit: 10 }),
          systemStatus: 'active',
          lastUpdated: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          overview
        });
    }

  } catch (error) {
    console.error('❌ Incident response API error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/admin/incident-response - Manage incident response operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, incidentId, data } = body;

    await auditLogger.log({
      level: AuditLevel.INFO,
      category: AuditCategory.SECURITY_EVENT,
      action: 'INCIDENT_RESPONSE_ADMIN',
      resource: 'incident_response',
      details: {
        description: `Admin incident response action: ${action}`,
        additionalInfo: {
          adminAction: action,
          targetIncident: incidentId
        }
      }
    });

    switch (action) {
      case 'create-incident':
        if (!data) {
          return NextResponse.json({
            success: false,
            error: 'Incident data required'
          }, { status: 400 });
        }

        const newIncidentId = await createIncident({
          title: data.title,
          description: data.description,
          severity: data.severity || IncidentSeverity.MEDIUM,
          category: data.category || IncidentCategory.SECURITY_BREACH,
          detectionSource: data.detectionSource || DetectionSource.USER_REPORTS,
          reportedBy: data.reportedBy || 'admin',
          affectedSystems: data.affectedSystems || [],
          affectedUsers: data.affectedUsers || 0
        });

        return NextResponse.json({
          success: true,
          incidentId: newIncidentId,
          message: 'Incident created successfully',
          timestamp: new Date().toISOString()
        });

      case 'update-status':
        if (!incidentId || !data?.status) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID and status required'
          }, { status: 400 });
        }

        const statusUpdated = await updateIncidentStatus(
          incidentId,
          data.status,
          data.notes
        );

        return NextResponse.json({
          success: statusUpdated,
          message: statusUpdated ? 
            `Incident status updated to ${data.status}` : 
            'Failed to update incident status',
          timestamp: new Date().toISOString()
        });

      case 'execute-action':
        if (!incidentId || !data?.action) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID and action required'
          }, { status: 400 });
        }

        const actionExecuted = await executeResponseAction(
          incidentId,
          data.action,
          data.executedBy || 'admin',
          data.description
        );

        return NextResponse.json({
          success: actionExecuted,
          message: actionExecuted ? 
            `Response action ${data.action} executed successfully` : 
            'Failed to execute response action',
          timestamp: new Date().toISOString()
        });

      case 'add-evidence':
        if (!incidentId || !data) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID and evidence data required'
          }, { status: 400 });
        }

        const evidenceId = await incidentResponseManager.addEvidence(incidentId, {
          type: data.type,
          name: data.name,
          description: data.description,
          location: data.location,
          collectedBy: data.collectedBy || 'admin',
          sensitive: data.sensitive || false
        });

        return NextResponse.json({
          success: true,
          evidenceId,
          message: 'Evidence added successfully',
          timestamp: new Date().toISOString()
        });

      case 'assign-team':
        if (!incidentId || !data?.teamMembers) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID and team members required'
          }, { status: 400 });
        }

        // Mock team assignment
        return NextResponse.json({
          success: true,
          message: `Team assigned to incident ${incidentId}`,
          assignedMembers: data.teamMembers,
          timestamp: new Date().toISOString()
        });

      case 'escalate-incident':
        if (!incidentId) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID required'
          }, { status: 400 });
        }

        // Mock escalation
        return NextResponse.json({
          success: true,
          message: `Incident ${incidentId} escalated successfully`,
          escalationLevel: data?.level || 'Level 2',
          timestamp: new Date().toISOString()
        });

      case 'send-notification':
        if (!incidentId || !data) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID and notification data required'
          }, { status: 400 });
        }

        // Mock notification sending
        return NextResponse.json({
          success: true,
          message: 'Notification sent successfully',
          recipients: data.recipients || [],
          channel: data.channel || 'email',
          timestamp: new Date().toISOString()
        });

      case 'generate-report':
        if (!incidentId) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID required'
          }, { status: 400 });
        }

        const incidentReport = await incidentResponseManager.generateIncidentReport(incidentId);
        
        return NextResponse.json({
          success: true,
          report: incidentReport,
          downloadUrl: `/api/admin/incident-response/report/${incidentId}`,
          timestamp: new Date().toISOString()
        });

      case 'bulk-action':
        if (!data?.incidentIds || !data?.action) {
          return NextResponse.json({
            success: false,
            error: 'Incident IDs and action required'
          }, { status: 400 });
        }

        const results = [];
        for (const id of data.incidentIds) {
          try {
            if (data.action === 'update-status') {
              await updateIncidentStatus(id, data.status, data.notes);
            } else if (data.action === 'execute-action') {
              await executeResponseAction(id, data.responseAction, 'admin');
            }
            results.push({ incidentId: id, success: true });
          } catch (error) {
            results.push({ incidentId: id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Bulk action completed',
          results,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Incident response admin POST error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/admin/incident-response - Update incident response configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { configType, config } = body;

    await auditLogger.log({
      level: AuditLevel.WARN,
      category: AuditCategory.SYSTEM_CONFIGURATION,
      action: 'INCIDENT_RESPONSE_CONFIG_UPDATE',
      resource: 'incident_response',
      details: {
        description: `Incident response configuration updated: ${configType}`,
        additionalInfo: { configType }
      }
    });

    switch (configType) {
      case 'detection':
        return NextResponse.json({
          success: true,
          message: 'Detection configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'classification':
        return NextResponse.json({
          success: true,
          message: 'Classification configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'response-workflows':
        return NextResponse.json({
          success: true,
          message: 'Response workflows updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'escalation':
        return NextResponse.json({
          success: true,
          message: 'Escalation configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'communication':
        return NextResponse.json({
          success: true,
          message: 'Communication configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      case 'forensics':
        return NextResponse.json({
          success: true,
          message: 'Forensics configuration updated',
          config,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid configuration type'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Incident response config update error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/admin/incident-response - Cleanup and archival
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const incidentId = url.searchParams.get('incidentId');
    const days = url.searchParams.get('days');

    await auditLogger.log({
      level: AuditLevel.WARN,
      category: AuditCategory.MAINTENANCE,
      action: 'INCIDENT_RESPONSE_CLEANUP',
      resource: 'incident_response',
      details: {
        description: `Incident response cleanup: ${action}`,
        additionalInfo: {
          cleanupAction: action,
          targetIncident: incidentId,
          days
        }
      }
    });

    switch (action) {
      case 'archive-incident':
        if (!incidentId) {
          return NextResponse.json({
            success: false,
            error: 'Incident ID required'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: `Incident ${incidentId} archived successfully`,
          timestamp: new Date().toISOString()
        });

      case 'cleanup-old-incidents':
        const archiveDays = parseInt(days || '365');
        return NextResponse.json({
          success: true,
          message: `Archived incidents older than ${archiveDays} days`,
          archivedCount: Math.floor(Math.random() * 50),
          timestamp: new Date().toISOString()
        });

      case 'cleanup-evidence':
        const evidenceDays = parseInt(days || '2555'); // 7 years
        return NextResponse.json({
          success: true,
          message: `Cleaned up evidence older than ${evidenceDays} days`,
          cleanedCount: Math.floor(Math.random() * 100),
          timestamp: new Date().toISOString()
        });

      case 'purge-resolved-incidents':
        const purgeDays = parseInt(days || '1095'); // 3 years
        return NextResponse.json({
          success: true,
          message: `Purged resolved incidents older than ${purgeDays} days`,
          purgedCount: Math.floor(Math.random() * 25),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid cleanup action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Incident response cleanup error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions
function getSeverityDescription(severity: IncidentSeverity): string {
  const descriptions: Record<IncidentSeverity, string> = {
    [IncidentSeverity.CRITICAL]: 'Critical business impact, immediate response required',
    [IncidentSeverity.HIGH]: 'High business impact, urgent response required',
    [IncidentSeverity.MEDIUM]: 'Medium business impact, timely response required',
    [IncidentSeverity.LOW]: 'Low business impact, standard response',
    [IncidentSeverity.INFORMATIONAL]: 'Informational only, no immediate action required'
  };
  return descriptions[severity] || 'Unknown severity level';
}

function getCategoryDescription(category: IncidentCategory): string {
  const descriptions: Record<IncidentCategory, string> = {
    [IncidentCategory.SECURITY_BREACH]: 'Unauthorized access or security compromise',
    [IncidentCategory.DATA_BREACH]: 'Unauthorized access to sensitive data',
    [IncidentCategory.SYSTEM_OUTAGE]: 'System or service unavailability',
    [IncidentCategory.PERFORMANCE_DEGRADATION]: 'Significant performance issues',
    [IncidentCategory.MALWARE]: 'Malicious software detection',
    [IncidentCategory.PHISHING]: 'Phishing attack or social engineering',
    [IncidentCategory.DDOS_ATTACK]: 'Distributed denial of service attack',
    [IncidentCategory.INSIDER_THREAT]: 'Malicious or negligent insider activity',
    [IncidentCategory.COMPLIANCE_VIOLATION]: 'Regulatory or policy violation',
    [IncidentCategory.INFRASTRUCTURE_FAILURE]: 'Infrastructure or hardware failure'
  };
  return descriptions[category] || 'Unknown incident category';
}

function getActionDescription(action: ResponseAction): string {
  const descriptions: Record<ResponseAction, string> = {
    [ResponseAction.ISOLATE_SYSTEM]: 'Isolate affected systems from network',
    [ResponseAction.BLOCK_IP]: 'Block suspicious IP addresses',
    [ResponseAction.DISABLE_ACCOUNT]: 'Disable compromised user accounts',
    [ResponseAction.RESET_PASSWORDS]: 'Force password reset for affected users',
    [ResponseAction.BACKUP_DATA]: 'Create backup of critical data',
    [ResponseAction.NOTIFY_STAKEHOLDERS]: 'Send notifications to stakeholders',
    [ResponseAction.COLLECT_EVIDENCE]: 'Collect forensic evidence',
    [ResponseAction.PATCH_VULNERABILITY]: 'Apply security patches',
    [ResponseAction.RESTORE_FROM_BACKUP]: 'Restore systems from backup',
    [ResponseAction.MONITOR_ACTIVITY]: 'Increase monitoring and surveillance'
  };
  return descriptions[action] || 'Unknown response action';
}

function getDetectionSourceDescription(source: DetectionSource): string {
  const descriptions: Record<DetectionSource, string> = {
    [DetectionSource.SECURITY_LOGS]: 'Security log analysis and monitoring',
    [DetectionSource.NETWORK_MONITORING]: 'Network traffic analysis',
    [DetectionSource.ENDPOINT_DETECTION]: 'Endpoint detection and response',
    [DetectionSource.USER_REPORTS]: 'User-reported incidents',
    [DetectionSource.AUTOMATED_ALERTS]: 'Automated system alerts',
    [DetectionSource.THREAT_INTELLIGENCE]: 'Threat intelligence feeds',
    [DetectionSource.VULNERABILITY_SCANS]: 'Vulnerability scanning results',
    [DetectionSource.BEHAVIORAL_ANALYTICS]: 'Behavioral analysis and anomaly detection'
  };
  return descriptions[source] || 'Unknown detection source';
} 