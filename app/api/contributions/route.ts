import { NextRequest, NextResponse } from "next/server";
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

    // Generate heatmap data for the last 12 months
    const generateHeatmapData = (type: 'github' | 'leetcode') => {
      const data = [];
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 12);

      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        let count = 0;
        let level = 0;

        if (type === 'github') {
          const random = Math.random();
          if (random > 0.3) {
            count = Math.floor(Math.random() * 15) + 1;
            level = count === 0 ? 0 : Math.min(4, Math.floor(count / 4) + 1);
          }
        } else {
          const random = Math.random();
          if (random > 0.4) {
            count = Math.floor(Math.random() * 8) + 1;
            level = count === 0 ? 0 : Math.min(4, Math.floor(count / 2) + 1);
          }
        }

        data.push({ date: dateStr, count, level });
      }

      return data;
    };

    const githubHeatmap = generateHeatmapData('github');
    const leetcodeHeatmap = generateHeatmapData('leetcode');

    const contributionData = {
      github: {
        currentStreak: Math.floor(Math.random() * 30) + 1,
        thisWeek: Math.floor(Math.random() * 50) + 5,
        bestStreak: Math.floor(Math.random() * 100) + 30,
        heatmap: githubHeatmap,
        username: "your-github-username",
        totalContributions: githubHeatmap.reduce((sum, day) => sum + day.count, 0)
      },
      leetcode: {
        solveStreak: Math.floor(Math.random() * 20) + 1,
        thisWeek: Math.floor(Math.random() * 15) + 1,
        easy: Math.floor(Math.random() * 200) + 50,
        medium: Math.floor(Math.random() * 150) + 30,
        hard: Math.floor(Math.random() * 50) + 5,
        heatmap: leetcodeHeatmap,
        username: "your-leetcode-username",
        ranking: Math.floor(Math.random() * 100000) + 10000,
        totalSolved: 0 // Will be calculated below
      },
      lastUpdated: new Date().toISOString()
    };

    // Calculate derived values
    contributionData.leetcode.totalSolved = 
      contributionData.leetcode.easy + 
      contributionData.leetcode.medium + 
      contributionData.leetcode.hard;

    return NextResponse.json(contributionData);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Future implementation ideas:
/*
GitHub API Integration:
- GET /users/{username}/events (for contribution activity)
- Use GitHub GraphQL API for contribution calendar data
- Webhook integration for real-time updates

LeetCode API Integration:
- LeetCode doesn't have official API, but there are community solutions:
- Use leetcode-query npm package
- Scrape LeetCode GraphQL endpoint (unofficial)
- Track via browser extension data

Real-time Updates:
- WebSocket connection for live updates
- Cron job to fetch and cache data periodically
- Browser notification when streak is at risk
*/