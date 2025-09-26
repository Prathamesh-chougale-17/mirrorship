"use client";

import { Card } from "@/components/ui/card";
import { Flame, BookOpen, Target, Calendar } from "lucide-react";

interface DashboardStats {
  streak: number;
  totalEntries: number;
  entriesThisMonth: number;
  hasEntryToday: boolean;
  totalNotes: number;
  recentActivities: number;
}

interface KanbanSummary {
  todo: number;
  'in-progress': number;
  done: number;
  total: number;
}

interface StatsOverviewProps {
  stats?: DashboardStats;
  kanbanSummary?: KanbanSummary;
}

export function StatsOverview({ stats, kanbanSummary }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-full">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold">{stats?.streak || 0}</div>
            <div className="text-xs text-muted-foreground">Writing streak</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-full">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-lg font-bold">{stats?.totalEntries || 0}</div>
            <div className="text-xs text-muted-foreground">Total entries</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-full">
            <Target className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <div className="text-lg font-bold">{kanbanSummary?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Active notes</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-full">
            <Calendar className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <div className="text-lg font-bold">
              {stats?.hasEntryToday ? "✅" : "⏰"}
            </div>
            <div className="text-xs text-muted-foreground">Today's entry</div>
          </div>
        </div>
      </Card>
    </div>
  );
}