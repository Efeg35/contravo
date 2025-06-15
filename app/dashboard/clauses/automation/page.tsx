'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Zap, 
  ArrowLeft,
  Plus,
  Clock,
  Bell,
  Mail,
  CheckCircle,
  Edit,
  Trash2,
  ArrowUp,
  Target,
  Timer
} from 'lucide-react';

// Types
interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'escalation' | 'notification' | 'completion' | 'reminder';
  isActive: boolean;
  trigger: {
    event: string;
    condition?: string;
    timeDelay?: number;
    timeUnit?: 'minutes' | 'hours' | 'days';
  };
  actions: Array<{
    type: 'email' | 'escalate' | 'assign' | 'notify' | 'complete';
    target: string[];
    template?: string;
    message?: string;
  }>;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
  successRate: number;
}

interface EscalationRule {
  id: string;
  workflowStep: string;
  timeLimit: number;
  timeUnit: 'hours' | 'days';
  escalateTo: string[];
  notificationTemplate: string;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const AutomationPage = () => {
  const router = useRouter();
  
  // State
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'rules' | 'escalation' | 'notifications'>('rules');
  const [newRuleModalOpen, setNewRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [newRuleType, setNewRuleType] = useState<string>('notification');

  // Fetch automation data
  const fetchAutomationData = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Geciken Onaylar için Eskalasyon',
          description: 'Onay adımı 24 saat geçerse üst yöneticiye eskalasyon',
          type: 'escalation',
          isActive: true,
          trigger: {
            event: 'step_overdue',
            timeDelay: 24,
            timeUnit: 'hours'
          },
          actions: [
            {
              type: 'escalate',
              target: ['2'],
              template: 'escalation_template'
            },
            {
              type: 'email',
              target: ['1', '2'],
              message: 'Clause onay süreci gecikmiş durumda. Lütfen kontrol ediniz.'
            }
          ],
          createdAt: '2024-01-10T10:00:00Z',
          lastTriggered: '2024-01-15T14:30:00Z',
          triggerCount: 12,
          successRate: 95
        },
        {
          id: '2',
          name: 'Süreç Tamamlama Bildirimi',
          description: 'Clause onay süreci tamamlandığında ilgili kişileri bilgilendir',
          type: 'completion',
          isActive: true,
          trigger: {
            event: 'workflow_completed'
          },
          actions: [
            {
              type: 'email',
              target: ['1', '3', '4'],
              template: 'completion_template'
            },
            {
              type: 'notify',
              target: ['creator'],
              message: 'Clause onay süreciniz başarıyla tamamlanmıştır.'
            }
          ],
          createdAt: '2024-01-08T15:00:00Z',
          lastTriggered: '2024-01-15T16:45:00Z',
          triggerCount: 28,
          successRate: 100
        },
        {
          id: '3',
          name: 'Günlük Hatırlatma',
          description: 'Bekleyen onaylar için günlük hatırlatma e-postası',
          type: 'reminder',
          isActive: true,
          trigger: {
            event: 'daily_reminder',
            timeDelay: 1,
            timeUnit: 'days'
          },
          actions: [
            {
              type: 'email',
              target: ['assignees'],
              template: 'reminder_template'
            }
          ],
          createdAt: '2024-01-05T09:00:00Z',
          lastTriggered: '2024-01-15T09:00:00Z',
          triggerCount: 45,
          successRate: 98
        },
        {
          id: '4',
          name: 'Yüksek Öncelik Bildirimi',
          description: 'Yüksek öncelikli clause\'lar için anında bildirim',
          type: 'notification',
          isActive: true,
          trigger: {
            event: 'high_priority_created',
            condition: 'priority >= high'
          },
          actions: [
            {
              type: 'notify',
              target: ['1', '2'],
              message: 'Yüksek öncelikli clause onaya gönderildi.'
            }
          ],
          createdAt: '2024-01-12T11:00:00Z',
          lastTriggered: '2024-01-15T10:15:00Z',
          triggerCount: 8,
          successRate: 100
        }
      ];

