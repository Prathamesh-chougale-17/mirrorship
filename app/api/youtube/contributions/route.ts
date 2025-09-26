import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/mongodb";
import { auth } from "@/auth";

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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    
    // Default to 9 months ago if no from date provided
    const fromDate = fromParam ? new Date(fromParam) : (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 9);
      return date;
    })();

    // Get YouTube uploads
    const uploads = await DatabaseService.getYouTubeUploads(user.id, fromDate, new Date());
    
    // Transform to contribution format (group by date)
    const contributionMap = new Map<string, number>();
    
    uploads.forEach(upload => {
      const dateStr = upload.publishedAt.toISOString().split('T')[0];
      contributionMap.set(dateStr, (contributionMap.get(dateStr) || 0) + 1);
    });

    // Convert to array format expected by ContributionGraph
    const data = Array.from(contributionMap.entries()).map(([date, count]) => ({
      date,
      count,
      level: Math.min(Math.floor(count / 2) + 1, 4) // Scale: 0-4 levels
    }));

    // Calculate stats
    const totalUploads = uploads.length;
    const currentDate = new Date();
    const thisWeekStart = new Date(currentDate);
    thisWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const thisWeekUploads = uploads.filter(upload => upload.publishedAt >= thisWeekStart).length;
    
    // Calculate upload streak (consecutive days with uploads)
    const sortedDates = Array.from(contributionMap.keys()).sort().reverse();
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (diffDays === 1) {
          tempStreak++;
          if (i === 1) currentStreak = tempStreak;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
          if (i === 1) currentStreak = 0;
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    const stats = {
      totalUploads,
      currentStreak,
      thisWeek: thisWeekUploads,
      bestStreak,
      totalViews: uploads.reduce((sum, upload) => sum + (upload.viewCount || 0), 0),
      avgViewsPerVideo: totalUploads > 0 ? Math.round(uploads.reduce((sum, upload) => sum + (upload.viewCount || 0), 0) / totalUploads) : 0
    };

    return NextResponse.json({
      data,
      stats
    });

  } catch (error) {
    console.error("Error fetching YouTube contributions:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch YouTube contributions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}