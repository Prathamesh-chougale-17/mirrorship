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

function generateHeatmapFromContributions(contributions: any[], startDate: Date, endDate: Date) {
  const data = [];
  const contributionMap = new Map();
  
  // Create map of contributions by date
  contributions.forEach(contrib => {
    const dateStr = contrib.date.toISOString().split('T')[0];
    contributionMap.set(dateStr, contrib.commitCount);
  });

  // Generate all dates in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const count = contributionMap.get(dateStr) || 0;
    const level = count === 0 ? 0 : Math.min(4, Math.floor(count / 4) + 1);
    
    data.push({ date: dateStr, count, level });
  }

  return data;
}

function generateHeatmapFromSubmissions(submissions: any[], startDate: Date, endDate: Date) {
  const data = [];
  const submissionMap = new Map();
  
  // Create map of submissions by date
  submissions.forEach(sub => {
    const dateStr = sub.submissionDate.toISOString().split('T')[0];
    submissionMap.set(dateStr, (submissionMap.get(dateStr) || 0) + 1);
  });

  // Generate all dates in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const count = submissionMap.get(dateStr) || 0;
    const level = count === 0 ? 0 : Math.min(4, Math.floor(count / 2) + 1);
    
    data.push({ date: dateStr, count, level });
  }

  return data;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "365");

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    let contributionData: any = {
      lastUpdated: new Date().toISOString()
    };

    // Get user platform settings
    const platformSettings = await DatabaseService.getUserPlatformSettings(user.id);

    try {
      // Fetch real GitHub data
      const [githubContributions, summary] = await Promise.all([
        DatabaseService.getGitHubContributions(user.id, startDate, endDate),
        DatabaseService.getContributionSummary(user.id, days)
      ]);

      const githubHeatmap = generateHeatmapFromContributions(githubContributions, startDate, endDate);
      
      // Calculate this week's contributions
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekContributions = githubContributions
        .filter(c => c.date >= weekStart)
        .reduce((sum, c) => sum + c.commitCount, 0);

      contributionData.github = {
        currentStreak: summary.github.streak,
        thisWeek: weekContributions,
        bestStreak: summary.github.streak, // Would need historical data for actual best
        heatmap: githubHeatmap,
        username: platformSettings?.github?.username || "your-github-username",
        totalContributions: summary.github.totalCommits
      };

    } catch (error) {
      console.error("GitHub data fetch error:", error);
      // Fallback to mock GitHub data
      const generateHeatmapData = (type: 'github' | 'leetcode') => {
        const data = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
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
      contributionData.github = {
        currentStreak: Math.floor(Math.random() * 30) + 1,
        thisWeek: Math.floor(Math.random() * 50) + 5,
        bestStreak: Math.floor(Math.random() * 100) + 30,
        heatmap: githubHeatmap,
        username: "demo-user",
        totalContributions: githubHeatmap.reduce((sum, day) => sum + day.count, 0)
      };
    }

    try {
      // Fetch real LeetCode data
      const [leetcodeSubmissions, summary] = await Promise.all([
        DatabaseService.getLeetCodeSubmissions(user.id, startDate, endDate),
        DatabaseService.getContributionSummary(user.id, days)
      ]);

      const leetcodeHeatmap = generateHeatmapFromSubmissions(leetcodeSubmissions, startDate, endDate);
      
      // Calculate difficulty breakdown
      const difficultyStats = leetcodeSubmissions
        .filter(s => s.status === 'Accepted')
        .reduce((acc, sub) => {
          acc[sub.difficulty.toLowerCase()] = (acc[sub.difficulty.toLowerCase()] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Calculate this week's submissions
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekSubmissions = leetcodeSubmissions
        .filter(s => s.submissionDate >= weekStart).length;

      contributionData.leetcode = {
        solveStreak: summary.leetcode.streak,
        thisWeek: weekSubmissions,
        easy: difficultyStats.easy || 0,
        medium: difficultyStats.medium || 0,
        hard: difficultyStats.hard || 0,
        heatmap: leetcodeHeatmap,
        username: platformSettings?.leetcode?.username || "your-leetcode-username",
        ranking: Math.floor(Math.random() * 100000) + 10000, // Mock ranking
        totalSolved: (difficultyStats.easy || 0) + (difficultyStats.medium || 0) + (difficultyStats.hard || 0)
      };

    } catch (error) {
      console.error("LeetCode data fetch error:", error);
      // Fallback to mock LeetCode data
      const generateHeatmapData = (type: 'github' | 'leetcode') => {
        const data = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          let count = 0;
          let level = 0;
          if (type === 'leetcode') {
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

      const leetcodeHeatmap = generateHeatmapData('leetcode');
      contributionData.leetcode = {
        solveStreak: Math.floor(Math.random() * 20) + 1,
        thisWeek: Math.floor(Math.random() * 15) + 1,
        easy: Math.floor(Math.random() * 200) + 50,
        medium: Math.floor(Math.random() * 150) + 30,
        hard: Math.floor(Math.random() * 50) + 5,
        heatmap: leetcodeHeatmap,
        username: "demo-user",
        ranking: Math.floor(Math.random() * 100000) + 10000,
        totalSolved: 0 // Will be calculated below
      };

      contributionData.leetcode.totalSolved = 
        contributionData.leetcode.easy + 
        contributionData.leetcode.medium + 
        contributionData.leetcode.hard;
    }

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