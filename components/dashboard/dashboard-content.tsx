"use client";

import { TrendsChart } from "./trends-chart";
import { RecentEntries } from "./recent-entries";

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
    <div className="space-y-6">
      {/* Beautiful Full-Width Layout */}
      <div className="w-full max-w-none">
        {/* Trends Chart - Prominent and Beautiful */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-1">
            <div className="bg-background rounded-lg shadow-sm border">
              <TrendsChart trends={dashboardData?.trends} />
            </div>
          </div>
        </div>
        
        {/* Recent Entries - Enhanced Full Width */}
        <div className="w-full">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-1">
            <div className="bg-background rounded-lg shadow-sm border">
              <RecentEntries 
                entries={dashboardData?.recentEntries} 
                moodEmojis={moodEmojis}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}