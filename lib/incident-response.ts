import { redisCache } from './redis-cache';
import { auditLogger, AuditLevel, AuditCategory } from './audit-logger';
// Incident Response interfaces
export interface IncidentResponseConfig {
  enabled: boolean;
  detection: DetectionConfig;
  classification: ClassificationConfig;
  response: ResponseConfig;
  escalation: EscalationConfig;
  forensics: ForensicsConfig;
  recovery: RecoveryConfig;
  communication: CommunicationConfig;
  postIncident: PostIncidentConfig;
}

export interface DetectionConfig {
  enabled: boolean;
  sources: DetectionSource[];
  thresholds: DetectionThresholds;
  automatedDetection: boolean;
  realTimeMonitoring: boolean;
  correlationRules: CorrelationRule[];
  falsePositiveReduction: boolean;
}

export interface ClassificationConfig {
  enabled: boolean;
  severityLevels: SeverityLevel[];
  categories: IncidentCategory[];
  priorityMatrix: PriorityMatrix;
  autoClassification: boolean;
  mlClassification: boolean;
}

export interface ResponseConfig {
  enabled: boolean;
  responseTeams: ResponseTeam[];
  workflows: ResponseWorkflow[];
  automatedResponse: AutomatedResponseConfig;
  containmentStrategies: ContainmentStrategy[];
  communicationTemplates: CommunicationTemplate[];
}

export interface EscalationConfig {
  enabled: boolean;
  escalationLevels: EscalationLevel[];
  escalationTriggers: EscalationTrigger[];
  notificationChannels: NotificationChannel[];
  timeBasedEscalation: boolean;
  severityBasedEscalation: boolean;
}

// Enums
export enum IncidentSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL'
}

export enum IncidentStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  CONTAINED = 'CONTAINED',
  ERADICATING = 'ERADICATING',
  RECOVERING = 'RECOVERING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum IncidentCategory {
  SECURITY_BREACH = 'SECURITY_BREACH',
  DATA_BREACH = 'DATA_BREACH',
  SYSTEM_OUTAGE = 'SYSTEM_OUTAGE',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  MALWARE = 'MALWARE',
  PHISHING = 'PHISHING',
  DDOS_ATTACK = 'DDOS_ATTACK',
  INSIDER_THREAT = 'INSIDER_THREAT',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  INFRASTRUCTURE_FAILURE = 'INFRASTRUCTURE_FAILURE'
}

export enum ResponseAction {
  ISOLATE_SYSTEM = 'ISOLATE_SYSTEM',
  BLOCK_IP = 'BLOCK_IP',
  DISABLE_ACCOUNT = 'DISABLE_ACCOUNT',
  RESET_PASSWORDS = 'RESET_PASSWORDS',
  BACKUP_DATA = 'BACKUP_DATA',
  NOTIFY_STAKEHOLDERS = 'NOTIFY_STAKEHOLDERS',
  COLLECT_EVIDENCE = 'COLLECT_EVIDENCE',
  PATCH_VULNERABILITY = 'PATCH_VULNERABILITY',
  RESTORE_FROM_BACKUP = 'RESTORE_FROM_BACKUP',
  MONITOR_ACTIVITY = 'MONITOR_ACTIVITY'
}

export enum DetectionSource {
  SECURITY_LOGS = 'SECURITY_LOGS',
  NETWORK_MONITORING = 'NETWORK_MONITORING',
  ENDPOINT_DETECTION = 'ENDPOINT_DETECTION',
  USER_REPORTS = 'USER_REPORTS',
  AUTOMATED_ALERTS = 'AUTOMATED_ALERTS',
  THREAT_INTELLIGENCE = 'THREAT_INTELLIGENCE',
  VULNERABILITY_SCANS = 'VULNERABILITY_SCANS',
  BEHAVIORAL_ANALYTICS = 'BEHAVIORAL_ANALYTICS'
}

