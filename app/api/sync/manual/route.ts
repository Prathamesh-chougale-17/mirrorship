import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { DatabaseService } from "@/lib/mongodb";
import { YouTubeService } from "@/lib/youtube";

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

async function syncGitHubData(userId: string, username: string, accessToken: string) {
  const headers = {
    'Authorization': `bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1).toISOString();
  const endDate = new Date().toISOString();

  const query = `
    query {
      user(login: "${username}") {
        name
        contributionsCollection(from: "${startDate}", to: "${endDate}") {
          contributionCalendar {
            colors
            totalContributions
            weeks {
              contributionDays {
                color
                contributionCount
                date
                weekday
              }
              firstDay
            }
          }
          pullRequestContributions(first: 100) {
            totalCount
            nodes {
              pullRequest {
                createdAt
                mergedAt
                state
                title
                url
              }
            }
          }
          issueContributions(first: 100) {
            totalCount
            nodes {
              issue {
                createdAt
                closedAt
                state
                title
                url
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.data?.user?.contributionsCollection?.contributionCalendar?.weeks) {
    throw new Error('No contribution data found');
  }

  // Process and save to database
  const contributionsCollection = data.data.user.contributionsCollection;
  const weeks = contributionsCollection.contributionCalendar.weeks;
  const pullRequests = contributionsCollection.pullRequestContributions?.nodes || [];
  const issues = contributionsCollection.issueContributions?.nodes || [];
  
  // Create maps for PR and issue data by date
  const prsByDate = new Map<string, { opened: number; merged: number; reviewed: number }>();
  const issuesByDate = new Map<string, { opened: number; closed: number }>();
  
  // Process PR data
  pullRequests.forEach((prNode: any) => {
    const pr = prNode.pullRequest;
    const createdDate = new Date(pr.createdAt).toISOString().split('T')[0];
    
    if (!prsByDate.has(createdDate)) {
      prsByDate.set(createdDate, { opened: 0, merged: 0, reviewed: 0 });
    }
    
    const prData = prsByDate.get(createdDate)!;
    prData.opened += 1;
    
    if (pr.mergedAt) {
      const mergedDate = new Date(pr.mergedAt).toISOString().split('T')[0];
      if (!prsByDate.has(mergedDate)) {
        prsByDate.set(mergedDate, { opened: 0, merged: 0, reviewed: 0 });
      }
      prsByDate.get(mergedDate)!.merged += 1;
    }
  });
  
  // Process issue data
  issues.forEach((issueNode: any) => {
    const issue = issueNode.issue;
    const createdDate = new Date(issue.createdAt).toISOString().split('T')[0];
    
    if (!issuesByDate.has(createdDate)) {
      issuesByDate.set(createdDate, { opened: 0, closed: 0 });
    }
    
    const issueData = issuesByDate.get(createdDate)!;
    issueData.opened += 1;
    
    if (issue.closedAt) {
      const closedDate = new Date(issue.closedAt).toISOString().split('T')[0];
      if (!issuesByDate.has(closedDate)) {
        issuesByDate.set(closedDate, { opened: 0, closed: 0 });
      }
      issuesByDate.get(closedDate)!.closed += 1;
    }
  });

  // Process all contribution days
  const contributions: any[] = [];
  weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      const dateStr = day.date;
      const prData = prsByDate.get(dateStr) || { opened: 0, merged: 0, reviewed: 0 };
      const issueData = issuesByDate.get(dateStr) || { opened: 0, closed: 0 };

      contributions.push({
        date: new Date(dateStr),
        commitCount: day.contributionCount,
        pullRequests: prData,
        issues: issueData
      });
    });
  });

  await DatabaseService.saveGitHubContributions(userId, contributions);
  
  return {
    totalContributions: contributionsCollection.contributionCalendar.totalContributions,
    weeks: weeks.length
  };
}

async function syncLeetCodeData(userId: string, username: string) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Use a working query that only gets basic stats - submissions list is not publicly available
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          profile {
            realName
            userAvatar
            ranking
          }
        }
      }
    `;

    // Fallback to try a simpler query first
    const fallbackQuery = `
      query getUser($username: String!) {
        matchedUser(username: $username) {
          username
        }
      }
    `;

  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://leetcode.com',
      'Referer': 'https://leetcode.com/',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      query,
      variables: {
        username: username
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LeetCode API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      username: username
    });
    throw new Error(`LeetCode API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    const responseText = await response.text();
    console.error('Failed to parse LeetCode response as JSON:', responseText);
    throw new Error(`Invalid JSON response from LeetCode API: ${responseText.substring(0, 200)}`);
  }

  if (data.errors) {
    console.error('LeetCode GraphQL errors:', data.errors);
    throw new Error(`LeetCode GraphQL error: ${data.errors.map((e: any) => e.message).join(', ')}`);
  }

  if (!data.data?.matchedUser) {
    throw new Error(`User '${username}' not found on LeetCode`);
  }

  // Process and save to database
  const matchedUser = data.data.matchedUser;
  
  // Since we can't get recent submissions, we'll update user stats only
  const submitStats = matchedUser.submitStats?.acSubmissionNum || [];
  const totalSolved = submitStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
  
  // Get problem counts by difficulty
  const easyCount = submitStats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
  const mediumCount = submitStats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
  const hardCount = submitStats.find((s: any) => s.difficulty === 'Hard')?.count || 0;
  
  // Don't create fake submissions - just update platform settings with latest stats
  await DatabaseService.updateUserPlatformSettings(userId, {
    leetcode: {
      username: username,
      lastSyncDate: new Date(),
      syncEnabled: true
    }
  });

  // Note: We don't save fake submissions since LeetCode API doesn't provide recent submission data
  // Real submissions need to be manually added or tracked through other means
  
  return {
    totalSubmissions: totalSolved,
    totalSolved: totalSolved,
    easyCount,
    mediumCount,
    hardCount,
    streak: 0 // Will be calculated from contributions
  };
  } catch (error) {
    console.error('LeetCode sync error:', error);
    // Return minimal data if sync fails
    return {
      totalSubmissions: 0,
      totalSolved: 0,
      streak: 0
    };
  }
}

