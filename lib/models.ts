import { ObjectId } from "mongodb";

// User Model (extends Better Auth user)
export interface User {
  _id?: ObjectId;
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Diary Entry Model
export interface DiaryEntry {
  _id?: ObjectId;
  id: string;
  userId: string;
  title: string;
  content: string; // Rich text JSON from Tiptap
  date: string; // YYYY-MM-DD format for daily entries
  mood?: number; // 1-5 scale
  tags: string[];
  aiSummary?: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Kanban Note Model
export interface KanbanNote {
  _id?: ObjectId;
  id: string;
  userId: string;
  title: string;
  content: string;
  column: string; // todo, in-progress, done
  position: number;
  priority: "low" | "medium" | "high";
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Activity Entry Model (for tracking various activities)
export interface ActivityEntry {
  _id?: ObjectId;
  id: string;
  userId: string;
  type: "github" | "social" | "learning" | "exercise" | "reading" | "custom";
  title: string;
  description?: string;
  value?: number; // commits, minutes, pages, etc.
  unit?: string; // "commits", "minutes", "pages"
  date: string; // YYYY-MM-DD format
  metadata?: Record<string, any>; // flexible data for different activity types
  createdAt: Date;
  updatedAt: Date;
}

// AI Summary Model (daily/weekly/monthly summaries)
export interface AISummary {
  _id?: ObjectId;
  id: string;
  userId: string;
  type: "daily" | "weekly" | "monthly";
  period: string; // date range or specific date
  summary: string;
  insights: string[];
  moodTrend?: {
    average: number;
    direction: "up" | "down" | "stable";
  };
  activityHighlights: {
    type: string;
    count: number;
    trend: "up" | "down" | "stable";
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// User Preferences Model
export interface UserPreferences {
  _id?: ObjectId;
  userId: string;
  theme: "light" | "dark" | "system";
  reminderTime?: string; // HH:MM format
  reminderEnabled: boolean;
  aiInsightsEnabled: boolean;
  activityTracking: {
    github: boolean;
    social: boolean;
    manual: boolean;
  };
  privacy: {
    dataRetention: number; // days
    shareAnalytics: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// GitHub Contribution Model
export interface GitHubContribution {
  _id?: ObjectId;
  userId: string;
  date: Date;
  commitCount: number;
  repositories: {
    name: string;
    commits: number;
    url?: string;
  }[];
  pullRequests?: {
    opened: number;
    merged: number;
    reviewed: number;
  };
  issues?: {
    opened: number;
    closed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// LeetCode Submission Model
export interface LeetCodeSubmission {
  _id?: ObjectId;
  userId: string;
  submissionId: string;
  problemTitle: string;
  problemSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | "Runtime Error" | "Compile Error";
  language: string;
  runtime?: number; // milliseconds
  memory?: number; // bytes
  submissionDate: Date;
  problemUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// YouTube Upload Model
export interface YouTubeUpload {
  _id?: ObjectId;
  userId: string;
  videoId: string;
  title: string;
  description?: string;
  publishedAt: Date;
  thumbnails?: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
  };
  duration?: string; // ISO 8601 format (e.g., "PT15M33S")
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
  categoryId?: string;
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// YouTube Channel Model
export interface YouTubeChannel {
  _id?: ObjectId;
  userId: string;
  channelId: string;
  channelHandle: string;
  title: string;
  description?: string;
  customUrl?: string;
  publishedAt?: Date;
  thumbnails?: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
  };
  statistics: {
    viewCount: number;
    subscriberCount: number;
    videoCount: number;
  };
  uploadsPlaylistId: string;
  lastSyncDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Platform Settings Model
export interface UserPlatformSettings {
  _id?: ObjectId;
  userId: string;
  github: {
    username?: string;
    accessToken?: string; // encrypted
    lastSyncDate?: Date;
    syncEnabled: boolean;
  };
  leetcode: {
    username?: string;
    sessionCookie?: string; // encrypted
    lastSyncDate?: Date;
    syncEnabled: boolean;
  };
  youtube: {
    channelHandle?: string;
    channelId?: string;
    uploadsPlaylistId?: string;
    lastSyncDate?: Date;
    syncEnabled: boolean;
  };
  syncFrequency: "manual" | "hourly" | "daily" | "weekly";
  createdAt: Date;
  updatedAt: Date;
}

// Project Model
export interface Project {
  _id?: ObjectId;
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "template" | "product";
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  status: "planning" | "in-progress" | "completed" | "on-hold";
  priority: "low" | "medium" | "high";
  startDate?: Date;
  completionDate?: Date;
  tags: string[];
  features: string[];
  challenges?: string;
  learnings?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Project Note Model (for project briefs and understanding)
export interface ProjectNote {
  _id?: ObjectId;
  id: string;
  userId: string;
  projectId: string;
  title: string;
  content: string; // Rich text JSON from Tiptap
  type: "brief" | "architecture" | "feature" | "bug" | "idea" | "meeting" | "other";
  tags: string[];
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Learning Topic Model (for main learning topics/subjects)
export interface LearningTopic {
  _id?: ObjectId;
  id: string;
  userId: string;
  title: string;
  description?: string;
  color?: string; // Hex color for visual distinction
  icon?: string; // Icon name or emoji
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Learning Node Model (for individual nodes in the learning graph)
export interface LearningNode {
  id: string;
  name: string;
  notes: string;
  resources: string[];
  youtubeLinks: string[];
  children?: LearningNode[];
}

// Learning Graph Model (for storing the complete graph structure)
export interface LearningGraph {
  _id?: ObjectId;
  id: string;
  userId: string;
  topicId: string; // Reference to LearningTopic
  rootNode: LearningNode;
  createdAt: Date;
  updatedAt: Date;
}

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  DIARY_ENTRIES: "diary_entries", 
  KANBAN_NOTES: "kanban_notes",
  ACTIVITY_ENTRIES: "activity_entries",
  AI_SUMMARIES: "ai_summaries",
  USER_PREFERENCES: "user_preferences",
  GITHUB_CONTRIBUTIONS: "github_contributions",
  LEETCODE_SUBMISSIONS: "leetcode_submissions",
  USER_PLATFORM_SETTINGS: "user_platform_settings",
  YOUTUBE_UPLOADS: "youtube_uploads",
  YOUTUBE_CHANNELS: "youtube_channels",
  PROJECTS: "projects",
  PROJECT_NOTES: "project_notes",
  LEARNING_TOPICS: "learning_topics",
  LEARNING_GRAPHS: "learning_graphs"
} as const;