import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { DatabaseService } from '@/lib/mongodb';
import { z } from 'zod';
import  {LeetCodeSubmission} from '@/lib/models';

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
  leetcodeUsername: z.string().min(1),
  sessionCookie: z.string().optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string()
  }).optional()
});

async function fetchFromLeetCodeAPI(
  username: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<Array<Omit<LeetCodeSubmission, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>> {
  try {
    // LeetCode GraphQL endpoint (unofficial but widely used)
    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mirrorship-App',
        'Referer': 'https://leetcode.com/'
      },
      body: JSON.stringify({
        query: `
          query userProfileCalendar($username: String!, $year: Int) {
            matchedUser(username: $username) {
              userCalendar(year: $year) {
                activeYears
                streak
                totalActiveDays
                dccBadges {
                  timestamp
                  badge {
                    name
                    icon
                  }
                }
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
              recentAcSubmissionList {
                id
                title
                titleSlug
                timestamp
              }
            }
          }
        `,
        variables: {
          username: username,
          year: endDate ? endDate.getFullYear() : new Date().getFullYear()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`LeetCode API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data?.matchedUser) {
      throw new Error('User not found or no data available');
    }

    const matchedUser = data.data.matchedUser;
    const submissions: Array<Omit<LeetCodeSubmission, '_id' | 'userId' | 'createdAt' | 'updatedAt'>> = [];

    // Process recent submissions if available
    const recentSubmissions = matchedUser.recentAcSubmissionList || [];
    recentSubmissions.forEach((submission: any, index: number) => {
      const submissionDate = new Date(parseInt(submission.timestamp) * 1000);
      
      // Filter by date range
      if (startDate && submissionDate < startDate) return;
      if (endDate && submissionDate > endDate) return;

      submissions.push({
        submissionId: submission.id || `recent-${index}`,
        problemTitle: submission.title,
        problemSlug: submission.titleSlug,
        difficulty: 'Easy', // Default since we don't get difficulty from recent submissions
        status: 'Accepted', // Recent accepted submissions
        language: 'Unknown', // Not available in this API response
        runtime: undefined,
        memory: undefined,
        submissionDate: submissionDate,
        problemUrl: `https://leetcode.com/problems/${submission.titleSlug}/`
      });
    });

    // If no recent submissions or we need more data, process calendar data
    const submissionCalendar = matchedUser.userCalendar?.submissionCalendar;
    if (submissionCalendar && submissions.length === 0) {
      const calendarData = JSON.parse(submissionCalendar);
      
      for (const [timestamp, count] of Object.entries(calendarData)) {
        const submissionDate = new Date(parseInt(timestamp) * 1000);
        
        // Filter by date range
        if (startDate && submissionDate < startDate) continue;
        if (endDate && submissionDate > endDate) continue;

        const dailyCount = parseInt(count as string);
        if (dailyCount > 0) {
          submissions.push({
            submissionId: `${timestamp}-daily`,
            problemTitle: `Daily Activity (${dailyCount} submissions)`,
            problemSlug: `daily-activity-${timestamp}`,
            difficulty: 'Easy',
            status: 'Accepted',
            language: 'Multiple',
            runtime: undefined,
            memory: undefined,
            submissionDate: submissionDate,
            problemUrl: `https://leetcode.com/${username}/`
          });
        }
      }
    }

    return submissions;

  } catch (error) {
    console.error('LeetCode API fetch error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leetcodeUsername, sessionCookie, dateRange } = syncRequestSchema.parse(body);

    // Calculate date range (default to last 365 days)
    const endDate = dateRange?.to ? new Date(dateRange.to) : new Date();
    const startDate = dateRange?.from 
      ? new Date(dateRange.from) 
      : new Date(endDate.getTime() - (365 * 24 * 60 * 60 * 1000));

    // Fetch LeetCode submissions
    const submissions = await fetchLeetCodeSubmissions(
      leetcodeUsername, 
      sessionCookie,
      startDate,
      endDate
    );

    // Save to database
    await DatabaseService.saveLeetCodeSubmissions(user.id, submissions);

    // Update user platform settings
    await DatabaseService.updateUserPlatformSettings(user.id, {
      leetcode: {
        username: leetcodeUsername,
        sessionCookie: sessionCookie, // Note: Should be encrypted in production
        lastSyncDate: new Date(),
        syncEnabled: true
      }
    });

    return NextResponse.json({
      message: 'LeetCode submissions synced successfully',
      submissionsCount: submissions.length,
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() }
    });

  } catch (error) {
    console.error('LeetCode sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync LeetCode submissions' }, 
      { status: 500 }
    );
  }
}

async function fetchLeetCodeSubmissions(
  username: string,
  sessionCookie?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<Omit<LeetCodeSubmission, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>> {
  try {
    // Use LeetCode GraphQL API (similar to the cp-api implementation)
    const submissions = await fetchFromLeetCodeAPI(username, startDate, endDate);
    
    return submissions;

  } catch (error) {
    console.error('Error fetching LeetCode submissions:', error);
    return [];
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

    const submissions = await DatabaseService.getLeetCodeSubmissions(
      user.id,
      startDate,
      endDate
    );

    const summary = await DatabaseService.getContributionSummary(user.id, days);

    return NextResponse.json({
      submissions,
      summary: summary.leetcode,
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() }
    });

  } catch (error) {
    console.error('LeetCode submissions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LeetCode submissions' }, 
      { status: 500 }
    );
  }
}