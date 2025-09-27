"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  FolderOpen, 
  Github, 
  ExternalLink, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  StickyNote,
  Palette,
  Package,
  Star,
  Code2,
  Layers3
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  noteCount?: number;
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

export default function ProjectsPage() {
  const { data: session, isPending } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"template" | "product">("product");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"planning" | "in-progress" | "completed" | "on-hold">("planning");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [challenges, setChallenges] = useState("");
  const [learnings, setLearnings] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Input helpers
  const [techInput, setTechInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
    }
  }, [session?.user]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch projects");
      }
      
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("product");
    setTechStack([]);
    setGithubUrl("");
    setLiveUrl("");
    setImageUrl("");
    setStatus("planning");
    setPriority("medium");
    setStartDate("");
    setCompletionDate("");
    setTags([]);
    setFeatures([]);
    setChallenges("");
    setLearnings("");
    setIsPublic(false);
    setIsEditing(false);
    setSelectedProject(null);
    setTechInput("");
    setTagInput("");
    setFeatureInput("");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setTitle(project.title);
    setDescription(project.description);
    setType(project.type);
    setTechStack(project.techStack || []);
    setGithubUrl(project.githubUrl || "");
    setLiveUrl(project.liveUrl || "");
    setImageUrl(project.imageUrl || "");
    setStatus(project.status);
    setPriority(project.priority);
    setStartDate(project.startDate || "");
    setCompletionDate(project.completionDate || "");
    setTags(project.tags || []);
    setFeatures(project.features || []);
    setChallenges(project.challenges || "");
    setLearnings(project.learnings || "");
    setIsPublic(project.isPublic);
    setSelectedProject(project);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        techStack,
        githubUrl: githubUrl.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        status,
        priority,
        startDate: startDate || undefined,
        completionDate: completionDate || undefined,
        tags,
        features,
        challenges: challenges.trim() || undefined,
        learnings: learnings.trim() || undefined,
        isPublic,
      };

      let response;
      if (isEditing && selectedProject) {
        response = await fetch("/api/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedProject.id, ...payload }),
        });
      } else {
        response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save project");
      }

      toast.success(isEditing ? "Project updated!" : "Project created!");
      setIsDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This will also delete all project notes.")) return;

    try {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete project");
      }

      toast.success("Project deleted!");
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    }
  };

  const addTechStack = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTechStack = (tech: string) => {
    setTechStack(techStack.filter(t => t !== tech));
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

  const addFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  const handleProjectClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  if (isPending || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Projects Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-80">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-6" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-16" />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-12" />
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
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
            <CardDescription>Please sign in to access your projects</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="h-8 w-8 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Showcase your best work and templates
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Project" : "Create New Project"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update your project details" : "Add a new project to your portfolio"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    placeholder="Project title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={type} onValueChange={(value: "template" | "product") => setType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Textarea
                  placeholder="Project description *"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    placeholder="GitHub URL"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Live URL"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Input
                  placeholder="Image URL (optional)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              {/* Tech Stack */}
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add tech stack"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechStack())}
                  />
                  <Button type="button" onClick={addTechStack} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechStack(tech)}>
                      {tech} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Select value={status} onValueChange={(value: "planning" | "in-progress" | "completed" | "on-hold") => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm">Public</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    placeholder="Completion date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                  />
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

              {/* Features */}
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add key features"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(feature)}>
                      {feature} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Textarea
                  placeholder="Challenges faced (optional)"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Textarea
                  placeholder="Key learnings (optional)"
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  rows={2}
                />
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

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first project to showcase your work
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const StatusIcon = statusIcons[project.status];
            const TypeIcon = typeIcons[project.type];
            
            return (
              <Card key={project.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {project.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEditDialog(project); }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div onClick={() => handleProjectClick(project)}>
                    <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent onClick={() => handleProjectClick(project)}>
                  <div className="space-y-4">
                    {/* Tech Stack */}
                    {project.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.techStack.slice(0, 4).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {project.techStack.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.techStack.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {project.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Status and Priority */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${statusColors[project.status]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {project.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={`text-xs ${priorityColors[project.priority]}`}>
                          {project.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {project.noteCount && project.noteCount > 0 && (
                          <div className="flex items-center gap-1">
                            <StickyNote className="h-4 w-4" />
                            <span className="text-xs">{project.noteCount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-2 pt-2">
                      {project.githubUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            window.open(project.githubUrl, '_blank'); 
                          }}
                          className="h-8 px-2"
                        >
                          <Github className="h-4 w-4 mr-1" />
                          Code
                        </Button>
                      )}
                      {project.liveUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            window.open(project.liveUrl, '_blank'); 
                          }}
                          className="h-8 px-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Live
                        </Button>
                      )}
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