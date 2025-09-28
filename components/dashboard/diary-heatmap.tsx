"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Flame, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DiaryEntry {
  date: string;
  count: number;
  wordCount?: number;
  mood?: number;
}

interface DiaryHeatmapProps {
  entries?: DiaryEntry[];
  isLoading?: boolean;
}

export function DiaryHeatmap({ entries = [], isLoading = false }: DiaryHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get the last 365 days
  const getDaysArray = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const days = getDaysArray();
  
  // Create a map for quick lookup
  const entryMap = new Map(entries.map(entry => [entry.date, entry]));
  
  // Get activity level for color intensity
  const getActivityLevel = (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count >= 3) return 3;
    return 1;
  };

  // Get color class based on activity level
  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      case 1: return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case 2: return "bg-green-300 dark:bg-green-700/50 border-green-400 dark:border-green-600";
      case 3: return "bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500";
      default: return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  // Calculate statistics
  const totalEntries = entries.reduce((sum, entry) => sum + entry.count, 0);
  const daysWithEntries = entries.filter(entry => entry.count > 0).length;
  const currentStreak = calculateCurrentStreak();
  const longestStreak = calculateLongestStreak();

  function calculateCurrentStreak(): number {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < days.length; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const entry = entryMap.get(dateString);
      
      if (entry && entry.count > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  function calculateLongestStreak(): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const day of days) {
      const entry = entryMap.get(day);
      if (entry && entry.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  // Group days by weeks for display
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get months for labels
  const getMonthLabels = () => {
    const labels = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < weeks.length; i += 4) {
      if (weeks[i] && weeks[i][0]) {
        const date = new Date(weeks[i][0]);
        labels.push({ index: i, label: months[date.getMonth()] });
      }
    }
    
    return labels;
  };

  const monthLabels = getMonthLabels();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Diary Writing Consistency
              </CardTitle>
              <CardDescription>Track your daily writing habit</CardDescription>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-20 w-20" />
              <Skeleton className="h-20 w-20" />
              <Skeleton className="h-20 w-20" />
              <Skeleton className="h-20 w-20" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Diary Writing Consistency
            </CardTitle>
            <CardDescription>Track your daily writing habit over the past year</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {currentStreak} day streak
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {daysWithEntries} active days
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-green-600">{totalEntries}</div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-blue-600">{daysWithEntries}</div>
              <div className="text-sm text-muted-foreground">Active Days</div>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-purple-600">{longestStreak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <div className="min-w-fit">
              {/* Month labels */}
              <div className="flex mb-2">
                <div className="w-8"></div> {/* Space for day labels */}
                <div className="flex-1 flex">
                  {monthLabels.map((month, index) => (
                    <div 
                      key={index} 
                      className="text-xs text-muted-foreground"
                      style={{ 
                        position: 'absolute',
                        left: `${(month.index * 12) + 32}px` // 12px per week + 32px offset
                      }}
                    >
                      {month.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day labels and heatmap grid */}
              <div className="flex">
                {/* Day labels */}
                <div className="flex flex-col mr-2">
                  {dayLabels.map((day, index) => (
                    <div key={day} className="h-3 mb-1 text-xs text-muted-foreground w-6 flex items-center">
                      {index % 2 === 1 && day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const date = week[dayIndex];
                        const entry = date ? entryMap.get(date) : null;
                        const count = entry?.count || 0;
                        const level = getActivityLevel(count);
                        
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`w-3 h-3 border rounded-sm cursor-pointer transition-all hover:scale-110 ${getColorClass(level)}`}
                            onClick={() => setSelectedDate(date || null)}
                            title={date ? `${date}: ${count} entries` : ''}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1 mx-2">
                  {[0, 1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`w-3 h-3 border rounded-sm ${getColorClass(level)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>

              {/* Selected date info */}
              {selectedDate && entryMap.get(selectedDate) && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="font-medium">{new Date(selectedDate).toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {entryMap.get(selectedDate)?.count} entries written
                    {entryMap.get(selectedDate)?.wordCount && 
                      ` • ${entryMap.get(selectedDate)?.wordCount} words`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}