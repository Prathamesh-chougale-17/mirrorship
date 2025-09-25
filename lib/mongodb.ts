// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
}

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client;

import { 
  COLLECTIONS, 
  DiaryEntry, 
  KanbanNote, 
  ActivityEntry, 
  AISummary, 
  UserPreferences,
  GitHubContribution,
  LeetCodeSubmission,
  UserPlatformSettings
} from './models';
import { ObjectId } from 'mongodb';

const DB_NAME = 'mirrorship';

export class DatabaseService {
  // GitHub Contributions
  static async saveGitHubContributions(
    userId: string, 
    contributions: Omit<GitHubContribution, '_id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<GitHubContribution>(COLLECTIONS.GITHUB_CONTRIBUTIONS);
    
    const timestamp = new Date();
    const contributionsWithMetadata = contributions.map(contrib => ({
      ...contrib,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp
    }));

    // Delete existing contributions for this user and date range
    if (contributions.length > 0) {
      const dates = contributions.map(c => c.date);
      await collection.deleteMany({
        userId,
        date: { $in: dates }
      });
    }

    if (contributionsWithMetadata.length > 0) {
      await collection.insertMany(contributionsWithMetadata);
    }
  }

  static async getGitHubContributions(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GitHubContribution[]> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<GitHubContribution>(COLLECTIONS.GITHUB_CONTRIBUTIONS);
    
    const filter: any = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    return await collection.find(filter).sort({ date: -1 }).toArray();
  }

  // LeetCode Submissions
  static async saveLeetCodeSubmissions(
    userId: string,
    submissions: Omit<LeetCodeSubmission, '_id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LeetCodeSubmission>(COLLECTIONS.LEETCODE_SUBMISSIONS);
    
    const timestamp = new Date();
    const submissionsWithMetadata = submissions.map(sub => ({
      ...sub,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp
    }));

    // Delete existing submissions for this user and date range
    if (submissions.length > 0) {
      const dates = submissions.map(s => s.submissionDate);
      await collection.deleteMany({
        userId,
        submissionDate: { $in: dates }
      });
    }

    if (submissionsWithMetadata.length > 0) {
      await collection.insertMany(submissionsWithMetadata);
    }
  }

  static async getLeetCodeSubmissions(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<LeetCodeSubmission[]> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LeetCodeSubmission>(COLLECTIONS.LEETCODE_SUBMISSIONS);
    
    const filter: any = { userId };
    if (startDate || endDate) {
      filter.submissionDate = {};
      if (startDate) filter.submissionDate.$gte = startDate;
      if (endDate) filter.submissionDate.$lte = endDate;
    }

    return await collection.find(filter).sort({ submissionDate: -1 }).toArray();
  }

  // Platform Settings
  static async getUserPlatformSettings(userId: string): Promise<UserPlatformSettings | null> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<UserPlatformSettings>(COLLECTIONS.USER_PLATFORM_SETTINGS);
    
    return await collection.findOne({ userId });
  }

  static async saveUserPlatformSettings(
    userId: string,
    settings: Omit<UserPlatformSettings, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<UserPlatformSettings>(COLLECTIONS.USER_PLATFORM_SETTINGS);
    
    const timestamp = new Date();
    await collection.replaceOne(
      { userId },
      {
        ...settings,
        userId,
        updatedAt: timestamp,
        createdAt: timestamp
      },
      { upsert: true }
    );
  }

  // Contribution Analytics
  static async getContributionSummary(userId: string, days: number = 365): Promise<{
    github: { totalCommits: number; streak: number; activeDays: number };
    leetcode: { totalSubmissions: number; streak: number; activeDays: number };
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const [githubContribs, leetcodeSubmissions] = await Promise.all([
      this.getGitHubContributions(userId, startDate, endDate),
      this.getLeetCodeSubmissions(userId, startDate, endDate)
    ]);

    // Calculate GitHub stats
    const githubStats = {
      totalCommits: githubContribs.reduce((sum, c) => sum + c.commitCount, 0),
      activeDays: githubContribs.filter(c => c.commitCount > 0).length,
      streak: this.calculateStreak(githubContribs.map(c => ({ date: c.date, active: c.commitCount > 0 })))
    };

    // Calculate LeetCode stats  
    const leetcodeStats = {
      totalSubmissions: leetcodeSubmissions.length,
      activeDays: new Set(leetcodeSubmissions.map(s => s.submissionDate.toDateString())).size,
      streak: this.calculateStreak(
        Array.from(new Set(leetcodeSubmissions.map(s => s.submissionDate.toDateString())))
          .map(dateStr => ({ date: new Date(dateStr), active: true }))
      )
    };

    return {
      github: githubStats,
      leetcode: leetcodeStats
    };
  }

  private static calculateStreak(activities: { date: Date; active: boolean }[]): number {
    const sortedActivities = activities
      .filter(a => a.active)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (sortedActivities.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < sortedActivities.length; i++) {
      const current = sortedActivities[i].date;
      const previous = sortedActivities[i - 1].date;
      const diffInDays = Math.floor((previous.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));
      
      if (diffInDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}