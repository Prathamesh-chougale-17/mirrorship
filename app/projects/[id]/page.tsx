"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Github, 
  ExternalLink, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  StickyNote,
  Edit,
  Trash2,
  Package,
  Palette,
  Code2,
  Target,
  Lightbulb,
  Bug,
  Users,
  FileText,
  Star
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { JSONContent } from "@tiptap/react";
import MermaidDiagram from "@/components/ui/mermaid-diagram";
import EditorContentDisplay from "@/components/ui/editor-content-display";
import {
  EditorBubbleMenu,
  EditorCharacterCount,
  EditorClearFormatting,
  EditorFloatingMenu,
  EditorFormatBold,
  EditorFormatCode,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatSubscript,
  EditorFormatSuperscript,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorNodeBulletList,
  EditorNodeCode,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTable,
  EditorNodeTaskList,
  EditorNodeText,
  EditorProvider,
  EditorSelector,
  EditorTableColumnAfter,
  EditorTableColumnBefore,
  EditorTableColumnDelete,
  EditorTableColumnMenu,
  EditorTableDelete,
  EditorTableFix,
  EditorTableGlobalMenu,
  EditorTableHeaderColumnToggle,
  EditorTableHeaderRowToggle,
  EditorTableMenu,
  EditorTableMergeCells,
  EditorTableRowAfter,
  EditorTableRowBefore,
  EditorTableRowDelete,
  EditorTableRowMenu,
  EditorTableSplitCell,
} from "@/components/ui/kibo-ui/editor";

interface Project {
  id: string;
  title: string;
  description: string;
  type: "template" | "product";
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  status: "planning" | "in-progress" | "completed" | "on-hold";
  priority: "low" | "medium" | "high";
  startDate?: string;
  completionDate?: string;
  tags: string[];
  features: string[];
  challenges?: string;
  learnings?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: "brief" | "architecture" | "feature" | "bug" | "idea" | "meeting" | "other";
  tags: string[];
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "on-hold": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

const statusIcons = {
  planning: Clock,
  "in-progress": AlertCircle,
  completed: CheckCircle,
  "on-hold": Clock
};

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const typeIcons = {
  template: Palette,
  product: Package
};

const noteTypeIcons = {
  brief: FileText,
  architecture: Code2,
  feature: Star,
  bug: Bug,
  idea: Lightbulb,
  meeting: Users,
  other: StickyNote
};

const noteTypeColors = {
  brief: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  architecture: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  feature: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  bug: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  idea: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

function isContentEmpty(content: any): boolean {
  if (!content) return true;
  if (typeof content === 'string') {
    return content.trim() === '';
  }
  if (typeof content === 'object' && content.type === 'doc') {
    return !content.content || content.content.length === 0 || 
           (content.content.length === 1 && 
            content.content[0].type === 'paragraph' && 
            (!content.content[0].content || content.content[0].content.length === 0));
  }
  return false;
}

function extractTextFromContent(content: JSONContent | string): string {
  if (typeof content === 'string') {
    return content;
  }
  if (!content || !content.content) {
    return '';
  }
  
  let text = '';
  const traverse = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      } else if (node.content) {
        traverse(node.content);
      }
    });
  };
  
  traverse(content.content);
  return text.trim();
}

