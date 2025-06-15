import { redisCache } from './redis-cache';
import { auditLogger, AuditLevel, AuditCategory } from './audit-logger';
import crypto from 'crypto';


// Data Protection interfaces
export interface DataProtectionConfig {
  enabled: boolean;
  gdprCompliance: GDPRConfig;
  encryption: EncryptionConfig;
  anonymization: AnonymizationConfig;
  consentManagement: ConsentConfig;
  dataRetention: RetentionConfig;
  dataMinimization: MinimizationConfig;
  rightToBeForgetton: ForgettonConfig;
  dataPortability: PortabilityConfig;
  privacyByDesign: PrivacyByDesignConfig;
}

export interface GDPRConfig {
  enabled: boolean;
  dataControllerInfo: DataControllerInfo;
  legalBasisTracking: boolean;
  consentRequired: boolean;
  dataProcessingRegister: boolean;
  breachNotification: BreachNotificationConfig;
  dataProtectionOfficer: DPOInfo;
  privacyNoticeRequired: boolean;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  keyRotationDays: number;
  encryptAtRest: boolean;
  encryptInTransit: boolean;
  fieldLevelEncryption: FieldEncryptionConfig[];
  keyManagement: KeyManagementConfig;
}

export interface AnonymizationConfig {
  enabled: boolean;
  techniques: AnonymizationTechnique[];
  automaticAnonymization: boolean;
  anonymizationSchedule: string; // cron expression
  kAnonymity: number;
  lDiversity: boolean;
  tCloseness: boolean;
  differentialPrivacy: DifferentialPrivacyConfig;
}

export interface ConsentConfig {
  enabled: boolean;
  consentTypes: ConsentType[];
  granularConsent: boolean;
  consentWithdrawal: boolean;
  consentExpiry: number; // days
  doubleOptIn: boolean;
  consentProof: boolean;
  minorConsent: MinorConsentConfig;
}

export interface RetentionConfig {
  enabled: boolean;
  defaultRetentionDays: number;
  categorySpecificRetention: Record<DataCategory, number>;
  automaticDeletion: boolean;
  retentionSchedule: string; // cron expression
  archiveBeforeDeletion: boolean;
  retentionNotifications: boolean;
}

// Enums
export enum DataCategory {
  PERSONAL_DATA = 'PERSONAL_DATA',
  SENSITIVE_DATA = 'SENSITIVE_DATA',
  BIOMETRIC_DATA = 'BIOMETRIC_DATA',
  HEALTH_DATA = 'HEALTH_DATA',
  FINANCIAL_DATA = 'FINANCIAL_DATA',
  BEHAVIORAL_DATA = 'BEHAVIORAL_DATA',
  LOCATION_DATA = 'LOCATION_DATA',
  COMMUNICATION_DATA = 'COMMUNICATION_DATA',
  TECHNICAL_DATA = 'TECHNICAL_DATA',
  MARKETING_DATA = 'MARKETING_DATA'
}

export enum LegalBasis {
  CONSENT = 'CONSENT',
  CONTRACT = 'CONTRACT',
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',
  VITAL_INTERESTS = 'VITAL_INTERESTS',
  PUBLIC_TASK = 'PUBLIC_TASK',
  LEGITIMATE_INTERESTS = 'LEGITIMATE_INTERESTS'
}

export enum ConsentType {
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  PERSONALIZATION = 'PERSONALIZATION',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  COOKIES = 'COOKIES',
  PROFILING = 'PROFILING'
}

export enum AnonymizationTechnique {
  GENERALIZATION = 'GENERALIZATION',
  SUPPRESSION = 'SUPPRESSION',
  PERTURBATION = 'PERTURBATION',
  SWAPPING = 'SWAPPING',
  SYNTHETIC_DATA = 'SYNTHETIC_DATA',
  DIFFERENTIAL_PRIVACY = 'DIFFERENTIAL_PRIVACY'
}

export enum DataSubjectRight {
  ACCESS = 'ACCESS',
  RECTIFICATION = 'RECTIFICATION',
  ERASURE = 'ERASURE',
  RESTRICT_PROCESSING = 'RESTRICT_PROCESSING',
  DATA_PORTABILITY = 'DATA_PORTABILITY',
  OBJECT = 'OBJECT',
  WITHDRAW_CONSENT = 'WITHDRAW_CONSENT'
}

// Data structures
export interface DataControllerInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  registrationNumber?: string;
  website?: string;
}

export interface DPOInfo {
  name: string;
  email: string;
  phone: string;
  qualifications: string[];
}

