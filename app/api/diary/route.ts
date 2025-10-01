import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
import { AIService } from "@/lib/ai";
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

const createEntrySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

const updateEntrySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  mood: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const date = url.searchParams.get("date");
    const month = url.searchParams.get("month");

    if (date) {
      // Get specific entry by date
      const entry = await DatabaseService.getDiaryEntryByDate(user.id, date);
      return NextResponse.json({ entry });
    } else if (month) {
      // Get entries for a specific month (format: YYYY-MM)
      const entries = await DatabaseService.getDiaryEntriesByMonth(user.id, month);
      return NextResponse.json({ entries });
    } else {
      // Get multiple entries
      const entries = await DatabaseService.getDiaryEntries(user.id, limit, skip);
      return NextResponse.json({ entries });
    }
  } catch (error) {
    console.error("Error fetching diary entries:", error);
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
    const validatedData = createEntrySchema.parse(body);

    // Check if entry for this date already exists
    const existingEntry = await DatabaseService.getDiaryEntryByDate(
      user.id,
      validatedData.date
    );

    if (existingEntry) {
      return NextResponse.json(
        { error: "Entry for this date already exists" },
        { status: 400 }
      );
    }

    // Generate AI insights if content is substantial
    let aiSummary = "";
    let generatedTags: string[] = [];
    let analyzedMood = validatedData.mood;

    if (validatedData.content.length > 50) {
      try {
        // Generate AI summary
        const summaryResult = await AIService.generateDailySummary({
          ...validatedData,
          id: crypto.randomUUID(),
          userId: user.id,
          tags: validatedData.tags || [],
          aiSummary: "",
          wordCount: validatedData.content.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        aiSummary = summaryResult.summary;
        
        // Generate tags if not provided
        if (!validatedData.tags || validatedData.tags.length === 0) {
          generatedTags = await AIService.generateTags(validatedData.content);
        }

        // Analyze mood if not provided
        if (!validatedData.mood && summaryResult.mood) {
          analyzedMood = summaryResult.mood.score;
        }
      } catch (aiError) {
        console.error("AI processing error:", aiError);
        // Continue without AI features if they fail
      }
    }

    const entryData = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: validatedData.title,
      content: validatedData.content,
      date: validatedData.date,
      mood: analyzedMood,
      tags: validatedData.tags || generatedTags,
      aiSummary,
      wordCount: validatedData.content.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await DatabaseService.createDiaryEntry(entryData);

    if (result.acknowledged) {
      try {
        // Ensure a single daily motivational quote is created per user/date
        const existingQuote = await DatabaseService.getDailyQuote(user.id, validatedData.date);
        if (!existingQuote) {
          // Get recent entries for context (exclude today's date)
          const recent = await DatabaseService.getLatestDiaryEntriesForContext(user.id, validatedData.date, 5);
          const quoteText = await AIService.generateMotivationalQuote(recent as any as import("@/lib/models").DiaryEntry[]);
          await DatabaseService.createDailyQuote({
            id: crypto.randomUUID(),
            userId: user.id,
            date: validatedData.date,
            quote: quoteText,
            source: 'ai-generated',
          });
        }
      } catch (qError) {
        console.error('Error generating/storing daily quote:', qError);
        // Continue without blocking diary creation
      }
      return NextResponse.json(
        { 
          message: "Diary entry created successfully",
          entry: entryData,
          // Include today's quote if available (non-blocking)
          quote: await DatabaseService.getDailyQuote(user.id, validatedData.date)
        },
        { status: 201 }
      );
    } else {
      throw new Error("Failed to create diary entry");
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating diary entry:", error);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const validatedUpdates = updateEntrySchema.parse(updates);

    // Update word count if content is being updated
    if (validatedUpdates.content) {
      (validatedUpdates as any).wordCount = validatedUpdates.content.length;

      // Regenerate AI summary if content changed significantly
      if (validatedUpdates.content.length > 50) {
        try {
          const summaryResult = await AIService.generateDailySummary({
            id,
            userId: user.id,
            title: validatedUpdates.title || "",
            content: validatedUpdates.content,
            date: new Date().toISOString().split('T')[0],
            tags: validatedUpdates.tags || [],
            aiSummary: "",
            wordCount: validatedUpdates.content.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          (validatedUpdates as any).aiSummary = summaryResult.summary;
        } catch (aiError) {
          console.error("AI processing error:", aiError);
        }
      }
    }

    const result = await DatabaseService.updateDiaryEntry(
      id,
      user.id,
      validatedUpdates
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Entry not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Entry updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating diary entry:", error);
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
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const result = await DatabaseService.deleteDiaryEntry(id, user.id);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Entry not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}