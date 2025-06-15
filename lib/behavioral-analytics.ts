import { redisCache } from './redis-cache';
import { auditLogger, AuditLevel, AuditCategory } from './audit-logger';


// Behavioral Analytics interfaces
export interface BehavioralAnalyticsConfig {
  enabled: boolean;
  patternAnalysis: PatternAnalysisConfig;
  anomalyDetection: AnomalyDetectionConfig;
  riskScoring: RiskScoringConfig;
  adaptiveAuth: AdaptiveAuthConfig;
  realTimeMonitoring: RealTimeMonitoringConfig;
  machineLearning: MLConfig;
}

export interface PatternAnalysisConfig {
  enabled: boolean;
  trackingPeriodDays: number;
  minSessionsForPattern: number;
  patternTypes: PatternType[];
  updateFrequencyHours: number;
}

export interface AnomalyDetectionConfig {
  enabled: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
  anomalyTypes: AnomalyType[];
  thresholds: AnomalyThresholds;
  alertEnabled: boolean;
  autoResponse: boolean;
}

export interface RiskScoringConfig {
  enabled: boolean;
  scoringModel: 'basic' | 'advanced' | 'ml';
  riskFactors: RiskFactor[];
  scoreRanges: ScoreRange[];
  updateIntervalMinutes: number;
}

export interface AdaptiveAuthConfig {
  enabled: boolean;
  triggers: AdaptiveTrigger[];
  actions: AdaptiveAction[];
  gracePeriodMinutes: number;
  fallbackAction: 'allow' | 'deny' | 'step_up';
}

export interface RealTimeMonitoringConfig {
  enabled: boolean;
  sessionTracking: boolean;
  deviceFingerprinting: boolean;
  locationTracking: boolean;
  timeBasedAnalysis: boolean;
  velocityChecks: boolean;
}

export interface MLConfig {
  enabled: boolean;
  algorithm: 'isolation_forest' | 'one_class_svm' | 'lstm';
  trainingDataDays: number;
  retrainIntervalDays: number;
  confidenceThreshold: number;
}

// Enums
export enum PatternType {
  LOGIN_TIMES = 'LOGIN_TIMES',
  DEVICE_USAGE = 'DEVICE_USAGE',
  LOCATION_PATTERNS = 'LOCATION_PATTERNS',
  NAVIGATION_BEHAVIOR = 'NAVIGATION_BEHAVIOR',
  FEATURE_USAGE = 'FEATURE_USAGE',
  SESSION_DURATION = 'SESSION_DURATION',
  API_USAGE = 'API_USAGE'
}

export enum AnomalyType {
  UNUSUAL_LOGIN_TIME = 'UNUSUAL_LOGIN_TIME',
  NEW_DEVICE = 'NEW_DEVICE',
  IMPOSSIBLE_TRAVEL = 'IMPOSSIBLE_TRAVEL',
  UNUSUAL_LOCATION = 'UNUSUAL_LOCATION',
  ABNORMAL_SESSION = 'ABNORMAL_SESSION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  VELOCITY_ANOMALY = 'VELOCITY_ANOMALY',
  BEHAVIORAL_DEVIATION = 'BEHAVIORAL_DEVIATION'
}

