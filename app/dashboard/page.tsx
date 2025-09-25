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

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
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
            <div className="text-2xl font-bold">{dashboardData?.kanbanSummary.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.kanbanSummary.done || 0} completed
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
                  <LineChart data={dashboardData?.trends.mood || []}>
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
                  <BarChart data={dashboardData?.trends.wordCount || []}>
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
                  <span>{dashboardData?.kanbanSummary.todo || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>In Progress</span>
                  <span>{dashboardData?.kanbanSummary['in-progress'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span>{dashboardData?.kanbanSummary.done || 0}</span>
                </div>
              </div>
              <Progress 
                value={dashboardData?.kanbanSummary.total ? 
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