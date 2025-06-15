'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Avatar components removed as unused
import { 
  Activity, 
  ArrowLeft,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  User,
  Calendar,
  MessageSquare,
  Eye,
  RefreshCw
} from 'lucide-react';

// Types
interface WorkflowStep {
  id: string;
  title: string;
  type: 'approval' | 'condition' | 'action';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'overdue';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  timeSpent?: number;
  comments?: number;
}

interface WorkflowInstance {
  id: string;
  clauseId: string;
  clauseTitle: string;
  workflowName: string;
  status: 'active' | 'completed' | 'rejected' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  currentStep: string;
  steps: WorkflowStep[];
  progress: number;
  estimatedCompletion?: string;
  actualCompletion?: string;
  overdueSteps: number;
}

const WorkflowTrackingPage = () => {
  const router = useRouter();
  
  // State
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch workflow instances
  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockWorkflows: WorkflowInstance[] = [
        {
          id: '1',
          clauseId: 'clause-1',
          clauseTitle: 'Yeni Gizlilik Maddesi',
          workflowName: 'Standart Clause Onayı',
          status: 'active',
          priority: 'high',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T14:30:00Z',
          createdBy: {
            id: '1',
            name: 'Ahmet Yılmaz'
          },
          currentStep: 'step2',
          progress: 60,
          estimatedCompletion: '2024-01-17T17:00:00Z',
          overdueSteps: 1,
          steps: [
            {
              id: 'step1',
              title: 'Hukuk İncelemesi',
              type: 'approval',
              status: 'completed',
              assignee: {
                id: '2',
                name: 'Ayşe Demir'
              },
              startedAt: '2024-01-15T09:00:00Z',
              completedAt: '2024-01-15T11:30:00Z',
              dueDate: '2024-01-15T17:00:00Z',
              timeSpent: 150,
              comments: 2
            },
            {
              id: 'step2',
              title: 'Risk Değerlendirmesi',
              type: 'approval',
              status: 'overdue',
              assignee: {
                id: '3',
                name: 'Mehmet Kaya'
              },
              startedAt: '2024-01-15T11:30:00Z',
              dueDate: '2024-01-15T17:00:00Z',
              timeSpent: 180,
              comments: 0
            },
            {
              id: 'step3',
              title: 'Genel Müdür Onayı',
              type: 'approval',
              status: 'pending',
              assignee: {
                id: '4',
                name: 'Fatma Özkan'
              },
              dueDate: '2024-01-16T17:00:00Z'
            }
          ]
        },
        {
          id: '2',
          clauseId: 'clause-2',
          clauseTitle: 'Ödeme Koşulları Güncellemesi',
          workflowName: 'Hızlı Onay',
          status: 'active',
          priority: 'medium',
          createdAt: '2024-01-14T14:00:00Z',
          updatedAt: '2024-01-15T10:15:00Z',
          createdBy: {
            id: '2',
            name: 'Ayşe Demir'
          },
          currentStep: 'step1',
          progress: 30,
          estimatedCompletion: '2024-01-16T12:00:00Z',
          overdueSteps: 0,
          steps: [
            {
              id: 'step1',
              title: 'Mali İşler Onayı',
              type: 'approval',
              status: 'in_progress',
              assignee: {
                id: '5',
                name: 'Ali Veli'
              },
              startedAt: '2024-01-15T09:00:00Z',
              dueDate: '2024-01-15T21:00:00Z',
              timeSpent: 75,
              comments: 1
            },
            {
              id: 'step2',
              title: 'Tamamlandı',
              type: 'action',
              status: 'pending'
            }
          ]
        },
        {
          id: '3',
          clauseId: 'clause-3',
          clauseTitle: 'Fesih Şartları',
          workflowName: 'Standart Clause Onayı',
          status: 'completed',
          priority: 'low',
          createdAt: '2024-01-12T10:00:00Z',
          updatedAt: '2024-01-14T16:45:00Z',
          createdBy: {
            id: '3',
            name: 'Mehmet Kaya'
          },
          currentStep: 'completed',
          progress: 100,
          actualCompletion: '2024-01-14T16:45:00Z',
          overdueSteps: 0,
          steps: [
            {
              id: 'step1',
              title: 'Hukuk İncelemesi',
              type: 'approval',
              status: 'completed',
              assignee: {
                id: '2',
                name: 'Ayşe Demir'
              },
              startedAt: '2024-01-12T10:00:00Z',
              completedAt: '2024-01-12T15:30:00Z',
              dueDate: '2024-01-12T18:00:00Z',
              timeSpent: 330,
              comments: 3
            },
            {
              id: 'step2',
              title: 'Genel Müdür Onayı',
              type: 'approval',
              status: 'completed',
              assignee: {
                id: '4',
                name: 'Fatma Özkan'
              },
              startedAt: '2024-01-13T09:00:00Z',
              completedAt: '2024-01-14T16:45:00Z',
              dueDate: '2024-01-14T18:00:00Z',
              timeSpent: 1905,
              comments: 1
            }
          ]
        }
      ];
      
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Workflow\'lar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter workflows
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.clauseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || workflow.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get step status icon
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Format time spent
  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  // Auto refresh
  useEffect(() => {
    fetchWorkflows();
    
    if (autoRefresh) {
      const interval = setInterval(fetchWorkflows, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">İş akışları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              İş Akışı Takibi
            </h1>
            <p className="text-gray-600">
              Clause onay süreçlerinin gerçek zamanlı takibi
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Otomatik Yenileme
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflows}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktif İş Akışı</p>
                <p className="text-xl font-bold">{workflows.filter(w => w.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Geciken Adımlar</p>
                <p className="text-xl font-bold text-red-600">
                  {workflows.reduce((sum, w) => sum + w.overdueSteps, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tamamlanan</p>
                <p className="text-xl font-bold text-green-600">
                  {workflows.filter(w => w.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ortalama Süre</p>
                <p className="text-xl font-bold text-purple-600">2.5 gün</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="İş akışı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="completed">Tamamlanan</SelectItem>
            <SelectItem value="rejected">Reddedilen</SelectItem>
            <SelectItem value="paused">Duraklatılan</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            <SelectItem value="urgent">Acil</SelectItem>
            <SelectItem value="high">Yüksek</SelectItem>
            <SelectItem value="medium">Orta</SelectItem>
            <SelectItem value="low">Düşük</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{workflow.clauseTitle}</CardTitle>
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status === 'active' ? 'Aktif' :
                       workflow.status === 'completed' ? 'Tamamlandı' :
                       workflow.status === 'rejected' ? 'Reddedildi' : 'Duraklatıldı'}
                    </Badge>
                    <Badge className={getPriorityColor(workflow.priority)}>
                      {workflow.priority === 'urgent' ? 'Acil' :
                       workflow.priority === 'high' ? 'Yüksek' :
                       workflow.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </Badge>
                    {workflow.overdueSteps > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {workflow.overdueSteps} geciken
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {workflow.workflowName} • {workflow.createdBy.name} tarafından oluşturuldu
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm">
                    <div className="font-medium">{workflow.progress}% tamamlandı</div>
                    <div className="text-gray-500">
                      {workflow.estimatedCompletion && workflow.status === 'active' && (
                        <>Tahmini: {new Date(workflow.estimatedCompletion).toLocaleDateString('tr-TR')}</>
                      )}
                      {workflow.actualCompletion && workflow.status === 'completed' && (
                        <>Tamamlandı: {new Date(workflow.actualCompletion).toLocaleDateString('tr-TR')}</>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWorkflow(selectedWorkflow?.id === workflow.id ? null : workflow)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${workflow.progress}%` }}
                ></div>
              </div>
            </CardHeader>
            
            {selectedWorkflow?.id === workflow.id && (
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium">İş Akışı Adımları</h4>
                  
                  {/* Workflow Steps */}
                  <div className="space-y-3">
                    {workflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          {getStepStatusIcon(step.status)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{step.title}</h5>
                            <Badge variant="outline" className="text-xs">
                              {step.type === 'approval' ? 'Onay' : 
                               step.type === 'condition' ? 'Koşul' : 'Aksiyon'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {step.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {step.assignee.name}
                              </div>
                            )}
                            {step.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Vade: {new Date(step.dueDate).toLocaleDateString('tr-TR')}
                              </div>
                            )}
                            {step.timeSpent && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeSpent(step.timeSpent)}
                              </div>
                            )}
                            {step.comments && step.comments > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {step.comments} yorum
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={
                              step.status === 'completed' ? 'text-green-600 border-green-200' :
                              step.status === 'in_progress' ? 'text-blue-600 border-blue-200' :
                              step.status === 'overdue' ? 'text-red-600 border-red-200' :
                              step.status === 'rejected' ? 'text-red-600 border-red-200' :
                              'text-gray-600 border-gray-200'
                            }
                          >
                            {step.status === 'completed' ? 'Tamamlandı' :
                             step.status === 'in_progress' ? 'Devam Ediyor' :
                             step.status === 'overdue' ? 'Gecikmiş' :
                             step.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">İş akışı bulunamadı</h3>
          <p className="text-gray-500">
            Arama kriterlerinize uygun aktif iş akışı bulunamadı
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkflowTrackingPage; 