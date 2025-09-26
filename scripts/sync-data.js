#!/usr/bin/env node

/**
 * Sync Script for GitHub and LeetCode Data
 * This script syncs contribution data for all users in the database
 */

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mirrorship';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// GitHub GraphQL API configuration
const GITHUB_API_URL = 'https://api.github.com/graphql';

// LeetCode API configuration
const LEETCODE_API_URL = 'https://leetcode.com/graphql/';

async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

async function fetchUsersWithPlatformSettings() {
  const client = await connectToMongoDB();
  try {
    const db = client.db();
    const users = await db.collection('users').aggregate([
      {
        $lookup: {
          from: 'user_platform_settings',
          localField: '_id',
          foreignField: 'userId',
          as: 'platformSettings'
        }
      },
      {
        $match: {
          $or: [
            { 'platformSettings.github.enabled': true },
            { 'platformSettings.leetcode.enabled': true }
          ]
        }
      }
    ]).toArray();
    
    return users;
  } finally {
    await client.close();
  }
}

async function syncGitHubData(user, platformSettings) {
  if (!platformSettings.github?.enabled || !platformSettings.github?.username || !platformSettings.github?.accessToken) {
    console.log(`Skipping GitHub sync for user ${user.email} - not configured`);
    return;
  }

  try {
    console.log(`Syncing GitHub data for ${user.email} (${platformSettings.github.username})`);
    
    const headers = {
      'Authorization': `bearer ${platformSettings.github.accessToken}`,
      'Content-Type': 'application/json'
    };

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1).toISOString();
    const endDate = new Date().toISOString();

    const query = `
      query {
        user(login: "${platformSettings.github.username}") {
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

    const response = await fetch(GITHUB_API_URL, {
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

    // Save to database
    await saveGitHubContributions(user._id, data.data.user.contributionsCollection);
    console.log(`✅ GitHub sync completed for ${user.email}`);

  } catch (error) {
    console.error(`❌ GitHub sync failed for ${user.email}:`, error.message);
  }
}

async function syncLeetCodeData(user, platformSettings) {
  if (!platformSettings.leetcode?.enabled || !platformSettings.leetcode?.username) {
    console.log(`Skipping LeetCode sync for user ${user.email} - not configured`);
    return;
  }

  try {
    console.log(`Syncing LeetCode data for ${user.email} (${platformSettings.leetcode.username})`);
    
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

    const response = await fetch(LEETCODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mirrorship-Sync-Script',
        'Referer': 'https://leetcode.com/'
      },
      body: JSON.stringify({
        query,
        variables: {
          username: platformSettings.leetcode.username,
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

    // Save to database
    await saveLeetCodeSubmissions(user._id, data.data.matchedUser);
    console.log(`✅ LeetCode sync completed for ${user.email}`);

  } catch (error) {
    console.error(`❌ LeetCode sync failed for ${user.email}:`, error.message);
  }
}

async function saveGitHubContributions(userId, contributionsCollection) {
  const client = await connectToMongoDB();
  try {
    const db = client.db();
    const collection = db.collection('github_contributions');

    const weeks = contributionsCollection.contributionCalendar.weeks;
    const pullRequests = contributionsCollection.pullRequestContributions?.nodes || [];
    const issues = contributionsCollection.issueContributions?.nodes || [];
    
    // Create maps for PR and issue data by date
    const prsByDate = new Map();
    const issuesByDate = new Map();
    
    // Process PR data
    pullRequests.forEach((prNode) => {
      const pr = prNode.pullRequest;
      const createdDate = new Date(pr.createdAt).toISOString().split('T')[0];
      
      if (!prsByDate.has(createdDate)) {
        prsByDate.set(createdDate, { opened: 0, merged: 0, reviewed: 0 });
      }
      
      const prData = prsByDate.get(createdDate);
      prData.opened += 1;
      
      if (pr.mergedAt) {
        const mergedDate = new Date(pr.mergedAt).toISOString().split('T')[0];
        if (!prsByDate.has(mergedDate)) {
          prsByDate.set(mergedDate, { opened: 0, merged: 0, reviewed: 0 });
        }
        prsByDate.get(mergedDate).merged += 1;
      }
    });
    
    // Process issue data
    issues.forEach((issueNode) => {
      const issue = issueNode.issue;
      const createdDate = new Date(issue.createdAt).toISOString().split('T')[0];
      
      if (!issuesByDate.has(createdDate)) {
        issuesByDate.set(createdDate, { opened: 0, closed: 0 });
      }
      
      const issueData = issuesByDate.get(createdDate);
      issueData.opened += 1;
      
      if (issue.closedAt) {
        const closedDate = new Date(issue.closedAt).toISOString().split('T')[0];
        if (!issuesByDate.has(closedDate)) {
          issuesByDate.set(closedDate, { opened: 0, closed: 0 });
        }
        issuesByDate.get(closedDate).closed += 1;
      }
    });

    // Process all contribution days
    const contributions = [];
    weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        const dateStr = day.date;
        const prData = prsByDate.get(dateStr) || { opened: 0, merged: 0, reviewed: 0 };
        const issueData = issuesByDate.get(dateStr) || { opened: 0, closed: 0 };

        contributions.push({
          userId: userId,
          date: new Date(dateStr),
          commitCount: day.contributionCount,
          pullRequests: prData,
          issues: issueData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    // Clear existing data for this user and insert new data
    await collection.deleteMany({ userId: userId });
    if (contributions.length > 0) {
      await collection.insertMany(contributions);
    }

  } finally {
    await client.close();
  }
}

async function saveLeetCodeSubmissions(userId, matchedUser) {
  const client = await connectToMongoDB();
  try {
    const db = client.db();
    const collection = db.collection('leetcode_submissions');

    const submissions = [];
    const recentSubmissions = matchedUser.recentAcSubmissionList || [];
    
    // Process recent submissions
    recentSubmissions.forEach((submission) => {
      submissions.push({
        userId: userId,
        problemTitle: submission.title,
        problemSlug: submission.titleSlug,
        submissionDate: new Date(submission.timestamp * 1000),
        status: 'Accepted',
        difficulty: 'Unknown', // LeetCode API doesn't provide difficulty in this endpoint
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Clear existing data for this user and insert new data
    await collection.deleteMany({ userId: userId });
    if (submissions.length > 0) {
      await collection.insertMany(submissions);
    }

  } finally {
    await client.close();
  }
}

async function main() {
  console.log('🚀 Starting data sync process...');
  
  try {
    const users = await fetchUsersWithPlatformSettings();
    console.log(`Found ${users.length} users with platform settings`);

    for (const user of users) {
      const platformSettings = user.platformSettings[0] || {};
      
      // Sync GitHub data
      if (platformSettings.github?.enabled) {
        await syncGitHubData(user, platformSettings);
      }
      
      // Sync LeetCode data
      if (platformSettings.leetcode?.enabled) {
        await syncLeetCodeData(user, platformSettings);
      }
    }

    console.log('✅ Data sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, syncGitHubData, syncLeetCodeData };