export interface BreachNotificationConfig {
  enabled: boolean;
  notificationTimeHours: number; // 72 hours for GDPR
  supervisoryAuthority: AuthorityInfo;
  dataSubjectNotification: boolean;
  breachRegister: boolean;
}

export interface AuthorityInfo {
  name: string;
  email: string;
  phone: string;
  website: string;
}

export interface FieldEncryptionConfig {
  field: string;
  table: string;
  encryptionLevel: 'STANDARD' | 'HIGH' | 'MAXIMUM';
  searchable: boolean;
}

export interface KeyManagementConfig {
  provider: 'LOCAL' | 'AWS_KMS' | 'AZURE_KEY_VAULT' | 'GOOGLE_KMS';
  keyRotationEnabled: boolean;
  keyBackup: boolean;
  keyEscrow: boolean;
}

export interface DifferentialPrivacyConfig {
  enabled: boolean;
  epsilon: number; // Privacy budget
  delta: number;
  mechanism: 'LAPLACE' | 'GAUSSIAN' | 'EXPONENTIAL';
}

export interface MinorConsentConfig {
  enabled: boolean;
  ageThreshold: number;
  parentalConsentRequired: boolean;
  ageVerification: boolean;
}

export interface MinimizationConfig {
  enabled: boolean;
  dataMinimizationRules: DataMinimizationRule[];
  purposeLimitation: boolean;
  storageMinimization: boolean;
  collectionMinimization: boolean;
}

export interface ForgettonConfig {
  enabled: boolean;
  automaticProcessing: boolean;
  verificationRequired: boolean;
  gracePeriodDays: number;
  cascadeDeletion: boolean;
  deletionProof: boolean;
}

export interface PortabilityConfig {
  enabled: boolean;
  supportedFormats: DataFormat[];
  automaticExport: boolean;
  encryptedExport: boolean;
  exportNotification: boolean;
}

export interface PrivacyByDesignConfig {
  enabled: boolean;
  defaultPrivacySettings: boolean;
  privacyImpactAssessment: boolean;
  dataProtectionByDefault: boolean;
  privacyEnhancingTechnologies: boolean;
}

export interface DataMinimizationRule {
  name: string;
  description: string;
  dataCategory: DataCategory;
  minimizationTechnique: string;
  enabled: boolean;
}

export enum DataFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  XML = 'XML',
  PDF = 'PDF'
}

// Data subject and consent management
export interface DataSubject {
  id: string;
  email: string;
  createdAt: Date;
  lastUpdated: Date;
  consents: ConsentRecord[];
  dataProcessingActivities: ProcessingActivity[];
  dataSubjectRights: DataSubjectRightRequest[];
  personalData: PersonalDataRecord[];
  retentionStatus: RetentionStatus;
  anonymizationStatus: AnonymizationStatus;
}

export interface ConsentRecord {
  id: string;
  type: ConsentType;
  granted: boolean;
  timestamp: Date;
  legalBasis: LegalBasis;
  purpose: string;
  dataCategories: DataCategory[];
  expiryDate?: Date;
  withdrawnAt?: Date;
  proofOfConsent: ConsentProof;
  granularSettings: Record<string, boolean>;
}

export interface ConsentProof {
  method: 'CHECKBOX' | 'SIGNATURE' | 'DOUBLE_OPT_IN' | 'VERBAL';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  consentText: string;
  version: string;
}

export interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  recipients: string[];
  retentionPeriod: number;
  crossBorderTransfer: boolean;
  safeguards: string[];
  startDate: Date;
  endDate?: Date;
}

export interface DataSubjectRightRequest {
  id: string;
  type: DataSubjectRight;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  requestDate: Date;
  completionDate?: Date;
  reason?: string;
  verificationRequired: boolean;
  verificationCompleted: boolean;
  response?: string;
  documents?: string[];
}

export interface PersonalDataRecord {
  id: string;
  category: DataCategory;
  field: string;
  value: string;
  encrypted: boolean;
  anonymized: boolean;
  source: string;
  collectionDate: Date;
  lastAccessed?: Date;
  retentionDate: Date;
  legalBasis: LegalBasis;
}

export interface RetentionStatus {
  category: DataCategory;
  retentionPeriod: number;
  collectionDate: Date;
  expiryDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED' | 'DELETED';
  lastReview: Date;
}

export interface AnonymizationStatus {
  scheduled: boolean;
  scheduledDate?: Date;
  completed: boolean;
  completionDate?: Date;
  technique: AnonymizationTechnique;
  kValue?: number;
}

