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
    const newPermission = {
      id: Date.now().toString(),
      description: 'New permission',
      canModify: true
    };
    
    setSettings(prev => ({
      ...prev,
      downloadPermissions: {
        ...prev.downloadPermissions,
        advancedSettings: {
          permissions: [...prev.downloadPermissions.advancedSettings.permissions, newPermission]
        }
      }
    }));
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
                    <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {settings.downloadPermissions.basicSettings.description}
                        </span>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                        <div key={permission.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{permission.description}</span>
                            <div className="flex items-center gap-2">
                              {!permission.canModify && (
                                <Badge variant="secondary" className="text-xs">
                                  This cannot be modified
                                </Badge>
                              )}
                              {permission.canModify && (
                                <Button variant="ghost" size="sm" className="p-1">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addDownloadPermission}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add download permission
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
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    downloadPermissions: { ...prev.downloadPermissions, separatePdfPermissions: e.target.checked }
                  }))
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="separate-pdf-download" className="text-sm">
                Add separate permissions for PDF download
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  checked={settings.sharePermissions.type === 'BASIC'}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    sharePermissions: { ...prev.sharePermissions, type: e.target.value as 'BASIC' | 'ADVANCED' }
                  }))}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="share-basic" className="font-medium">
                    Basic share permissions
                  </Label>
                  {settings.sharePermissions.type === 'BASIC' && (
                    <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {settings.sharePermissions.basicSettings.description}
                        </span>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                  checked={settings.sharePermissions.type === 'ADVANCED'}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    sharePermissions: { ...prev.sharePermissions, type: e.target.value as 'BASIC' | 'ADVANCED' }
                  }))}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="share-advanced" className="font-medium">
                    Advanced share permissions
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Users who are not included in any permission will not be able to share. To change this default, add a new group permission and select "All other groups and users".
                  </p>
                  {settings.sharePermissions.type === 'ADVANCED' && (
                    <div className="mt-3 space-y-3">
                      {settings.sharePermissions.advancedSettings.permissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{permission.description}</span>
                            <div className="flex items-center gap-2">
                              {!permission.canModify && (
                                <Badge variant="secondary" className="text-xs">
                                  This cannot be modified
                                </Badge>
                              )}
                              {permission.canModify && (
                                <Button variant="ghost" size="sm" className="p-1">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addSharePermission}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add share permission
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
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    sharePermissions: { ...prev.sharePermissions, separatePdfPermissions: e.target.checked }
                  }))
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="separate-pdf-share" className="text-sm">
                Add separate permissions for PDF sharing
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

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