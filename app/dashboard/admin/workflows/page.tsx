"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Book, MoreVertical, Copy, Upload, ToggleRight, Trash2 } from "lucide-react";
import React, { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface WorkflowTemplate {
    id: string;
    name: string;
    status: 'PUBLISHED' | 'UNPUBLISHED';
}

const WorkflowTemplateCard = ({ template }: { template: WorkflowTemplate }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-base font-semibold">{template.name}</CardTitle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Upload className="mr-2 h-4 w-4" />
            <span>Export</span>
          </DropdownMenuItem>
           <DropdownMenuItem>
            <ToggleRight className="mr-2 h-4 w-4" />
            <span>
              {template.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent>
        {template.status === 'PUBLISHED' ? (
            <Badge variant="default" className="bg-green-100 text-green-800">Published</Badge>
        ) : (
            <Badge variant="secondary">Unpublished</Badge>
        )}
    </CardContent>
  </Card>
);

const WorkflowDesignerPage = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/workflow-templates');
        if (!response.ok) {
          throw new Error('Failed to fetch workflow templates');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const publishedTemplates = templates.filter(t => t.status === 'PUBLISHED');
  const unpublishedTemplates = templates.filter(t => t.status === 'UNPUBLISHED');

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workflow Designer</h1>
        <Button>
          Create new
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">New internal workflow</CardTitle>
            <PlusCircle className="w-6 h-6 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Contract launched by members of your Ironclad team.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">New public workflow</CardTitle>
            <PlusCircle className="w-6 h-6 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Contract launched by anyone accessing a URL.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer bg-gray-50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Explore with Workflow Library</CardTitle>
            <Book className="w-6 h-6 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Customize popular workflows using templates from the Workflow Library.</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Templates Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Live</h2>
        <p className="text-gray-500">{publishedTemplates.length} configurations</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedTemplates.map(template => (
            <WorkflowTemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>

      {/* Not Published Templates Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Not published</h2>
        <p className="text-gray-500">{unpublishedTemplates.length} configurations</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unpublishedTemplates.map(template => (
            <WorkflowTemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDesignerPage; 