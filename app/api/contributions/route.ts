import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { DatabaseService } from "@/lib/mongodb";

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

    // Get date range (last 365 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    // Fetch real GitHub contributions
    const githubContributions = await DatabaseService.getGitHubContributions(
      user.id, 
      startDate, 
      endDate
    );

    // Fetch real LeetCode submissions
    const leetcodeSubmissions = await DatabaseService.getLeetCodeSubmissions(
      user.id,
      startDate,
      endDate
    );

    // Transform GitHub data to contribution graph format
    const githubActivityMap = new Map();
    githubContributions.forEach(contrib => {
      const dateStr = contrib.date.toISOString().split('T')[0];
      const prCount = (contrib.pullRequests?.opened || 0) + (contrib.pullRequests?.merged || 0);
      const issueCount = (contrib.issues?.opened || 0) + (contrib.issues?.closed || 0);
      const totalCount = contrib.commitCount + prCount + issueCount;
      
      githubActivityMap.set(dateStr, {
        date: dateStr,
        count: totalCount,
        level: Math.min(4, Math.floor(totalCount / 4) + 1)
      });
    });

    // Transform LeetCode data to contribution graph format
    const leetcodeActivityMap = new Map();
    const dailySubmissions = new Map();

    leetcodeSubmissions.forEach(submission => {
      const dateStr = submission.submissionDate.toISOString().split('T')[0];
      const count = dailySubmissions.get(dateStr) || 0;
      dailySubmissions.set(dateStr, count + 1);
    });

    dailySubmissions.forEach((count, dateStr) => {
      leetcodeActivityMap.set(dateStr, {
        date: dateStr,
        count,
        level: Math.min(4, Math.floor(count / 2) + 1)
      });
    });

    // Generate complete year data with zeros for missing days
    const githubData = [];
    const leetcodeData = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      githubData.push(
        githubActivityMap.get(dateStr) || {
          date: dateStr,
          count: 0,
          level: 0
        }
      );

      leetcodeData.push(
        leetcodeActivityMap.get(dateStr) || {
          date: dateStr,
          count: 0,
          level: 0
        }
      );
    }

    // Calculate streaks and stats
    const githubStats = {
      currentStreak: calculateCurrentStreak(githubData),
      totalContributions: githubData.reduce((sum, day) => sum + day.count, 0),
      thisWeek: githubData.slice(-7).reduce((sum, day) => sum + day.count, 0),
      bestStreak: calculateBestStreak(githubData)
    };

    const leetcodeStats = {
      solveStreak: calculateCurrentStreak(leetcodeData),
      totalSolved: leetcodeData.reduce((sum, day) => sum + day.count, 0),
      thisWeek: leetcodeData.slice(-7).reduce((sum, day) => sum + day.count, 0),
      easy: leetcodeSubmissions.filter(s => s.difficulty === 'Easy').length,
      medium: leetcodeSubmissions.filter(s => s.difficulty === 'Medium').length,
      hard: leetcodeSubmissions.filter(s => s.difficulty === 'Hard').length
    };

    return NextResponse.json({
      github: {
        data: githubData,
        stats: githubStats
      },
      leetcode: {
        data: leetcodeData,
        stats: leetcodeStats
      }
    });

  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}

function calculateCurrentStreak(data: Array<{ date: string; count: number; level: number }>): number {
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = data.findIndex(d => d.date === today);
  
  if (todayIndex === -1) return 0;

  let streak = 0;
  for (let i = todayIndex; i >= 0; i--) {
    if (data[i].count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateBestStreak(data: Array<{ date: string; count: number; level: number }>): number {
  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of data) {
    if (day.count > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}