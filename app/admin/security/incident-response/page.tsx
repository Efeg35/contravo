'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  Clock, 
  RefreshCw,
  Download,
  Eye,
  Zap,
  FileText,
  Plus
} from 'lucide-react';

interface IncidentResponseStats {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  averageResolutionTime: number;
  incidentsBySeverity: Record<string, number>;
  incidentsByCategory: Record<string, number>;
  mttr: number;
  mtbf: number;
  falsePositiveRate: number;
  escalationRate: number;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  priority: number;
  detectedAt: string;
  reportedBy: string;
  assignedTo: string[];
  affectedSystems: string[];
  affectedUsers: number;
  detectionSource: string;
}

interface ResponseAction {
  id: string;
  action: string;
  description: string;
  executedAt: string;
  executedBy: string;
  automated: boolean;
  successful: boolean;
  result: string;
}

interface Evidence {
  id: string;
  type: string;
  name: string;
  description: string;
  collectedAt: string;
  collectedBy: string;
  sensitive: boolean;
}

export default function IncidentResponsePage() {
  const [stats, setStats] = useState<IncidentResponseStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [actions, setActions] = useState<ResponseAction[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newIncidentForm, setNewIncidentForm] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    category: 'SECURITY_BREACH',
    affectedSystems: '',
    affectedUsers: 0
  });

  const [newActionForm, setNewActionForm] = useState({
    action: 'ISOLATE_SYSTEM',
    description: ''
  });

  const [newEvidenceForm, setNewEvidenceForm] = useState({
    type: 'LOG',
    name: '',
    description: '',
    location: '',
    sensitive: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/incident-response?action=stats');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
      }

      // Load incidents
      const incidentsResponse = await fetch('/api/admin/incident-response?action=incidents&limit=50');
      if (incidentsResponse.ok) {
        const data = await incidentsResponse.json();
        setIncidents(data.incidents || []);
      }

      // Load mock data
      setIncidents([
        {
          id: 'INC-20240115-0001',
          title: 'Suspicious Login Activity',
          description: 'Multiple failed login attempts detected from unusual locations',
          severity: 'HIGH',
          category: 'SECURITY_BREACH',
          status: 'INVESTIGATING',
          priority: 8,
          detectedAt: '2024-01-15T10:30:00Z',
          reportedBy: 'Security System',
          assignedTo: ['security-team'],
          affectedSystems: ['auth-service', 'user-portal'],
          affectedUsers: 150,
          detectionSource: 'AUTOMATED_ALERTS'
        },
        {
          id: 'INC-20240115-0002',
          title: 'Data Exfiltration Attempt',
          description: 'Unusual data transfer patterns detected',
          severity: 'CRITICAL',
          category: 'DATA_BREACH',
          status: 'CONTAINED',
          priority: 10,
          detectedAt: '2024-01-15T08:15:00Z',
          reportedBy: 'DLP System',
          assignedTo: ['incident-response-team'],
          affectedSystems: ['database', 'api-gateway'],
          affectedUsers: 500,
          detectionSource: 'NETWORK_MONITORING'
        }
      ]);

      setActions([
        {
          id: 'action1',
          action: 'BLOCK_IP',
          description: 'Blocked suspicious IP addresses',
          executedAt: '2024-01-15T10:45:00Z',
          executedBy: 'security-admin',
          automated: true,
          successful: true,
          result: 'Successfully blocked 15 IP addresses'
        }
      ]);

      setEvidence([
        {
          id: 'evidence1',
          type: 'LOG',
          name: 'auth-service-logs.txt',
          description: 'Authentication service logs showing failed attempts',
          collectedAt: '2024-01-15T10:35:00Z',
          collectedBy: 'forensics-team',
          sensitive: false
        }
      ]);

    } catch (_) {
      console.error('Error loading incident data:');
      setMessage({ type: 'error', text: 'Failed to load incident response data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    try {
      const response = await fetch('/api/admin/incident-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-incident',
          data: {
            title: newIncidentForm.title,
            description: newIncidentForm.description,
            severity: newIncidentForm.severity,
            category: newIncidentForm.category,
            affectedSystems: newIncidentForm.affectedSystems.split(',').map(s => s.trim()),
            affectedUsers: newIncidentForm.affectedUsers,
            reportedBy: 'admin',
            detectionSource: 'USER_REPORTS'
          }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Incident created successfully' });
        setNewIncidentForm({
          title: '',
          description: '',
          severity: 'MEDIUM',
          category: 'SECURITY_BREACH',
          affectedSystems: '',
          affectedUsers: 0
        });
        loadData();
      }
    } catch (_) {
      console.error('Create incident error:');
      setMessage({ type: 'error', text: 'Failed to create incident' });
    }
  };

  const handleUpdateStatus = async (incidentId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/incident-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          incidentId,
          data: { status }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Incident status updated to ${status}` });
        loadData();
      }
    } catch (_) {
      console.error('Update status error:');
      setMessage({ type: 'error', text: 'Failed to update incident status' });
    }
  };

  const handleExecuteAction = async (incidentId: string) => {
    try {
      const response = await fetch('/api/admin/incident-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute-action',
          incidentId,
          data: {
            action: newActionForm.action,
            description: newActionForm.description,
            executedBy: 'admin'
          }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Response action executed successfully' });
        setNewActionForm({ action: 'ISOLATE_SYSTEM', description: '' });
        loadData();
      }
    } catch (_) {
      console.error('Execute action error:');
      setMessage({ type: 'error', text: 'Failed to execute response action' });
    }
  };

  const handleAddEvidence = async (incidentId: string) => {
    try {
      const response = await fetch('/api/admin/incident-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-evidence',
          incidentId,
          data: {
            type: newEvidenceForm.type,
            name: newEvidenceForm.name,
            description: newEvidenceForm.description,
            location: newEvidenceForm.location,
            collectedBy: 'admin',
            sensitive: newEvidenceForm.sensitive
          }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Evidence added successfully' });
        setNewEvidenceForm({
          type: 'LOG',
          name: '',
          description: '',
          location: '',
          sensitive: false
        });
        loadData();
      }
    } catch (_) {
      console.error('Add evidence error:');
      setMessage({ type: 'error', text: 'Failed to add evidence' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      case 'INFORMATIONAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DETECTED': return 'bg-yellow-100 text-yellow-800';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800';
      case 'CONTAINED': return 'bg-orange-100 text-orange-800';
      case 'ERADICATING': return 'bg-purple-100 text-purple-800';
      case 'RECOVERING': return 'bg-indigo-100 text-indigo-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin h-8 w-8 mr-2" />
        <span>Loading incident response dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Incident Response
          </h1>
          <p className="text-muted-foreground">
            Security incident detection, response, and management
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
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="response">Response Actions</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="create">Create Incident</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalIncidents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.openIncidents || 0} open, {stats?.resolvedIncidents || 0} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MTTR</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round((stats?.mttr || 0) / 60000)}m</div>
                <p className="text-xs text-muted-foreground">
                  Mean Time To Resolution
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.escalationRate || 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Incidents requiring escalation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.falsePositiveRate || 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Detection accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incidents by Severity</CardTitle>
                <CardDescription>Distribution of incident severity levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats?.incidentsBySeverity || {}).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(severity)}>
                          {severity}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incidents by Category</CardTitle>
                <CardDescription>Types of security incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats?.incidentsByCategory || {}).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>Monitor and manage security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search incidents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DETECTED">Detected</SelectItem>
                    <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                    <SelectItem value="CONTAINED">Contained</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <Badge variant="outline">{incident.category.replace('_', ' ')}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {incident.id}
                          </span>
                        </div>
                        <h4 className="font-medium">{incident.title}</h4>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Detected: {new Date(incident.detectedAt).toLocaleString()}</span>
                          <span>Affected Users: {incident.affectedUsers}</span>
                          <span>Systems: {incident.affectedSystems.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Select onValueChange={(status) => handleUpdateStatus(incident.id, status)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                            <SelectItem value="CONTAINED">Contained</SelectItem>
                            <SelectItem value="ERADICATING">Eradicating</SelectItem>
                            <SelectItem value="RECOVERING">Recovering</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Execute Response Action</CardTitle>
                <CardDescription>Execute automated or manual response actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Incident</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidents.map((incident) => (
                          <SelectItem key={incident.id} value={incident.id}>
                            {incident.id} - {incident.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Action</label>
                    <Select
                      value={newActionForm.action}
                      onValueChange={(value) => setNewActionForm({
                        ...newActionForm,
                        action: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISOLATE_SYSTEM">Isolate System</SelectItem>
                        <SelectItem value="BLOCK_IP">Block IP</SelectItem>
                        <SelectItem value="DISABLE_ACCOUNT">Disable Account</SelectItem>
                        <SelectItem value="RESET_PASSWORDS">Reset Passwords</SelectItem>
                        <SelectItem value="BACKUP_DATA">Backup Data</SelectItem>
                        <SelectItem value="COLLECT_EVIDENCE">Collect Evidence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newActionForm.description}
                      onChange={(e) => setNewActionForm({
                        ...newActionForm,
                        description: e.target.value
                      })}
                      placeholder="Action description and details"
                    />
                  </div>
                  <Button
                    onClick={() => selectedIncident && handleExecuteAction(selectedIncident.id)}
                    className="w-full"
                    disabled={!selectedIncident}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Execute Action
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Actions</CardTitle>
                <CardDescription>Recently executed response actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{action.action.replace('_', ' ')}</Badge>
                          <Badge className={action.successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {action.successful ? 'Success' : 'Failed'}
                          </Badge>
                          {action.automated && (
                            <Badge variant="outline">Automated</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {action.executedBy}
                        </span>
                      </div>
                      <p className="text-sm">{action.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(action.executedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 mt-1">{action.result}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evidence">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Evidence</CardTitle>
                <CardDescription>Collect and document forensic evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Incident</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidents.map((incident) => (
                          <SelectItem key={incident.id} value={incident.id}>
                            {incident.id} - {incident.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Evidence Type</label>
                    <Select
                      value={newEvidenceForm.type}
                      onValueChange={(value) => setNewEvidenceForm({
                        ...newEvidenceForm,
                        type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOG">Log File</SelectItem>
                        <SelectItem value="SCREENSHOT">Screenshot</SelectItem>
                        <SelectItem value="NETWORK_CAPTURE">Network Capture</SelectItem>
                        <SelectItem value="MEMORY_DUMP">Memory Dump</SelectItem>
                        <SelectItem value="FILE">File</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newEvidenceForm.name}
                      onChange={(e) => setNewEvidenceForm({
                        ...newEvidenceForm,
                        name: e.target.value
                      })}
                      placeholder="Evidence file name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newEvidenceForm.description}
                      onChange={(e) => setNewEvidenceForm({
                        ...newEvidenceForm,
                        description: e.target.value
                      })}
                      placeholder="Evidence description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={newEvidenceForm.location}
                      onChange={(e) => setNewEvidenceForm({
                        ...newEvidenceForm,
                        location: e.target.value
                      })}
                      placeholder="File path or location"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newEvidenceForm.sensitive}
                      onChange={(e) => setNewEvidenceForm({
                        ...newEvidenceForm,
                        sensitive: e.target.checked
                      })}
                    />
                    <label className="text-sm">Sensitive Evidence</label>
                  </div>
                  <Button
                    onClick={() => selectedIncident && handleAddEvidence(selectedIncident.id)}
                    className="w-full"
                    disabled={!selectedIncident}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Evidence
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evidence Collection</CardTitle>
                <CardDescription>Collected forensic evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.type}</Badge>
                          {item.sensitive && (
                            <Badge className="bg-red-100 text-red-800">Sensitive</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.collectedBy}
                        </span>
                      </div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Collected: {new Date(item.collectedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Incident</CardTitle>
              <CardDescription>Manually create a new security incident</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={newIncidentForm.title}
                      onChange={(e) => setNewIncidentForm({
                        ...newIncidentForm,
                        title: e.target.value
                      })}
                      placeholder="Incident title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newIncidentForm.description}
                      onChange={(e) => setNewIncidentForm({
                        ...newIncidentForm,
                        description: e.target.value
                      })}
                      placeholder="Detailed incident description"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <Select
                      value={newIncidentForm.severity}
                      onValueChange={(value) => setNewIncidentForm({
                        ...newIncidentForm,
                        severity: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="INFORMATIONAL">Informational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newIncidentForm.category}
                      onValueChange={(value) => setNewIncidentForm({
                        ...newIncidentForm,
                        category: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SECURITY_BREACH">Security Breach</SelectItem>
                        <SelectItem value="DATA_BREACH">Data Breach</SelectItem>
                        <SelectItem value="SYSTEM_OUTAGE">System Outage</SelectItem>
                        <SelectItem value="MALWARE">Malware</SelectItem>
                        <SelectItem value="PHISHING">Phishing</SelectItem>
                        <SelectItem value="DDOS_ATTACK">DDoS Attack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Affected Systems</label>
                    <Input
                      value={newIncidentForm.affectedSystems}
                      onChange={(e) => setNewIncidentForm({
                        ...newIncidentForm,
                        affectedSystems: e.target.value
                      })}
                      placeholder="Comma-separated system names"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Affected Users</label>
                    <Input
                      type="number"
                      value={newIncidentForm.affectedUsers}
                      onChange={(e) => setNewIncidentForm({
                        ...newIncidentForm,
                        affectedUsers: parseInt(e.target.value) || 0
                      })}
                      placeholder="Number of affected users"
                    />
                  </div>
                  <Button onClick={handleCreateIncident} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Incident
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 