// Privacy breach management
export interface PrivacyBreach {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  discoveryDate: Date;
  reportedDate?: Date;
  affectedDataSubjects: number;
  dataCategories: DataCategory[];
  rootCause: string;
  containmentActions: string[];
  notificationRequired: boolean;
  supervisoryAuthorityNotified: boolean;
  dataSubjectsNotified: boolean;
  status: 'DISCOVERED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  riskAssessment: BreachRiskAssessment;
}

export interface BreachRiskAssessment {
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  mitigationMeasures: string[];
}

// Statistics and reporting
export interface DataProtectionStats {
  totalDataSubjects: number;
  activeConsents: number;
  withdrawnConsents: number;
  pendingRightRequests: number;
  completedRightRequests: number;
  encryptedFields: number;
  anonymizedRecords: number;
  retentionExpirations: number;
  privacyBreaches: number;
  complianceScore: number;
}

export class DataProtectionManager {
  private static instance: DataProtectionManager;
  private config: DataProtectionConfig;
  private dataSubjects: Map<string, DataSubject> = new Map();
  private encryptionKeys: Map<string, string> = new Map();
  private stats: DataProtectionStats = {
    totalDataSubjects: 0,
    activeConsents: 0,
    withdrawnConsents: 0,
    pendingRightRequests: 0,
    completedRightRequests: 0,
    encryptedFields: 0,
    anonymizedRecords: 0,
    retentionExpirations: 0,
    privacyBreaches: 0,
    complianceScore: 0
  };

  private readonly REDIS_KEY_PREFIX = 'data_protection:';
  private readonly ENCRYPTION_KEY_PREFIX = 'encryption_key:';

