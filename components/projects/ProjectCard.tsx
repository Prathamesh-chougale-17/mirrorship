"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Package, Palette, Clock, CheckCircle, AlertCircle, StickyNote } from "lucide-react";
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

export default function ProjectCard({ project, onEdit, onDelete, onOpen }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: string) => void; onOpen: (p: Project) => void; }) {
  const StatusIcon = statusIcons[project.status] ?? Clock;
  const TypeIcon = typeIcons[project.type] ?? Package;

  return (
    <Card className="flex flex-col h-40 p-3 hover:shadow-md transition-shadow rounded-lg">
      <CardHeader className="p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center overflow-hidden">
              {project.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover" />
              ) : (
                <TypeIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-medium line-clamp-1 cursor-pointer" onClick={() => onOpen(project)}>{project.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground line-clamp-2" onClick={() => onOpen(project)}>{project.description}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge className={`text-xs ${statusColors[project.status]}`}>{project.status.replace('-', ' ')}</Badge>
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
