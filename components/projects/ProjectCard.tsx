"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Package, Palette, Clock, CheckCircle, AlertCircle, StickyNote, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Project } from "./types";

const statusIcons: Record<string, any> = {
  planning: Clock,
  "in-progress": AlertCircle,
  completed: CheckCircle,
  "on-hold": Clock,
};

const typeIcons: Record<string, any> = {
  template: Palette,
  product: Package,
};

const statusColors: Record<string, string> = {
  planning: "bg-blue-50 text-blue-700",
  "in-progress": "bg-yellow-50 text-yellow-700",
  completed: "bg-green-50 text-green-700",
  "on-hold": "bg-gray-50 text-gray-700",
};

export default function ProjectCard({ project, onEdit, onDelete, onOpen, onRequestDelete }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: string) => void; onOpen: (p: Project) => void; onRequestDelete: (p: Project) => void; }) {
  const StatusIcon = statusIcons[project.status] ?? Clock;
  const TypeIcon = typeIcons[project.type] ?? Package;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // trigger fade-in
    const t = setTimeout(() => setLoaded(true), 10);
    return () => clearTimeout(t);
  }, []);

  const getInitials = (title?: string) => {
    if (!title) return "?";
    const parts = title.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const gradients = [
    "from-indigo-100 to-indigo-50",
    "from-rose-100 to-rose-50",
    "from-emerald-100 to-emerald-50",
    "from-yellow-100 to-yellow-50",
    "from-sky-100 to-sky-50",
  ];

  const pickGradient = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  const handleDelete = () => {
    // ask the page to show the Dialog before actually deleting
    onRequestDelete(project);
  };

  return (
    <Card className={`flex flex-col h-48 p-4 rounded-lg transform-gpu transition-shadow transition-transform transition-opacity duration-200 ease-out hover:shadow-lg hover:scale-[1.02] ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <CardHeader className="p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-md flex items-center justify-center overflow-hidden">
              {project.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover" />
              ) : (
                <div className={`h-full w-full rounded-md bg-gradient-to-br ${pickGradient(project.id)} flex items-center justify-center text-base font-semibold text-muted-foreground`}>
                  {getInitials(project.title)}
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-base font-medium line-clamp-1 cursor-pointer" onClick={() => onOpen(project)}>{project.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground line-clamp-2" onClick={() => onOpen(project)}>{project.description}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge className={`text-xs ${statusColors[project.status]}`}>{project.status.replace('-', ' ')}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={6} className="w-36">
                <DropdownMenuItem onSelect={() => onEdit(project)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 mt-2 flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {project.techStack?.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[11px]">{t}</Badge>
          ))}
          {project.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[11px]">{tag}</Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {project.noteCount ? (
              <div className="flex items-center gap-1"><StickyNote className="h-3 w-3" />{project.noteCount}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.open(project.githubUrl, '_blank'); }} className="h-7 px-2">
                <Github className="h-4 w-4 mr-1" />
                <span className="text-xs">Code</span>
              </Button>
            )}
            {project.liveUrl && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.open(project.liveUrl, '_blank'); }} className="h-7 px-2">
                <ExternalLink className="h-4 w-4 mr-1" />
                <span className="text-xs">Live</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
