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
  const currentYear = new Date().getFullYear();
  
  const query = `
    query userProfileCalendar($username: String!, $year: Int) {
      matchedUser(username: $username) {
        username
        userCalendar(year: $year) {
          activeYears
          streak
          totalActiveDays
          submissionCalendar
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        recentAcSubmissionList(limit: 100) {
          id
          title
          titleSlug
          timestamp
        }
      }
    }
  `;

  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mirrorship-App',
      'Referer': 'https://leetcode.com/'
    },
    body: JSON.stringify({
      query,
      variables: {
        username: username,
        year: currentYear
      }
    })
  });

  if (!response.ok) {
    throw new Error(`LeetCode API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.data?.matchedUser) {
    throw new Error('User not found on LeetCode');
  }

  // Process and save to database
  const matchedUser = data.data.matchedUser;
  const submissions: any[] = [];
  const recentSubmissions = matchedUser.recentAcSubmissionList || [];
  
  // Process recent submissions
  recentSubmissions.forEach((submission: any) => {
    submissions.push({
      problemTitle: submission.title,
      problemSlug: submission.titleSlug,
      submissionDate: new Date(submission.timestamp * 1000),
      status: 'Accepted',
      difficulty: 'Unknown' // LeetCode API doesn't provide difficulty in this endpoint
    });
  });

  await DatabaseService.saveLeetCodeSubmissions(userId, submissions);
  
  return {
    totalSubmissions: recentSubmissions.length,
    streak: matchedUser.userCalendar?.streak || 0
  };
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