  private constructor(config: DataProtectionConfig) {
    this.config = config;
    this.initializeEncryption();
    
    // Only start periodic tasks in runtime environments, not during build
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
      this.startPeriodicTasks();
    }
  }

  static getInstance(config?: DataProtectionConfig): DataProtectionManager {
    if (!DataProtectionManager.instance) {
      if (!config) {
        throw new Error('Data protection configuration required for first initialization');
      }
      DataProtectionManager.instance = new DataProtectionManager(config);
    }
    return DataProtectionManager.instance;
  }

  // Consent Management
  async recordConsent(
    dataSubjectId: string,
    consentData: {
      type: ConsentType;
      granted: boolean;
      purpose: string;
      dataCategories: DataCategory[];
      legalBasis: LegalBasis;
      ipAddress: string;
      userAgent: string;
      consentText: string;
    }
  ): Promise<string> {
    try {
      const dataSubject = await this.getOrCreateDataSubject(dataSubjectId);
      
      const consentRecord: ConsentRecord = {
        id: this.generateId('consent'),
        type: consentData.type,
        granted: consentData.granted,
        timestamp: new Date(),
        legalBasis: consentData.legalBasis,
        purpose: consentData.purpose,
        dataCategories: consentData.dataCategories,
        expiryDate: this.config.consentManagement.consentExpiry > 0 ? 
          new Date(Date.now() + this.config.consentManagement.consentExpiry * 24 * 60 * 60 * 1000) : 
          undefined,
        proofOfConsent: {
          method: 'CHECKBOX',
          ipAddress: consentData.ipAddress,
          userAgent: consentData.userAgent,
          timestamp: new Date(),
          consentText: consentData.consentText,
          version: '1.0'
        },
        granularSettings: {}
      };

      // Remove existing consent of same type
      dataSubject.consents = dataSubject.consents.filter(c => c.type !== consentData.type);
      dataSubject.consents.push(consentRecord);
      dataSubject.lastUpdated = new Date();

      await this.storeDataSubject(dataSubject);

      // Update statistics
      if (consentData.granted) {
        this.stats.activeConsents++;
      } else {
        this.stats.withdrawnConsents++;
      }

      // Audit log
      await auditLogger.log({
        level: AuditLevel.INFO,
        category: AuditCategory.COMPLIANCE,
        action: 'CONSENT_RECORDED',
        resource: 'data_protection',
        userId: dataSubjectId,
        details: {
          description: `Consent ${consentData.granted ? 'granted' : 'withdrawn'} for ${consentData.type}`,
          additionalInfo: {
            consentType: consentData.type,
            granted: consentData.granted,
            legalBasis: consentData.legalBasis
          }
        }
      });

      console.log(`✅ Consent recorded for ${dataSubjectId}: ${consentData.type} = ${consentData.granted}`);
      return consentRecord.id;

    } catch (error) {
      console.error('❌ Error recording consent:');
      throw error;
    }
  }

  async withdrawConsent(dataSubjectId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const dataSubject = await this.getDataSubject(dataSubjectId);
      if (!dataSubject) {
        throw new Error('Data subject not found');
      }

      const consent = dataSubject.consents.find(c => c.type === consentType);
      if (!consent) {
        throw new Error('Consent not found');
      }

      consent.granted = false;
      consent.withdrawnAt = new Date();
      dataSubject.lastUpdated = new Date();

      await this.storeDataSubject(dataSubject);

      // Update statistics
      this.stats.activeConsents--;
      this.stats.withdrawnConsents++;

      // Audit log
      await auditLogger.log({
        level: AuditLevel.WARN,
        category: AuditCategory.COMPLIANCE,
        action: 'CONSENT_WITHDRAWN',
        resource: 'data_protection',
        userId: dataSubjectId,
        details: {
          description: `Consent withdrawn for ${consentType}`,
          additionalInfo: { consentType }
        }
      });

      console.log(`🚫 Consent withdrawn for ${dataSubjectId}: ${consentType}`);
      return true;

    } catch (error) {
      console.error('❌ Error withdrawing consent:');
      return false;
    }
  }

  // Data Subject Rights
  async processDataSubjectRightRequest(
    dataSubjectId: string,
    rightType: DataSubjectRight,
    reason?: string
  ): Promise<string> {
    try {
      const dataSubject = await this.getOrCreateDataSubject(dataSubjectId);
      
      const request: DataSubjectRightRequest = {
        id: this.generateId('right_request'),
        type: rightType,
        status: 'PENDING',
        requestDate: new Date(),
        reason,
        verificationRequired: this.shouldRequireVerification(rightType),
        verificationCompleted: false
      };

      dataSubject.dataSubjectRights.push(request);
      dataSubject.lastUpdated = new Date();

      await this.storeDataSubject(dataSubject);

      // Update statistics
      this.stats.pendingRightRequests++;

      // Process specific rights
      switch (rightType) {
        case DataSubjectRight.ACCESS:
          await this.processAccessRequest(dataSubjectId, request.id);
          break;
        case DataSubjectRight.ERASURE:
          await this.processErasureRequest(dataSubjectId, request.id);
          break;
        case DataSubjectRight.DATA_PORTABILITY:
          await this.processPortabilityRequest(dataSubjectId, request.id);
          break;
      }

      // Audit log
      await auditLogger.log({
        level: AuditLevel.INFO,
        category: AuditCategory.COMPLIANCE,
        action: 'DATA_SUBJECT_RIGHT_REQUEST',
        resource: 'data_protection',
        userId: dataSubjectId,
        details: {
          description: `Data subject right request: ${rightType}`,
          additionalInfo: { rightType, requestId: request.id }
        }
      });

      console.log(`📋 Data subject right request created: ${rightType} for ${dataSubjectId}`);
      return request.id;

    } catch (error) {
      console.error('❌ Error processing data subject right request:');
      throw error;
    }
  }

  private async processAccessRequest(dataSubjectId: string, requestId: string): Promise<void> {
    // Generate comprehensive data export
    const dataSubject = await this.getDataSubject(dataSubjectId);
    if (!dataSubject) return;

    const accessData = {
      personalData: dataSubject.personalData,
      consents: dataSubject.consents,
      processingActivities: dataSubject.dataProcessingActivities,
      retentionStatus: dataSubject.retentionStatus
    };

    // Store access data for download
    await redisCache.set(
      `${this.REDIS_KEY_PREFIX}access_data:${requestId}`,
      JSON.stringify(accessData),
      { ttl: 30 * 24 * 60 * 60 } // 30 days
    );

    // Update request status
    const request = dataSubject.dataSubjectRights.find(r => r.id === requestId);
    if (request) {
      request.status = 'COMPLETED';
      request.completionDate = new Date();
      request.response = 'Personal data export prepared for download';
      await this.storeDataSubject(dataSubject);
    }
  }

  private async processErasureRequest(dataSubjectId: string, requestId: string): Promise<void> {
    if (!this.config.rightToBeForgetton.enabled) {
      throw new Error('Right to be forgotten is not enabled');
    }

    // Implement erasure logic
    const dataSubject = await this.getDataSubject(dataSubjectId);
    if (!dataSubject) return;

    // Mark for deletion after grace period
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + this.config.rightToBeForgetton.gracePeriodDays);

    // Schedule deletion
    await redisCache.set(
      `${this.REDIS_KEY_PREFIX}scheduled_deletion:${dataSubjectId}`,
      JSON.stringify({ deletionDate, requestId }),
      { ttl: this.config.rightToBeForgetton.gracePeriodDays * 24 * 60 * 60 }
    );

    // Update request status
    const request = dataSubject.dataSubjectRights.find(r => r.id === requestId);
    if (request) {
      request.status = 'IN_PROGRESS';
      request.response = `Data scheduled for deletion on ${deletionDate.toISOString()}`;
      await this.storeDataSubject(dataSubject);
    }
  }

  private async processPortabilityRequest(dataSubjectId: string, requestId: string): Promise<void> {
    if (!this.config.dataPortability.enabled) {
      throw new Error('Data portability is not enabled');
    }

    const dataSubject = await this.getDataSubject(dataSubjectId);
    if (!dataSubject) return;

    // Generate portable data in requested format
    const portableData = {
      dataSubject: {
        id: dataSubject.id,
        email: dataSubject.email,
        createdAt: dataSubject.createdAt
      },
      personalData: dataSubject.personalData.map(pd => ({
        category: pd.category,
        field: pd.field,
        value: pd.encrypted ? '[ENCRYPTED]' : pd.value,
        collectionDate: pd.collectionDate
      })),
      consents: dataSubject.consents.map(c => ({
        type: c.type,
        granted: c.granted,
        timestamp: c.timestamp,
        purpose: c.purpose
      }))
    };

    // Store portable data
    await redisCache.set(
      `${this.REDIS_KEY_PREFIX}portable_data:${requestId}`,
      JSON.stringify(portableData),
      { ttl: 30 * 24 * 60 * 60 } // 30 days
    );

    // Update request status
    const request = dataSubject.dataSubjectRights.find(r => r.id === requestId);
    if (request) {
      request.status = 'COMPLETED';
      request.completionDate = new Date();
      request.response = 'Portable data export prepared for download';
      await this.storeDataSubject(dataSubject);
    }
  }

  // Encryption and Anonymization
  async encryptPersonalData(data: string, field: string): Promise<string> {
    if (!this.config.encryption.enabled) {
      return data;
    }

    try {
      const key = await this.getEncryptionKey(field);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.config.encryption.algorithm, key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `${iv.toString('hex')}:${encrypted}`;

    } catch (error) {
      console.error('❌ Encryption error:');
      throw error;
    }
  }

  async decryptPersonalData(encryptedData: string, field: string): Promise<string> {
    if (!this.config.encryption.enabled) {
      return encryptedData;
    }

    try {
      const [, encrypted] = encryptedData.split(':');
      const key = await this.getEncryptionKey(field);
      const decipher = crypto.createDecipher(this.config.encryption.algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;

    } catch (error) {
      console.error('❌ Decryption error:');
      throw error;
    }
  }

  async anonymizeData(dataSubjectId: string, technique: AnonymizationTechnique): Promise<boolean> {
    if (!this.config.anonymization.enabled) {
      return false;
    }

    try {
      const dataSubject = await this.getDataSubject(dataSubjectId);
      if (!dataSubject) {
        throw new Error('Data subject not found');
      }

      // Apply anonymization technique
      switch (technique) {
        case AnonymizationTechnique.GENERALIZATION:
          await this.applyGeneralization(dataSubject);
          break;
        case AnonymizationTechnique.SUPPRESSION:
          await this.applySuppression(dataSubject);
          break;
        case AnonymizationTechnique.PERTURBATION:
          await this.applyPerturbation(dataSubject);
          break;
      }

      // Update anonymization status
      dataSubject.anonymizationStatus = {
        scheduled: false,
        completed: true,
        completionDate: new Date(),
        technique
      };

      await this.storeDataSubject(dataSubject);

      // Update statistics
      this.stats.anonymizedRecords++;

      // Audit log
      await auditLogger.log({
        level: AuditLevel.INFO,
        category: AuditCategory.COMPLIANCE,
        action: 'DATA_ANONYMIZED',
        resource: 'data_protection',
        userId: dataSubjectId,
        details: {
          description: `Data anonymized using ${technique}`,
          additionalInfo: { technique }
        }
      });

      console.log(`🎭 Data anonymized for ${dataSubjectId} using ${technique}`);
      return true;

    } catch (error) {
      console.error('❌ Anonymization error:', error);
      throw error;
    }
  }

  // Privacy breach management
  async reportPrivacyBreach(breachData: {
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    affectedDataSubjects: number;
    dataCategories: DataCategory[];
    rootCause: string;
  }): Promise<string> {
    try {
      const breach: PrivacyBreach = {
        id: this.generateId('breach'),
        title: breachData.title,
        description: breachData.description,
        severity: breachData.severity,
        discoveryDate: new Date(),
        affectedDataSubjects: breachData.affectedDataSubjects,
        dataCategories: breachData.dataCategories,
        rootCause: breachData.rootCause,
        containmentActions: [],
        notificationRequired: this.shouldNotifyBreach(breachData.severity),
        supervisoryAuthorityNotified: false,
        dataSubjectsNotified: false,
        status: 'DISCOVERED',
        riskAssessment: {
          likelihood: 'MEDIUM',
          impact: breachData.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          overallRisk: breachData.severity,
          factors: [],
          mitigationMeasures: []
        }
      };

      // Store breach
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}breach:${breach.id}`,
        JSON.stringify(breach),
        { ttl: 365 * 24 * 60 * 60 } // 1 year
      );

      // Update statistics
      this.stats.privacyBreaches++;

      // Auto-notify if required
      if (breach.notificationRequired && this.config.gdprCompliance.breachNotification.enabled) {
        await this.notifyPrivacyBreach(breach.id);
      }

      // Audit log
      await auditLogger.log({
        level: AuditLevel.CRITICAL,
        category: AuditCategory.SECURITY_EVENT,
        action: 'PRIVACY_BREACH_REPORTED',
        resource: 'data_protection',
        details: {
          description: `Privacy breach reported: ${breachData.title}`,
          additionalInfo: {
            breachId: breach.id,
            severity: breachData.severity,
            affectedSubjects: breachData.affectedDataSubjects
          }
        }
      });

      console.log(`🚨 Privacy breach reported: ${breach.id} (${breachData.severity})`);
      return breach.id;

    } catch (error) {
      console.error('❌ Error reporting privacy breach:');
      throw error;
    }
  }

  // Utility methods
  private async getOrCreateDataSubject(dataSubjectId: string): Promise<DataSubject> {
    let dataSubject = await this.getDataSubject(dataSubjectId);
    
    if (!dataSubject) {
      dataSubject = {
        id: dataSubjectId,
        email: '', // Would be populated from user data
        createdAt: new Date(),
        lastUpdated: new Date(),
        consents: [],
        dataProcessingActivities: [],
        dataSubjectRights: [],
        personalData: [],
        retentionStatus: {
          category: DataCategory.PERSONAL_DATA,
          retentionPeriod: this.config.dataRetention.defaultRetentionDays,
          collectionDate: new Date(),
          expiryDate: new Date(Date.now() + this.config.dataRetention.defaultRetentionDays * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          lastReview: new Date()
        },
        anonymizationStatus: {
          scheduled: false,
          completed: false,
          technique: AnonymizationTechnique.GENERALIZATION
        }
      };

      await this.storeDataSubject(dataSubject);
      this.stats.totalDataSubjects++;
    }

    return dataSubject;
  }

  private async getDataSubject(dataSubjectId: string): Promise<DataSubject | null> {
    try {
      const cached = await redisCache.get<string>(`${this.REDIS_KEY_PREFIX}subject:${dataSubjectId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting data subject:');
      return null;
    }
  }

  private async storeDataSubject(dataSubject: DataSubject): Promise<void> {
    try {
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}subject:${dataSubject.id}`,
        JSON.stringify(dataSubject),
        { ttl: 365 * 24 * 60 * 60 } // 1 year
      );
    } catch (error) {
      console.error('Error storing data subject:');
    }
  }

  private async getEncryptionKey(field: string): Promise<string> {
    let key = this.encryptionKeys.get(field);
    
    if (!key) {
      // Generate or retrieve key
      key = crypto.randomBytes(32).toString('hex');
      this.encryptionKeys.set(field, key);
      
      // Store key securely
      await redisCache.set(
        `${this.ENCRYPTION_KEY_PREFIX}${field}`,
        key,
        { ttl: this.config.encryption.keyRotationDays * 24 * 60 * 60 }
      );
    }
    
    return key;
  }

  private shouldRequireVerification(rightType: DataSubjectRight): boolean {
    return [
      DataSubjectRight.ERASURE,
      DataSubjectRight.DATA_PORTABILITY,
      DataSubjectRight.ACCESS
    ].includes(rightType);
  }

  private shouldNotifyBreach(severity: string): boolean {
    return ['HIGH', 'CRITICAL'].includes(severity);
  }

  private async notifyPrivacyBreach(breachId: string): Promise<void> {
    // Implementation would send notifications to supervisory authority
    console.log(`📧 Privacy breach notification sent for ${breachId}`);
  }

  private async applyGeneralization(dataSubject: DataSubject): Promise<void> {
    // Generalize specific data fields
    dataSubject.personalData.forEach(pd => {
      if (pd.category === DataCategory.LOCATION_DATA) {
        // Generalize location to city level
        pd.value = pd.value.split(',')[0]; // Keep only city
        pd.anonymized = true;
      }
    });
  }

  private async applySuppression(dataSubject: DataSubject): Promise<void> {
    // Suppress sensitive data fields
    dataSubject.personalData.forEach(pd => {
      if (pd.category === DataCategory.SENSITIVE_DATA) {
        pd.value = '[SUPPRESSED]';
        pd.anonymized = true;
      }
    });
  }

  private async applyPerturbation(dataSubject: DataSubject): Promise<void> {
    // Add noise to numerical data
    dataSubject.personalData.forEach(pd => {
      if (pd.category === DataCategory.BEHAVIORAL_DATA && !isNaN(Number(pd.value))) {
        const noise = Math.random() * 0.1 - 0.05; // ±5% noise
        pd.value = (Number(pd.value) * (1 + noise)).toString();
        pd.anonymized = true;
      }
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeEncryption(): void {
    if (this.config.encryption.enabled) {
      console.log('🔐 Encryption system initialized');
    }
  }

  private startPeriodicTasks(): void {
    // Data retention cleanup
    if (this.config.dataRetention.enabled) {
      setInterval(() => {
        this.processRetentionCleanup();
      }, 24 * 60 * 60 * 1000); // Daily
    }

    // Automatic anonymization
    if (this.config.anonymization.automaticAnonymization) {
      setInterval(() => {
        this.processScheduledAnonymization();
      }, 24 * 60 * 60 * 1000); // Daily
    }

    // Key rotation
    if (this.config.encryption.keyRotationDays > 0) {
      // Prevent timeout overflow by limiting maximum interval to 24 hours
      const maxInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const rotationInterval = Math.min(
        this.config.encryption.keyRotationDays * 24 * 60 * 60 * 1000,
        maxInterval
      );
      
      setInterval(() => {
        this.rotateEncryptionKeys();
      }, rotationInterval);
    }
  }

  private async processRetentionCleanup(): Promise<void> {
    console.log('🧹 Processing data retention cleanup');
    // Implementation would clean up expired data
  }

  private async processScheduledAnonymization(): Promise<void> {
    console.log('🎭 Processing scheduled anonymization');
    // Implementation would anonymize scheduled data
  }

  private async rotateEncryptionKeys(): Promise<void> {
    console.log('🔄 Rotating encryption keys');
    // Implementation would rotate encryption keys
  }

  // Public API methods
  getStats(): DataProtectionStats {
    return { ...this.stats };
  }

  async generateComplianceReport(): Promise<{
    complianceScore: number;
    gdprCompliance: boolean;
    recommendations: string[];
    issues: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check GDPR compliance
    if (!this.config.gdprCompliance.enabled) {
      issues.push('GDPR compliance is not enabled');
      score -= 20;
    }

    if (!this.config.encryption.enabled) {
      issues.push('Data encryption is not enabled');
      recommendations.push('Enable data encryption for sensitive information');
      score -= 15;
    }

    if (!this.config.consentManagement.enabled) {
      issues.push('Consent management is not enabled');
      score -= 15;
    }

    if (this.stats.pendingRightRequests > 10) {
      issues.push('High number of pending data subject right requests');
      recommendations.push('Process pending data subject right requests');
      score -= 10;
    }

    return {
      complianceScore: Math.max(0, score),
      gdprCompliance: score >= 80,
      recommendations,
      issues
    };
  }


}

// Default configuration
export const defaultDataProtectionConfig: DataProtectionConfig = {
  enabled: true,
  gdprCompliance: {
    enabled: true,
    dataControllerInfo: {
      name: 'Your Company',
      address: '123 Main St, City, Country',
      email: 'privacy@company.com',
      phone: '+1-234-567-8900'
    },
    legalBasisTracking: true,
    consentRequired: true,
    dataProcessingRegister: true,
    breachNotification: {
      enabled: true,
      notificationTimeHours: 72,
      supervisoryAuthority: {
        name: 'Data Protection Authority',
        email: 'contact@dpa.gov',
        phone: '+1-234-567-8901',
        website: 'https://dpa.gov'
      },
      dataSubjectNotification: true,
      breachRegister: true
    },
    dataProtectionOfficer: {
      name: 'Data Protection Officer',
      email: 'dpo@company.com',
      phone: '+1-234-567-8902',
      qualifications: ['CIPP/E', 'CIPM']
    },
    privacyNoticeRequired: true
  },
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    keyRotationDays: 90,
    encryptAtRest: true,
    encryptInTransit: true,
    fieldLevelEncryption: [
      { field: 'email', table: 'users', encryptionLevel: 'STANDARD', searchable: true },
      { field: 'phone', table: 'users', encryptionLevel: 'STANDARD', searchable: false },
      { field: 'ssn', table: 'users', encryptionLevel: 'MAXIMUM', searchable: false }
    ],
    keyManagement: {
      provider: 'LOCAL',
      keyRotationEnabled: true,
      keyBackup: true,
      keyEscrow: false
    }
  },
  anonymization: {
    enabled: true,
    techniques: [
      AnonymizationTechnique.GENERALIZATION,
      AnonymizationTechnique.SUPPRESSION,
      AnonymizationTechnique.PERTURBATION
    ],
    automaticAnonymization: true,
    anonymizationSchedule: '0 2 * * 0', // Weekly at 2 AM
    kAnonymity: 5,
    lDiversity: true,
    tCloseness: false,
    differentialPrivacy: {
      enabled: false,
      epsilon: 1.0,
      delta: 0.00001,
      mechanism: 'LAPLACE'
    }
  },
  consentManagement: {
    enabled: true,
    consentTypes: Object.values(ConsentType),
    granularConsent: true,
    consentWithdrawal: true,
    consentExpiry: 365, // 1 year
    doubleOptIn: true,
    consentProof: true,
    minorConsent: {
      enabled: true,
      ageThreshold: 16,
      parentalConsentRequired: true,
      ageVerification: true
    }
  },
  dataRetention: {
    enabled: true,
    defaultRetentionDays: 2555, // 7 years
    categorySpecificRetention: {
      [DataCategory.PERSONAL_DATA]: 2555,
      [DataCategory.SENSITIVE_DATA]: 1825,
      [DataCategory.FINANCIAL_DATA]: 2555,
      [DataCategory.HEALTH_DATA]: 3650,
      [DataCategory.MARKETING_DATA]: 1095,
      [DataCategory.BEHAVIORAL_DATA]: 730,
      [DataCategory.LOCATION_DATA]: 365,
      [DataCategory.COMMUNICATION_DATA]: 1095,
      [DataCategory.TECHNICAL_DATA]: 1095,
      [DataCategory.BIOMETRIC_DATA]: 1825
    },
    automaticDeletion: true,
    retentionSchedule: '0 3 * * 0', // Weekly at 3 AM
    archiveBeforeDeletion: true,
    retentionNotifications: true
  },
  dataMinimization: {
    enabled: true,
    dataMinimizationRules: [
      {
        name: 'Location Data Minimization',
        description: 'Minimize location data to city level after 30 days',
        dataCategory: DataCategory.LOCATION_DATA,
        minimizationTechnique: 'GENERALIZATION',
        enabled: true
      }
    ],
    purposeLimitation: true,
    storageMinimization: true,
    collectionMinimization: true
  },
  rightToBeForgetton: {
    enabled: true,
    automaticProcessing: false,
    verificationRequired: true,
    gracePeriodDays: 30,
    cascadeDeletion: true,
    deletionProof: true
  },
  dataPortability: {
    enabled: true,
    supportedFormats: [DataFormat.JSON, DataFormat.CSV, DataFormat.XML],
    automaticExport: false,
    encryptedExport: true,
    exportNotification: true
  },
  privacyByDesign: {
    enabled: true,
    defaultPrivacySettings: true,
    privacyImpactAssessment: true,
    dataProtectionByDefault: true,
    privacyEnhancingTechnologies: true
  }
};

// Export singleton instance
export const dataProtectionManager = DataProtectionManager.getInstance(defaultDataProtectionConfig);

// Helper functions
export async function recordConsent(
  dataSubjectId: string,
  consentData: {
    type: ConsentType;
    granted: boolean;
    purpose: string;
    dataCategories: DataCategory[];
    legalBasis: LegalBasis;
    ipAddress: string;
    userAgent: string;
    consentText: string;
  }
) {
  return dataProtectionManager.recordConsent(dataSubjectId, consentData);
}

export async function processDataSubjectRightRequest(
  dataSubjectId: string,
  rightType: DataSubjectRight,
  reason?: string
) {
  return dataProtectionManager.processDataSubjectRightRequest(dataSubjectId, rightType, reason);
}

export async function reportPrivacyBreach(breachData: {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedDataSubjects: number;
  dataCategories: DataCategory[];
  rootCause: string;
}) {
  return dataProtectionManager.reportPrivacyBreach(breachData);
}

export function getDataProtectionStats() {
  return dataProtectionManager.getStats();
}

export async function generateComplianceReport() {
  return dataProtectionManager.generateComplianceReport();
} 