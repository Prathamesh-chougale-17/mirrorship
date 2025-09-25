import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

async function getAuthUser(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieHeader
      })
    });
    return session?.user || null;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  column: z.string(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  column: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  position: z.number().optional(),
});

const updatePositionsSchema = z.array(z.object({
  id: z.string(),
  column: z.string(),
  position: z.number(),
}));

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await DatabaseService.getKanbanNotes(user.id);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching kanban notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Get the highest position in the target column
    const existingNotes = await DatabaseService.getKanbanNotes(user.id);
    const notesInColumn = existingNotes.filter(note => note.column === validatedData.column);
    const maxPosition = notesInColumn.length > 0 
      ? Math.max(...notesInColumn.map(note => note.position)) 
      : -1;

    const noteData = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: validatedData.title,
      content: validatedData.content,
      column: validatedData.column,
      position: maxPosition + 1,
      priority: validatedData.priority,
      tags: validatedData.tags || [],
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await DatabaseService.createKanbanNote(noteData);

    if (result.acknowledged) {
      return NextResponse.json(
        { 
          message: "Kanban note created successfully",
          note: noteData,
        },
        { status: 201 }
      );
    } else {
      throw new Error("Failed to create kanban note");
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating kanban note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Handle bulk position updates
    if (body.notes && Array.isArray(body.notes)) {
      const validatedUpdates = updatePositionsSchema.parse(body.notes);
      
      const result = await DatabaseService.updateKanbanNotePositions(
        user.id,
        validatedUpdates
      );

      return NextResponse.json({ 
        message: "Note positions updated successfully",
        modifiedCount: result.modifiedCount 
      });
    }

    // Handle single note update
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const validatedUpdates = updateNoteSchema.parse(updates);

    // Convert dueDate to Date object if provided
    const updatesWithDates: any = { ...validatedUpdates };
    if (validatedUpdates.dueDate) {
      updatesWithDates.dueDate = new Date(validatedUpdates.dueDate);
    }

    const result = await DatabaseService.updateKanbanNote(
      id,
      user.id,
      updatesWithDates
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Note updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating kanban note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const result = await DatabaseService.deleteKanbanNote(id, user.id);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting kanban note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}