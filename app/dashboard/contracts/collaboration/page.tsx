'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Users,
  MessageSquare,
  Edit3,
  Send,
  Plus,
  History,
  UserPlus,
  Bell,
  Save,
  FileText,
  CheckCircle2,
  Zap,
  MousePointer
} from 'lucide-react';

// Types
interface CollaborativeSession {
  id: string;
  clauseId: string;
  clauseTitle: string;
  participants: Participant[];
  activeUsers: ActiveUser[];
  comments: Comment[];
  createdAt: string;
  lastActivity: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
}

interface ActiveUser {
  id: string;
  name: string;
  cursor: {
    line: number;
    column: number;
  };
  color: string;
  lastSeen: string;
}

interface Comment {
  id: string;
  userId: string;
  user: {
    name: string;
  };
  content: string;
  position: {
    line: number;
    column: number;
  };
  resolved: boolean;
  createdAt: string;
  replies: CommentReply[];
}

interface CommentReply {
  id: string;
  userId: string;
  user: {
    name: string;
  };
  content: string;
  createdAt: string;
}

// Mock data - moved outside component to prevent re-creation on every render
const MOCK_SESSIONS: CollaborativeSession[] = [
  {
    id: '1',
    clauseId: '1',
    clauseTitle: 'Gizlilik ve Veri Koruma Maddesi',
    participants: [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        email: 'ahmet@contravo.com',
        role: 'OWNER',
        joinedAt: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        name: 'Ayşe Demir',
        email: 'ayse@contravo.com',
        role: 'EDITOR',
        joinedAt: '2024-01-15T09:15:00Z'
      },
      {
        id: '3',
        name: 'Mehmet Kaya',
        email: 'mehmet@contravo.com',
        role: 'VIEWER',
        joinedAt: '2024-01-15T10:00:00Z'
      }
    ],
    activeUsers: [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        cursor: { line: 5, column: 12 },
        color: '#3B82F6',
        lastSeen: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Ayşe Demir',
        cursor: { line: 12, column: 8 },
        color: '#EF4444',
        lastSeen: '2024-01-15T10:29:00Z'
      }
    ],
    comments: [
      {
        id: '1',
        userId: '2',
        user: {
          name: 'Ayşe Demir'
        },
        content: 'Bu bölümde KVKK uyumluluğu için ek açıklama gerekiyor.',
        position: { line: 8, column: 0 },
        resolved: false,
        createdAt: '2024-01-15T10:15:00Z',
        replies: [
          {
            id: '1',
            userId: '1',
            user: {
              name: 'Ahmet Yılmaz'
            },
            content: 'Haklısın, bu kısmı detaylandıralım.',
            createdAt: '2024-01-15T10:20:00Z'
          }
        ]
      }
    ],
    createdAt: '2024-01-15T09:00:00Z',
    lastActivity: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    clauseId: '2',
    clauseTitle: 'Sorumluluk Reddi Maddesi',
    participants: [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        email: 'ahmet@contravo.com',
        role: 'OWNER',
        joinedAt: '2024-01-14T14:00:00Z'
      },
      {
        id: '4',
        name: 'Fatma Özkan',
        email: 'fatma@contravo.com',
        role: 'EDITOR',
        joinedAt: '2024-01-14T14:30:00Z'
      }
    ],
    activeUsers: [],
    comments: [],
    createdAt: '2024-01-14T14:00:00Z',
    lastActivity: '2024-01-14T16:45:00Z'
  }
];