export enum RiskLevel {
  VERY_LOW = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Data structures
export interface UserBehaviorProfile {
  userId: string;
  createdAt: Date;
  lastUpdated: Date;
  patterns: BehaviorPattern[];
  riskScore: number;
  riskLevel: RiskLevel;
  anomalies: AnomalyRecord[];
  adaptiveAuthState: AdaptiveAuthState;
  statistics: BehaviorStatistics;
}

export interface BehaviorPattern {
  type: PatternType;
  pattern: Record<string, unknown>;
  confidence: number;
  lastSeen: Date;
  frequency: number;
  variance: number;
}

export interface AnomalyRecord {
  id: string;
  type: AnomalyType;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: Record<string, unknown>;
  resolved: boolean;
  falsePositive: boolean;
  riskScore: number;
}

export interface AdaptiveAuthState {
  currentRiskLevel: RiskLevel;
  lastStepUp: Date | null;
  stepUpReason: string | null;
  temporaryRestrictions: TemporaryRestriction[];
  trustScore: number;
}

export interface TemporaryRestriction {
  type: 'mfa_required' | 'location_locked' | 'device_locked' | 'session_limited';
  expiresAt: Date;
  reason: string;
}

export interface BehaviorStatistics {
  totalSessions: number;
  avgSessionDuration: number;
  uniqueDevices: number;
  uniqueLocations: number;
  lastActivity: Date;
  riskHistory: Array<{ date: Date; score: number }>;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  location: LocationInfo;
  userAgent: string;
  timestamp: Date;
  actions: SessionAction[];
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface SessionAction {
  action: string;
  endpoint: string;
  timestamp: Date;
  duration: number;
  metadata: Record<string, unknown>;
}

export interface AnomalyThresholds {
  loginTimeVariance: number; // hours
  locationDistance: number; // km
  sessionDurationVariance: number; // minutes
  velocityThreshold: number; // km/h
  deviceChangeFrequency: number; // per week
  failedAttemptsThreshold: number;
}

export interface RiskFactor {
  name: string;
  weight: number;
  enabled: boolean;
  calculate: (profile: UserBehaviorProfile, context: SessionContext) => number;
}

export interface ScoreRange {
  min: number;
  max: number;
  level: RiskLevel;
  description: string;
  actions: string[];
}

export interface AdaptiveTrigger {
  name: string;
  condition: (profile: UserBehaviorProfile, context: SessionContext) => boolean;
  action: AdaptiveAction;
  enabled: boolean;
}

export interface AdaptiveAction {
  type: 'allow' | 'deny' | 'step_up_mfa' | 'device_verification' | 'location_verification' | 'session_limit';
  parameters: Record<string, unknown>;
  message: string;
}

// Analytics statistics
export interface BehavioralAnalyticsStats {
  totalProfiles: number;
  activeProfiles: number;
  totalAnomalies: number;
  unresolvedAnomalies: number;
  averageRiskScore: number;
  riskDistribution: Record<RiskLevel, number>;
  topAnomalyTypes: Array<{ type: AnomalyType; count: number }>;
  adaptiveAuthTriggers: number;
  falsePositiveRate: number;
}

export class BehavioralAnalyticsEngine {
  private static instance: BehavioralAnalyticsEngine;
  private config: BehavioralAnalyticsConfig;
  private profiles: Map<string, UserBehaviorProfile> = new Map();
  private sessions: Map<string, SessionContext> = new Map();
  private stats: BehavioralAnalyticsStats = {
    totalProfiles: 0,
    activeProfiles: 0,
    totalAnomalies: 0,
    unresolvedAnomalies: 0,
    averageRiskScore: 0,
    riskDistribution: {
      [RiskLevel.VERY_LOW]: 0,
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0
    },
    topAnomalyTypes: [],
    adaptiveAuthTriggers: 0,
    falsePositiveRate: 0
  };

  private readonly REDIS_KEY_PREFIX = 'behavioral_analytics:';
  private readonly PROFILE_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

  private constructor(config: BehavioralAnalyticsConfig) {
    this.config = config;
    this.initializeRiskFactors();
    this.startPeriodicTasks();
  }

  static getInstance(config?: BehavioralAnalyticsConfig): BehavioralAnalyticsEngine {
    if (!BehavioralAnalyticsEngine.instance) {
      if (!config) {
        throw new Error('Behavioral analytics configuration required for first initialization');
      }
      BehavioralAnalyticsEngine.instance = new BehavioralAnalyticsEngine(config);
    }
    return BehavioralAnalyticsEngine.instance;
  }