// Data structures
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  status: IncidentStatus;
  priority: number;
  detectedAt: Date;
  reportedBy: string;
  assignedTo: string[];
  affectedSystems: string[];
  affectedUsers: number;
  detectionSource: DetectionSource;
  timeline: IncidentTimelineEntry[];
  evidence: Evidence[];
  actions: ResponseActionRecord[];
  communications: CommunicationRecord[];
  impact: ImpactAssessment;
  containment: ContainmentRecord;
  recovery: RecoveryRecord;
  postIncident: PostIncidentAnalysis;
  tags: string[];
  metadata: IncidentMetadata;
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: Date;
  event: string;
  description: string;
  actor: string;
  automated: boolean;
  evidence?: string[];
}

export interface Evidence {
  id: string;
  type: 'LOG' | 'SCREENSHOT' | 'NETWORK_CAPTURE' | 'MEMORY_DUMP' | 'FILE' | 'OTHER';
  name: string;
  description: string;
  collectedAt: Date;
  collectedBy: string;
  location: string;
  hash: string;
  chainOfCustody: ChainOfCustodyEntry[];
  encrypted: boolean;
  sensitive: boolean;
}

export interface ResponseActionRecord {
  id: string;
  action: ResponseAction;
  description: string;
  executedAt: Date;
  executedBy: string;
  automated: boolean;
  successful: boolean;
  result: string;
  evidence?: string[];
}

export interface CommunicationRecord {
  id: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'STAKEHOLDER' | 'MEDIA' | 'REGULATORY';
  recipient: string;
  message: string;
  sentAt: Date;
  sentBy: string;
  channel: string;
  acknowledged: boolean;
}

export interface ImpactAssessment {
  businessImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  financialImpact: number;
  reputationalImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  operationalImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complianceImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedServices: string[];
  downtime: number; // minutes
  dataCompromised: boolean;
  customersAffected: number;
}