export default function ProjectDetailPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form state for creating new notes
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent>({
    type: 'doc',
    content: []
  });
  const [mermaidContent, setMermaidContent] = useState("");
  const [contentMode, setContentMode] = useState<"rich" | "mermaid">("rich");
  const [noteType, setNoteType] = useState<"brief" | "architecture" | "feature" | "bug" | "idea" | "meeting" | "other">("brief");
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isCompleted, setIsCompleted] = useState(false);

  // Form state for editing notes
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState<JSONContent>({
    type: 'doc',
    content: []
  });
  const [editingMermaidContent, setEditingMermaidContent] = useState("");
  const [editingContentMode, setEditingContentMode] = useState<"rich" | "mermaid">("rich");
  const [editingNoteType, setEditingNoteType] = useState<"brief" | "architecture" | "feature" | "bug" | "idea" | "meeting" | "other">("brief");
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [editingPriority, setEditingPriority] = useState<"low" | "medium" | "high">("medium");
  const [editingIsCompleted, setEditingIsCompleted] = useState(false);

  // Input helpers
  const [tagInput, setTagInput] = useState("");
  const [editingTagInput, setEditingTagInput] = useState("");
  
  // Alert dialog state for deletion
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user && projectId) {
      fetchProject();
      fetchNotes();
    }
  }, [session?.user, projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project");
      }
      
      const foundProject = data.projects?.find((p: Project) => p.id === projectId);
      if (!foundProject) {
        toast.error("Project not found");
        router.push("/projects");
        return;
      }
      
      setProject(foundProject);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
      router.push("/projects");
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/projects/notes?projectId=${projectId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notes");
      }
      
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent({
      type: 'doc',
      content: []
    });
    setMermaidContent("");
    setContentMode("rich");
    setNoteType("brief");
    setTags([]);
    setPriority("medium");
    setIsCompleted(false);
    setSelectedNote(null);
    setTagInput("");
  };

  const saveEditingNote = async () => {
    if (!editingTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (editingContentMode === "mermaid") {
      if (!editingMermaidContent.trim()) {
        toast.error("Please enter Mermaid diagram content");
        return;
      }
    } else {
      if (isContentEmpty(editingContent)) {
        toast.error("Please enter some content");
        return;
      }
    }

    if (!selectedNote) return;

    try {
      const contentToSave = editingContentMode === "mermaid" 
        ? editingMermaidContent.trim()
        : (typeof editingContent === 'object' ? JSON.stringify(editingContent) : editingContent);
      
      const payload = {
        id: selectedNote.id,
        projectId,
        title: editingTitle.trim(),
        content: contentToSave,
        type: editingNoteType,
        tags: editingTags,
        priority: editingPriority,
        isCompleted: editingIsCompleted,
      };

      const response = await fetch("/api/projects/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update note");
      }

      toast.success("Note updated successfully!");
      await fetchNotes();
      cancelEditing();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const addEditingTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && editingTagInput.trim() && !editingTags.includes(editingTagInput.trim())) {
      setEditingTags([...editingTags, editingTagInput.trim()]);
      setEditingTagInput("");
    }
  };

  const removeEditingTag = (tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  };

  const openCreateDialog = (mode: "rich" | "mermaid" = "rich") => {
    resetForm();
    setContentMode(mode);
    if (mode === "mermaid") {
      setMermaidContent("graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Process]\n    B -->|No| D[End]\n    C --> D");
    }
    setIsDialogOpen(true);
  };

  const startEditingNote = (note: ProjectNote) => {
    setEditingTitle(note.title);
    
    // Check if content is Mermaid diagram - improved detection
    const contentStr = typeof note.content === 'string' ? note.content : JSON.stringify(note.content);
    const mermaidKeywords = [
      'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 
      'journey', 'gantt', 'pie', 'gitgraph', 'erDiagram', 'mindmap', 'timeline',
      'sankey', 'block-beta', 'packet-beta'
    ];
    
    // More robust Mermaid detection
    const isMermaidContent = typeof note.content === 'string' && 
      mermaidKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(contentStr);
      });
    
    if (isMermaidContent) {
      setEditingContentMode("mermaid");
      setEditingMermaidContent(note.content as string);
      setEditingContent({ type: 'doc', content: [] });
    } else {
      // Default to rich text mode
      setEditingContentMode("rich");
      setEditingMermaidContent("");
      let parsedContent;
      try {
        parsedContent = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
      } catch {
        // If parsing fails, treat as plain text and convert to rich text format
        parsedContent = {
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: note.content as string }]
          }]
        };
      }
      setEditingContent(parsedContent);
    }
    
    setEditingNoteType(note.type);
    setEditingTags(note.tags || []);
    setEditingPriority(note.priority);
    setEditingIsCompleted(note.isCompleted);
    setSelectedNote(note);
    setEditingNoteId(note.id);
    setEditingTagInput("");
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setSelectedNote(null);
    setEditingTagInput("");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (contentMode === "mermaid") {
      if (!mermaidContent.trim()) {
        toast.error("Please enter Mermaid diagram content");
        return;
      }
    } else {
      if (isContentEmpty(content)) {
        toast.error("Please enter some content");
        return;
      }
    }

    setIsCreating(true);
    try {
      const contentToSave = contentMode === "mermaid" 
        ? mermaidContent.trim()
        : (typeof content === 'object' ? JSON.stringify(content) : content);
      
      const payload = {
        projectId,
        title: title.trim(),
        content: contentToSave,
        type: noteType,
        tags,
        priority,
        isCompleted,
      };

      const response = await fetch("/api/projects/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save note");
      }

      toast.success("Note created!");
      setIsDialogOpen(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    } finally {
      setIsCreating(false);
    }
  };

  const openDeleteAlert = (noteId: string) => {
    setNoteToDelete(noteId);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      const response = await fetch(`/api/projects/notes?id=${noteToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete note");
      }

      toast.success("Note deleted!");
      fetchNotes();
      setIsDeleteAlertOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete note");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleContentModeChange = (newMode: "rich" | "mermaid") => {
    if (newMode === contentMode) return;

    if (newMode === "mermaid") {
      // Switching to Mermaid mode
      if (!isContentEmpty(content)) {
        // Convert rich text to plain text for Mermaid input
        const plainText = extractTextFromContent(content);
        setMermaidContent(plainText);
      }
      // Clear rich content but keep mermaid content
      setContent({ type: 'doc', content: [] });
    } else {
      // Switching to Rich text mode
      if (mermaidContent.trim()) {
        // Convert Mermaid content to rich text format
        setContent({
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: mermaidContent }]
          }]
        });
      }
      // Clear mermaid content but keep rich content
      setMermaidContent("");
    }
    
    setContentMode(newMode);
  };

  if (isPending || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-6 w-20 mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-5 w-96 mb-6" />
          
          {/* Project Details Skeleton */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access this project</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const StatusIcon = statusIcons[project.status];
  const TypeIcon = typeIcons[project.type];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/projects")}
          className="mb-4 -ml-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TypeIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{project.type}</Badge>
            <Badge className={`${statusColors[project.status]}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {project.status.replace('-', ' ')}
            </Badge>
            {project.githubUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(project.githubUrl, '_blank')}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            )}
            {project.liveUrl && (
              <Button
                variant="outline" 
                size="sm"
                onClick={() => window.open(project.liveUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Live
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Project Notes</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button onClick={() => openCreateDialog("rich")} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            
            <DialogTrigger asChild>
              <Button onClick={() => openCreateDialog("mermaid")} variant="outline">
                <Code2 className="h-4 w-4 mr-2" />
                Add Mermaid
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
              <DialogDescription>
                Add a new note to document your project insights
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    placeholder="Note title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={noteType} onValueChange={(value: any) => setNoteType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Note type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">Project Brief</SelectItem>
                      <SelectItem value="architecture">Architecture</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="meeting">Meeting Notes</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Content</h4>
                    <Badge variant="secondary" className="text-xs">
                      {contentMode === "rich" ? "Rich Text Editor" : "Mermaid Diagram"}
                    </Badge>
                  </div>
                  
                  {contentMode === "rich" ? (
                      <EditorProvider
                        className="h-full w-full overflow-y-auto rounded-lg border bg-background p-4 min-h-80"
                        content={content}
                        onUpdate={({ editor }) => {
                          setContent(editor.getJSON());
                        }}
                        placeholder="Write your note content here..."
                      >
                        <EditorFloatingMenu>
                          <EditorNodeHeading1 hideName />
                          <EditorNodeBulletList hideName />
                          <EditorNodeQuote hideName />
                          <EditorNodeCode hideName />
                          <EditorNodeTable hideName />
                        </EditorFloatingMenu>
                        <EditorBubbleMenu>
                          <EditorSelector title="Text">
                            <EditorNodeText />
                            <EditorNodeHeading1 />
                            <EditorNodeHeading2 />
                            <EditorNodeHeading3 />
                            <EditorNodeBulletList />
                            <EditorNodeOrderedList />
                            <EditorNodeTaskList />
                            <EditorNodeQuote />
                            <EditorNodeCode />
                          </EditorSelector>
                          <EditorSelector title="Format">
                            <EditorFormatBold />
                            <EditorFormatItalic />
                            <EditorFormatUnderline />
                            <EditorFormatStrike />
                            <EditorFormatCode />
                            <EditorFormatSuperscript />
                            <EditorFormatSubscript />
                          </EditorSelector>
                          <EditorLinkSelector />
                          <EditorClearFormatting />
                        </EditorBubbleMenu>
                        <EditorTableMenu>
                          <EditorTableColumnMenu>
                            <EditorTableColumnBefore />
                            <EditorTableColumnAfter />
                            <EditorTableColumnDelete />
                          </EditorTableColumnMenu>
                          <EditorTableRowMenu>
                            <EditorTableRowBefore />
                            <EditorTableRowAfter />
                            <EditorTableRowDelete />
                          </EditorTableRowMenu>
                          <EditorTableGlobalMenu>
                            <EditorTableHeaderColumnToggle />
                            <EditorTableHeaderRowToggle />
                            <EditorTableDelete />
                            <EditorTableMergeCells />
                            <EditorTableSplitCell />
                            <EditorTableFix />
                          </EditorTableGlobalMenu>
                        </EditorTableMenu>
                        <EditorCharacterCount.Words>Words: </EditorCharacterCount.Words>
                      </EditorProvider>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Mermaid Code</label>
                          <Select onValueChange={(template) => {
                            if (template && template !== 'select') {
                              setMermaidContent(template);
                            }
                          }}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Insert template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="select">Select template...</SelectItem>
                              <SelectItem value={`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`}>Basic Flowchart</SelectItem>
                              <SelectItem value={`graph LR
    subgraph "Frontend"
        A[React App]
        B[Components]
    end
    subgraph "Backend"
        C[API Server]
        D[Database]
    end
    A --> C
    C --> D`}>System Architecture</SelectItem>
                              <SelectItem value={`sequenceDiagram
    participant User
    participant App
    participant API
    User->>App: Click Button
    App->>API: Send Request
    API-->>App: Return Data
    App-->>User: Show Result`}>Sequence Diagram</SelectItem>
                              <SelectItem value={`classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Project {
        +String title
        +String description
        +create()
        +update()
    }
    User ||--o{ Project`}>Class Diagram</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          placeholder={`Examples:

Flowchart:
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D

Architecture:
graph LR
    subgraph "Frontend"
        A[React App]
        B[Components]
    end
    subgraph "Backend"
        C[API Server]
        D[Database]
    end
    A --> C
    C --> D

Sequence Diagram:
sequenceDiagram
    participant User
    participant App
    participant API
    User->>App: Click Button
    App->>API: Send Request
    API-->>App: Return Data
    App-->>User: Show Result`}
                          value={mermaidContent}
                          onChange={(e) => setMermaidContent(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Preview</label>
                        <div className="border rounded-lg p-4 bg-background min-h-80">
                          {mermaidContent.trim() ? (
                            <MermaidDiagram chart={mermaidContent} />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              Enter Mermaid code to see preview
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCompleted"
                    checked={isCompleted}
                    onChange={(e) => setIsCompleted(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isCompleted" className="text-sm">Mark as completed</label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isCreating} className="flex-1">
                  {isCreating ? "Saving..." : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">
            Start documenting your project insights and progress
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => openCreateDialog("rich")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
            <Button onClick={() => openCreateDialog("mermaid")} variant="outline">
              <Code2 className="h-4 w-4 mr-2" />
              Create Diagram
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const NoteIcon = noteTypeIcons[note.type];
            
            // Consistent Mermaid detection
            const mermaidKeywords = [
              'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 
              'journey', 'gantt', 'pie', 'gitgraph', 'erDiagram', 'mindmap', 'timeline',
              'sankey', 'block-beta', 'packet-beta'
            ];
            
            const isMermaidContent = typeof note.content === 'string' && 
              mermaidKeywords.some(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                return regex.test(note.content as string);
              });
            
            return (
              <div key={note.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Note title"
                          className="text-xl font-semibold"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Select value={editingNoteType} onValueChange={(value: any) => setEditingNoteType(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Note type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="brief">Brief</SelectItem>
                              <SelectItem value="architecture">Architecture</SelectItem>
                              <SelectItem value="feature">Feature</SelectItem>
                              <SelectItem value="bug">Bug Report</SelectItem>
                              <SelectItem value="idea">Idea</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={editingPriority} onValueChange={(value: any) => setEditingPriority(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low Priority</SelectItem>
                              <SelectItem value="medium">Medium Priority</SelectItem>
                              <SelectItem value="high">High Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`completed-${note.id}`}
                            checked={editingIsCompleted}
                            onChange={(e) => setEditingIsCompleted(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor={`completed-${note.id}`} className="text-sm">Mark as completed</label>
                        </div>
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editingTags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                                <button
                                  onClick={() => removeEditingTag(tag)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <Input
                            value={editingTagInput}
                            onChange={(e) => setEditingTagInput(e.target.value)}
                            onKeyDown={addEditingTag}
                            placeholder="Add tags (press Enter)"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-xs ${noteTypeColors[note.type]}`}>
                            <NoteIcon className="h-3 w-3 mr-1" />
                            {note.type}
                          </Badge>
                          <Badge className={`text-xs ${priorityColors[note.priority]}`}>
                            {note.priority}
                          </Badge>
                          {note.isCompleted && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              Completed
                            </Badge>
                          )}
                          {isMermaidContent && (
                            <Badge variant="secondary" className="text-xs">
                              <Code2 className="h-3 w-3 mr-1" />
                              Diagram
                            </Badge>
                          )}
                          {note.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {editingNoteId === note.id ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={saveEditingNote}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteAlert(note.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {editingNoteId === note.id ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          variant={editingContentMode === "rich" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditingContentMode("rich")}
                        >
                          Rich Text
                        </Button>
                        <Button
                          variant={editingContentMode === "mermaid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditingContentMode("mermaid")}
                        >
                          Mermaid
                        </Button>
                      </div>
                      {editingContentMode === "rich" ? (
                        <div className="border rounded-lg">
                          <EditorProvider
                            content={editingContent}
                            onUpdate={({ editor }) => setEditingContent(editor.getJSON())}
                            className="min-h-[200px] prose prose-sm max-w-none dark:prose-invert p-4"
                          >
                            <EditorBubbleMenu>
                              <EditorSelector title="Text Style" />
                              <EditorFormatBold />
                              <EditorFormatItalic />
                              <EditorFormatStrike />
                              <EditorFormatCode />
                              <EditorLinkSelector />
                            </EditorBubbleMenu>
                            <EditorFloatingMenu>
                              <EditorSelector title="Insert" />
                              <EditorNodeHeading1 />
                              <EditorNodeHeading2 />
                              <EditorNodeHeading3 />
                              <EditorNodeBulletList />
                              <EditorNodeOrderedList />
                              <EditorNodeQuote />
                              <EditorNodeCode />
                            </EditorFloatingMenu>
                          </EditorProvider>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Mermaid Code</label>
                            <Textarea
                              placeholder="Enter Mermaid diagram code..."
                              value={editingMermaidContent}
                              onChange={(e) => setEditingMermaidContent(e.target.value)}
                              rows={8}
                              className="font-mono text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Preview</label>
                            <div className="border rounded-lg p-4 bg-background min-h-[200px]">
                              {editingMermaidContent.trim() ? (
                                <MermaidDiagram chart={editingMermaidContent} />
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  Enter Mermaid code to see preview
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {isMermaidContent ? (
                        <div className="bg-muted/50 rounded-lg p-4 my-4">
                          <MermaidDiagram chart={note.content as string} />
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          <EditorContentDisplay content={note.content} />
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                  {note.updatedAt !== note.createdAt && (
                    <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note
              and remove all its content from your project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}