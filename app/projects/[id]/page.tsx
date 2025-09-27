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
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent>({
    type: 'doc',
    content: []
  });
  const [noteType, setNoteType] = useState<"brief" | "architecture" | "feature" | "bug" | "idea" | "meeting" | "other">("brief");
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isCompleted, setIsCompleted] = useState(false);

  // Input helpers
  const [tagInput, setTagInput] = useState("");

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
    setNoteType("brief");
    setTags([]);
    setPriority("medium");
    setIsCompleted(false);
    setIsEditing(false);
    setSelectedNote(null);
    setTagInput("");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (note: ProjectNote) => {
    setTitle(note.title);
    
    let parsedContent;
    try {
      parsedContent = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
    } catch {
      parsedContent = {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: note.content }]
        }]
      };
    }
    
    setContent(parsedContent);
    setNoteType(note.type);
    setTags(note.tags || []);
    setPriority(note.priority);
    setIsCompleted(note.isCompleted);
    setSelectedNote(note);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (isContentEmpty(content)) {
      toast.error("Please enter some content");
      return;
    }

    setIsCreating(true);
    try {
      const contentToSave = typeof content === 'object' ? JSON.stringify(content) : content;
      
      const payload = {
        projectId,
        title: title.trim(),
        content: contentToSave,
        type: noteType,
        tags,
        priority,
        isCompleted,
      };

      let response;
      if (isEditing && selectedNote) {
        response = await fetch("/api/projects/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedNote.id, ...payload }),
        });
      } else {
        response = await fetch("/api/projects/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save note");
      }

      toast.success(isEditing ? "Note updated!" : "Note created!");
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

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`/api/projects/notes?id=${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete note");
      }

      toast.success("Note deleted!");
      fetchNotes();
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
        
        <div className="flex items-center gap-3 mb-4">
          <TypeIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{project.title}</h1>
        </div>
        <p className="text-muted-foreground text-lg mb-6">{project.description}</p>
        
        {/* Project Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Project Details
                  <Badge variant="outline" className="text-xs">
                    {project.type}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Created on {new Date(project.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {project.githubUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(project.githubUrl, '_blank')}
                  >
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Button>
                )}
                {project.liveUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(project.liveUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Live Demo
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Status & Priority</h4>
                <div className="space-y-2">
                  <Badge className={`${statusColors[project.status]}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {project.status.replace('-', ' ')}
                  </Badge>
                  <Badge className={`${priorityColors[project.priority]} ml-2`}>
                    {project.priority}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tech Stack</h4>
                <div className="flex flex-wrap gap-1">
                  {project.techStack?.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {project.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {(project.features?.length > 0 || project.challenges || project.learnings) && (
              <div className="mt-6 space-y-4">
                {project.features?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Key Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {project.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {project.challenges && (
                  <div>
                    <h4 className="font-medium mb-2">Challenges</h4>
                    <p className="text-sm text-muted-foreground">{project.challenges}</p>
                  </div>
                )}
                
                {project.learnings && (
                  <div>
                    <h4 className="font-medium mb-2">Key Learnings</h4>
                    <p className="text-sm text-muted-foreground">{project.learnings}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Project Notes</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Note" : "Create New Note"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update your project note" : "Add a new note to document your project insights"}
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
                  <h4 className="font-medium">Content</h4>
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
                  {isCreating ? "Saving..." : isEditing ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">
            Start documenting your project insights and progress
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const NoteIcon = noteTypeIcons[note.type];
            
            return (
              <Card key={note.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1 mb-1">
                        {note.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${noteTypeColors[note.type]}`}>
                          <NoteIcon className="h-3 w-3 mr-1" />
                          {note.type}
                        </Badge>
                        <Badge className={`text-xs ${priorityColors[note.priority]}`}>
                          {note.priority}
                        </Badge>
                        {note.isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(note)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Content Preview */}
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {(() => {
                        let displayText = '';
                        if (typeof note.content === 'string') {
                          try {
                            // Try to parse as JSON content
                            const parsed = JSON.parse(note.content);
                            displayText = extractTextFromContent(parsed);
                          } catch {
                            // If parsing fails, use as plain text
                            displayText = note.content;
                          }
                        } else {
                          displayText = extractTextFromContent(note.content);
                        }
                        
                        return displayText.length > 100 
                          ? `${displayText.substring(0, 100)}...`
                          : displayText || "No content available";
                      })()}
                    </div>
                    
                    {/* Tags */}
                    {note.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}