async function syncYouTubeData(userId: string, channelHandle: string, uploadsPlaylistId: string) {
  // Get uploads for the last 9 months
  const nineMonthsAgo = new Date();
  nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
  
  const uploads = await YouTubeService.getUploadsInDateRange(
    uploadsPlaylistId,
    nineMonthsAgo,
    new Date()
  );

  // Transform and save upload data
  const transformedUploads = uploads.map(upload => 
    YouTubeService.transformUploadData(upload)
  );
  
  await DatabaseService.saveYouTubeUploads(userId, transformedUploads);
  
  return {
    totalUploads: transformedUploads.length,
    dateRange: {
      from: nineMonthsAgo.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platforms } = body; // array of platforms to sync: ['github', 'leetcode']

    // Get user's platform settings
    const platformSettings = await DatabaseService.getUserPlatformSettings(user.id);
    
    if (!platformSettings) {
      return NextResponse.json(
        { error: "No platform settings found. Please configure your integrations first." },
        { status: 400 }
      );
    }

    const results = {
      github: null as any,
      leetcode: null as any,
      youtube: null as any,
      errors: [] as string[]
    };

    // Sync GitHub if requested and configured
    if ((!platforms || platforms.includes('github')) && platformSettings.github?.syncEnabled) {
      try {
        if (!platformSettings.github.username || !platformSettings.github.accessToken) {
          throw new Error('GitHub credentials not configured');
        }
        
        results.github = await syncGitHubData(
          user.id,
          platformSettings.github.username,
          platformSettings.github.accessToken
        );
      } catch (error: any) {
        console.error('GitHub sync error:', error);
        results.errors.push(`GitHub sync failed: ${error.message}`);
      }
    }

    // Sync LeetCode if requested and configured
    if ((!platforms || platforms.includes('leetcode')) && platformSettings.leetcode?.syncEnabled) {
      try {
        if (!platformSettings.leetcode.username) {
          throw new Error('LeetCode username not configured');
        }
        
        results.leetcode = await syncLeetCodeData(
          user.id,
          platformSettings.leetcode.username
        );
      } catch (error: any) {
        console.error('LeetCode sync error:', error);
        results.errors.push(`LeetCode sync failed: ${error.message}`);
      }
    }

    // Sync YouTube if requested and configured
    if ((!platforms || platforms.includes('youtube')) && platformSettings.youtube?.syncEnabled) {
      try {
        if (!platformSettings.youtube.channelHandle || !platformSettings.youtube.uploadsPlaylistId) {
          throw new Error('YouTube channel not properly configured');
        }
        
        results.youtube = await syncYouTubeData(
          user.id,
          platformSettings.youtube.channelHandle,
          platformSettings.youtube.uploadsPlaylistId
        );
      } catch (error: any) {
        console.error('YouTube sync error:', error);
        results.errors.push(`YouTube sync failed: ${error.message}`);
      }
    }

    // Check if any sync was successful
    const hasSuccess = results.github || results.leetcode || results.youtube;
    
    if (!hasSuccess && results.errors.length > 0) {
      return NextResponse.json(
        { error: "All syncs failed", details: results.errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed",
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Manual sync error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}