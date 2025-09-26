import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/mongodb";

// Admin API key for batch operations (set this in your environment)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

async function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === ADMIN_API_KEY;
}

async function syncUserData(userId: string, platformSettings: any) {
  const results = {
    github: null as any,
    leetcode: null as any,
    errors: [] as string[]
  };

  // Sync GitHub if configured
  if (platformSettings.github?.syncEnabled && platformSettings.github.username && platformSettings.github.accessToken) {
    try {
      const githubResult = await syncGitHubData(userId, platformSettings.github.username, platformSettings.github.accessToken);
      results.github = githubResult;
    } catch (error: any) {
      console.error(`GitHub sync failed for user ${userId}:`, error);
      results.errors.push(`GitHub: ${error.message}`);
    }
  }

  // Sync LeetCode if configured
  if (platformSettings.leetcode?.syncEnabled && platformSettings.leetcode.username) {
    try {
      const leetcodeResult = await syncLeetCodeData(userId, platformSettings.leetcode.username);
      results.leetcode = leetcodeResult;
    } catch (error: any) {
      console.error(`LeetCode sync failed for user ${userId}:`, error);
      results.errors.push(`LeetCode: ${error.message}`);
    }
  }

  return results;
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

  // Process and save data (same logic as manual sync)
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
      'User-Agent': 'Mirrorship-Batch-Sync',
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

  // Process and save data (same logic as manual sync)
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
      difficulty: 'Unknown'
    });
  });

  await DatabaseService.saveLeetCodeSubmissions(userId, submissions);
  
  return {
    totalSubmissions: recentSubmissions.length,
    streak: matchedUser.userCalendar?.streak || 0
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!ADMIN_API_KEY) {
      return NextResponse.json(
        { error: "Admin API key not configured" },
        { status: 500 }
      );
    }

    const isAuthenticated = await authenticateAdmin(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Admin API key required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { syncAll } = body;

    if (!syncAll) {
      return NextResponse.json(
        { error: "syncAll parameter is required" },
        { status: 400 }
      );
    }

    console.log('🚀 Starting batch sync for all users...');

    // Get all users with platform settings
    const usersWithSettings = await DatabaseService.getUsersWithPlatformSettings();
    
    if (!usersWithSettings || usersWithSettings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found with platform settings",
        results: { processedUsers: 0, totalErrors: 0 }
      });
    }

    console.log(`Found ${usersWithSettings.length} users with platform settings`);

    let processedUsers = 0;
    let totalErrors = 0;
    const userResults: any[] = [];

    // Process users sequentially to avoid overwhelming APIs
    for (const user of usersWithSettings) {
      try {
        console.log(`Syncing data for user: ${user.email} (${user._id})`);
        
        // Get platform settings for this user
        const platformSettings = await DatabaseService.getUserPlatformSettings(user._id.toString());
        
        if (platformSettings) {
          const userResult = await syncUserData(user._id.toString(), platformSettings);
          userResults.push({
            userId: user._id,
            email: user.email,
            ...userResult
          });
          
          if (userResult.errors.length > 0) {
            totalErrors += userResult.errors.length;
          }
        }
        
        processedUsers++;
        
        // Small delay to be nice to APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`Failed to sync user ${user.email}:`, error);
        totalErrors++;
        userResults.push({
          userId: user._id,
          email: user.email,
          errors: [error.message]
        });
      }
    }

    console.log(`✅ Batch sync completed. Processed ${processedUsers} users with ${totalErrors} total errors.`);

    return NextResponse.json({
      success: true,
      message: `Batch sync completed. Processed ${processedUsers} users.`,
      results: {
        processedUsers,
        totalErrors,
        userResults: userResults.slice(0, 10) // Limit response size, only return first 10 for logging
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Batch sync error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}