export interface ContainmentRecord {
  strategy: string;
  implementedAt: Date;
  implementedBy: string;
  successful: boolean;
  description: string;
  actions: string[];
  effectiveness: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RecoveryRecord {
  strategy: string;
  startedAt: Date;
  completedAt?: Date;
  recoveryTime: number; // minutes
  successful: boolean;
  description: string;
  actions: string[];
  verificationSteps: string[];
}

export interface PostIncidentAnalysis {
  completed: boolean;
  completedAt?: Date;
  rootCause: string;
  contributingFactors: string[];
  lessonsLearned: string[];
  improvements: string[];
  preventiveMeasures: string[];
  followUpActions: FollowUpAction[];
}

export interface FollowUpAction {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ChainOfCustodyEntry {
  timestamp: Date;
  action: 'COLLECTED' | 'TRANSFERRED' | 'ANALYZED' | 'STORED' | 'DESTROYED';
  person: string;
  location: string;
  notes: string;
}

export interface IncidentMetadata {
  correlationId?: string;
  relatedIncidents: string[];
  externalReferences: string[];
  regulatoryNotifications: string[];
  mediaReferences: string[];
  cost: number;
  effort: number; // person-hours
}

export interface DetectionThresholds {
  failedLogins: number;
  suspiciousIPs: number;
  dataExfiltration: number; // MB
  systemLoad: number; // percentage
  errorRate: number; // percentage
  responseTime: number; // milliseconds
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  timeWindow: number; // minutes
  threshold: number;
  severity: IncidentSeverity;
  enabled: boolean;
}

export interface SeverityLevel {
  level: IncidentSeverity;
  description: string;
  responseTime: number; // minutes
  escalationTime: number; // minutes
  requiredApprovals: string[];
  notificationChannels: string[];
}

export interface PriorityMatrix {
  [key: string]: {
    [key: string]: number; // severity + impact = priority
  };
}

export interface ResponseTeam {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  specializations: IncidentCategory[];
  availabilitySchedule: string;
  contactInfo: ContactInfo;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  skills: string[];
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
}

export interface ContactInfo {
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  slackChannel: string;
  escalationContact: string;
}

export interface ResponseWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  category: IncidentCategory;
  severity: IncidentSeverity;
  automated: boolean;
}

export interface WorkflowTrigger {
  type: 'SEVERITY' | 'CATEGORY' | 'KEYWORD' | 'TIME' | 'ESCALATION';
  condition: string;
  value: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  action: ResponseAction;
  automated: boolean;
  requiredRole: string;
  timeLimit: number; // minutes
  dependencies: string[];
  approvalRequired: boolean;
}

export interface AutomatedResponseConfig {
  enabled: boolean;
  actions: AutomatedAction[];
  safetyLimits: SafetyLimits;
  humanApprovalRequired: boolean;
  rollbackCapability: boolean;
}

export interface AutomatedAction {
  trigger: string;
  action: ResponseAction;
  conditions: string[];
  safetyChecks: string[];
  rollbackAction?: ResponseAction;
}

export interface SafetyLimits {
  maxSystemsToIsolate: number;
  maxAccountsToDisable: number;
  maxIPsToBlock: number;
  requireApprovalAbove: IncidentSeverity;
}

export interface ContainmentStrategy {
  id: string;
  name: string;
  description: string;
  category: IncidentCategory;
  actions: ResponseAction[];
  timeToImplement: number; // minutes
  effectiveness: number; // percentage
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'STAKEHOLDER' | 'MEDIA' | 'REGULATORY';
  subject: string;
  template: string;
  variables: string[];
  approvalRequired: boolean;
}

export interface EscalationLevel {
  level: number;
  name: string;
  description: string;
  contacts: string[];
  notificationMethods: string[];
  timeThreshold: number; // minutes
  severityThreshold: IncidentSeverity;
}

export interface EscalationTrigger {
  type: 'TIME' | 'SEVERITY' | 'IMPACT' | 'MANUAL';
  condition: string;
  threshold: string;
  escalationLevel: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'SLACK' | 'WEBHOOK' | 'PHONE';
  endpoint: string;
  enabled: boolean;
  priority: number;
}

export interface ForensicsConfig {
  enabled: boolean;
  automaticCollection: boolean;
  evidenceTypes: string[];
  retentionPeriod: number; // days
  chainOfCustody: boolean;
  encryption: boolean;
}

export interface RecoveryConfig {
  enabled: boolean;
  strategies: RecoveryStrategy[];
  backupValidation: boolean;
  rollbackCapability: boolean;
  testingRequired: boolean;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  category: IncidentCategory;
  steps: string[];
  estimatedTime: number; // minutes
  prerequisites: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CommunicationConfig {
  enabled: boolean;
  templates: CommunicationTemplate[];
  approvalWorkflow: boolean;
  stakeholderGroups: StakeholderGroup[];
  mediaPolicy: MediaPolicy;
}

export interface StakeholderGroup {
  id: string;
  name: string;
  description: string;
  contacts: string[];
  notificationThreshold: IncidentSeverity;
  communicationMethod: string;
}

export interface MediaPolicy {
  enabled: boolean;
  spokesperson: string;
  approvalRequired: boolean;
  templates: string[];
  guidelines: string[];
}

export interface PostIncidentConfig {
  enabled: boolean;
  mandatoryForSeverity: IncidentSeverity[];
  timelineRequirement: number; // days
  stakeholderInvolvement: boolean;
  improvementTracking: boolean;
}

// Statistics
export interface IncidentResponseStats {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  averageResolutionTime: number;
  incidentsBySeverity: Record<IncidentSeverity, number>;
  incidentsByCategory: Record<IncidentCategory, number>;
  mttr: number; // Mean Time To Resolution
  mtbf: number; // Mean Time Between Failures
  falsePositiveRate: number;
  escalationRate: number;
}

export class IncidentResponseManager {
  private static instance: IncidentResponseManager;
  private config: IncidentResponseConfig;
  private incidents: Map<string, Incident> = new Map();
  private activeWorkflows: Map<string, string> = new Map(); // incidentId -> workflowId
  private stats: IncidentResponseStats = {
    totalIncidents: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    averageResolutionTime: 0,
    incidentsBySeverity: {
      [IncidentSeverity.CRITICAL]: 0,
      [IncidentSeverity.HIGH]: 0,
      [IncidentSeverity.MEDIUM]: 0,
      [IncidentSeverity.LOW]: 0,
      [IncidentSeverity.INFORMATIONAL]: 0
    },
    incidentsByCategory: {
      [IncidentCategory.SECURITY_BREACH]: 0,
      [IncidentCategory.DATA_BREACH]: 0,
      [IncidentCategory.SYSTEM_OUTAGE]: 0,
      [IncidentCategory.PERFORMANCE_DEGRADATION]: 0,
      [IncidentCategory.MALWARE]: 0,
      [IncidentCategory.PHISHING]: 0,
      [IncidentCategory.DDOS_ATTACK]: 0,
      [IncidentCategory.INSIDER_THREAT]: 0,
      [IncidentCategory.COMPLIANCE_VIOLATION]: 0,
      [IncidentCategory.INFRASTRUCTURE_FAILURE]: 0
    },
    mttr: 0,
    mtbf: 0,
    falsePositiveRate: 0,
    escalationRate: 0
  };

