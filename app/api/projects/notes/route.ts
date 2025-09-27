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

const createNoteSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  type: z.enum(["brief", "architecture", "feature", "bug", "idea", "meeting", "other"]).default("brief"),
  tags: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  isCompleted: z.boolean().default(false),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  type: z.enum(["brief", "architecture", "feature", "bug", "idea", "meeting", "other"]).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  isCompleted: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const noteId = url.searchParams.get("id");

    if (noteId) {
      // Get specific note
      const note = await DatabaseService.getProjectNoteById(noteId, user.id);
      if (!note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      return NextResponse.json({ note });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Verify project belongs to user
    const project = await DatabaseService.getProjectById(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const notes = await DatabaseService.getProjectNotes(user.id, projectId);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching project notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createNoteSchema.parse(body);

    // Verify project belongs to user
    const project = await DatabaseService.getProjectById(validatedData.projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const note = {
      id: randomUUID(),
      userId: user.id,
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await DatabaseService.createProjectNote(note);

    return NextResponse.json({ 
      message: "Note created successfully",
      note 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating project note:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data",
        details: error.issues 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
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
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const validatedData = updateNoteSchema.parse(updateData);

    // Check if note exists and belongs to user
    const existingNote = await DatabaseService.getProjectNoteById(id, user.id);
    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await DatabaseService.updateProjectNote(id, user.id, validatedData);

    return NextResponse.json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("Error updating project note:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data",
        details: error.issues 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
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
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    // Check if note exists and belongs to user
    const existingNote = await DatabaseService.getProjectNoteById(id, user.id);
    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await DatabaseService.deleteProjectNote(id, user.id);

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting project note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}