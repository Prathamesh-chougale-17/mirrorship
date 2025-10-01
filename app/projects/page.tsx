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
import ProjectsGrid from "@/components/projects/ProjectsGrid";
import { Project } from "@/components/projects/types";

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

  const productProjects = projects.filter(p => p.type === 'product');
  const templateProjects = projects.filter(p => p.type === 'template');

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

        {/* Products Section Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 p-2">
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        </div>

        {/* Templates Section Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 p-2">
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
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
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Projects</h2>
              <p className="text-sm text-muted-foreground">Products you built</p>
            </div>
            <ProjectsGrid
              projects={productProjects}
              onEdit={(p) => openEditDialog(p)}
              onDelete={(id) => handleDelete(id)}
              onOpen={(p) => handleProjectClick(p)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Templates</h2>
              <p className="text-sm text-muted-foreground">Reusable starters and templates</p>
            </div>
            <ProjectsGrid
              projects={templateProjects}
              onEdit={(p) => openEditDialog(p)}
              onDelete={(id) => handleDelete(id)}
              onOpen={(p) => handleProjectClick(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}