  // Main analysis method
  async analyzeUserBehavior(
    userId: string,
    sessionContext: SessionContext
  ): Promise<{
    riskScore: number;
    riskLevel: RiskLevel;
    anomalies: AnomalyRecord[];
    adaptiveAction?: AdaptiveAction;
    profile: UserBehaviorProfile;
  }> {
    if (!this.config.enabled) {
      return {
        riskScore: 0,
        riskLevel: RiskLevel.VERY_LOW,
        anomalies: [],
        profile: await this.getOrCreateProfile(userId)
      };
    }

    try {
      // Get or create user profile
      const profile = await this.getOrCreateProfile(userId);

      // Update session tracking
      this.sessions.set(sessionContext.sessionId, sessionContext);

      // Detect anomalies
      const anomalies = await this.detectAnomalies(profile, sessionContext);

      // Update behavior patterns
      await this.updateBehaviorPatterns(profile, sessionContext);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(profile, sessionContext, anomalies);
      const riskLevel = this.getRiskLevel(riskScore);

      // Update profile
      profile.riskScore = riskScore;
      profile.riskLevel = riskLevel;
      profile.anomalies.push(...anomalies);
      profile.lastUpdated = new Date();

      // Check adaptive authentication triggers
      const adaptiveAction = this.checkAdaptiveTriggers(profile, sessionContext);

      // Store updated profile
      await this.storeProfile(profile);

      // Update statistics
      this.updateStats(profile, anomalies, adaptiveAction);

      // Log significant events
      if (anomalies.length > 0 || riskLevel >= RiskLevel.HIGH) {
        await this.logBehavioralEvent(userId, riskLevel, anomalies, adaptiveAction);
      }

      console.log(`🧠 Behavioral analysis completed for user ${userId}: Risk=${riskLevel} (${riskScore}), Anomalies=${anomalies.length}`);

      return {
        riskScore,
        riskLevel,
        anomalies,
        adaptiveAction,
        profile
      };

    } catch {
      console.error('❌ Behavioral analysis error:');
      
      // Return safe defaults on error
      return {
        riskScore: 50, // Medium risk as fallback
        riskLevel: RiskLevel.MEDIUM,
        anomalies: [],
        profile: await this.getOrCreateProfile(userId)
      };
    }
  }