      const mockEscalationRules: EscalationRule[] = [
        {
          id: '1',
          workflowStep: 'hukuk_onay',
          timeLimit: 24,
          timeUnit: 'hours',
          escalateTo: ['2'],
          notificationTemplate: 'Hukuk onayı 24 saati geçmiştir. Lütfen kontrol ediniz.',
          isActive: true,
          priority: 'high'
        },
        {
          id: '2',
          workflowStep: 'genel_mudur_onay',
          timeLimit: 3,
          timeUnit: 'days',
          escalateTo: ['2'],
          notificationTemplate: 'Genel müdür onayı 3 günü geçmiştir.',
          isActive: true,
          priority: 'urgent'
        }
      ];
      
      setAutomationRules(mockRules);
      setEscalationRules(mockEscalationRules);
    } catch (error) {
      console.error('Otomasyon verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle rule status
  const toggleRuleStatus = (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  // Create new rule
  const handleCreateRule = () => {
    if (!newRuleName.trim()) return;
    
    const newRule: AutomationRule = {
      id: Date.now().toString(),
      name: newRuleName,
      description: newRuleDescription,
      type: newRuleType as any,
      isActive: true,
      trigger: {
        event: 'custom_event'
      },
      actions: [],
      createdAt: new Date().toISOString(),
      triggerCount: 0,
      successRate: 0
    };
    
    setAutomationRules(prev => [...prev, newRule]);
    setNewRuleName('');
    setNewRuleDescription('');
    setNewRuleType('notification');
    setNewRuleModalOpen(false);
  };

  // Get rule type color
  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'escalation': return 'bg-red-100 text-red-800';
      case 'notification': return 'bg-blue-100 text-blue-800';
      case 'completion': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get rule type icon
  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'escalation': return <ArrowUp className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'completion': return <CheckCircle className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Otomasyon kuralları yükleniyor...</p>
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
              <Zap className="h-6 w-6 text-blue-600" />
              İş Akışı Otomasyonu
            </h1>
            <p className="text-gray-600">
              Clause onay süreçleri için otomatik kurallar ve eskalasyonlar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={newRuleModalOpen} onOpenChange={setNewRuleModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kural
              </Button>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Yeni Otomasyon Kuralı</DialogTitle>
                <DialogDescription>
                  İş akışı süreçleri için yeni bir otomasyon kuralı oluşturun
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Kural Adı</label>
                  <Input
                    placeholder="Kural adını girin..."
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Açıklama</label>
                  <Textarea
                    placeholder="Kural açıklaması..."
                    value={newRuleDescription}
                    onChange={(e) => setNewRuleDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Kural Tipi</label>
                  <Select value={newRuleType} onValueChange={setNewRuleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification">Bildirim</SelectItem>
                      <SelectItem value="escalation">Eskalasyon</SelectItem>
                      <SelectItem value="completion">Tamamlama</SelectItem>
                      <SelectItem value="reminder">Hatırlatma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setNewRuleModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleCreateRule}>
                    Oluştur
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktif Kurallar</p>
                <p className="text-xl font-bold">{automationRules.filter(r => r.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Tetikleme</p>
                <p className="text-xl font-bold text-green-600">
                  {automationRules.reduce((sum, r) => sum + r.triggerCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Başarı Oranı</p>
                <p className="text-xl font-bold text-purple-600">
                  {Math.round(automationRules.reduce((sum, r) => sum + r.successRate, 0) / automationRules.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Timer className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Zaman Tasarrufu</p>
                <p className="text-xl font-bold text-orange-600">~4.2 saat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b">
        <button
          className={`pb-2 px-1 border-b-2 transition-colors ${
            selectedTab === 'rules' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('rules')}
        >
          Otomasyon Kuralları
        </button>
        <button
          className={`pb-2 px-1 border-b-2 transition-colors ${
            selectedTab === 'escalation' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('escalation')}
        >
          Eskalasyon Kuralları
        </button>
        <button
          className={`pb-2 px-1 border-b-2 transition-colors ${
            selectedTab === 'notifications' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('notifications')}
        >
          Bildirim Şablonları
        </button>
      </div>

      {/* Automation Rules Tab */}
      {selectedTab === 'rules' && (
        <div className="space-y-4">
          {automationRules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getRuleTypeIcon(rule.type)}
                        {rule.name}
                      </CardTitle>
                      <Badge className={getRuleTypeColor(rule.type)}>
                        {rule.type === 'escalation' ? 'Eskalasyon' :
                         rule.type === 'notification' ? 'Bildirim' :
                         rule.type === 'completion' ? 'Tamamlama' : 'Hatırlatma'}
                      </Badge>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {rule.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRuleStatus(rule.id)}
                    />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Tetikleme Koşulu</h4>
                    <div className="text-sm text-gray-600">
                      <div>Olay: {rule.trigger.event}</div>
                      {rule.trigger.timeDelay && (
                        <div>Süre: {rule.trigger.timeDelay} {rule.trigger.timeUnit}</div>
                      )}
                      {rule.trigger.condition && (
                        <div>Koşul: {rule.trigger.condition}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Aksiyonlar</h4>
                    <div className="space-y-1">
                      {rule.actions.map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action.type === 'email' ? 'E-posta' :
                           action.type === 'escalate' ? 'Eskalasyon' :
                           action.type === 'notify' ? 'Bildirim' : 'Atama'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">İstatistikler</h4>
                    <div className="text-sm text-gray-600">
                      <div>Tetikleme: {rule.triggerCount} kez</div>
                      <div>Başarı: %{rule.successRate}</div>
                      {rule.lastTriggered && (
                        <div>Son: {new Date(rule.lastTriggered).toLocaleDateString('tr-TR')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Escalation Rules Tab */}
      {selectedTab === 'escalation' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eskalasyon Kuralları</CardTitle>
              <CardDescription>
                Süre aşımı durumlarında otomatik eskalasyon kuralları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {escalationRules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{rule.workflowStep}</h4>
                        <Badge className={
                          rule.priority === 'urgent' ? 'bg-red-500 text-white' :
                          rule.priority === 'high' ? 'bg-orange-500 text-white' :
                          rule.priority === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }>
                          {rule.priority === 'urgent' ? 'Acil' :
                           rule.priority === 'high' ? 'Yüksek' :
                           rule.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </Badge>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.isActive} />
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Süre Limiti:</span> {rule.timeLimit} {rule.timeUnit}
                      </div>
                      <div>
                        <span className="font-medium">Eskalasyon:</span> {rule.escalateTo.length} kişi
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <span className="font-medium">Bildirim Şablonu:</span>
                      <p className="mt-1 text-gray-600">{rule.notificationTemplate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Templates Tab */}
      {selectedTab === 'notifications' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Şablonları</CardTitle>
              <CardDescription>
                E-posta ve sistem bildirimleri için özelleştirilebilir şablonlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      E-posta Şablonları
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Eskalasyon Bildirimi</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Süre aşımı durumlarında gönderilen e-posta şablonu
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                      </div>
                      
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Tamamlama Bildirimi</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Süreç tamamlandığında gönderilen e-posta şablonu
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                      </div>
                      
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Günlük Hatırlatma</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Bekleyen işler için günlük hatırlatma e-postası
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5 text-green-600" />
                      Sistem Bildirimleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Yeni Görev Bildirimi</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Yeni onay görevi atandığında gösterilen bildirim
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                      </div>
                      
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Süre Uyarısı</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Görev süresi dolmak üzereyken gösterilen uyarı
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                      </div>
                      
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Başarı Bildirimi</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Görev başarıyla tamamlandığında gösterilen bildirim
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AutomationPage; 