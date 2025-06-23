'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Edit, Trash2, Users, UserCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  _count: {
    steps: number
  }
}

interface WorkflowTemplateStep {
  id: string
  order: number
  teamId?: string
  approverRole?: string
  team?: {
    id: string
    name: string
  }
}

export default function WorkflowTemplatesPage() {
  const { data: session, status } = useSession()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templateSteps, setTemplateSteps] = useState<WorkflowTemplateStep[]>([])
  const [isStepsModalOpen, setIsStepsModalOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
    
    if (session?.user?.role !== 'ADMIN') {
      redirect('/dashboard')
    }
    
    fetchTemplates()
  }, [session, status])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/workflow-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Şablonları yüklerken hata:', error)
      toast.error('Şablonlar yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/workflow-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Şablon başarıyla oluşturuldu')
        setIsCreateModalOpen(false)
        setFormData({ name: '', description: '' })
        fetchTemplates()
      } else {
        toast.error('Şablon oluşturulurken bir hata oluştu')
      }
    } catch (error) {
      console.error('Şablon oluştururken hata:', error)
      toast.error('Şablon oluşturulurken bir hata oluştu')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/workflow-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Şablon başarıyla silindi')
        fetchTemplates()
      } else {
        toast.error('Şablon silinirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Şablon silerken hata:', error)
      toast.error('Şablon silinirken bir hata oluştu')
    }
  }

  const fetchTemplateSteps = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/workflow-templates/${templateId}/steps`)
      if (response.ok) {
        const data = await response.json()
        setTemplateSteps(data)
        setSelectedTemplate(templateId)
        setIsStepsModalOpen(true)
      }
    } catch (error) {
      console.error('Şablon adımları yüklenirken hata:', error)
      toast.error('Şablon adımları yüklenirken bir hata oluştu')
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onay Akışı Şablonları</h1>
          <p className="text-gray-600 mt-2">
            Farklı sözleşme türleri için standart onay adımlarını yönetin
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Şablon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Onay Akışı Şablonu</DialogTitle>
              <DialogDescription>
                Yeni bir onay akışı şablonu oluşturun. Daha sonra adımları ekleyebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTemplate}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Şablon Adı</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Pazarlama Ajansı Sözleşmesi Akışı"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Bu şablonun ne için kullanıldığını açıklayın..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz onay akışı şablonu bulunmuyor
              </h3>
              <p className="text-gray-600 mb-4">
                İlk şablonunuzu oluşturarak başlayın
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Şablonu Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {template._count.steps} adım
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Oluşturulma: {new Date(template.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchTemplateSteps(template.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Adımları Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Adımları Düzenleme Modal'ı */}
      <Dialog open={isStepsModalOpen} onOpenChange={setIsStepsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Onay Akışı Adımları</DialogTitle>
            <DialogDescription>
              Bu şablon için onay adımlarını yönetin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {templateSteps.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz adım bulunmuyor
                </h3>
                <p className="text-gray-600 mb-4">
                  İlk onay adımını ekleyerek başlayın
                </p>
                <Button onClick={() => {
                  setIsStepsModalOpen(false)
                  window.location.href = `/dashboard/admin/workflows/${selectedTemplate}/steps/new`
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Adımı Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {templateSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Badge>{index + 1}. Adım</Badge>
                    </div>
                    <div className="flex-1">
                      {step.teamId ? (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Takım:</span>
                          <span>{step.team?.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Rol:</span>
                          <span>{step.approverRole}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-6">
                  <Button onClick={() => {
                    setIsStepsModalOpen(false)
                    window.location.href = `/dashboard/admin/workflows/${selectedTemplate}/steps/new`
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Adım Ekle
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 