  // Anomaly detection
  private async detectAnomalies(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): Promise<AnomalyRecord[]> {
    if (!this.config.anomalyDetection.enabled) {
      return [];
    }

    const anomalies: AnomalyRecord[] = [];

    for (const anomalyType of this.config.anomalyDetection.anomalyTypes) {
      const anomaly = await this.checkSpecificAnomaly(anomalyType, profile, context);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  private async checkSpecificAnomaly(
    type: AnomalyType,
    profile: UserBehaviorProfile,
    context: SessionContext
  ): Promise<AnomalyRecord | null> {
    switch (type) {
      case AnomalyType.UNUSUAL_LOGIN_TIME:
        return this.checkUnusualLoginTime(profile, context);
      
      case AnomalyType.NEW_DEVICE:
        return this.checkNewDevice(profile, context);
      
      case AnomalyType.IMPOSSIBLE_TRAVEL:
        return this.checkImpossibleTravel(profile, context);
      
      case AnomalyType.UNUSUAL_LOCATION:
        return this.checkUnusualLocation(profile, context);
      
      case AnomalyType.VELOCITY_ANOMALY:
        return this.checkVelocityAnomaly(profile, context);
      
      default:
        return null;
    }
  }

  private checkUnusualLoginTime(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): AnomalyRecord | null {
    const loginTimePattern = profile.patterns.find(p => p.type === PatternType.LOGIN_TIMES);
    if (!loginTimePattern) return null;

    const currentHour = context.timestamp.getHours();
    const usualHours = loginTimePattern.pattern.hours as number[];
    
    if (!usualHours.includes(currentHour)) {
      return {
        id: this.generateAnomalyId(),
        type: AnomalyType.UNUSUAL_LOGIN_TIME,
        timestamp: context.timestamp,
        severity: 'medium',
        description: `Login at unusual time: ${currentHour}:00`,
        context: { currentHour, usualHours },
        resolved: false,
        falsePositive: false,
        riskScore: 25
      };
    }

    return null;
  }

  private checkNewDevice(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): AnomalyRecord | null {
    const devicePattern = profile.patterns.find(p => p.type === PatternType.DEVICE_USAGE);
    if (!devicePattern) return null;

    const knownDevices = devicePattern.pattern.devices as string[];
    
    if (!knownDevices.includes(context.deviceFingerprint)) {
      return {
        id: this.generateAnomalyId(),
        type: AnomalyType.NEW_DEVICE,
        timestamp: context.timestamp,
        severity: 'high',
        description: 'Login from new device',
        context: { 
          newDevice: context.deviceFingerprint,
          knownDevices: knownDevices.length 
        },
        resolved: false,
        falsePositive: false,
        riskScore: 40
      };
    }

    return null;
  }

  private checkImpossibleTravel(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): AnomalyRecord | null {
    const lastLocation = profile.statistics.lastActivity;
    if (!lastLocation) return null;

    // Get last known location from patterns
    const locationPattern = profile.patterns.find(p => p.type === PatternType.LOCATION_PATTERNS);
    if (!locationPattern) return null;

    const lastKnownLocation = locationPattern.pattern.lastLocation as LocationInfo;
    if (!lastKnownLocation) return null;

    // Calculate distance and time difference
    const distance = this.calculateDistance(
      lastKnownLocation.latitude,
      lastKnownLocation.longitude,
      context.location.latitude,
      context.location.longitude
    );

    const timeDiff = (context.timestamp.getTime() - profile.statistics.lastActivity.getTime()) / (1000 * 60 * 60); // hours
    const maxSpeed = this.config.anomalyDetection.thresholds.velocityThreshold;
    
    if (distance > maxSpeed * timeDiff) {
      return {
        id: this.generateAnomalyId(),
        type: AnomalyType.IMPOSSIBLE_TRAVEL,
        timestamp: context.timestamp,
        severity: 'critical',
        description: `Impossible travel: ${distance.toFixed(2)}km in ${timeDiff.toFixed(2)}h`,
        context: { 
          distance,
          timeDiff,
          requiredSpeed: distance / timeDiff,
          lastLocation: lastKnownLocation,
          currentLocation: context.location
        },
        resolved: false,
        falsePositive: false,
        riskScore: 80
      };
    }

    return null;
  }

  private checkUnusualLocation(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): AnomalyRecord | null {
    const locationPattern = profile.patterns.find(p => p.type === PatternType.LOCATION_PATTERNS);
    if (!locationPattern) return null;

    const usualLocations = locationPattern.pattern.locations as LocationInfo[];
    const threshold = this.config.anomalyDetection.thresholds.locationDistance;
    
    const isUsualLocation = usualLocations.some(loc => {
      const distance = this.calculateDistance(
        loc.latitude,
        loc.longitude,
        context.location.latitude,
        context.location.longitude
      );
      return distance <= threshold;
    });

    if (!isUsualLocation) {
      return {
        id: this.generateAnomalyId(),
        type: AnomalyType.UNUSUAL_LOCATION,
        timestamp: context.timestamp,
        severity: 'medium',
        description: `Login from unusual location: ${context.location.city}, ${context.location.country}`,
        context: { 
          currentLocation: context.location,
          usualLocations: usualLocations.map(l => `${l.city}, ${l.country}`)
        },
        resolved: false,
        falsePositive: false,
        riskScore: 30
      };
    }

    return null;
  }

  private checkVelocityAnomaly(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): AnomalyRecord | null {
    // Check for rapid successive actions
    const recentActions = context.actions.filter(
      action => context.timestamp.getTime() - action.timestamp.getTime() < 60000 // last minute
    );

    if (recentActions.length > 20) { // More than 20 actions per minute
      return {
        id: this.generateAnomalyId(),
        type: AnomalyType.VELOCITY_ANOMALY,
        timestamp: context.timestamp,
        severity: 'high',
        description: `High velocity: ${recentActions.length} actions in 1 minute`,
        context: { 
          actionsPerMinute: recentActions.length,
          threshold: 20
        },
        resolved: false,
        falsePositive: false,
        riskScore: 50
      };
    }

    return null;
  }

  // Risk scoring
  private calculateRiskScore(
    profile: UserBehaviorProfile,
    context: SessionContext,
    anomalies: AnomalyRecord[]
  ): number {
    if (!this.config.riskScoring.enabled) {
      return 0;
    }

    let score = 0;

    // Base risk from anomalies
    const anomalyScore = anomalies.reduce((sum, anomaly) => sum + anomaly.riskScore, 0);
    score += anomalyScore;

    // Apply risk factors
    for (const factor of this.config.riskScoring.riskFactors) {
      if (factor.enabled) {
        const factorScore = factor.calculate(profile, context);
        score += factorScore * factor.weight;
      }
    }

    // Normalize score (0-100)
    return Math.min(100, Math.max(0, score));
  }

  private getRiskLevel(score: number): RiskLevel {
    for (const range of this.config.riskScoring.scoreRanges) {
      if (score >= range.min && score <= range.max) {
        return range.level;
      }
    }
    return RiskLevel.MEDIUM;
  }

  // Adaptive authentication
  private checkAdaptiveTriggers(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): AdaptiveAction | undefined {
    if (!this.config.adaptiveAuth.enabled) {
      return undefined;
    }

    for (const trigger of this.config.adaptiveAuth.triggers) {
      if (trigger.enabled && trigger.condition(profile, context)) {
        this.stats.adaptiveAuthTriggers++;
        
        // Update adaptive auth state
        profile.adaptiveAuthState.currentRiskLevel = profile.riskLevel;
        profile.adaptiveAuthState.lastStepUp = new Date();
        profile.adaptiveAuthState.stepUpReason = trigger.name;

        return trigger.action;
      }
    }

    return undefined;
  }

  // Pattern learning and updates
  private async updateBehaviorPatterns(
    profile: UserBehaviorProfile,
    context: SessionContext
  ): Promise<void> {
    if (!this.config.patternAnalysis.enabled) {
      return;
    }

    // Update login time patterns
    this.updateLoginTimePattern(profile, context);

    // Update device patterns
    this.updateDevicePattern(profile, context);

    // Update location patterns
    this.updateLocationPattern(profile, context);

    // Update session duration patterns
    this.updateSessionPattern(profile, context);

    // Update navigation patterns
    this.updateNavigationPattern(profile, context);
  }

  private updateLoginTimePattern(profile: UserBehaviorProfile, context: SessionContext): void {
    let pattern = profile.patterns.find(p => p.type === PatternType.LOGIN_TIMES);
    
    if (!pattern) {
      pattern = {
        type: PatternType.LOGIN_TIMES,
        pattern: { hours: [], daysOfWeek: [] },
        confidence: 0,
        lastSeen: context.timestamp,
        frequency: 1,
        variance: 0
      };
      profile.patterns.push(pattern);
    }

    const hour = context.timestamp.getHours();
    const dayOfWeek = context.timestamp.getDay();

    const hours = pattern.pattern.hours as number[];
    const daysOfWeek = pattern.pattern.daysOfWeek as number[];

    if (!hours.includes(hour)) {
      hours.push(hour);
    }
    if (!daysOfWeek.includes(dayOfWeek)) {
      daysOfWeek.push(dayOfWeek);
    }

    pattern.frequency++;
    pattern.lastSeen = context.timestamp;
    pattern.confidence = Math.min(1, pattern.frequency / 50); // Confidence increases with frequency
  }

  private updateDevicePattern(profile: UserBehaviorProfile, context: SessionContext): void {
    let pattern = profile.patterns.find(p => p.type === PatternType.DEVICE_USAGE);
    
    if (!pattern) {
      pattern = {
        type: PatternType.DEVICE_USAGE,
        pattern: { devices: [], userAgents: [] },
        confidence: 0,
        lastSeen: context.timestamp,
        frequency: 1,
        variance: 0
      };
      profile.patterns.push(pattern);
    }

    const devices = pattern.pattern.devices as string[];
    const userAgents = pattern.pattern.userAgents as string[];

    if (!devices.includes(context.deviceFingerprint)) {
      devices.push(context.deviceFingerprint);
    }
    if (!userAgents.includes(context.userAgent)) {
      userAgents.push(context.userAgent);
    }

    // Keep only recent devices (last 10)
    if (devices.length > 10) {
      devices.splice(0, devices.length - 10);
    }

    pattern.frequency++;
    pattern.lastSeen = context.timestamp;
  }

  private updateLocationPattern(profile: UserBehaviorProfile, context: SessionContext): void {
    let pattern = profile.patterns.find(p => p.type === PatternType.LOCATION_PATTERNS);
    
    if (!pattern) {
      pattern = {
        type: PatternType.LOCATION_PATTERNS,
        pattern: { locations: [], lastLocation: null },
        confidence: 0,
        lastSeen: context.timestamp,
        frequency: 1,
        variance: 0
      };
      profile.patterns.push(pattern);
    }

    const locations = pattern.pattern.locations as LocationInfo[];
    
    // Add location if not already present (within 10km)
    const existingLocation = locations.find(loc => {
      const distance = this.calculateDistance(
        loc.latitude,
        loc.longitude,
        context.location.latitude,
        context.location.longitude
      );
      return distance <= 10; // 10km threshold
    });

    if (!existingLocation) {
      locations.push(context.location);
      
      // Keep only recent locations (last 20)
      if (locations.length > 20) {
        locations.splice(0, locations.length - 20);
      }
    }

    pattern.pattern.lastLocation = context.location;
    pattern.frequency++;
    pattern.lastSeen = context.timestamp;
  }

  private updateSessionPattern(profile: UserBehaviorProfile, context: SessionContext): void {
    // This would be called when session ends with duration
    // For now, we'll estimate based on actions
    const estimatedDuration = context.actions.length > 0 ? 
      context.actions[context.actions.length - 1].timestamp.getTime() - context.timestamp.getTime() : 0;

    let pattern = profile.patterns.find(p => p.type === PatternType.SESSION_DURATION);
    
    if (!pattern) {
      pattern = {
        type: PatternType.SESSION_DURATION,
        pattern: { durations: [], avgDuration: 0 },
        confidence: 0,
        lastSeen: context.timestamp,
        frequency: 1,
        variance: 0
      };
      profile.patterns.push(pattern);
    }

    const durations = pattern.pattern.durations as number[];
    durations.push(estimatedDuration);

    // Keep only recent 100 sessions
    if (durations.length > 100) {
      durations.splice(0, durations.length - 100);
    }

    pattern.pattern.avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    pattern.frequency++;
    pattern.lastSeen = context.timestamp;
  }

  private updateNavigationPattern(profile: UserBehaviorProfile, context: SessionContext): void {
    let pattern = profile.patterns.find(p => p.type === PatternType.NAVIGATION_BEHAVIOR);
    
    if (!pattern) {
      pattern = {
        type: PatternType.NAVIGATION_BEHAVIOR,
        pattern: { commonPaths: [], features: [] },
        confidence: 0,
        lastSeen: context.timestamp,
        frequency: 1,
        variance: 0
      };
      profile.patterns.push(pattern);
    }

    const features = pattern.pattern.features as string[];
    
    // Extract features from actions
    context.actions.forEach(action => {
      if (!features.includes(action.action)) {
        features.push(action.action);
      }
    });

    pattern.frequency++;
    pattern.lastSeen = context.timestamp;
  }

  // Profile management
  private async getOrCreateProfile(userId: string): Promise<UserBehaviorProfile> {
    // Check memory cache first
    let profile = this.profiles.get(userId);
    if (profile) {
      return profile;
    }

    // Check Redis cache
    try {
      const cachedProfile = await redisCache.get<string>(`${this.REDIS_KEY_PREFIX}profile:${userId}`);
      if (cachedProfile) {
        profile = JSON.parse(cachedProfile);
        this.profiles.set(userId, profile!);
        return profile!;
      }
    } catch {
      console.error('Error loading profile from cache:');
    }

    // Create new profile
    profile = {
      userId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      patterns: [],
      riskScore: 0,
      riskLevel: RiskLevel.VERY_LOW,
      anomalies: [],
      adaptiveAuthState: {
        currentRiskLevel: RiskLevel.VERY_LOW,
        lastStepUp: null,
        stepUpReason: null,
        temporaryRestrictions: [],
        trustScore: 50
      },
      statistics: {
        totalSessions: 0,
        avgSessionDuration: 0,
        uniqueDevices: 0,
        uniqueLocations: 0,
        lastActivity: new Date(),
        riskHistory: []
      }
    };

    this.profiles.set(userId, profile);
    this.stats.totalProfiles++;

    return profile;
  }

  private async storeProfile(profile: UserBehaviorProfile): Promise<void> {
    try {
      // Update memory cache
      this.profiles.set(profile.userId, profile);

      // Store in Redis
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}profile:${profile.userId}`,
        JSON.stringify(profile),
        { ttl: this.PROFILE_CACHE_TTL }
      );
    } catch {
      console.error('Error storing profile:');
    }
  }

  // Statistics and reporting
  getStats(): BehavioralAnalyticsStats {
    return { ...this.stats };
  }

  async generateBehavioralReport(userId: string): Promise<{
    profile: UserBehaviorProfile;
    insights: string[];
    recommendations: string[];
    riskAssessment: string;
  }> {
    const profile = await this.getOrCreateProfile(userId);
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Generate insights
    if (profile.patterns.length > 0) {
      insights.push(`User has established ${profile.patterns.length} behavioral patterns`);
    }

    if (profile.anomalies.length > 0) {
      const recentAnomalies = profile.anomalies.filter(
        a => Date.now() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
      );
      insights.push(`${recentAnomalies.length} anomalies detected in the last 7 days`);
    }

    // Generate recommendations
    if (profile.riskLevel >= RiskLevel.HIGH) {
      recommendations.push('Consider implementing additional security measures');
    }

    if (profile.anomalies.some(a => a.type === AnomalyType.NEW_DEVICE)) {
      recommendations.push('Enable device registration notifications');
    }

    const riskAssessment = this.generateRiskAssessment(profile);

    return {
      profile,
      insights,
      recommendations,
      riskAssessment
    };
  }

  // Utility methods
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRiskAssessment(profile: UserBehaviorProfile): string {
    switch (profile.riskLevel) {
      case RiskLevel.VERY_LOW:
        return 'User behavior is consistent and poses minimal risk';
      case RiskLevel.LOW:
        return 'User behavior is mostly normal with minor variations';
      case RiskLevel.MEDIUM:
        return 'User behavior shows some unusual patterns that warrant monitoring';
      case RiskLevel.HIGH:
        return 'User behavior is significantly abnormal and requires attention';
      case RiskLevel.CRITICAL:
        return 'User behavior is highly suspicious and requires immediate action';
      default:
        return 'Risk assessment unavailable';
    }
  }

  private initializeRiskFactors(): void {
    this.config.riskScoring.riskFactors = [
      {
        name: 'new_device_factor',
        weight: 0.3,
        enabled: true,
        calculate: (profile, context) => {
          const devicePattern = profile.patterns.find(p => p.type === PatternType.DEVICE_USAGE);
          if (!devicePattern) return 20;
          
          const knownDevices = devicePattern.pattern.devices as string[];
          return knownDevices.includes(context.deviceFingerprint) ? 0 : 30;
        }
      },
      {
        name: 'location_risk_factor',
        weight: 0.25,
        enabled: true,
        calculate: (profile, context) => {
          const locationPattern = profile.patterns.find(p => p.type === PatternType.LOCATION_PATTERNS);
          if (!locationPattern) return 15;
          
          const usualLocations = locationPattern.pattern.locations as LocationInfo[];
          const isUsualLocation = usualLocations.some(loc => {
            const distance = this.calculateDistance(
              loc.latitude, loc.longitude,
              context.location.latitude, context.location.longitude
            );
            return distance <= 50; // 50km threshold
          });
          
          return isUsualLocation ? 0 : 25;
        }
      },
      {
        name: 'time_risk_factor',
        weight: 0.2,
        enabled: true,
        calculate: (profile, context) => {
          const timePattern = profile.patterns.find(p => p.type === PatternType.LOGIN_TIMES);
          if (!timePattern) return 10;
          
          const currentHour = context.timestamp.getHours();
          const usualHours = timePattern.pattern.hours as number[];
          
          return usualHours.includes(currentHour) ? 0 : 15;
        }
      }
    ];

    this.config.riskScoring.scoreRanges = [
      { min: 0, max: 20, level: RiskLevel.VERY_LOW, description: 'Very low risk', actions: [] },
      { min: 21, max: 40, level: RiskLevel.LOW, description: 'Low risk', actions: [] },
      { min: 41, max: 60, level: RiskLevel.MEDIUM, description: 'Medium risk', actions: ['monitor'] },
      { min: 61, max: 80, level: RiskLevel.HIGH, description: 'High risk', actions: ['step_up_auth'] },
      { min: 81, max: 100, level: RiskLevel.CRITICAL, description: 'Critical risk', actions: ['block', 'investigate'] }
    ];
  }

  private startPeriodicTasks(): void {
    // Update statistics every 5 minutes
    setInterval(() => {
      this.updatePeriodicStats();
    }, 5 * 60 * 1000);

    // Clean up old sessions every hour
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000);

    // Retrain ML models daily (if enabled)
    if (this.config.machineLearning.enabled) {
      setInterval(() => {
        this.retrainMLModels();
      }, 24 * 60 * 60 * 1000);
    }
  }

  private updatePeriodicStats(): void {
    this.stats.activeProfiles = this.profiles.size;
    
    let totalRisk = 0;
    const riskDistribution = {
      [RiskLevel.VERY_LOW]: 0,
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0
    };

    for (const profile of this.profiles.values()) {
      totalRisk += profile.riskScore;
      riskDistribution[profile.riskLevel]++;
    }

    this.stats.averageRiskScore = this.profiles.size > 0 ? totalRisk / this.profiles.size : 0;
    this.stats.riskDistribution = riskDistribution;
  }

  private cleanupOldSessions(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    
    for (const [sessionId, session] of this.sessions) {
      if (session.timestamp.getTime() < cutoff) {
        this.sessions.delete(sessionId);
      }
    }
  }

  private retrainMLModels(): void {
    // Mock ML retraining - in production, would implement actual ML pipeline
    console.log('🤖 Retraining ML models for behavioral analytics');
  }

  private updateStats(
    profile: UserBehaviorProfile, 
    anomalies: AnomalyRecord[], 
    adaptiveAction?: AdaptiveAction
  ): void {
    this.stats.totalAnomalies += anomalies.length;
    this.stats.unresolvedAnomalies += anomalies.filter(a => !a.resolved).length;

    if (adaptiveAction) {
      this.stats.adaptiveAuthTriggers++;
    }

    // Update top anomaly types
    anomalies.forEach(anomaly => {
      const existingType = this.stats.topAnomalyTypes.find(t => t.type === anomaly.type);
      if (existingType) {
        existingType.count++;
      } else {
        this.stats.topAnomalyTypes.push({ type: anomaly.type, count: 1 });
      }
    });

    // Keep only top 10
    this.stats.topAnomalyTypes = this.stats.topAnomalyTypes
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async logBehavioralEvent(
    userId: string,
    riskLevel: RiskLevel,
    anomalies: AnomalyRecord[],
    adaptiveAction?: AdaptiveAction
  ): Promise<void> {
    await auditLogger.log({
      level: riskLevel >= RiskLevel.HIGH ? AuditLevel.ERROR : AuditLevel.WARN,
      category: AuditCategory.SECURITY_EVENT,
      action: 'BEHAVIORAL_ANALYSIS',
      resource: 'behavioral_analytics',
      userId,
              details: {
          description: `Behavioral analysis completed: Risk=${RiskLevel[riskLevel]}`,
          riskLevel: RiskLevel[riskLevel] as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          additionalInfo: {
            riskScore: 0, // Would include actual score
            anomaliesCount: anomalies.length,
            anomalyTypes: anomalies.map(a => AnomalyType[a.type]),
            adaptiveAction: adaptiveAction?.type
          }
        }
    });
  }
}

// Default configuration
export const defaultBehavioralAnalyticsConfig: BehavioralAnalyticsConfig = {
  enabled: true,
  patternAnalysis: {
    enabled: true,
    trackingPeriodDays: 90,
    minSessionsForPattern: 10,
    patternTypes: Object.values(PatternType),
    updateFrequencyHours: 6
  },
  anomalyDetection: {
    enabled: true,
    sensitivityLevel: 'medium',
    anomalyTypes: Object.values(AnomalyType),
    thresholds: {
      loginTimeVariance: 3, // hours
      locationDistance: 100, // km
      sessionDurationVariance: 60, // minutes
      velocityThreshold: 800, // km/h (realistic max travel speed)
      deviceChangeFrequency: 3, // per week
      failedAttemptsThreshold: 5
    },
    alertEnabled: true,
    autoResponse: false
  },
  riskScoring: {
    enabled: true,
    scoringModel: 'advanced',
    riskFactors: [], // Will be initialized
    scoreRanges: [], // Will be initialized
    updateIntervalMinutes: 15
  },
  adaptiveAuth: {
    enabled: true,
    triggers: [], // Will be configured based on risk levels
    actions: [], // Will be configured based on triggers
    gracePeriodMinutes: 30,
    fallbackAction: 'step_up'
  },
  realTimeMonitoring: {
    enabled: true,
    sessionTracking: true,
    deviceFingerprinting: true,
    locationTracking: true,
    timeBasedAnalysis: true,
    velocityChecks: true
  },
  machineLearning: {
    enabled: false, // Disabled by default
    algorithm: 'isolation_forest',
    trainingDataDays: 30,
    retrainIntervalDays: 7,
    confidenceThreshold: 0.8
  }
};

// Export singleton instance
export const behavioralAnalytics = BehavioralAnalyticsEngine.getInstance(defaultBehavioralAnalyticsConfig);

// Helper functions
export async function analyzeUserBehavior(
  userId: string,
  sessionContext: SessionContext
) {
  return behavioralAnalytics.analyzeUserBehavior(userId, sessionContext);
}

export function getBehavioralAnalyticsStats() {
  return behavioralAnalytics.getStats();
}

export async function generateBehavioralReport(userId: string) {
  return behavioralAnalytics.generateBehavioralReport(userId);
} 