"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  DashboardHeader, 
  CodingDashboard, 
  DashboardContent 
} from "@/components/dashboard";
import { type Activity as ContributionActivity } from "@/components/ui/kibo-ui/contribution-graph";

interface DashboardData {
  stats: {
    totalEntries: number;
    entriesThisMonth: number;
    hasEntryToday: boolean;
    totalNotes: number;
    recentActivities: number;
    streak: number;
    totalWords: number;
    currentStreak: number;
    avgMood: number;
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
    "in-progress": number;
    done: number;
    total: number;
  };
  activitySummary: Array<{
    _id: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  trends: {
    mood: Array<{ date: string; mood: number }>;
    wordCount: Array<{ date: string; words: number }>;
  };
}

interface ContributionStats {
  currentStreak: number;
  totalContributions: number;
  thisWeek: number;
  bestStreak: number;
  totalSolved: number;
  solveStreak: number;
  easy: number;
  medium: number;
  hard: number;
}

interface ContributionData {
  github: {
    data: ContributionActivity[];
    stats: ContributionStats;
  };
  leetcode: {
    data: ContributionActivity[];
    stats: ContributionStats;
  };
}

interface PlatformSettings {
  hasGitHub: boolean;
  hasLeetCode: boolean;
  isLoading: boolean;
}

interface Motivation {
  message: string;
  description: string;
  action: string;
  urgency: "high" | "critical" | "medium" | "low" | "success";
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [contributionsLoading, setContributionsLoading] = useState(false);
  const [contributionData, setContributionData] = useState<ContributionData>({
    github: {
      data: [],
      stats: {
        currentStreak: 0,
        totalContributions: 0,
        thisWeek: 0,
        bestStreak: 0,
        totalSolved: 0,
        solveStreak: 0,
        easy: 0,
        medium: 0,
        hard: 0
      }
    },
    leetcode: {
      data: [],
      stats: {
        currentStreak: 0,
        totalContributions: 0,
        thisWeek: 0,
        bestStreak: 0,
        totalSolved: 0,
        solveStreak: 0,
        easy: 0,
        medium: 0,
        hard: 0
      }
    }
  });
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    hasGitHub: false,
    hasLeetCode: false,
    isLoading: true
  });

  const moodEmojis = { 1: "😔", 2: "😕", 3: "😐", 4: "😊", 5: "😄" };

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
      fetchPlatformSettings();
      fetchContributionData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch dashboard data");
      }
      
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const response = await fetch("/api/user/platform-settings");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch platform settings");
      }
      
      setPlatformSettings({
        hasGitHub: data.hasGitHub,
        hasLeetCode: data.hasLeetCode,
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching platform settings:", error);
      setPlatformSettings(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchContributionData = async () => {
    try {
      setContributionsLoading(true);
      // Fetch data for last 9 months only
      const nineMonthsAgo = new Date();
      nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
      const fromDate = nineMonthsAgo.toISOString().split('T')[0];
      
      const response = await fetch(`/api/contributions?from=${fromDate}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch contribution data");
      }
      
      setContributionData({
        github: {
          data: data.github.data || [],
          stats: data.github.stats || {
            currentStreak: 0,
            totalContributions: 0,
            thisWeek: 0,
            bestStreak: 0,
            totalSolved: 0,
            solveStreak: 0,
            easy: 0,
            medium: 0,
            hard: 0
          }
        },
        leetcode: {
          data: data.leetcode.data || [],
          stats: data.leetcode.stats || {
            currentStreak: 0,
            totalContributions: 0,
            thisWeek: 0,
            bestStreak: 0,
            totalSolved: 0,
            solveStreak: 0,
            easy: 0,
            medium: 0,
            hard: 0
          }
        }
      });
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setContributionsLoading(false);
    }
  };

  const handleManualSync = async (platforms = ["github", "leetcode"]) => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/sync/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Manual sync failed");
      }

      const result = await response.json();
      toast.success(result.message || "Sync completed successfully!");
      setLastSyncTime(new Date());
      // Refresh data after sync
      await Promise.all([
        fetchDashboardData(),
        fetchContributionData()
      ]);
    } catch (error) {
      console.error("Manual sync error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync data");
    } finally {
      setIsSyncing(false);
    }
  };

  const getTodaysGithubActivity = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysData = contributionData.github.data.find(day => day.date === today);
    return todaysData?.count || 0;
  };

  const getGitHubMotivation = () => {
    const todaysCommits = getTodaysGithubActivity();
    const currentStreak = contributionData.github.stats.currentStreak;
    
    if (todaysCommits === 0) {
      if (currentStreak === 0) {
        return "🚀 Start your coding journey today! Make your first commit.";
      } else {
        return `⚠️ Don't break your ${currentStreak}-day streak! Time to commit some code.`;
      }
    } else if (todaysCommits < 3) {
      return `💪 Good start! ${todaysCommits} commits today. Can you do more?`;
    } else {
      return `🔥 Awesome! ${todaysCommits} commits today. You're on fire!`;
    }
  };

  const getTodaysLeetCodeActivity = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysData = contributionData.leetcode.data.find(day => day.date === today);
    return todaysData?.count || 0;
  };

  const getLeetCodeMotivation = (): Motivation => {
    const todaysSolved = getTodaysLeetCodeActivity();
    const currentStreak = contributionData.leetcode.stats.solveStreak;
    const dailyGoal = 15;
    
    if (todaysSolved === 0) {
      if (currentStreak === 0) {
        return {
          message: "🎯 Start your coding journey today!",
          description: `Goal: ${dailyGoal} problems today. Every expert was once a beginner.`,
          action: "Start Problem Solving",
          urgency: "high"
        };
      } else {
        return {
          message: `⚠️ Don't break your ${currentStreak}-day streak!`,
          description: `You need ${dailyGoal} problems to stay on track. Time is ticking!`,
          action: "Save Your Streak",
          urgency: "high"
        };
      }
    } else if (todaysSolved < 5) {
      return {
        message: `🚨 You're way behind! Only ${todaysSolved}/${dailyGoal} problems solved`,
        description: "You're out of aim! Need to seriously grind to catch up today.",
        action: "Grind Problems Now",
        urgency: "critical"
      };
    } else if (todaysSolved < 10) {
      return {
        message: `💪 Good progress! ${todaysSolved}/${dailyGoal} problems solved`,
        description: "You're getting there. Keep the momentum going!",
        action: "Continue Grinding",
        urgency: "medium"
      };
    } else if (todaysSolved < 15) {
      return {
        message: `🔥 Great work! ${todaysSolved}/${dailyGoal} problems solved`,
        description: "Almost there! Just a few more to hit your daily target.",
        action: "Finish Strong",
        urgency: "low"
      };
    } else {
      return {
        message: `🚀 Outstanding! ${todaysSolved}/${dailyGoal} problems solved`,
        description: "Goal crushed! You're absolutely killing it today!",
        action: "Keep the Streak",
        urgency: "success"
      };
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to access your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <DashboardHeader 
        userName={session.user.name}
        isSyncing={isSyncing}
        onSync={() => handleManualSync()}
      />

      <CodingDashboard 
        platformSettings={platformSettings}
        contributionsLoading={contributionsLoading}
        contributionData={contributionData}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        getLeetCodeMotivation={getLeetCodeMotivation}
        getTodaysLeetCodeActivity={getTodaysLeetCodeActivity}
        onManualSync={(platforms) => handleManualSync(platforms)}
        stats={dashboardData?.stats}
        kanbanSummary={dashboardData?.kanbanSummary}
      />

      <DashboardContent 
        dashboardData={dashboardData} 
        moodEmojis={moodEmojis}
      />
    </div>
  );
}