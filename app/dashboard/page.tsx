"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Calendar, 
  Target, 
  Activity,
  Plus,
  ArrowRight,
  Flame,
  Heart,
  Clock,
  GitBranch
} from "lucide-react";
import { 
  ContributionGraph, 
  ContributionGraphCalendar, 
  ContributionGraphBlock, 
  ContributionGraphFooter, 
  ContributionGraphTotalCount, 
  ContributionGraphLegend,
  type Activity as ContributionActivity
} from "@/components/ui/kibo-ui/contribution-graph";
import Link from "next/link";
import { toast } from "sonner";

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

const moodEmojis = { 1: "😔", 2: "😕", 3: "😐", 4: "😊", 5: "😄" };
const activityColors = {
  github: "#22c55e",
  social: "#3b82f6", 
  learning: "#8b5cf6",
  exercise: "#f59e0b",
  reading: "#ef4444",
  custom: "#6b7280"
};

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contributionData, setContributionData] = useState({
    github: {
      currentStreak: 7,
      thisWeek: 23,
      bestStreak: 45,
      lastSevenDays: [4, 2, 0, 3, 1, 5, 2]
    },
    leetcode: {
      solveStreak: 12,
      totalSolved: 247,
      thisWeek: 8,
      easy: 120,
      medium: 98,
      hard: 29
    }
  });

  // Generate GitHub-style contribution data (last 12 months)
  const generateContributionData = (type: 'github' | 'leetcode'): ContributionActivity[] => {
    const data: ContributionActivity[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 12);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let count = 0;
      let level = 0;

      if (type === 'github') {
        // Simulate GitHub contributions (commits, PRs, etc.)
        const random = Math.random();
        if (random > 0.3) { // 70% chance of activity
          count = Math.floor(Math.random() * 15) + 1;
          level = count === 0 ? 0 : Math.min(4, Math.floor(count / 4) + 1);
        }
      } else {
        // Simulate LeetCode problem solving
        const random = Math.random();
        if (random > 0.4) { // 60% chance of solving problems
          count = Math.floor(Math.random() * 8) + 1;
          level = count === 0 ? 0 : Math.min(4, Math.floor(count / 2) + 1);
        }
      }

      data.push({
        date: dateStr,
        count,
        level
      });
    }

    return data;
  };

  const githubContributions = generateContributionData('github');
  const leetcodeContributions = generateContributionData('leetcode');

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
      // Simulate real-time updates (in a real app, this would come from APIs)
      const interval = setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
          // Reset daily at midnight
          setContributionData(prev => ({
            ...prev,
            github: {
              ...prev.github,
              lastSevenDays: [Math.floor(Math.random() * 6), ...prev.github.lastSevenDays.slice(0, 6)]
            }
          }));
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [session?.user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch dashboard data");
      }
      
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const getMotivationalMessage = () => {
    const totalStreak = contributionData.github.currentStreak + contributionData.leetcode.solveStreak;
    const githubTotal = githubContributions.reduce((sum, day) => sum + day.count, 0);
    const leetcodeTotal = leetcodeContributions.reduce((sum, day) => sum + day.count, 0);
    
    if (totalStreak > 30) return "🏆 Incredible! You're a coding machine!";
    if (totalStreak > 20) return "🔥 You're on fire! Keep the momentum going!";
    if (totalStreak > 10) return "💪 Great consistency! You're building strong habits!";
    if (totalStreak > 5) return "🚀 Good streak! Keep pushing forward!";
    if (githubTotal + leetcodeTotal > 100) return "📈 Amazing progress this year!";
    return "✨ Every day is a new opportunity to grow!";
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access your dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your reflection journey overview
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/diary">
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Link>
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Daily Growth Tracker</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">{getMotivationalMessage()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {contributionData.github.currentStreak + contributionData.leetcode.solveStreak} days
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Combined streak</div>
          </div>
        </div>
      </div>

      {/* Contribution Streaks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* GitHub Contributions */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">GitHub Contributions</CardTitle>
                  <CardDescription className="text-gray-300">Keep your coding streak alive</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                {contributionData.github.lastSevenDays[6] > 0 ? "Today ✅" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Streak</span>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-bold text-lg">{contributionData.github.currentStreak} days</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <span className="text-green-600 font-medium">{contributionData.github.thisWeek} contributions</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Best Streak</span>
                <span className="text-muted-foreground">{contributionData.github.bestStreak} days</span>
              </div>
              {/* GitHub Contribution Heatmap */}
              <div className="mt-4 -mx-2">
                <div className="text-xs text-muted-foreground mb-2 px-2">Last 12 months of contributions</div>
                <ContributionGraph 
                  data={githubContributions} 
                  blockSize={10}
                  blockMargin={2}
                  fontSize={11}
                  className="text-xs"
                >
                  <ContributionGraphCalendar hideMonthLabels>
                    {({ activity, dayIndex, weekIndex }) => (
                      <ContributionGraphBlock
                        activity={activity}
                        dayIndex={dayIndex}
                        weekIndex={weekIndex}
                        className="hover:stroke-2 hover:stroke-foreground/40 cursor-pointer transition-all data-[level='1']:fill-green-200 data-[level='2']:fill-green-400 data-[level='3']:fill-green-600 data-[level='4']:fill-green-800 dark:data-[level='1']:fill-green-900 dark:data-[level='2']:fill-green-700 dark:data-[level='3']:fill-green-500 dark:data-[level='4']:fill-green-300"
                        title={`${activity.count} contributions on ${activity.date}`}
                      />
                    )}
                  </ContributionGraphCalendar>
                  <ContributionGraphFooter className="text-xs px-2">
                    <ContributionGraphTotalCount />
                    <ContributionGraphLegend />
                  </ContributionGraphFooter>
                </ContributionGraph>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {contributionData.github.currentStreak > 0 ? 
                      `🔥 ${contributionData.github.currentStreak} day streak!` : 
                      "Sync your GitHub to start tracking!"
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/sync" className="text-xs">
                        Sync Data
                        <GitBranch className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs">
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LeetCode Progress */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">LeetCode Progress</CardTitle>
                  <CardDescription className="text-orange-100">Daily problem solving</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-100 border-orange-400/30">
                {contributionData.leetcode.thisWeek > 0 ? "Active 💪" : "Start Today!"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Solve Streak</span>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-bold text-lg">{contributionData.leetcode.solveStreak} days</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Problems Solved</span>
                <span className="text-orange-600 font-medium">{contributionData.leetcode.totalSolved} / 3000+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <span className="text-muted-foreground">{contributionData.leetcode.thisWeek} problems</span>
              </div>
              {/* LeetCode Problem Solving Heatmap */}
              <div className="mt-4 -mx-2">
                <div className="text-xs text-muted-foreground mb-2 px-2">Problem solving activity</div>
                <ContributionGraph 
                  data={leetcodeContributions} 
                  blockSize={10}
                  blockMargin={2}
                  fontSize={11}
                  className="text-xs"
                  labels={{
                    totalCount: "{{count}} problems solved in {{year}}",
                    legend: { less: "0", more: "8+" }
                  }}
                >
                  <ContributionGraphCalendar hideMonthLabels>
                    {({ activity, dayIndex, weekIndex }) => (
                      <ContributionGraphBlock
                        activity={activity}
                        dayIndex={dayIndex}
                        weekIndex={weekIndex}
                        className="hover:stroke-2 hover:stroke-foreground/40 cursor-pointer transition-all data-[level='1']:fill-orange-200 data-[level='2']:fill-orange-400 data-[level='3']:fill-orange-600 data-[level='4']:fill-orange-800 dark:data-[level='1']:fill-orange-900 dark:data-[level='2']:fill-orange-700 dark:data-[level='3']:fill-orange-500 dark:data-[level='4']:fill-orange-300"
                        title={`${activity.count} problems solved on ${activity.date}`}
                      />
                    )}
                  </ContributionGraphCalendar>
                  <ContributionGraphFooter className="text-xs px-2">
                    <ContributionGraphTotalCount />
                    <ContributionGraphLegend />
                  </ContributionGraphFooter>
                </ContributionGraph>
              </div>
              
              {/* Difficulty Breakdown */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Difficulty Distribution</span>
                  <span>{contributionData.leetcode.totalSolved} total</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{contributionData.leetcode.easy}</div>
                    <div className="text-muted-foreground">Easy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-600">{contributionData.leetcode.medium}</div>
                    <div className="text-muted-foreground">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{contributionData.leetcode.hard}</div>
                    <div className="text-muted-foreground">Hard</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {contributionData.leetcode.solveStreak > 7 ? 
                      `🚀 Amazing ${contributionData.leetcode.solveStreak} day streak!` : 
                      contributionData.leetcode.solveStreak > 0 ?
                      `💪 ${contributionData.leetcode.solveStreak} day streak!` :
                      "Sync your LeetCode to start tracking!"
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/sync" className="text-xs">
                        Sync Data
                        <Target className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="text-xs">
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Writing Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.stats.streak || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.stats.streak === 1 ? "day" : "days"} in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.stats.totalEntries || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.stats.entriesThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Notes</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.kanbanSummary?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.kanbanSummary?.done || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats.hasEntryToday ? "✅" : "⏰"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.stats.hasEntryToday ? "Entry completed" : "No entry yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Entries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood & Word Count Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Mood Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dashboardData?.trends?.mood || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis domain={[1, 5]} fontSize={12} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Writing Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dashboardData?.trends?.wordCount || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="words" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Entries List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Entries
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/diary">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentEntries?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No diary entries yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/diary">Write your first entry</Link>
                    </Button>
                  </div>
                ) : (
                  dashboardData?.recentEntries?.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{entry.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()} • {entry.wordCount} words
                        </p>
                        {entry.aiSummary && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {entry.aiSummary}
                          </p>
                        )}
                      </div>
                      {entry.mood && (
                        <div className="ml-4 text-xl">
                          {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Kanban Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>To Do</span>
                  <span>{dashboardData?.kanbanSummary?.todo || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>In Progress</span>
                  <span>{dashboardData?.kanbanSummary?.['in-progress'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span>{dashboardData?.kanbanSummary?.done || 0}</span>
                </div>
              </div>
              <Progress 
                value={dashboardData?.kanbanSummary?.total ? 
                  (dashboardData.kanbanSummary.done / dashboardData.kanbanSummary.total) * 100 : 0
                } 
              />
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/notes">Manage Notes</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.activitySummary?.map((activity) => (
                  <div key={activity._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: activityColors[activity._id as keyof typeof activityColors] }}
                      />
                      <span className="text-sm capitalize">{activity._id}</span>
                    </div>
                    <Badge variant="secondary">{activity.count}</Badge>
                  </div>
                ))}
                {(!dashboardData?.activitySummary || dashboardData.activitySummary.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activities tracked yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/diary">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Write Entry
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/notes">
                  <Target className="h-4 w-4 mr-2" />
                  Add Task
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <GitBranch className="h-4 w-4 mr-2" />
                Sync GitHub
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}