const CollaborationPage = () => {
  const router = useRouter();

  // State
  const [sessions, setSessions] = useState<CollaborativeSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CollaborativeSession | null>(null);
  const [clauseContent, setClauseContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState<{line: number, column: number} | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [loading, setLoading] = useState(true);

  // Initialize - fixed infinite re-render by removing dependency
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setSessions(MOCK_SESSIONS);
      setLoading(false);
    }, 1000);
  }, []); // Empty dependency array prevents re-renders

  // Handle session selection
  const handleSessionSelect = (session: CollaborativeSession) => {
    setSelectedSession(session);
    setClauseContent(`Bu madde, kişisel verilerin korunması ile ilgili detaylı düzenlemeleri içermektedir.

Taraflar, bu madde kapsamında aşağıdaki hususları kabul ederler:

1. Kişisel veriler, KVKK hükümlerine uygun olarak işlenecektir.
2. Veri güvenliği için gerekli teknik ve idari tedbirler alınacaktır.
3. Veri ihlali durumunda ilgili kişiler derhal bilgilendirilecektir.

Bu madde, Türk Hukuku'na tabi olup, İstanbul Mahkemeleri yetkilidir.`);
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setClauseContent(e.target.value);
    console.log('Content changed, syncing with other users...');
  };

  // Handle comment addition
  const handleAddComment = () => {
    if (!newComment.trim() || !commentPosition || !selectedSession) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: '1',
      user: {
        name: 'Ahmet Yılmaz'
      },
      content: newComment,
      position: commentPosition,
      resolved: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    setSelectedSession({
      ...selectedSession,
      comments: [...selectedSession.comments, comment]
    });

    setNewComment('');
    setCommentPosition(null);
  };

  // Handle invite user
  const handleInviteUser = () => {
    if (!inviteEmail.trim() || !selectedSession) return;

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString()
    };

    setSelectedSession({
      ...selectedSession,
      participants: [...selectedSession.participants, newParticipant]
    });

    setInviteEmail('');
    setShowInviteModal(false);
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'EDITOR':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Collaboration oturumları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
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
              <Users className="h-6 w-6 text-blue-600" />
              Gerçek Zamanlı İşbirliği
            </h1>
            <p className="text-gray-600">Clause'ları birlikte düzenleyin ve yorumlayın</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Bildirimler
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Oturum
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Aktif Oturumlar
              </CardTitle>
              <CardDescription>
                Devam eden collaboration oturumları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedSession?.id === session.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{session.clauseTitle}</h4>
                      <div className="flex items-center gap-1">
                        {session.activeUsers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-600">{session.activeUsers.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex -space-x-2">
                        {session.participants.slice(0, 3).map((participant) => (
                          <Avatar key={participant.id} className="w-6 h-6 border-2 border-white">
                            <AvatarFallback className="text-xs">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {session.participants.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{session.participants.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {session.participants.length} katılımcı
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Son aktivite: {new Date(session.lastActivity).toLocaleDateString('tr-TR')}</span>
                      {session.comments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{session.comments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="space-y-4">
              {/* Session Header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedSession.clauseTitle}</CardTitle>
                      <CardDescription>
                        {selectedSession.activeUsers.length > 0 ? (
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            {selectedSession.activeUsers.length} kullanıcı aktif
                          </span>
                        ) : (
                          'Şu anda aktif kullanıcı yok'
                        )}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Davet Et
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle>Kullanıcı Davet Et</DialogTitle>
                            <DialogDescription>
                              Bu collaboration oturumuna yeni kullanıcı davet edin
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">E-posta Adresi</label>
                              <Input
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="kullanici@example.com"
                                type="email"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Rol</label>
                              <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="EDITOR">Editör</option>
                                <option value="VIEWER">Görüntüleyici</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                                İptal
                              </Button>
                              <Button onClick={handleInviteUser}>
                                <Send className="h-4 w-4 mr-2" />
                                Davet Gönder
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        Geçmiş
                      </Button>
                      
                      <Button size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Active Users */}
                  {selectedSession.activeUsers.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-600">Aktif kullanıcılar:</span>
                      {selectedSession.activeUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: user.color }}
                          />
                          <span className="text-sm">{user.name}</span>
                          <MousePointer className="h-3 w-3" style={{ color: user.color }} />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Katılımcılar:</span>
                    <div className="flex items-center gap-2">
                      {selectedSession.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center gap-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <Badge className={getRoleColor(participant.role)} variant="outline">
                            {participant.role === 'OWNER' ? 'Sahip' :
                             participant.role === 'EDITOR' ? 'Editör' : 'Görüntüleyici'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Clause Editörü
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Textarea
                      value={clauseContent}
                      onChange={handleContentChange}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder="Clause içeriğini buraya yazın..."
                    />
                    
                    {/* Simulated cursors */}
                    {selectedSession.activeUsers.map((user) => (
                      <div
                        key={user.id}
                        className="absolute pointer-events-none"
                        style={{
                          top: `${user.cursor.line * 20 + 10}px`,
                          left: `${user.cursor.column * 8 + 10}px`,
                        }}
                      >
                        <div 
                          className="w-0.5 h-5 animate-pulse"
                          style={{ backgroundColor: user.color }}
                        />
                        <div 
                          className="text-xs px-1 py-0.5 rounded text-white -mt-1"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Zap className="h-4 w-4" />
                      Otomatik kaydetme aktif
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommentPosition({ line: 1, column: 0 })}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Yorum Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              {selectedSession.comments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Yorumlar ({selectedSession.comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedSession.comments.map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {comment.user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.user.name}</span>
                                <span className="text-xs text-gray-500">
                                  Satır {comment.position.line}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString('tr-TR')}
                                </span>
                                {!comment.resolved && (
                                  <Badge variant="outline" className="text-xs">
                                    Açık
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                              
                              {/* Replies */}
                              {comment.replies.length > 0 && (
                                <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="text-xs">
                                          {reply.user.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-xs">{reply.user.name}</span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(reply.createdAt).toLocaleString('tr-TR')}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-700">{reply.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2">
                                <Button variant="ghost" size="sm" className="text-xs">
                                  Yanıtla
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Çözüldü Olarak İşaretle
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Comment */}
              {commentPosition && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Yeni Yorum</CardTitle>
                    <CardDescription>
                      Satır {commentPosition.line} için yorum ekleyin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Yorumunuzu buraya yazın..."
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCommentPosition(null)}>
                          İptal
                        </Button>
                        <Button onClick={handleAddComment}>
                          <Send className="h-4 w-4 mr-2" />
                          Yorum Ekle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Collaboration Oturumu Seçin</h3>
                <p className="text-gray-500">
                  Düzenlemek için sol panelden bir oturum seçin
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage; 