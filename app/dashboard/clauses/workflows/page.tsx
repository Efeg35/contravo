'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Workflow, 
  ArrowLeft,
  Plus,
  Play,
  Save,
  Copy,
  Trash2,
  Settings,
  Users,
  GitBranch,
  Zap,
  CheckCircle,
  Diamond,
  Circle,
  Square,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';

// Types
interface WorkflowNode {
  id: string;
  type: 'start' | 'approval' | 'condition' | 'action' | 'end';
  title: string;
  description?: string;
  position: { x: number; y: number };
  config: {
    assignees?: string[];
    approvalType?: 'any' | 'majority' | 'all';
    timeLimit?: number;
    escalation?: {
      enabled: boolean;
      afterHours: number;
      escalateTo: string[];
    };
  };
  connections: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
}

const WorkflowDesignerPage = () => {
  const router = useRouter();
  
  // State
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [designerMode, setDesignerMode] = useState(false);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [newWorkflowModalOpen, setNewWorkflowModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  // Node templates
  const nodeTemplates = [
    {
      type: 'approval',
      title: 'Onay Adımı',
      icon: CheckCircle,
      color: 'bg-blue-100 text-blue-600',
      description: 'Kullanıcı onayı gerektirir'
    },
    {
      type: 'condition',
      title: 'Koşul',
      icon: Diamond,
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Koşullu dallanma'
    },
    {
      type: 'action',
      title: 'Aksiyon',
      icon: Zap,
      color: 'bg-green-100 text-green-600',
      description: 'Otomatik işlem'
    }
  ];

  // Approval types
  const approvalTypes = [
    { value: 'any', label: 'Herhangi Biri', description: 'Bir kişi onaylarsa yeterli' },
    { value: 'majority', label: 'Çoğunluk', description: 'Yarıdan fazlası onaylamalı' },
    { value: 'all', label: 'Tümü', description: 'Herkes onaylamalı' }
  ];

  // Mock users
  const mockUsers = [
    { id: '1', name: 'Ahmet Yılmaz', role: 'Hukuk Müdürü' },
    { id: '2', name: 'Ayşe Demir', role: 'Genel Müdür' },
    { id: '3', name: 'Mehmet Kaya', role: 'İK Uzmanı' },
    { id: '4', name: 'Fatma Özkan', role: 'Mali İşler' }
  ];

  // Fetch workflows
  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const mockWorkflows: WorkflowTemplate[] = [
        {
          id: '1',
          name: 'Standart Clause Onayı',
          description: 'Yeni clause\'lar için standart onay süreci',
          category: 'approval',
          isSystem: true,
          usageCount: 45,
          createdAt: '2024-01-01T00:00:00Z',
          nodes: [
            {
              id: 'start',
              type: 'start',
              title: 'Başlangıç',
              position: { x: 100, y: 100 },
              config: {},
              connections: ['approval1']
            },
            {
              id: 'approval1',
              type: 'approval',
              title: 'Hukuk Onayı',
              position: { x: 300, y: 100 },
              config: {
                assignees: ['1'],
                approvalType: 'any',
                timeLimit: 24,
                escalation: {
                  enabled: true,
                  afterHours: 48,
                  escalateTo: ['2']
                }
              },
              connections: ['condition1']
            },
            {
              id: 'condition1',
              type: 'condition',
              title: 'Risk Değerlendirmesi',
              position: { x: 500, y: 100 },
              config: {},
              connections: ['approval2', 'end']
            },
            {
              id: 'approval2',
              type: 'approval',
              title: 'Genel Müdür Onayı',
              position: { x: 700, y: 50 },
              config: {
                assignees: ['2'],
                approvalType: 'any',
                timeLimit: 72
              },
              connections: ['end']
            },
            {
              id: 'end',
              type: 'end',
              title: 'Tamamlandı',
              position: { x: 700, y: 200 },
              config: {},
              connections: []
            }
          ]
        },
        {
          id: '2',
          name: 'Hızlı Onay',
          description: 'Düşük riskli clause\'lar için hızlı onay',
          category: 'approval',
          isSystem: false,
          usageCount: 28,
          createdAt: '2024-01-05T00:00:00Z',
          nodes: [
            {
              id: 'start',
              type: 'start',
              title: 'Başlangıç',
              position: { x: 100, y: 100 },
              config: {},
              connections: ['approval1']
            },
            {
              id: 'approval1',
              type: 'approval',
              title: 'Uzman Onayı',
              position: { x: 300, y: 100 },
              config: {
                assignees: ['3', '4'],
                approvalType: 'any',
                timeLimit: 12
              },
              connections: ['end']
            },
            {
              id: 'end',
              type: 'end',
              title: 'Tamamlandı',
              position: { x: 500, y: 100 },
              config: {},
              connections: []
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

  // Create new workflow
  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    
    const newWorkflow: WorkflowTemplate = {
      id: Date.now().toString(),
      name: newWorkflowName,
      description: newWorkflowDescription,
      category: 'custom',
      isSystem: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      nodes: [
        {
          id: 'start',
          type: 'start',
          title: 'Başlangıç',
          position: { x: 100, y: 200 },
          config: {},
          connections: []
        },
        {
          id: 'end',
          type: 'end',
          title: 'Tamamlandı',
          position: { x: 600, y: 200 },
          config: {},
          connections: []
        }
      ]
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setNodes(newWorkflow.nodes);
    setDesignerMode(true);
    setNewWorkflowName('');
    setNewWorkflowDescription('');
    setNewWorkflowModalOpen(false);
  };

  // Open workflow in designer
  const handleEditWorkflow = (workflow: WorkflowTemplate) => {
    setSelectedWorkflow(workflow);
    setNodes(workflow.nodes);
    setDesignerMode(true);
  };

  // Get node color
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-100 text-green-600 border-green-300';
      case 'approval': return 'bg-blue-100 text-blue-600 border-blue-300';
      case 'condition': return 'bg-yellow-100 text-yellow-600 border-yellow-300';
      case 'action': return 'bg-purple-100 text-purple-600 border-purple-300';
      case 'end': return 'bg-red-100 text-red-600 border-red-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  // Get node icon
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start': return Circle;
      case 'approval': return CheckCircle;
      case 'condition': return Diamond;
      case 'action': return Zap;
      case 'end': return Square;
      default: return Circle;
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Workflow'lar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (designerMode && selectedWorkflow) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Designer Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setDesignerMode(false)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{selectedWorkflow.name}</h1>
              <p className="text-sm text-gray-600">{selectedWorkflow.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Test Et
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Node Palette */}
          <div className="w-64 bg-white border-r p-4">
            <h3 className="font-medium mb-4">Workflow Bileşenleri</h3>
            <div className="space-y-2">
              {nodeTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.type}
                    className={`p-3 rounded-lg border-2 border-dashed cursor-pointer hover:border-solid transition-all ${template.color}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{template.title}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">{template.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-auto">
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />

            {/* Nodes */}
            {nodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              return (
                <div
                  key={node.id}
                  className={`absolute w-32 h-20 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${getNodeColor(node.type)} ${
                    selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y
                  }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="p-2 h-full flex flex-col items-center justify-center text-center">
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{node.title}</span>
                  </div>
                </div>
              );
            })}

            {/* Connections */}
            {nodes.map((node) =>
              node.connections.map((targetId) => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                
                const startX = node.position.x + 64;
                const startY = node.position.y + 40;
                const endX = target.position.x + 64;
                const endY = target.position.y + 40;
                
                return (
                  <svg
                    key={`${node.id}-${targetId}`}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#6B7280"
                        />
                      </marker>
                    </defs>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#6B7280"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  </svg>
                );
              })
            )}
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-80 bg-white border-l p-4">
              <h3 className="font-medium mb-4">Özellikler</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Başlık</label>
                  <Input
                    value={selectedNode.title}
                    onChange={(e) => {
                      setSelectedNode(prev => prev ? { ...prev, title: e.target.value } : null);
                      setNodes(prev => prev.map(n => 
                        n.id === selectedNode.id ? { ...n, title: e.target.value } : n
                      ));
                    }}
                  />
                </div>

                {selectedNode.type === 'approval' && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Onaylayıcılar</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Kullanıcı seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Onay Tipi</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Onay tipini seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {approvalTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Süre Limiti (saat)</label>
                      <Input type="number" placeholder="24" />
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Koşul</label>
                    <div className="space-y-2">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Alan seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="risk_level">Risk Seviyesi</SelectItem>
                          <SelectItem value="amount">Tutar</SelectItem>
                          <SelectItem value="category">Kategori</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Operatör..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Eşittir</SelectItem>
                          <SelectItem value="greater_than">Büyüktür</SelectItem>
                          <SelectItem value="less_than">Küçüktür</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Değer..." />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
              <Workflow className="h-6 w-6 text-blue-600" />
              İş Akışı Tasarımı
            </h1>
            <p className="text-gray-600">
              Clause onay süreçleri için özelleştirilebilir iş akışları
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={newWorkflowModalOpen} onOpenChange={setNewWorkflowModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Yeni İş Akışı
              </Button>
            </DialogTrigger>
                    <DialogContent className="backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Yeni İş Akışı Oluştur</DialogTitle>
            <DialogDescription>
              Clause onay süreci için yeni bir iş akışı tasarlayın
            </DialogDescription>
          </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">İş Akışı Adı</label>
                  <Input
                    placeholder="İş akışı adını girin..."
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Açıklama</label>
                  <Textarea
                    placeholder="İş akışı açıklaması..."
                    value={newWorkflowDescription}
                    onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setNewWorkflowModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleCreateWorkflow}>
                    Oluştur
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Workflow Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-blue-600" />
                    {workflow.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {workflow.description}
                  </CardDescription>
                </div>
                {workflow.isSystem && (
                  <Badge variant="outline" className="text-xs">
                    Sistem
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-gray-400" />
                    <span>{workflow.nodes.length} adım</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{workflow.usageCount} kullanım</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs">
                    {workflow.nodes.slice(0, 4).map((node, index) => (
                      <React.Fragment key={node.id}>
                        <div className={`px-2 py-1 rounded text-xs ${getNodeColor(node.type)}`}>
                          {node.title}
                        </div>
                        {index < Math.min(workflow.nodes.length - 1, 3) && (
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                        )}
                      </React.Fragment>
                    ))}
                    {workflow.nodes.length > 4 && (
                      <MoreHorizontal className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditWorkflow(workflow)}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log('Copy workflow:', workflow.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  {!workflow.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log('Delete workflow:', workflow.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkflowDesignerPage; 