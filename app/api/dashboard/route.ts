import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get dashboard statistics
    const stats = await DatabaseService.getDashboardStats(user.id);

    // Get recent diary entries (last 7 days)
    const recentEntries = await DatabaseService.getDiaryEntries(user.id, 7);

    // Get recent activities
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const activities = await DatabaseService.getActivityEntries(user.id, thirtyDaysAgo);

    // Get activity summary for charts
    const activitySummary = await DatabaseService.getActivitySummary(user.id, 30);

    // Get mood trends from recent entries
    const entriesWithMood = recentEntries.filter(entry => entry.mood !== undefined);
    const moodTrend = entriesWithMood.length > 0 ? {
      average: entriesWithMood.reduce((sum, entry) => sum + (entry.mood || 0), 0) / entriesWithMood.length,
      data: entriesWithMood.map(entry => ({
        date: entry.date,
        mood: entry.mood || 0
      })).reverse()
    } : null;

    // Calculate streaks
    const sortedEntries = recentEntries.sort((a, b) => b.date.localeCompare(a.date));
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      const expectedDate = new Date(checkDate);
      expectedDate.setDate(expectedDate.getDate() - currentStreak);
      
      if (entryDate.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }

    const response = {
      stats: {
        ...stats,
        currentStreak,
        moodAverage: moodTrend?.average || null,
      },
      recentEntries: recentEntries.map(entry => ({
        id: entry.id,
        title: entry.title,
        date: entry.date,
        mood: entry.mood,
        wordCount: entry.wordCount,
        aiSummary: entry.aiSummary?.substring(0, 100) + (entry.aiSummary && entry.aiSummary.length > 100 ? '...' : ''),
      })),
      moodTrend,
      activitySummary: activitySummary.map(activity => ({
        type: activity._id,
        count: activity.count,
        totalValue: activity.totalValue,
        avgValue: Math.round(activity.avgValue || 0)
      })),
      recentActivities: activities.slice(0, 10).map(activity => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        date: activity.date,
        value: activity.value,
        unit: activity.unit
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}