  private readonly REDIS_KEY_PREFIX = 'incident_response:';

  private constructor(config: IncidentResponseConfig) {
    this.config = config;
    this.startMonitoring();
  }

  static getInstance(config?: IncidentResponseConfig): IncidentResponseManager {
    if (!IncidentResponseManager.instance) {
      if (!config) {
        throw new Error('Incident response configuration required for first initialization');
      }
      IncidentResponseManager.instance = new IncidentResponseManager(config);
    }
    return IncidentResponseManager.instance;
  }

  // Main incident creation and management
  async createIncident(incidentData: {
    title: string;
    description: string;
    severity?: IncidentSeverity;
    category?: IncidentCategory;
    detectionSource: DetectionSource;
    reportedBy: string;
    affectedSystems?: string[];
    affectedUsers?: number;
  }): Promise<string> {
    try {
      const incident: Incident = {
        id: this.generateIncidentId(),
        title: incidentData.title,
        description: incidentData.description,
        severity: incidentData.severity || IncidentSeverity.MEDIUM,
        category: incidentData.category || IncidentCategory.SECURITY_BREACH,
        status: IncidentStatus.DETECTED,
        priority: this.calculatePriority(incidentData.severity || IncidentSeverity.MEDIUM, 'MEDIUM'),
        detectedAt: new Date(),
        reportedBy: incidentData.reportedBy,
        assignedTo: [],
        affectedSystems: incidentData.affectedSystems || [],
        affectedUsers: incidentData.affectedUsers || 0,
        detectionSource: incidentData.detectionSource,
        timeline: [{
          id: this.generateId('timeline'),
          timestamp: new Date(),
          event: 'INCIDENT_CREATED',
          description: 'Incident created and detected',
          actor: incidentData.reportedBy,
          automated: false
        }],
        evidence: [],
        actions: [],
        communications: [],
        impact: {
          businessImpact: 'MEDIUM',
          financialImpact: 0,
          reputationalImpact: 'LOW',
          operationalImpact: 'MEDIUM',
          complianceImpact: 'NONE',
          affectedServices: incidentData.affectedSystems || [],
          downtime: 0,
          dataCompromised: false,
          customersAffected: incidentData.affectedUsers || 0
        },
        containment: {
          strategy: '',
          implementedAt: new Date(),
          implementedBy: '',
          successful: false,
          description: '',
          actions: [],
          effectiveness: 'LOW'
        },
        recovery: {
          strategy: '',
          startedAt: new Date(),
          recoveryTime: 0,
          successful: false,
          description: '',
          actions: [],
          verificationSteps: []
        },
        postIncident: {
          completed: false,
          rootCause: '',
          contributingFactors: [],
          lessonsLearned: [],
          improvements: [],
          preventiveMeasures: [],
          followUpActions: []
        },
        tags: [],
        metadata: {
          relatedIncidents: [],
          externalReferences: [],
          regulatoryNotifications: [],
          mediaReferences: [],
          cost: 0,
          effort: 0
        }
      };

      // Store incident
      this.incidents.set(incident.id, incident);
      await this.storeIncident(incident);

      // Update statistics
      this.stats.totalIncidents++;
      this.stats.openIncidents++;
      this.stats.incidentsBySeverity[incident.severity]++;
      this.stats.incidentsByCategory[incident.category]++;

      // Auto-assign team if configured
      await this.autoAssignTeam(incident);

      // Start response workflow
      await this.initiateResponseWorkflow(incident);

      // Send notifications
      await this.sendInitialNotifications(incident);

      // Audit log
      await auditLogger.log({
        level: this.getAuditLevel(incident.severity),
        category: AuditCategory.SECURITY_EVENT,
        action: 'INCIDENT_CREATED',
        resource: 'incident_response',
        details: {
          description: `Security incident created: ${incident.title}`,
          additionalInfo: {
            incidentId: incident.id,
            severity: incident.severity,
            category: incident.category
          }
        }
      });

      console.log(`🚨 Incident created: ${incident.id} (${incident.severity})`);
      return incident.id;

    } catch (_error) {
      console.error('❌ Error creating incident:', _error);
      throw _error;
    }
  }

