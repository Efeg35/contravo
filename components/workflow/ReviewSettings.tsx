"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Plus, Edit2, Trash2 } from "lucide-react";
import { MultiUserAutocomplete } from "@/components/ui/MultiUserAutocomplete";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ReviewSettingsData {
  // Turn Tracking
  turnTracking: {
    enabled: boolean;
    defaultAssignee: 'NO_ONE' | 'INTERNAL_PARTY' | 'COUNTERPARTY';
    customAssignees: Array<{id: string; name: string; email: string; type: 'user' | 'role' | 'group'}>;
    advancedConditions: Array<{
      id: string;
      name: string;
      condition: string;
      assignee: string;
    }>;
  };
  
  // Download Permissions
  downloadPermissions: {
    type: 'BASIC' | 'ADVANCED';
    basicSettings: {
      description: string;
    };
    advancedSettings: {
      permissions: Array<{
        id: string;
        description: string;
        canModify: boolean;
      }>;
    };
    separatePdfPermissions: boolean;
  };
  
  // Share Permissions  
  sharePermissions: {
    type: 'BASIC' | 'ADVANCED';
    basicSettings: {
      description: string;
    };
    advancedSettings: {
      permissions: Array<{
        id: string;
        description: string;
        canModify: boolean;
      }>;
    };
    separatePdfPermissions: boolean;
  };
  
  // Email Template
  emailTemplate: {
    fromDisplayName: string;
    companyDisplayName: string;
    subject: string;
    bodyTemplate: string;
    tips: {
      includeEmailerName: boolean;
      includeEmailerEmail: boolean;
    };
  };
}

interface ReviewSettingsProps {
  templateId?: string;
  initialData?: Partial<ReviewSettingsData>;
  onSave?: (data: ReviewSettingsData) => void;
}

