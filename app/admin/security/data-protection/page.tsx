'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Eye,
  Settings,
  RefreshCw,
  Lock,
  UserCheck,
  Scale,
  Database
} from 'lucide-react';


interface DataProtectionStats {
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

interface ComplianceReport {
  complianceScore: number;
  gdprCompliance: boolean;
  recommendations: string[];
  issues: string[];
}

interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  type: string;
  granted: boolean;
  timestamp: string;
  purpose: string;
  expiryDate?: string;
}

interface DataSubjectRightRequest {
  id: string;
  dataSubjectId: string;
  type: string;
  status: string;
  requestDate: string;
  completionDate?: string;
  description: string;
}

interface PrivacyBreach {
  id: string;
  title: string;
  severity: string;
  discoveryDate: string;
  affectedDataSubjects: number;
  status: string;
  notificationRequired: boolean;
}

export default function DataProtectionPage() {
  const [stats, setStats] = useState<DataProtectionStats | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [rightRequests, setRightRequests] = useState<DataSubjectRightRequest[]>([]);
  const [breaches, setBreaches] = useState<PrivacyBreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newConsentForm, setNewConsentForm] = useState({
    dataSubjectId: '',
    type: 'MARKETING',
    granted: true,
    purpose: ''
  });

  const [newBreachForm, setNewBreachForm] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    affectedDataSubjects: 0,
    rootCause: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/data-protection?action=stats');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
      }

      // Load compliance report
      const complianceResponse = await fetch('/api/admin/data-protection?action=compliance-report');
      if (complianceResponse.ok) {
        const data = await complianceResponse.json();
        setComplianceReport(data.report);
      }

      // Load mock data
      setConsents([
        {
          id: 'consent1',
          dataSubjectId: 'user123',
          type: 'MARKETING',
          granted: true,
          timestamp: '2024-01-15T10:00:00Z',
          purpose: 'Marketing communications',
          expiryDate: '2025-01-15T10:00:00Z'
        },
        {
          id: 'consent2',
          dataSubjectId: 'user456',
          type: 'ANALYTICS',
          granted: false,
          timestamp: '2024-01-14T15:30:00Z',
          purpose: 'Usage analytics'
        }
      ]);

      setRightRequests([
        {
          id: 'request1',
          dataSubjectId: 'user789',
          type: 'ACCESS',
          status: 'PENDING',
          requestDate: '2024-01-15T09:00:00Z',
          description: 'Request for personal data access'
        },
        {
          id: 'request2',
          dataSubjectId: 'user101',
          type: 'ERASURE',
          status: 'COMPLETED',
          requestDate: '2024-01-10T14:00:00Z',
          completionDate: '2024-01-12T16:00:00Z',
          description: 'Request for data deletion'
        }
      ]);

      setBreaches([
        {
          id: 'breach1',
          title: 'Unauthorized Access Attempt',
          severity: 'HIGH',
          discoveryDate: '2024-01-14T12:00:00Z',
          affectedDataSubjects: 25,
          status: 'INVESTIGATING',
          notificationRequired: true
        }
      ]);

    } catch (error) {
      console.error('Error loading data:');
      setMessage({ type: 'error', text: 'Failed to load data protection information' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordConsent = async () => {
    try {
      const response = await fetch('/api/admin/data-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-consent',
          dataSubjectId: newConsentForm.dataSubjectId,
          data: {
            type: newConsentForm.type,
            granted: newConsentForm.granted,
            purpose: newConsentForm.purpose,
            ipAddress: '127.0.0.1',
            userAgent: 'Admin Interface',
            consentText: `Consent for ${newConsentForm.purpose}`
          }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Consent recorded successfully' });
        setNewConsentForm({ dataSubjectId: '', type: 'MARKETING', granted: true, purpose: '' });
        loadData();
      }
    } catch (error) {
      console.error('Consent error:');
      setMessage({ type: 'error', text: 'Failed to record consent' });
    }
  };

  const handleProcessRightRequest = async (dataSubjectId: string, rightType: string) => {
    try {
      const response = await fetch('/api/admin/data-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-data-subject-right',
          dataSubjectId,
          data: { rightType }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${rightType} request processed successfully` });
        loadData();
      }
    } catch (error) {
      console.error('Rights request error:');
      setMessage({ type: 'error', text: 'Failed to process data subject right request' });
    }
  };

  const handleReportBreach = async () => {
    try {
      const response = await fetch('/api/admin/data-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report-privacy-breach',
          data: {
            title: newBreachForm.title,
            description: newBreachForm.description,
            severity: newBreachForm.severity,
            affectedDataSubjects: newBreachForm.affectedDataSubjects,
            dataCategories: ['PERSONAL_DATA'],
            rootCause: newBreachForm.rootCause
          }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Privacy breach reported successfully' });
        setNewBreachForm({
          title: '',
          description: '',
          severity: 'MEDIUM',
          affectedDataSubjects: 0,
          rootCause: ''
        });
        loadData();
      }
    } catch (error) {
      console.error('Breach report error:');
      setMessage({ type: 'error', text: 'Failed to report privacy breach' });
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin h-8 w-8 mr-2" />
        <span>Loading data protection dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Data Protection & Privacy
          </h1>
          <p className="text-muted-foreground">
            GDPR compliance, consent management, and privacy protection
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="consents">Consent Management</TabsTrigger>
          <TabsTrigger value="rights">Data Subject Rights</TabsTrigger>
          <TabsTrigger value="breaches">Privacy Breaches</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Subjects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDataSubjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered data subjects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Consents</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeConsents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.withdrawnConsents || 0} withdrawn
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingRightRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.completedRightRequests || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getComplianceColor(complianceReport?.complianceScore || 0)}`}>
                  {complianceReport?.complianceScore || 0}%
                </div>
                <Progress value={complianceReport?.complianceScore || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Protection Overview</CardTitle>
                <CardDescription>Key metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm">Encrypted Fields</span>
                    </div>
                    <Badge variant="outline">{stats?.encryptedFields || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="text-sm">Anonymized Records</span>
                    </div>
                    <Badge variant="outline">{stats?.anonymizedRecords || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Privacy Breaches</span>
                    </div>
                    <Badge variant="outline">{stats?.privacyBreaches || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm">Retention Expirations</span>
                    </div>
                    <Badge variant="outline">{stats?.retentionExpirations || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>GDPR and privacy compliance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {complianceReport?.gdprCompliance ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      GDPR Compliance: {complianceReport?.gdprCompliance ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </div>
                  
                  {complianceReport?.issues && complianceReport.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Issues:</h4>
                      <ul className="text-sm space-y-1">
                        {complianceReport.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {complianceReport?.recommendations && complianceReport.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Recommendations:</h4>
                      <ul className="text-sm space-y-1">
                        {complianceReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consents">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Record New Consent</CardTitle>
                <CardDescription>Record consent for a data subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Data Subject ID</label>
                    <Input
                      value={newConsentForm.dataSubjectId}
                      onChange={(e) => setNewConsentForm({
                        ...newConsentForm,
                        dataSubjectId: e.target.value
                      })}
                      placeholder="Enter data subject ID"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Consent Type</label>
                    <Select
                      value={newConsentForm.type}
                      onValueChange={(value) => setNewConsentForm({
                        ...newConsentForm,
                        type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="ANALYTICS">Analytics</SelectItem>
                        <SelectItem value="PERSONALIZATION">Personalization</SelectItem>
                        <SelectItem value="COOKIES">Cookies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Purpose</label>
                    <Input
                      value={newConsentForm.purpose}
                      onChange={(e) => setNewConsentForm({
                        ...newConsentForm,
                        purpose: e.target.value
                      })}
                      placeholder="Purpose of data processing"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newConsentForm.granted}
                      onChange={(e) => setNewConsentForm({
                        ...newConsentForm,
                        granted: e.target.checked
                      })}
                    />
                    <label className="text-sm">Consent Granted</label>
                  </div>
                  <Button onClick={handleRecordConsent} className="w-full">
                    Record Consent
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Consents</CardTitle>
                <CardDescription>Latest consent records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consents.map((consent) => (
                    <div key={consent.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{consent.type}</Badge>
                          <Badge className={consent.granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {consent.granted ? 'Granted' : 'Withdrawn'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {consent.dataSubjectId}
                        </span>
                      </div>
                      <p className="text-sm">{consent.purpose}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(consent.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rights">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Rights Requests</CardTitle>
              <CardDescription>Manage data subject rights requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rightRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{request.type}</Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {request.dataSubjectId}
                          </span>
                        </div>
                        <p className="text-sm">{request.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested: {new Date(request.requestDate).toLocaleString()}
                          {request.completionDate && (
                            <span> • Completed: {new Date(request.completionDate).toLocaleString()}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleProcessRightRequest(request.dataSubjectId, request.type)}
                          >
                            Process
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Privacy Breach</CardTitle>
                <CardDescription>Report a new privacy breach incident</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={newBreachForm.title}
                      onChange={(e) => setNewBreachForm({
                        ...newBreachForm,
                        title: e.target.value
                      })}
                      placeholder="Brief title of the breach"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newBreachForm.description}
                      onChange={(e) => setNewBreachForm({
                        ...newBreachForm,
                        description: e.target.value
                      })}
                      placeholder="Detailed description of the breach"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <Select
                      value={newBreachForm.severity}
                      onValueChange={(value) => setNewBreachForm({
                        ...newBreachForm,
                        severity: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Affected Data Subjects</label>
                    <Input
                      type="number"
                      value={newBreachForm.affectedDataSubjects}
                      onChange={(e) => setNewBreachForm({
                        ...newBreachForm,
                        affectedDataSubjects: parseInt(e.target.value) || 0
                      })}
                      placeholder="Number of affected data subjects"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Root Cause</label>
                    <Textarea
                      value={newBreachForm.rootCause}
                      onChange={(e) => setNewBreachForm({
                        ...newBreachForm,
                        rootCause: e.target.value
                      })}
                      placeholder="Root cause analysis"
                    />
                  </div>
                  <Button onClick={handleReportBreach} className="w-full">
                    Report Breach
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Breaches</CardTitle>
                <CardDescription>Latest privacy breach incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breaches.map((breach) => (
                    <div key={breach.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(breach.severity)}>
                            {breach.severity}
                          </Badge>
                          <Badge variant="outline">{breach.status}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {breach.affectedDataSubjects} affected
                        </span>
                      </div>
                      <h4 className="font-medium">{breach.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Discovered: {new Date(breach.discoveryDate).toLocaleString()}
                      </p>
                      {breach.notificationRequired && (
                        <div className="flex items-center gap-1 mt-2">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-orange-600">Notification Required</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>GDPR Compliance Checklist</CardTitle>
                <CardDescription>Essential GDPR compliance requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Privacy Policy Published</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Consent Management System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Data Subject Rights Process</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Data Protection Impact Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Breach Notification Process</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Data Protection Officer Appointed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention Policies</CardTitle>
                <CardDescription>Configure data retention periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Personal Data</span>
                    <Badge variant="outline">7 years</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Marketing Data</span>
                    <Badge variant="outline">3 years</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics Data</span>
                    <Badge variant="outline">2 years</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Location Data</span>
                    <Badge variant="outline">1 year</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Policies
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 