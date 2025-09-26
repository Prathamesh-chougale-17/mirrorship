import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { DatabaseService } from '@/lib/mongodb';
import { z } from 'zod';
import { GitHubContribution } from '@/lib/models';

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

const syncRequestSchema = z.object({
  githubUsername: z.string().min(1),
  accessToken: z.string().optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string()
  }).optional()
});

async function fetchFromGitHubGraphQL(
  username: string,
  accessToken: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<Omit<GitHubContribution, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>> {
  const headers = {
    'Authorization': `bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const currentYear = endDate ? endDate.getFullYear() : new Date().getFullYear();
  const query = `
    query {
      user(login: "${username}") {
        name
        contributionsCollection(from: "${startDate?.toISOString() || new Date(currentYear, 0, 1).toISOString()}", to: "${endDate?.toISOString() || new Date().toISOString()}") {
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
    throw new Error(`GitHub GraphQL API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.data?.user?.contributionsCollection?.contributionCalendar?.weeks) {
    throw new Error('No contribution data found');
  }

  const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
  const pullRequests = data.data.user.contributionsCollection.pullRequestContributions?.nodes || [];
  const issues = data.data.user.contributionsCollection.issueContributions?.nodes || [];
  
  const contributions: Array<Omit<GitHubContribution, '_id' | 'userId' | 'createdAt' | 'updatedAt'>> = [];
  
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
  
  // Process contribution data from GitHub API response
  weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      const contributionDate = new Date(day.date);
      const dateStr = day.date;
      
      // Always create an entry for each day (even if 0 commits) to maintain calendar structure
      const prData = prsByDate.get(dateStr) || { opened: 0, merged: 0, reviewed: 0 };
      const issueData = issuesByDate.get(dateStr) || { opened: 0, closed: 0 };
      
      contributions.push({
        date: contributionDate,
        commitCount: day.contributionCount,
        repositories: day.contributionCount > 0 ? [{
          name: `${username}/repository`,
          commits: day.contributionCount,
          url: `https://github.com/${username}`
        }] : [],
        pullRequests: prData,
        issues: issueData
      });
    });
  });

  return contributions;
}

async function fetchGitHubContributions(
  username: string,
  accessToken?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<Omit<import('@/lib/models').GitHubContribution, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>> {
  
  if (!accessToken) {
    console.warn('No GitHub access token provided, falling back to mock data');
    throw new Error('GitHub access token required for real data');
  }

  try {
    // Use GitHub GraphQL API (similar to the cp-api implementation)
    const contributions = await fetchFromGitHubGraphQL(username, accessToken, startDate, endDate);
    return contributions;

  } catch (error) {
    console.error('GitHub API fetch error:', error);
    
    // Return empty array when API fails - no fallback data
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { githubUsername, accessToken, dateRange } = syncRequestSchema.parse(body);

    // Calculate date range (default to last 365 days)
    const endDate = dateRange?.to ? new Date(dateRange.to) : new Date();
    const startDate = dateRange?.from 
      ? new Date(dateRange.from) 
      : new Date(endDate.getTime() - (365 * 24 * 60 * 60 * 1000));

    // Fetch GitHub contributions
    const contributions = await fetchGitHubContributions(
      githubUsername, 
      accessToken,
      startDate,
      endDate
    );

    // Save to database
    await DatabaseService.saveGitHubContributions(user.id, contributions);

    // Update user platform settings
    await DatabaseService.updateUserPlatformSettings(user.id, {
      github: {
        username: githubUsername,
        accessToken: accessToken, // Note: Should be encrypted in production
        lastSyncDate: new Date(),
        syncEnabled: true
      }
    });

    return NextResponse.json({
      message: 'GitHub contributions synced successfully',
      contributionsCount: contributions.length,
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() }
    });

  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync GitHub contributions' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '365');
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const contributions = await DatabaseService.getGitHubContributions(
      user.id,
      startDate,
      endDate
    );

    const summary = await DatabaseService.getContributionSummary(user.id, days);

    return NextResponse.json({
      contributions,
      summary: summary.github,
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() }
    });

  } catch (error) {
    console.error('GitHub contributions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub contributions' }, 
      { status: 500 }
    );
  }
}