'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare,
  Send,
  Eye,
  Edit,
  AlertCircle,
  CheckCheck,
  ArrowRight,
  Calendar,
  FileText
} from 'lucide-react';

// Types
interface ClauseApproval {
  id: string;
  clauseId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  requestedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  comments?: string;
  requestedAt: string;
  respondedAt?: string;
  clause: {
    id: string;
    title: string;
    category: string;
    version: number;
  };
}

interface ApprovalComment {
  id: string;
  approvalId: string;
  userId: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

interface ClauseApprovalWorkflowProps {
  clauseId?: string;
  onApprovalUpdate?: () => void;
  className?: string;
}

const ClauseApprovalWorkflow: React.FC<ClauseApprovalWorkflowProps> = ({
  clauseId,
  onApprovalUpdate,
  className
}) => {
  // State
  const [approvals, setApprovals] = useState<ClauseApproval[]>([]);
  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ClauseApproval | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_revision' | null>(null);

  // Fetch approvals
  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const url = clauseId 
        ? `/api/clauses/${clauseId}/approvals`
        : '/api/contracts/approvals';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setApprovals(data.approvals || []);
      }
    } catch (error) {
      console.error('Onaylar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for approval
  const fetchComments = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/contracts/approvals/${approvalId}/comments`);
      const data = await response.json();
      
      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Yorumlar yüklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [clauseId]);

  // Handle approval action
  const handleApprovalAction = async (approvalId: string, action: 'approve' | 'reject' | 'request_revision', comment?: string) => {
    try {
      const response = await fetch(`/api/contracts/approvals/${approvalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comment
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Approval action successful:', data);
        console.log('Updating approval with status:', data.approval.status);
        
        // Update the approval in the list
        setApprovals(prev => {
          const updated = prev.map(approval => 
            approval.id === approvalId 
              ? { 
                  ...approval, 
                  status: data.approval.status,
                  respondedAt: data.approval.respondedAt,
                  comments: comment || approval.comments
                }
              : approval
          );
          console.log('Updated approvals:', updated);
          return updated;
        });
        
        setShowCommentModal(false);
        setNewComment('');
        setSelectedApproval(null);
        setActionType(null);
        
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
      } else {
        console.error('Onay işlemi başarısız:', await response.text());
      }
    } catch (error) {
      console.error('Onay işlemi başarısız:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!selectedApproval) return;
    
    console.log('handleCommentSubmit called with actionType:', actionType);
    console.log('newComment:', newComment);
    
    // For actions, comment is required except for approve
    if (actionType && actionType !== 'approve' && !newComment.trim()) {
      console.log('Comment required but empty, returning');
      return;
    }
    
    if (actionType) {
      // Submit approval action with comment
      console.log('Submitting approval action:', actionType);
      await handleApprovalAction(selectedApproval.id, actionType, newComment);
    } else {
      // Submit just comment
      if (!newComment.trim()) return;
      
      try {
        const response = await fetch(`/api/contracts/approvals/${selectedApproval.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newComment
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Add new comment to existing comments
          setComments(prev => [...prev, data.comment]);
          setNewComment('');
        } else {
          console.error('Yorum eklenemedi:', await response.text());
        }
      } catch (error) {
        console.error('Yorum eklenemedi:', error);
      }
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'REVISION_REQUESTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Onaylandı';
      case 'REJECTED':
        return 'Reddedildi';
      case 'REVISION_REQUESTED':
        return 'Revizyon İstendi';
      case 'PENDING':
        return 'Beklemede';
      default:
        return status;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'REVISION_REQUESTED':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCheck className="h-5 w-5 text-blue-600" />
            Onay İş Akışı
          </h3>
          <p className="text-gray-600 text-sm">
            Clause onay süreçlerini takip edin ve yönetin
          </p>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Yükleniyor...</p>
          </div>
        ) : approvals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Henüz onay talebi bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          approvals.map((approval) => (
            <Card key={approval.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{approval.clause.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        v{approval.clause.version}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Talep eden: {approval.requestedBy.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        <span>Onaylayacak: {approval.assignedTo.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(approval.requestedAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(approval.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(approval.status)}
                        {getStatusText(approval.status)}
                      </div>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {approval.comments && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{approval.comments}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedApproval(approval);
                        setActionType(null); // Reset action type for comments
                        fetchComments(approval.id);
                        setShowCommentModal(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Yorumlar
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/dashboard/clauses/${approval.clauseId}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Görüntüle
                    </Button>
                  </div>
                  
                  {approval.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setActionType('request_revision');
                          fetchComments(approval.id);
                          setShowCommentModal(true);
                        }}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Revizyon İste
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setActionType('reject');
                          fetchComments(approval.id);
                          setShowCommentModal(true);
                        }}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reddet
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleApprovalAction(approval.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Onayla
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {actionType === 'approve' ? 'Clause Onaylama' :
                   actionType === 'reject' ? 'Clause Reddetme' :
                   actionType === 'request_revision' ? 'Revizyon İsteme' :
                   'Yorumlar'} - {selectedApproval.clause.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCommentModal(false);
                    setSelectedApproval(null);
                    setActionType(null);
                    setNewComment('');
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              {comments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Önceki Yorumlar</h4>
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar} />
                        <AvatarFallback>
                          {comment.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* New Comment */}
              <div className="space-y-3">
                <Label>
                  {actionType ? 'Açıklama' : 'Yeni Yorum'}
                  {actionType && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    actionType === 'approve' ? 'Onay açıklaması (opsiyonel)' :
                    actionType === 'reject' ? 'Red sebebini açıklayın' :
                    actionType === 'request_revision' ? 'Hangi değişikliklerin yapılması gerektiğini belirtin' :
                    'Yorumunuzu yazın'
                  }
                  rows={4}
                />
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentModal(false);
                    setSelectedApproval(null);
                    setActionType(null);
                    setNewComment('');
                  }}
                >
                  İptal
                </Button>
                
                <Button
                  onClick={handleCommentSubmit}
                                     disabled={!!(actionType && actionType !== 'approve' && !newComment.trim())}
                  className={
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    actionType === 'request_revision' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  {actionType === 'approve' ? 'Onayla' :
                   actionType === 'reject' ? 'Reddet' :
                   actionType === 'request_revision' ? 'Revizyon İste' :
                   'Yorum Ekle'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClauseApprovalWorkflow; 