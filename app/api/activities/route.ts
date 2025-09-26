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

const createActivitySchema = z.object({
  type: z.enum(["github", "social", "learning", "exercise", "reading", "custom"]),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateActivitySchema = z.object({
  type: z.enum(["github", "social", "learning", "exercise", "reading", "custom"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const type = url.searchParams.get("type");

    let activities = await DatabaseService.getActivityEntries(
      user.id, 
      startDate || undefined, 
      endDate || undefined
    );

    // Filter by type if specified
    if (type) {
      activities = activities.filter(activity => activity.type === type);
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
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
    const validatedData = createActivitySchema.parse(body);

    const activityData = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      value: validatedData.value,
      unit: validatedData.unit,
      date: validatedData.date,
      metadata: validatedData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await DatabaseService.createActivityEntry(activityData);

    if (result.acknowledged) {
      return NextResponse.json(
        { 
          message: "Activity created successfully",
          activity: activityData,
        },
        { status: 201 }
      );
    } else {
      throw new Error("Failed to create activity");
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// For GitHub integration - special endpoint to sync GitHub activity
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This endpoint should integrate with real GitHub API data
    // For now, return an error indicating this feature needs implementation
    return NextResponse.json({
      error: "GitHub activity sync not yet implemented. Please use the /api/sync/github endpoint instead.",
    }, { status: 501 });
  } catch (error) {
    console.error("Error syncing GitHub activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}