export const ReviewSettings: React.FC<ReviewSettingsProps> = ({
  templateId,
  initialData,
  onSave
}) => {
  const [settings, setSettings] = useState<ReviewSettingsData>({
    turnTracking: {
      enabled: false,
      defaultAssignee: 'NO_ONE',
      customAssignees: [],
      advancedConditions: []
    },
    downloadPermissions: {
      type: 'BASIC',
      basicSettings: {
        description: 'Everyone can always download documents'
      },
      advancedSettings: {
        permissions: [
          {
            id: '1',
            description: 'Users with Workflow Management permissions can download',
            canModify: false
          }
        ]
      },
      separatePdfPermissions: false
    },
    sharePermissions: {
      type: 'BASIC', 
      basicSettings: {
        description: 'Everyone can always share documents'
      },
      advancedSettings: {
        permissions: [
          {
            id: '1',
            description: 'Users with Workflow Management permissions can share',
            canModify: false
          }
        ]
      },
      separatePdfPermissions: false
    },
    emailTemplate: {
      fromDisplayName: 'Emailer User Name',
      companyDisplayName: 'Company External Display Name',
      subject: 'Draft contract from Company External Display Name - Please Review.',
      bodyTemplate: `Hi,

Please find the agreement attached. Thanks!

Best,
Emailer User Name`,
      tips: {
        includeEmailerName: true,
        includeEmailerEmail: true
      }
    }
  });

  const [showDownloadEditModal, setShowDownloadEditModal] = useState(false);
  const [downloadPermissionDraft, setDownloadPermissionDraft] = useState(settings.downloadPermissions.basicSettings.description);

  // Advanced download permission modal state
  const [showAddAdvancedDownloadModal, setShowAddAdvancedDownloadModal] = useState(false);
  const [advancedDownloadUsers, setAdvancedDownloadUsers] = useState<any[]>([]);
  const [advancedDownloadWhen, setAdvancedDownloadWhen] = useState('Always');

  // PDF Download Permissions State
  const [pdfPermissionsType, setPdfPermissionsType] = useState<'BASIC' | 'ADVANCED'>('BASIC');
  const [showPdfDownloadEditModal, setShowPdfDownloadEditModal] = useState(false);
  const [pdfDownloadPermissionDraft, setPdfDownloadPermissionDraft] = useState('Everyone can always download PDF documents');
  const [pdfAdvancedPermissions, setPdfAdvancedPermissions] = useState<any[]>([]);
  const [showAddPdfAdvancedDownloadModal, setShowAddPdfAdvancedDownloadModal] = useState(false);
  const [pdfAdvancedDownloadUsers, setPdfAdvancedDownloadUsers] = useState<any[]>([]);
  const [pdfAdvancedDownloadWhen, setPdfAdvancedDownloadWhen] = useState('Always');

  // Share Permissions State
  const [sharePermissionsType, setSharePermissionsType] = useState<'BASIC' | 'ADVANCED'>('BASIC');
  const [showShareEditModal, setShowShareEditModal] = useState(false);
  const [sharePermissionDraft, setSharePermissionDraft] = useState('Everyone can always share documents');
  const [advancedSharePermissions, setAdvancedSharePermissions] = useState<any[]>([]);
  const [showAddAdvancedShareModal, setShowAddAdvancedShareModal] = useState(false);
  const [advancedShareUsers, setAdvancedShareUsers] = useState<any[]>([]);
  const [advancedShareWhen, setAdvancedShareWhen] = useState('Always');

  // Share PDF Permissions State
  const [pdfSharePermissionsType, setPdfSharePermissionsType] = useState<'BASIC' | 'ADVANCED'>('BASIC');
  const [showPdfShareEditModal, setShowPdfShareEditModal] = useState(false);
  const [pdfSharePermissionDraft, setPdfSharePermissionDraft] = useState('Everyone can always share PDF documents');
  const [pdfAdvancedSharePermissions, setPdfAdvancedSharePermissions] = useState<any[]>([]);
  const [showAddPdfAdvancedShareModal, setShowAddPdfAdvancedShareModal] = useState(false);
  const [pdfAdvancedShareUsers, setPdfAdvancedShareUsers] = useState<any[]>([]);
  const [pdfAdvancedShareWhen, setPdfAdvancedShareWhen] = useState('Always');

  // Initialize with provided data
  useEffect(() => {
    if (initialData) {
      setSettings(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleSave = () => {
    onSave?.(settings);
  };

  const addAdvancedCondition = () => {
    const newCondition = {
      id: Date.now().toString(),
      name: '', // Artık name field'ını kullanmıyoruz ama interface uyumluluğu için tutuyoruz
      condition: 'Always',
      assignee: 'No one'
    };
    
    setSettings(prev => ({
      ...prev,
      turnTracking: {
        ...prev.turnTracking,
        advancedConditions: [...prev.turnTracking.advancedConditions, newCondition]
      }
    }));
  };

  const removeAdvancedCondition = (id: string) => {
    setSettings(prev => ({
      ...prev,
      turnTracking: {
        ...prev.turnTracking,
        advancedConditions: prev.turnTracking.advancedConditions.filter(c => c.id !== id)
      }
    }));
  };

  const addDownloadPermission = () => {
    setAdvancedDownloadUsers([]);
    setAdvancedDownloadWhen('Always');
    setShowAddAdvancedDownloadModal(true);
  };

  const handleAddAdvancedDownloadPermission = () => {
    if (advancedDownloadUsers.length === 0) return;
    setSettings(prev => ({
      ...prev,
      downloadPermissions: {
        ...prev.downloadPermissions,
        advancedSettings: {
          permissions: [
            ...prev.downloadPermissions.advancedSettings.permissions,
            {
              id: Date.now().toString(),
              description: `${advancedDownloadUsers.map(u => u.name || u.label).join(', ')} can download (${advancedDownloadWhen})`,
              canModify: true,
              users: advancedDownloadUsers,
              when: advancedDownloadWhen
            }
          ]
        }
      }
    }));
    setShowAddAdvancedDownloadModal(false);
  };

  const addSharePermission = () => {
    const newPermission = {
      id: Date.now().toString(),
      description: 'New permission',
      canModify: true
    };
    
    setSettings(prev => ({
      ...prev,
      sharePermissions: {
        ...prev.sharePermissions,
        advancedSettings: {
          permissions: [...prev.sharePermissions.advancedSettings.permissions, newPermission]
        }
      }
    }));
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      {/* Turn Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Turn Tracking</CardTitle>
          <p className="text-sm text-gray-600">
            Set whose turn it is when workflow starts in the review step.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-4 h-4 mt-0.5">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-700">SELECT PARTY</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                    onClick={addAdvancedCondition}
                  >
                    Add an advanced condition
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    when no condition is met
                  </div>
                  
                  <Select 
                    value={settings.turnTracking.defaultAssignee}
                    onValueChange={(value: 'NO_ONE' | 'INTERNAL_PARTY' | 'COUNTERPARTY') => 
                      setSettings(prev => ({
                        ...prev,
                        turnTracking: { ...prev.turnTracking, defaultAssignee: value }
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_ONE">No one</SelectItem>
                      <SelectItem value="INTERNAL_PARTY">Internal Party</SelectItem>
                      <SelectItem value="COUNTERPARTY">Counterparty</SelectItem>
                    </SelectContent>
                  </Select>
                  

                </div>
                
                {/* Advanced Conditions */}
                {settings.turnTracking.advancedConditions.map((condition) => (
                  <div key={condition.id} className="mt-4 p-3 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-300 rounded-sm flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 6 6">
                            <circle cx="3" cy="3" r="1"/>
                            <circle cx="1" cy="3" r="1"/>
                            <circle cx="5" cy="3" r="1"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium">when</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAdvancedCondition(condition.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <Select
                        value={condition.condition}
                        onValueChange={(value) => {
                          const newConditions = settings.turnTracking.advancedConditions.map(c =>
                            c.id === condition.id ? { ...c, condition: value } : c
                          );
                          setSettings(prev => ({
                            ...prev,
                            turnTracking: { ...prev.turnTracking, advancedConditions: newConditions }
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Always">Always</SelectItem>
                          <SelectItem value="Renewal Type is Auto-Renew">Renewal Type is Auto-Renew</SelectItem>
                          <SelectItem value="Renewal Type is Auto-Renew OR Optional Extension">Renewal Type is Auto-Renew OR Optional Extension</SelectItem>
                          <SelectItem value="Renewal Type is None">Renewal Type is None</SelectItem>
                          <SelectItem value="Renewal Type is not Evergreen">Renewal Type is not Evergreen</SelectItem>
                          <SelectItem value="Renewal Type is Optional Extension">Renewal Type is Optional Extension</SelectItem>
                          <SelectItem value="Renewal Type is Other">Renewal Type is Other</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.assignee}
                        onValueChange={(value) => {
                          const newConditions = settings.turnTracking.advancedConditions.map(c =>
                            c.id === condition.id ? { ...c, assignee: value } : c
                          );
                          setSettings(prev => ({
                            ...prev,
                            turnTracking: { ...prev.turnTracking, advancedConditions: newConditions }
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No one">No one</SelectItem>
                          <SelectItem value="Internal Party">Internal Party</SelectItem>
                          <SelectItem value="Counterparty">Counterparty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Download Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700">Download Permissions</Label>
            <div className="mt-3 space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="BASIC"
                  id="download-basic"
                  name="download-permissions"
                  checked={settings.downloadPermissions.type === 'BASIC'}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    downloadPermissions: { ...prev.downloadPermissions, type: e.target.value as 'BASIC' | 'ADVANCED' }
                  }))}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="download-basic" className="font-medium">
                    Basic download permissions
                  </Label>
                  {settings.downloadPermissions.type === 'BASIC' && (
                    <div className="mt-3 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                      <span className="text-sm">
                        {settings.downloadPermissions.basicSettings.description}
                      </span>
                      <Button variant="ghost" size="icon" className="p-1" onClick={() => {
                        setDownloadPermissionDraft(settings.downloadPermissions.basicSettings.description);
                        setShowDownloadEditModal(true);
                      }} title="Edit Permissions">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="ADVANCED"
                  id="download-advanced"
                  name="download-permissions"
                  checked={settings.downloadPermissions.type === 'ADVANCED'}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    downloadPermissions: { ...prev.downloadPermissions, type: e.target.value as 'BASIC' | 'ADVANCED' }
                  }))}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="download-advanced" className="font-medium">
                    Advanced download permissions
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Users who are not included in any permission will not be able to download. To change this default, add a new group permission and select "All other groups and users".
                  </p>
                  {settings.downloadPermissions.type === 'ADVANCED' && (
                    <div className="mt-3 space-y-3">
                      {settings.downloadPermissions.advancedSettings.permissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                          <span className="text-sm">{permission.description}</span>
                          <div className="flex items-center gap-2">
                            {!permission.canModify && (
                              <span className="text-xs text-gray-400">This cannot be modified</span>
                            )}
                            {permission.canModify && (
                              <Button variant="ghost" size="sm" className="p-1">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addDownloadPermission}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        + Add download permission
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gray-200"></div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Download PDF Permissions</Label>
            <div className="flex items-center space-x-2 mt-3">
              <input
                type="checkbox"
                id="separate-pdf-download"
                checked={settings.downloadPermissions.separatePdfPermissions}
                onChange={e => {
                  setSettings(prev => ({
                    ...prev,
                    downloadPermissions: { ...prev.downloadPermissions, separatePdfPermissions: e.target.checked }
                  }));
                  // Checkbox işaretlenirse varsayılan olarak BASIC seçili olsun
                  if (e.target.checked) setPdfPermissionsType('BASIC');
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="separate-pdf-download" className="text-sm">
                Add separate permissions for PDF download
              </Label>
            </div>
          </div>

          {settings.downloadPermissions.separatePdfPermissions && (
            <div className="mt-4 space-y-4 ml-6">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="BASIC"
                  id="pdf-download-basic"
                  name="pdf-download-permissions"
                  checked={pdfPermissionsType === 'BASIC'}
                  onChange={() => setPdfPermissionsType('BASIC')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="pdf-download-basic" className="font-medium">
                    Basic download permissions
                  </Label>
                  {pdfPermissionsType === 'BASIC' && (
                    <div className="mt-3 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                      <span className="text-sm">
                        {pdfDownloadPermissionDraft}
                      </span>
                      <Button variant="ghost" size="icon" className="p-1" onClick={() => setShowPdfDownloadEditModal(true)} title="Edit Permissions">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="ADVANCED"
                  id="pdf-download-advanced"
                  name="pdf-download-permissions"
                  checked={pdfPermissionsType === 'ADVANCED'}
                  onChange={() => setPdfPermissionsType('ADVANCED')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="pdf-download-advanced" className="font-medium">
                    Advanced download permissions
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Users who are not included in any permission will not be able to download PDF. To change this default, add a new group permission and select "All other groups and users".
                  </p>
                  {pdfPermissionsType === 'ADVANCED' && (
                    <div className="mt-3 space-y-3">
                      {pdfAdvancedPermissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                          <span className="text-sm">{permission.description}</span>
                          <div className="flex items-center gap-2">
                            {!permission.canModify && (
                              <span className="text-xs text-gray-400">This cannot be modified</span>
                            )}
                            {permission.canModify && (
                              <Button variant="ghost" size="sm" className="p-1">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddPdfAdvancedDownloadModal(true)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        + Add download permission
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Permission Edit Modal */}
      <Dialog open={showDownloadEditModal} onOpenChange={setShowDownloadEditModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit download documents permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={downloadPermissionDraft}
              onChange={e => setDownloadPermissionDraft(e.target.value)}
            >
              <option value="Everyone can always download documents">Everyone can always download documents</option>
              <option value="Users with Workflow Management permissions can download documents">Users with Workflow Management permissions can download documents</option>
            </select>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDownloadEditModal(false)}>Cancel</Button>
            <Button onClick={() => {
              setSettings(prev => ({
                ...prev,
                downloadPermissions: {
                  ...prev.downloadPermissions,
                  basicSettings: {
                    ...prev.downloadPermissions.basicSettings,
                    description: downloadPermissionDraft
                  }
                }
              }));
              setShowDownloadEditModal(false);
            }}>Save Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Download Permission Edit Modal */}
      <Dialog open={showPdfDownloadEditModal} onOpenChange={setShowPdfDownloadEditModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit download PDF documents permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={pdfDownloadPermissionDraft}
              onChange={e => setPdfDownloadPermissionDraft(e.target.value)}
            >
              <option value="Everyone can always download PDF documents">Everyone can always download PDF documents</option>
              <option value="Users with Workflow Management permissions can download PDF documents">Users with Workflow Management permissions can download PDF documents</option>
            </select>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPdfDownloadEditModal(false)}>Cancel</Button>
            <Button onClick={() => setShowPdfDownloadEditModal(false)}>Save Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Advanced Download Permission Modal */}
      <Dialog open={showAddAdvancedDownloadModal} onOpenChange={setShowAddAdvancedDownloadModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Add download permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="block mb-1 text-sm">Who can download?</Label>
              <MultiUserAutocomplete
                value={advancedDownloadUsers}
                onChange={setAdvancedDownloadUsers}
                placeholder="Select groups or users"
              />
            </div>
            <div>
              <Label className="block mb-1 text-sm">When can they download?</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={advancedDownloadWhen}
                onChange={e => setAdvancedDownloadWhen(e.target.value)}
              >
                <option value="Always">Always</option>
                <option value="Never">Never</option>
                <option value="Only if certain approvals are completed">Only if certain approvals are completed</option>
                <option value="If a certain condition is met">If a certain condition is met</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddAdvancedDownloadModal(false)}>Cancel</Button>
            <Button
              onClick={handleAddAdvancedDownloadPermission}
              disabled={advancedDownloadUsers.length === 0}
            >
              Add Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Advanced PDF Download Permission Modal */}
      <Dialog open={showAddPdfAdvancedDownloadModal} onOpenChange={setShowAddPdfAdvancedDownloadModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Add download PDF permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="block mb-1 text-sm">Who can download PDF?</Label>
              <MultiUserAutocomplete
                value={pdfAdvancedDownloadUsers}
                onChange={setPdfAdvancedDownloadUsers}
                placeholder="Select groups or users"
              />
            </div>
            <div>
              <Label className="block mb-1 text-sm">When can they download PDF?</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={pdfAdvancedDownloadWhen}
                onChange={e => setPdfAdvancedDownloadWhen(e.target.value)}
              >
                <option value="Always">Always</option>
                <option value="Never">Never</option>
                <option value="Only if certain approvals are completed">Only if certain approvals are completed</option>
                <option value="If a certain condition is met">If a certain condition is met</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddPdfAdvancedDownloadModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (pdfAdvancedDownloadUsers.length === 0) return;
                setPdfAdvancedPermissions(prev => ([
                  ...prev,
                  {
                    id: Date.now().toString(),
                    description: `${pdfAdvancedDownloadUsers.map(u => u.name || u.label).join(', ')} can download PDF (${pdfAdvancedDownloadWhen})`,
                    canModify: true,
                    users: pdfAdvancedDownloadUsers,
                    when: pdfAdvancedDownloadWhen
                  }
                ]));
                setShowAddPdfAdvancedDownloadModal(false);
              }}
              disabled={pdfAdvancedDownloadUsers.length === 0}
            >
              Add Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Share Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700">Share Document Permissions</Label>
            <div className="mt-3 space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="BASIC"
                  id="share-basic"
                  name="share-permissions"
                  checked={sharePermissionsType === 'BASIC'}
                  onChange={() => setSharePermissionsType('BASIC')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="share-basic" className="font-medium">
                    Basic share permissions
                  </Label>
                  {sharePermissionsType === 'BASIC' && (
                    <div className="mt-3 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                      <span className="text-sm">
                        {sharePermissionDraft}
                      </span>
                      <Button variant="ghost" size="icon" className="p-1" onClick={() => setShowShareEditModal(true)} title="Edit Permissions">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="ADVANCED"
                  id="share-advanced"
                  name="share-permissions"
                  checked={sharePermissionsType === 'ADVANCED'}
                  onChange={() => setSharePermissionsType('ADVANCED')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="share-advanced" className="font-medium">
                    Advanced share permissions
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Users who are not included in any permission will not be able to share. To change this default, add a new group permission and select "All other groups and users".
                  </p>
                  {sharePermissionsType === 'ADVANCED' && (
                    <div className="mt-3 space-y-3">
                      {advancedSharePermissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                          <span className="text-sm">{permission.description}</span>
                          <div className="flex items-center gap-2">
                            {!permission.canModify && (
                              <span className="text-xs text-gray-400">This cannot be modified</span>
                            )}
                            {permission.canModify && (
                              <Button variant="ghost" size="sm" className="p-1">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddAdvancedShareModal(true)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        + Add share permission
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="h-[1px] w-full bg-gray-200"></div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Share PDF Document Permissions</Label>
            <div className="flex items-center space-x-2 mt-3">
              <input
                type="checkbox"
                id="separate-pdf-share"
                checked={settings.sharePermissions.separatePdfPermissions}
                onChange={e => {
                  setSettings(prev => ({
                    ...prev,
                    sharePermissions: { ...prev.sharePermissions, separatePdfPermissions: e.target.checked }
                  }));
                  if (e.target.checked) setPdfSharePermissionsType('BASIC');
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="separate-pdf-share" className="text-sm">
                Add separate permissions for PDF sharing
              </Label>
            </div>
          </div>
          {settings.sharePermissions.separatePdfPermissions && (
            <div className="mt-4 space-y-4 ml-6">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="BASIC"
                  id="pdf-share-basic"
                  name="pdf-share-permissions"
                  checked={pdfSharePermissionsType === 'BASIC'}
                  onChange={() => setPdfSharePermissionsType('BASIC')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="pdf-share-basic" className="font-medium">
                    Basic share permissions
                  </Label>
                  {pdfSharePermissionsType === 'BASIC' && (
                    <div className="mt-3 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                      <span className="text-sm">
                        {pdfSharePermissionDraft}
                      </span>
                      <Button variant="ghost" size="icon" className="p-1" onClick={() => setShowPdfShareEditModal(true)} title="Edit Permissions">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  value="ADVANCED"
                  id="pdf-share-advanced"
                  name="pdf-share-permissions"
                  checked={pdfSharePermissionsType === 'ADVANCED'}
                  onChange={() => setPdfSharePermissionsType('ADVANCED')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="pdf-share-advanced" className="font-medium">
                    Advanced share permissions
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Users who are not included in any permission will not be able to share PDF. To change this default, add a new group permission and select "All other groups and users".
                  </p>
                  {pdfSharePermissionsType === 'ADVANCED' && (
                    <div className="mt-3 space-y-3">
                      {pdfAdvancedSharePermissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                          <span className="text-sm">{permission.description}</span>
                          <div className="flex items-center gap-2">
                            {!permission.canModify && (
                              <span className="text-xs text-gray-400">This cannot be modified</span>
                            )}
                            {permission.canModify && (
                              <Button variant="ghost" size="sm" className="p-1">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddPdfAdvancedShareModal(true)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        + Add share permission
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Permission Edit Modal */}
      <Dialog open={showShareEditModal} onOpenChange={setShowShareEditModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit share documents permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={sharePermissionDraft}
              onChange={e => setSharePermissionDraft(e.target.value)}
            >
              <option value="Everyone can always share documents">Everyone can always share documents</option>
              <option value="Users with Workflow Management permissions can share documents">Users with Workflow Management permissions can share documents</option>
            </select>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowShareEditModal(false)}>Cancel</Button>
            <Button onClick={() => setShowShareEditModal(false)}>Save Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Advanced Share Permission Modal */}
      <Dialog open={showAddAdvancedShareModal} onOpenChange={setShowAddAdvancedShareModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Add share permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="block mb-1 text-sm">Who can share?</Label>
              <MultiUserAutocomplete
                value={advancedShareUsers}
                onChange={setAdvancedShareUsers}
                placeholder="Select groups or users"
              />
            </div>
            <div>
              <Label className="block mb-1 text-sm">When can they share?</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={advancedShareWhen}
                onChange={e => setAdvancedShareWhen(e.target.value)}
              >
                <option value="Always">Always</option>
                <option value="Never">Never</option>
                <option value="Only if certain approvals are completed">Only if certain approvals are completed</option>
                <option value="If a certain condition is met">If a certain condition is met</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddAdvancedShareModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (advancedShareUsers.length === 0) return;
                setAdvancedSharePermissions(prev => ([
                  ...prev,
                  {
                    id: Date.now().toString(),
                    description: `${advancedShareUsers.map(u => u.name || u.label).join(', ')} can share (${advancedShareWhen})`,
                    canModify: true,
                    users: advancedShareUsers,
                    when: advancedShareWhen
                  }
                ]));
                setShowAddAdvancedShareModal(false);
              }}
              disabled={advancedShareUsers.length === 0}
            >
              Add Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Share Permission Edit Modal */}
      <Dialog open={showPdfShareEditModal} onOpenChange={setShowPdfShareEditModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit share PDF documents permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={pdfSharePermissionDraft}
              onChange={e => setPdfSharePermissionDraft(e.target.value)}
            >
              <option value="Everyone can always share PDF documents">Everyone can always share PDF documents</option>
              <option value="Users with Workflow Management permissions can share PDF documents">Users with Workflow Management permissions can share PDF documents</option>
            </select>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPdfShareEditModal(false)}>Cancel</Button>
            <Button onClick={() => setShowPdfShareEditModal(false)}>Save Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Advanced PDF Share Permission Modal */}
      <Dialog open={showAddPdfAdvancedShareModal} onOpenChange={setShowAddPdfAdvancedShareModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Add share as PDF permission</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="block mb-1 text-sm">Who can share?</Label>
              <MultiUserAutocomplete
                value={pdfAdvancedShareUsers}
                onChange={setPdfAdvancedShareUsers}
                placeholder="Select groups or users"
              />
            </div>
            <div>
              <Label className="block mb-1 text-sm">When can they share?</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={pdfAdvancedShareWhen}
                onChange={e => setPdfAdvancedShareWhen(e.target.value)}
              >
                <option value="Always">Always</option>
                <option value="Never">Never</option>
                <option value="Only if certain approvals are completed">Only if certain approvals are completed</option>
                <option value="If a certain condition is met">If a certain condition is met</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddPdfAdvancedShareModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (pdfAdvancedShareUsers.length === 0) return;
                setPdfAdvancedSharePermissions(prev => ([
                  ...prev,
                  {
                    id: Date.now().toString(),
                    description: `${pdfAdvancedShareUsers.map(u => u.name || u.label).join(', ')} can share PDF (${pdfAdvancedShareWhen})`,
                    canModify: true,
                    users: pdfAdvancedShareUsers,
                    when: pdfAdvancedShareWhen
                  }
                ]));
                setShowAddPdfAdvancedShareModal(false);
              }}
              disabled={pdfAdvancedShareUsers.length === 0}
            >
              Add Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Default Email Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Default Email Template</CardTitle>
          <p className="text-sm text-gray-600">
            Customize the default email template when a document is emailed directly from Ironclad. Workflow participants will be able to modify text and further personalize emails generated from this configuration
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-32">FROM (DISPLAY NAME)</Label>
              <div className="flex items-center gap-2 flex-1">
                <Badge variant="secondary" className="bg-teal-100 text-teal-800 text-xs px-2 py-1">
                  T
                </Badge>
                <span className="text-sm">{settings.emailTemplate.fromDisplayName}</span>
                <span className="text-sm text-gray-500">
                  ({' '}
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800 text-xs px-2 py-1">
                    T
                  </Badge>
                  {settings.emailTemplate.companyDisplayName}) via Ironclad
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-32">SUBJECT</Label>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm">Draft contract from</span>
                <Badge variant="secondary" className="bg-teal-100 text-teal-800 text-xs px-2 py-1">
                  T
                </Badge>
                <span className="text-sm">{settings.emailTemplate.companyDisplayName} - Please Review.</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="whitespace-pre-line text-sm">
                  {settings.emailTemplate.bodyTemplate.split('\n').map((line, index) => (
                    <div key={index}>
                      {line.includes('Emailer User Name') ? (
                        <>
                          {line.substring(0, line.indexOf('Emailer User Name'))}
                          <Badge variant="secondary" className="bg-teal-100 text-teal-800 text-xs px-2 py-1 mx-1">
                            T
                          </Badge>
                          {settings.emailTemplate.fromDisplayName}
                          {line.substring(line.indexOf('Emailer User Name') + 'Emailer User Name'.length)}
                        </>
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 mt-0.5">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Tip:</p>
                    <p className="text-sm text-yellow-700">
                      Include{' '}
                      <code className="bg-yellow-200 px-1 rounded text-xs">Emailer User Name</code>
                      {' '}and{' '}
                      <code className="bg-yellow-200 px-1 rounded text-xs">Emailer User Email</code>
                      {' '}to personalize emails
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} className="px-6">
          Save Review Settings
        </Button>
      </div>
    </div>
  );
}; 