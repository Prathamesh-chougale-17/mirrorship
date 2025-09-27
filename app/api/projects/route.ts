import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

async function getAuthUser(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers
  });

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["template", "product"]),
  techStack: z.array(z.string()),
  githubUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(["planning", "in-progress", "completed", "on-hold"]).default("planning"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(["template", "product"]).optional(),
  techStack: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(["planning", "in-progress", "completed", "on-hold"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await DatabaseService.getProjectsWithNoteCounts(user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);

    const project = {
      id: randomUUID(),
      userId: user.id,
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      completionDate: validatedData.completionDate ? new Date(validatedData.completionDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await DatabaseService.createProject(project);

    return NextResponse.json({ 
      message: "Project created successfully",
      project 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data",
        details: error.issues 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const validatedData = updateProjectSchema.parse(updateData);

    // Check if project exists and belongs to user
    const existingProject = await DatabaseService.getProjectById(id, user.id);
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updatePayload = {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      completionDate: validatedData.completionDate ? new Date(validatedData.completionDate) : undefined,
    };

    await DatabaseService.updateProject(id, user.id, updatePayload);

    return NextResponse.json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating project:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data",
        details: error.issues 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Check if project exists and belongs to user
    const existingProject = await DatabaseService.getProjectById(id, user.id);
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await DatabaseService.deleteProject(id, user.id);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}