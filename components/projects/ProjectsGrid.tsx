"use client";

import React from "react";
import ProjectCard from "./ProjectCard";
import { Project } from "./types";

export default function ProjectsGrid({ projects, onEdit, onDelete, onOpen, onRequestDelete }: { projects: Project[]; onEdit: (p: Project) => void; onDelete: (id: string) => void; onOpen: (p: Project) => void; onRequestDelete: (p: Project) => void; }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {projects.map((p) => (
        <div key={p.id} className="w-full">
          <ProjectCard project={p} onEdit={onEdit} onDelete={onDelete} onOpen={onOpen} onRequestDelete={onRequestDelete} />
        </div>
      ))}
    </div>
  );
}
