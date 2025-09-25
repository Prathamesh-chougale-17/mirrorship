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
  syncFrequency: "manual" | "hourly" | "daily" | "weekly";
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
  USER_PLATFORM_SETTINGS: "user_platform_settings"
} as const;