  async updateIncidentStatus(incidentId: string, status: IncidentStatus, notes?: string): Promise<boolean> {
    try {
      const incident = await this.getIncident(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      const oldStatus = incident.status;
      incident.status = status;

      // Add timeline entry
      incident.timeline.push({
        id: this.generateId('timeline'),
        timestamp: new Date(),
        event: 'STATUS_CHANGED',
        description: `Status changed from ${oldStatus} to ${status}${notes ? ': ' + notes : ''}`,
        actor: 'system', // Would be actual user
        automated: false
      });

      // Update statistics
      if (status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED) {
        this.stats.openIncidents--;
        this.stats.resolvedIncidents++;
        
        // Calculate resolution time
        const resolutionTime = Date.now() - incident.detectedAt.getTime();
        this.updateResolutionTimeStats(resolutionTime);
      }

      await this.storeIncident(incident);

      // Handle status-specific actions
      switch (status) {
        case IncidentStatus.CONTAINED:
          await this.handleContainment(incident);
          break;
        case IncidentStatus.RECOVERING:
          await this.handleRecovery(incident);
          break;
        case IncidentStatus.RESOLVED:
          await this.handleResolution(incident);
          break;
        case IncidentStatus.CLOSED:
          await this.handleClosure(incident);
          break;
      }

      console.log(`📊 Incident ${incidentId} status updated: ${oldStatus} → ${status}`);
      return true;

    } catch (_error) {
      console.error('❌ Error updating incident status:');
      return false;
    }
  }

  async executeResponseAction(
    incidentId: string,
    action: ResponseAction,
    executedBy: string,
    description?: string
  ): Promise<boolean> {
    try {
      const incident = await this.getIncident(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      const actionRecord: ResponseActionRecord = {
        id: this.generateId('action'),
        action,
        description: description || `Executed ${action}`,
        executedAt: new Date(),
        executedBy,
        automated: false,
        successful: true, // Would be determined by actual execution
        result: 'Action completed successfully'
      };

      // Execute the actual action
      const success = await this.performResponseAction(action, incident);
      actionRecord.successful = success;
      actionRecord.result = success ? 'Action completed successfully' : 'Action failed';

      incident.actions.push(actionRecord);

      // Add timeline entry
      incident.timeline.push({
        id: this.generateId('timeline'),
        timestamp: new Date(),
        event: 'ACTION_EXECUTED',
        description: `Response action executed: ${action}`,
        actor: executedBy,
        automated: false
      });

      await this.storeIncident(incident);

      console.log(`⚡ Response action executed: ${action} for incident ${incidentId}`);
      return success;

    } catch (_error) {
      console.error('❌ Error executing response action:');
      return false;
    }
  }

  async addEvidence(
    incidentId: string,
    evidenceData: {
      type: Evidence['type'];
      name: string;
      description: string;
      location: string;
      collectedBy: string;
      sensitive?: boolean;
    }
  ): Promise<string> {
    try {
      const incident = await this.getIncident(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      const evidence: Evidence = {
        id: this.generateId('evidence'),
        type: evidenceData.type,
        name: evidenceData.name,
        description: evidenceData.description,
        collectedAt: new Date(),
        collectedBy: evidenceData.collectedBy,
        location: evidenceData.location,
        hash: this.generateHash(evidenceData.name + evidenceData.location),
        chainOfCustody: [{
          timestamp: new Date(),
          action: 'COLLECTED',
          person: evidenceData.collectedBy,
          location: evidenceData.location,
          notes: 'Evidence collected'
        }],
        encrypted: evidenceData.sensitive || false,
        sensitive: evidenceData.sensitive || false
      };

      incident.evidence.push(evidence);

      // Add timeline entry
      incident.timeline.push({
        id: this.generateId('timeline'),
        timestamp: new Date(),
        event: 'EVIDENCE_COLLECTED',
        description: `Evidence collected: ${evidence.name}`,
        actor: evidenceData.collectedBy,
        automated: false,
        evidence: [evidence.id]
      });

      await this.storeIncident(incident);

      console.log(`🔍 Evidence added to incident ${incidentId}: ${evidence.name}`);
      return evidence.id;

    } catch (_error) {
      console.error('❌ Error adding evidence:', _error);
      throw _error;
    }
  }

  // Private helper methods
  private async autoAssignTeam(incident: Incident): Promise<void> {
    // Find appropriate response team based on category and severity
    const team = this.config.response.responseTeams.find(t => 
      t.specializations.includes(incident.category)
    );

    if (team) {
      incident.assignedTo = team.members.map(m => m.id);
      
      incident.timeline.push({
        id: this.generateId('timeline'),
        timestamp: new Date(),
        event: 'TEAM_ASSIGNED',
        description: `Response team assigned: ${team.name}`,
        actor: 'system',
        automated: true
      });
    }
  }

  private async initiateResponseWorkflow(incident: Incident): Promise<void> {
    // Find matching workflow
    const workflow = this.config.response.workflows.find(w => 
      w.category === incident.category && 
      w.severity === incident.severity
    );

    if (workflow) {
      this.activeWorkflows.set(incident.id, workflow.id);
      
      incident.timeline.push({
        id: this.generateId('timeline'),
        timestamp: new Date(),
        event: 'WORKFLOW_INITIATED',
        description: `Response workflow initiated: ${workflow.name}`,
        actor: 'system',
        automated: true
      });

      // Execute automated steps
      if (workflow.automated) {
        await this.executeWorkflowSteps(incident, workflow);
      }
    }
  }

  private async executeWorkflowSteps(incident: Incident, workflow: ResponseWorkflow): Promise<void> {
    for (const step of workflow.steps) {
      if (step.automated) {
        await this.executeResponseAction(incident.id, step.action, 'system', step.description);
      }
    }
  }

  private async performResponseAction(action: ResponseAction, incident: Incident): Promise<boolean> {
    // Mock implementation - in production would perform actual actions
    switch (action) {
      case ResponseAction.ISOLATE_SYSTEM:
        console.log(`🔒 Isolating systems: ${incident.affectedSystems.join(', ')}`);
        return true;
      case ResponseAction.BLOCK_IP:
        console.log('🚫 Blocking suspicious IP addresses');
        return true;
      case ResponseAction.DISABLE_ACCOUNT:
        console.log('👤 Disabling compromised accounts');
        return true;
      case ResponseAction.RESET_PASSWORDS:
        console.log('🔑 Resetting user passwords');
        return true;
      case ResponseAction.BACKUP_DATA:
        console.log('💾 Creating data backups');
        return true;
      case ResponseAction.COLLECT_EVIDENCE:
        console.log('🔍 Collecting forensic evidence');
        return true;
      default:
        return true;
    }
  }

  private async sendInitialNotifications(incident: Incident): Promise<void> {
    // Send notifications based on severity and configuration
    const notifications = this.config.escalation.notificationChannels.filter(
      channel => channel.enabled
    );

    for (const channel of notifications) {
      await this.sendNotification(channel, incident, 'INCIDENT_CREATED');
    }
  }

  private async sendNotification(
    channel: NotificationChannel,
    incident: Incident,
    type: string
  ): Promise<void> {
    // Mock notification sending
    console.log(`📢 Sending ${type} notification via ${channel.type} for incident ${incident.id}`);
  }

  private async handleContainment(incident: Incident): Promise<void> {
    incident.containment.implementedAt = new Date();
    incident.containment.successful = true;
    incident.containment.description = 'Incident contained successfully';
  }

  private async handleRecovery(incident: Incident): Promise<void> {
    incident.recovery.startedAt = new Date();
    incident.recovery.description = 'Recovery process initiated';
  }

  private async handleResolution(incident: Incident): Promise<void> {
    incident.recovery.completedAt = new Date();
    incident.recovery.successful = true;
    incident.recovery.recoveryTime = Date.now() - incident.recovery.startedAt.getTime();
  }

  private async handleClosure(incident: Incident): Promise<void> {
    // Initiate post-incident analysis if required
    if (this.shouldRequirePostIncidentAnalysis(incident)) {
      incident.postIncident.completed = false;
      // Schedule post-incident review
    }
  }

  private shouldRequirePostIncidentAnalysis(incident: Incident): boolean {
    return this.config.postIncident.mandatoryForSeverity.includes(incident.severity);
  }

  private calculatePriority(severity: IncidentSeverity, impact: string): number {
    // Simple priority calculation - would be more sophisticated in production
    const severityWeight = {
      [IncidentSeverity.CRITICAL]: 5,
      [IncidentSeverity.HIGH]: 4,
      [IncidentSeverity.MEDIUM]: 3,
      [IncidentSeverity.LOW]: 2,
      [IncidentSeverity.INFORMATIONAL]: 1
    };

    const impactWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    
    return severityWeight[severity] * (impactWeight[impact as keyof typeof impactWeight] || 2);
  }

  private getAuditLevel(severity: IncidentSeverity): AuditLevel {
    switch (severity) {
      case IncidentSeverity.CRITICAL:
        return AuditLevel.CRITICAL;
      case IncidentSeverity.HIGH:
        return AuditLevel.ERROR;
      case IncidentSeverity.MEDIUM:
        return AuditLevel.WARN;
      default:
        return AuditLevel.INFO;
    }
  }

  private updateResolutionTimeStats(resolutionTime: number): void {
    // Update MTTR calculation
    const currentMttr = this.stats.mttr;
    const resolvedCount = this.stats.resolvedIncidents;
    
    this.stats.mttr = ((currentMttr * (resolvedCount - 1)) + resolutionTime) / resolvedCount;
  }

  private async getIncident(incidentId: string): Promise<Incident | null> {
    // Check memory cache first
    let incident = this.incidents.get(incidentId);
    if (incident) {
      return incident;
    }

    // Check Redis cache
    try {
      const cached = await redisCache.get<string>(`${this.REDIS_KEY_PREFIX}incident:${incidentId}`);
      if (cached) {
        incident = JSON.parse(cached);
        this.incidents.set(incidentId, incident!);
        return incident!;
      }
    } catch (_error) {
      console.error('Error loading incident from cache:');
    }

    return null;
  }

  private async storeIncident(incident: Incident): Promise<void> {
    try {
      // Update memory cache
      this.incidents.set(incident.id, incident);

      // Store in Redis
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}incident:${incident.id}`,
        JSON.stringify(incident),
        { ttl: 365 * 24 * 60 * 60 } // 1 year
      );
    } catch (_error) {
      console.error('Error storing incident:');
    }
  }

  private generateIncidentId(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(this.stats.totalIncidents + 1).padStart(4, '0');
    
    return `INC-${year}${month}${day}-${sequence}`;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(input: string): string {
    // Simple hash function - would use proper cryptographic hash in production
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private startMonitoring(): void {
    if (this.config.detection.realTimeMonitoring) {
      // Start real-time monitoring
      console.log('🔍 Incident response monitoring started');
    }
  }

  // Public API methods
  getStats(): IncidentResponseStats {
    return { ...this.stats };
  }

  async searchIncidents(query: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    category?: IncidentCategory;
    dateFrom?: Date;
    dateTo?: Date;
    assignedTo?: string;
    limit?: number;
  }): Promise<Incident[]> {
    const incidents = Array.from(this.incidents.values());
    
    return incidents.filter(incident => {
      if (query.status && incident.status !== query.status) return false;
      if (query.severity && incident.severity !== query.severity) return false;
      if (query.category && incident.category !== query.category) return false;
      if (query.dateFrom && incident.detectedAt < query.dateFrom) return false;
      if (query.dateTo && incident.detectedAt > query.dateTo) return false;
      if (query.assignedTo && !incident.assignedTo.includes(query.assignedTo)) return false;
      return true;
    }).slice(0, query.limit || 50);
  }

  async generateIncidentReport(incidentId: string): Promise<{
    incident: Incident;
    summary: string;
    timeline: string;
    impact: string;
    lessons: string[];
  }> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    return {
      incident,
      summary: `Incident ${incident.id}: ${incident.title}`,
      timeline: incident.timeline.map(entry => 
        `${entry.timestamp.toISOString()}: ${entry.description}`
      ).join('\n'),
      impact: `Business Impact: ${incident.impact.businessImpact}, Affected Users: ${incident.impact.customersAffected}`,
      lessons: incident.postIncident.lessonsLearned
    };
  }
}

// Default configuration
export const defaultIncidentResponseConfig: IncidentResponseConfig = {
  enabled: true,
  detection: {
    enabled: true,
    sources: Object.values(DetectionSource),
    thresholds: {
      failedLogins: 10,
      suspiciousIPs: 5,
      dataExfiltration: 100, // MB
      systemLoad: 90, // percentage
      errorRate: 10, // percentage
      responseTime: 5000 // milliseconds
    },
    automatedDetection: true,
    realTimeMonitoring: true,
    correlationRules: [],
    falsePositiveReduction: true
  },
  classification: {
    enabled: true,
    severityLevels: [
      {
        level: IncidentSeverity.CRITICAL,
        description: 'Critical business impact, immediate response required',
        responseTime: 15, // minutes
        escalationTime: 30,
        requiredApprovals: ['CISO', 'CTO'],
        notificationChannels: ['EMAIL', 'SMS', 'PHONE']
      },
      {
        level: IncidentSeverity.HIGH,
        description: 'High business impact, urgent response required',
        responseTime: 60,
        escalationTime: 120,
        requiredApprovals: ['Security Manager'],
        notificationChannels: ['EMAIL', 'SMS']
      }
    ],
    categories: Object.values(IncidentCategory),
    priorityMatrix: {},
    autoClassification: true,
    mlClassification: false
  },
  response: {
    enabled: true,
    responseTeams: [],
    workflows: [],
    automatedResponse: {
      enabled: true,
      actions: [],
      safetyLimits: {
        maxSystemsToIsolate: 5,
        maxAccountsToDisable: 10,
        maxIPsToBlock: 100,
        requireApprovalAbove: IncidentSeverity.HIGH
      },
      humanApprovalRequired: true,
      rollbackCapability: true
    },
    containmentStrategies: [],
    communicationTemplates: []
  },
  escalation: {
    enabled: true,
    escalationLevels: [],
    escalationTriggers: [],
    notificationChannels: [],
    timeBasedEscalation: true,
    severityBasedEscalation: true
  },
  forensics: {
    enabled: true,
    automaticCollection: true,
    evidenceTypes: ['LOG', 'SCREENSHOT', 'NETWORK_CAPTURE', 'MEMORY_DUMP'],
    retentionPeriod: 2555, // 7 years
    chainOfCustody: true,
    encryption: true
  },
  recovery: {
    enabled: true,
    strategies: [],
    backupValidation: true,
    rollbackCapability: true,
    testingRequired: true
  },
  communication: {
    enabled: true,
    templates: [],
    approvalWorkflow: true,
    stakeholderGroups: [],
    mediaPolicy: {
      enabled: true,
      spokesperson: 'Communications Director',
      approvalRequired: true,
      templates: [],
      guidelines: []
    }
  },
  postIncident: {
    enabled: true,
    mandatoryForSeverity: [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH],
    timelineRequirement: 30, // days
    stakeholderInvolvement: true,
    improvementTracking: true
  }
};

// Export singleton instance
export const incidentResponseManager = IncidentResponseManager.getInstance(defaultIncidentResponseConfig);

// Helper functions
export async function createIncident(incidentData: {
  title: string;
  description: string;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  detectionSource: DetectionSource;
  reportedBy: string;
  affectedSystems?: string[];
  affectedUsers?: number;
}) {
  return incidentResponseManager.createIncident(incidentData);
}

export async function updateIncidentStatus(incidentId: string, status: IncidentStatus, notes?: string) {
  return incidentResponseManager.updateIncidentStatus(incidentId, status, notes);
}

export async function executeResponseAction(
  incidentId: string,
  action: ResponseAction,
  executedBy: string,
  description?: string
) {
  return incidentResponseManager.executeResponseAction(incidentId, action, executedBy, description);
}

export function getIncidentResponseStats() {
  return incidentResponseManager.getStats();
}

export async function searchIncidents(query: {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  dateFrom?: Date;
  dateTo?: Date;
  assignedTo?: string;
  limit?: number;
}) {
  return incidentResponseManager.searchIncidents(query);
} 