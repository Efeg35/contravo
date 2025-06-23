'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// RadioGroup yerine basit HTML radio input kullanacağız
import { ArrowLeft, Users, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  _count: {
    members: number
  }
}

interface WorkflowTemplate {
  id: string
  name: string
  description?: string
}

export default function NewStepPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    order: 1,
    assignmentType: '', // 'team', 'role' veya 'dynamic'
    teamId: '',
    approverRole: ''
  })

  const roles = [
    { value: 'ADMIN', label: 'Yönetici' },
    { value: 'EDITOR', label: 'Düzenleyici' },
    { value: 'VIEWER', label: 'Görüntüleyici' }
  ]

  const fetchData = useCallback(async () => {
    try {
      // Template bilgilerini ve mevcut adımları al
      const [templateResponse, teamsResponse] = await Promise.all([
        fetch(`/api/admin/workflow-templates/${templateId}`),
        fetch('/api/admin/teams')
      ])

      if (templateResponse.ok) {
        const templateData = await templateResponse.json()
        setTemplate(templateData)
      }

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData)
      }

      // Mevcut adımları al ve sonraki sırayı belirle
      const stepsResponse = await fetch(`/api/admin/workflow-templates/${templateId}/steps`)
      if (stepsResponse.ok) {
        const steps = await stepsResponse.json()
        const nextOrder = steps.length > 0 ? Math.max(...steps.map((s: { order: number }) => s.order)) + 1 : 1
        setFormData(prev => ({ ...prev, order: nextOrder }))
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Veriler yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchData()
  }, [session, status, templateId, router, fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.assignmentType) {
        toast.error('Atama türü seçilmelidir')
        return
      }

      if (formData.assignmentType === 'team' && !formData.teamId) {
        toast.error('Takım seçilmelidir')
        return
      }

      if (formData.assignmentType === 'role' && !formData.approverRole) {
        toast.error('Rol seçilmelidir')
        return
      }

      const requestData = {
        order: formData.order,
        teamId: formData.assignmentType === 'team' ? formData.teamId : null,
        approverRole: formData.assignmentType === 'role' ? formData.approverRole : null,
        isDynamicApprover: formData.assignmentType === 'dynamic',
      }

      const response = await fetch(`/api/admin/workflow-templates/${templateId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        toast.success('Adım başarıyla eklendi')
        router.push(`/dashboard/admin/workflows`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Adım eklenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Adım eklenirken hata:', error)
      toast.error('Adım eklenirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
  }

  if (!template) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Şablon bulunamadı</h1>
          <Link href="/dashboard/admin/workflows">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/dashboard/admin/workflows">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Şablonlara Dön
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Yeni Onay Adımı Ekle</CardTitle>
          <CardDescription>
            "{template.name}" şablonu için yeni bir onay adımı ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="order">Adım Sırası</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Bu adımın onay akışındaki sırası
              </p>
            </div>

            <div>
              <Label>Onaylayıcı Atama Türü</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="team"
                    name="assignmentType"
                    value="team"
                    checked={formData.assignmentType === 'team'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      assignmentType: e.target.value,
                      teamId: '',
                      approverRole: ''
                    }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="team" className="flex items-center space-x-2 cursor-pointer">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Belirli bir takıma ata</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="role"
                    name="assignmentType"
                    value="role"
                    checked={formData.assignmentType === 'role'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      assignmentType: e.target.value,
                      teamId: '',
                      approverRole: ''
                    }))}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <Label htmlFor="role" className="flex items-center space-x-2 cursor-pointer">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span>Belirli bir role ata</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="dynamic"
                    name="assignmentType"
                    value="dynamic"
                    checked={formData.assignmentType === 'dynamic'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      assignmentType: e.target.value,
                      teamId: '',
                      approverRole: ''
                    }))}
                    className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <Label htmlFor="dynamic" className="flex items-center space-x-2 cursor-pointer">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                    <span>Onaycı, sözleşmeyi başlatanın yöneticisi olsun</span>
                  </Label>
                </div>
              </div>
            </div>

            {formData.assignmentType === 'team' && (
              <div>
                <Label htmlFor="teamId">Takım Seçin</Label>
                <Select value={formData.teamId} onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir takım seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team._count.members} üye)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  Bu takımdaki herhangi bir üye bu adımı onaylayabilir
                </p>
              </div>
            )}

            {formData.assignmentType === 'role' && (
              <div>
                <Label htmlFor="approverRole">Rol Seçin</Label>
                <Select value={formData.approverRole} onValueChange={(value) => setFormData(prev => ({ ...prev, approverRole: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir rol seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  Bu role sahip herhangi bir kullanıcı bu adımı onaylayabilir
                </p>
              </div>
            )}

            {/* Dinamik onaycı seçildiyse bilgi mesajı */}
            {formData.assignmentType === 'dynamic' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-800 text-sm mt-2">
                Bu adımda onaycı, sözleşmeyi başlatan kullanıcının yöneticisi (manager) olacaktır.
              </div>
            )}

            <div className="flex items-center space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.assignmentType}
              >
                {isSubmitting ? 'Ekleniyor...' : 'Adımı Ekle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 