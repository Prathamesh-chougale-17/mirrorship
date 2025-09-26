"use client";

import { TrendsChart } from "./trends-chart";
import { RecentEntries } from "./recent-entries";
import { TaskProgress } from "./task-progress";

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
}

export function DashboardContent({ dashboardData, moodEmojis }: DashboardContentProps) {
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
      </div>
    </div>
  );
}