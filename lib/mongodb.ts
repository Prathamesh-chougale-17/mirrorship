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
  UserPlatformSettings,
  YouTubeUpload,
  YouTubeChannel,
  Project,
  ProjectNote,
  LearningTopic,
  LearningNode,
  LearningGraph
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

  static async updateUserPlatformSettings(
    userId: string,
    partialSettings: Partial<Omit<UserPlatformSettings, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<UserPlatformSettings>(COLLECTIONS.USER_PLATFORM_SETTINGS);
    
    const timestamp = new Date();
    await collection.updateOne(
      { userId },
      {
        $set: {
          ...partialSettings,
          updatedAt: timestamp
        },
        $setOnInsert: {
          userId,
          createdAt: timestamp
        }
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

  // Get all users with platform settings for batch operations
  static async getUsersWithPlatformSettings(): Promise<any[]> {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find users who have platform settings
    const users = await usersCollection.aggregate([
      {
        $lookup: {
          from: COLLECTIONS.USER_PLATFORM_SETTINGS,
          localField: '_id',
          foreignField: 'userId',
          as: 'platformSettings'
        }
      },
      {
        $match: {
          platformSettings: { $ne: [] } // Only users with platform settings
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          name: 1
        }
      }
    ]).toArray();
    
    return users;
  }

  // YouTube Channel
  static async saveYouTubeChannel(
    userId: string,
    channelData: Omit<YouTubeChannel, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<YouTubeChannel>(COLLECTIONS.YOUTUBE_CHANNELS);
    
    const timestamp = new Date();
    await collection.replaceOne(
      { userId },
      {
        ...channelData,
        userId,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      { upsert: true }
    );
  }

  static async getYouTubeChannel(userId: string): Promise<YouTubeChannel | null> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<YouTubeChannel>(COLLECTIONS.YOUTUBE_CHANNELS);
    
    return await collection.findOne({ userId });
  }

  // YouTube Uploads
  static async saveYouTubeUploads(
    userId: string,
    uploads: Omit<YouTubeUpload, '_id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<YouTubeUpload>(COLLECTIONS.YOUTUBE_UPLOADS);
    
    const timestamp = new Date();
    const uploadsWithMetadata = uploads.map(upload => ({
      ...upload,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp
    }));

    // Delete existing uploads for this user and date range
    if (uploads.length > 0) {
      const videoIds = uploads.map(u => u.videoId);
      await collection.deleteMany({
        userId,
        videoId: { $in: videoIds }
      });
    }

    if (uploadsWithMetadata.length > 0) {
      await collection.insertMany(uploadsWithMetadata);
    }
  }

  static async getYouTubeUploads(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<YouTubeUpload[]> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<YouTubeUpload>(COLLECTIONS.YOUTUBE_UPLOADS);
    
    const filter: any = { userId };
    if (startDate || endDate) {
      filter.publishedAt = {};
      if (startDate) filter.publishedAt.$gte = startDate;
      if (endDate) filter.publishedAt.$lte = endDate;
    }
    
    return await collection
      .find(filter)
      .sort({ publishedAt: -1 })
      .toArray();
  }

  static async getYouTubeStats(userId: string): Promise<any> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<YouTubeUpload>(COLLECTIONS.YOUTUBE_UPLOADS);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [totalUploads, recentUploads, totalViews] = await Promise.all([
      collection.countDocuments({ userId }),
      collection.countDocuments({
        userId,
        publishedAt: { $gte: thirtyDaysAgo }
      }),
      collection.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalViews: { $sum: "$viewCount" } } }
      ]).toArray()
    ]);
    
    return {
      totalUploads,
      recentUploads,
      totalViews: totalViews[0]?.totalViews || 0
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

  // Learning Topics
  static async createLearningTopic(
    userId: string,
    topic: Omit<LearningTopic, '_id' | 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<LearningTopic> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LearningTopic>(COLLECTIONS.LEARNING_TOPICS);
    
    const timestamp = new Date();
    const newTopic: LearningTopic = {
      id: new ObjectId().toString(),
      userId,
      ...topic,
      isArchived: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await collection.insertOne(newTopic);
    return newTopic;
  }

  static async getLearningTopics(userId: string, includeArchived: boolean = false): Promise<LearningTopic[]> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LearningTopic>(COLLECTIONS.LEARNING_TOPICS);
    
    const filter: any = { userId };
    if (!includeArchived) {
      filter.isArchived = false;
    }

    return await collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  static async getLearningTopicById(userId: string, topicId: string): Promise<LearningTopic | null> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LearningTopic>(COLLECTIONS.LEARNING_TOPICS);
    
    return await collection.findOne({ userId, id: topicId });
  }

  static async updateLearningTopic(
    userId: string,
    topicId: string,
    updates: Partial<Omit<LearningTopic, '_id' | 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LearningTopic>(COLLECTIONS.LEARNING_TOPICS);
    
    await collection.updateOne(
      { userId, id: topicId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );
  }

  static async deleteLearningTopic(userId: string, topicId: string): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Delete the topic
    const topicsCollection = db.collection<LearningTopic>(COLLECTIONS.LEARNING_TOPICS);
    await topicsCollection.deleteOne({ userId, id: topicId });
    
    // Delete associated graph
    const graphsCollection = db.collection<LearningGraph>(COLLECTIONS.LEARNING_GRAPHS);
    await graphsCollection.deleteOne({ userId, topicId });
  }

  // Learning Graphs
  static async saveLearningGraph(
    userId: string,
    topicId: string,
    rootNode: LearningNode
  ): Promise<void> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LearningGraph>(COLLECTIONS.LEARNING_GRAPHS);
    
    const timestamp = new Date();
    await collection.replaceOne(
      { userId, topicId },
      {
        id: new ObjectId().toString(),
        userId,
        topicId,
        rootNode,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      { upsert: true }
    );
  }

  static async getLearningGraph(userId: string, topicId: string): Promise<LearningGraph | null> {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<LearningGraph>(COLLECTIONS.LEARNING_GRAPHS);
    
    return await collection.findOne({ userId, topicId });
  }
}