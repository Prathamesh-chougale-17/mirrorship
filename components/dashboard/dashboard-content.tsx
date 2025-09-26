"use client";

import { TrendsChart } from "./trends-chart";
import { RecentEntries } from "./recent-entries";
import { TaskProgress } from "./task-progress";
import { ActivitySummaryCard } from "./activity-summary";
import { QuickActions } from "./quick-actions";

interface DashboardData {
  stats: {
    totalEntries: number;
    entriesThisMonth: number;
    hasEntryToday: boolean;
    totalNotes: number;
    recentActivities: number;
    streak: number;
  };
  recentEntries: Array<{
    id: string;
    title: string;
    date: string;
    mood?: number;
    wordCount: number;
    aiSummary?: string;
  }>;
  activitySummary: Array<{
    _id: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  kanbanSummary: {
    todo: number;
    'in-progress': number;
    done: number;
    total: number;
  };
  trends: {
    mood: Array<{ date: string; mood: number }>;
    wordCount: Array<{ date: string; words: number }>;
  };
}

interface DashboardContentProps {
  dashboardData: DashboardData | null;
  moodEmojis: { [key: number]: string };
  activityColors: { [key: string]: string };
}

export function DashboardContent({ dashboardData, moodEmojis, activityColors }: DashboardContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Recent Entries & Trends - Takes 3 columns on large screens */}
      <div className="lg:col-span-3 space-y-6">
        <TrendsChart trends={dashboardData?.trends} />
        <RecentEntries 
          entries={dashboardData?.recentEntries} 
          moodEmojis={moodEmojis}
        />
      </div>

      {/* Compact Sidebar - Takes 1 column */}
      <div className="space-y-4">
        <TaskProgress kanbanSummary={dashboardData?.kanbanSummary} />
        <ActivitySummaryCard 
          activities={dashboardData?.activitySummary}
          activityColors={activityColors}
        />
        <QuickActions />
      </div>
    </div>
  );
}