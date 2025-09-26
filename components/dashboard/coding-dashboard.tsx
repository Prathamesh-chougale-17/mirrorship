"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain, 
  GitBranch, 
  Target, 
  Flame, 
  ArrowRight, 
  Code, 
  ExternalLink,
  AlertTriangle,
  Zap,
  Trophy,
  BookOpen
} from "lucide-react";
import { 
  ContributionGraph, 
  ContributionGraphCalendar, 
  ContributionGraphBlock, 
  ContributionGraphFooter, 
  ContributionGraphLegend,
  type Activity as ContributionActivity
} from "@/components/ui/kibo-ui/contribution-graph";
import Link from "next/link";

interface PlatformSettings {
  hasGitHub: boolean;
  hasLeetCode: boolean;
  isLoading: boolean;
}

interface ContributionStats {
  currentStreak: number;
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
    stats: ContributionStats;
    data: ContributionActivity[];
  };
  leetcode: {
    stats: ContributionStats;
    data: ContributionActivity[];
  };
}

interface Motivation {
  message: string;
  description: string;
  action: string;
  urgency: 'critical' | 'high' | 'medium' | 'low' | 'success';
}

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

interface CodingDashboardProps {
  platformSettings: PlatformSettings;
  contributionData: ContributionData;
  contributionsLoading: boolean;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  getTodaysLeetCodeActivity: () => number;
  getLeetCodeMotivation: () => Motivation;
  onManualSync: (platforms?: string[]) => void;
  stats?: DashboardStats;
  kanbanSummary?: KanbanSummary;
}

export function CodingDashboard({
  platformSettings,
  contributionData,
  contributionsLoading,
  lastSyncTime,
  isSyncing,
  getTodaysLeetCodeActivity,
  getLeetCodeMotivation,
  onManualSync,
  stats,
  kanbanSummary
}: CodingDashboardProps) {
  // Filter contribution data to show only last 9 months
  const filterLast9Months = (data: ContributionActivity[]): ContributionActivity[] => {
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
    const cutoffDate = nineMonthsAgo.toISOString().split('T')[0];
    
    return data.filter(activity => activity.date >= cutoffDate);
  };

  const filteredGithubData = filterLast9Months(contributionData.github.data);
  const filteredLeetcodeData = filterLast9Months(contributionData.leetcode.data);
  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-4 md:p-6">
        {(!platformSettings.hasGitHub && !platformSettings.hasLeetCode) ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect Your Platforms</h3>
              <p className="text-sm text-muted-foreground mb-6">Link GitHub and LeetCode to track your coding progress</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button asChild size="sm">
                <Link href="/sync">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Connect Platforms
                </Link>
              </Button>
            </div>
          </div>
        ) : contributionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* General Stats Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
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
            </div>

            {/* Coding Stats Overview - Compact Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-full">
                    <GitBranch className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {platformSettings.hasGitHub ? contributionData.github.stats.currentStreak : 0}
                    </div>
                    <div className="text-xs text-muted-foreground">GitHub streak</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-full">
                    <Target className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {platformSettings.hasLeetCode ? contributionData.leetcode.stats.solveStreak : 0}
                    </div>
                    <div className="text-xs text-muted-foreground">LeetCode streak</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sync Status */}
            {lastSyncTime && (
              <div className="text-center mb-4">
                <span className="text-xs text-muted-foreground">Last synced: {lastSyncTime.toLocaleTimeString()}</span>
              </div>
            )}

            {/* Contribution Heatmaps - Larger, More Prominent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {platformSettings.hasGitHub && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-green-600" />
                      GitHub Contributions
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {contributionData.github.stats.thisWeek} this week
                    </span>
                  </div>
                  <TooltipProvider>
                    <ContributionGraph 
                      data={filteredGithubData} 
                      blockSize={14}
                      blockMargin={3}
                      fontSize={12}
                      className="text-xs"
                    >
                      <ContributionGraphCalendar>
                        {({ activity, dayIndex, weekIndex }) => (
                          <ShadcnTooltip key={`github-${weekIndex}-${dayIndex}`}>
                            <TooltipTrigger asChild>
                              <ContributionGraphBlock
                                activity={activity}
                                dayIndex={dayIndex}
                                weekIndex={weekIndex}
                                className="hover:stroke-2 hover:stroke-foreground/40 cursor-pointer transition-all data-[level='0']:fill-muted data-[level='1']:fill-green-200 data-[level='2']:fill-green-400 data-[level='3']:fill-green-600 data-[level='4']:fill-green-800"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-center">
                                <div className="font-semibold">
                                  {activity.count === 0 ? 'No contributions' : `${activity.count} contributions`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(activity.date).toLocaleDateString()}
                                </div>
                              </div>
                            </TooltipContent>
                          </ShadcnTooltip>
                        )}
                      </ContributionGraphCalendar>
                      <ContributionGraphFooter className="text-xs">
                        <ContributionGraphLegend />
                      </ContributionGraphFooter>
                    </ContributionGraph>
                  </TooltipProvider>
                </div>
              )}
              {platformSettings.hasLeetCode && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      LeetCode Problems
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {contributionData.leetcode.stats.totalSolved} solved
                    </span>
                  </div>
                  <TooltipProvider>
                    <ContributionGraph 
                      data={filteredLeetcodeData} 
                      blockSize={14}
                      blockMargin={3}
                      fontSize={12}
                      className="text-xs"
                    >
                      <ContributionGraphCalendar>
                        {({ activity, dayIndex, weekIndex }) => (
                          <ShadcnTooltip key={`leetcode-${weekIndex}-${dayIndex}`}>
                            <TooltipTrigger asChild>
                              <ContributionGraphBlock
                                activity={activity}
                                dayIndex={dayIndex}
                                weekIndex={weekIndex}
                                className="hover:stroke-2 hover:stroke-foreground/40 cursor-pointer transition-all data-[level='0']:fill-muted data-[level='1']:fill-orange-200 data-[level='2']:fill-orange-400 data-[level='3']:fill-orange-600 data-[level='4']:fill-orange-800"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-center">
                                <div className="font-semibold">
                                  {activity.count === 0 ? 'No problems solved' : `${activity.count} problems solved`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(activity.date).toLocaleDateString()}
                                </div>
                              </div>
                            </TooltipContent>
                          </ShadcnTooltip>
                        )}
                      </ContributionGraphCalendar>
                      <ContributionGraphFooter className="text-xs">
                        <ContributionGraphLegend />
                      </ContributionGraphFooter>
                    </ContributionGraph>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* LeetCode Motivation Section */}
            {platformSettings.hasLeetCode && (() => {
              const motivation = getLeetCodeMotivation();
              const urgency = (motivation.urgency ?? 'medium') as 'critical' | 'high' | 'medium' | 'low' | 'success';
              
              const urgencyStyles = {
                critical: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-100' },
                high: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-900 dark:text-orange-100' },
                medium: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-900 dark:text-yellow-100' },
                low: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100' },
                success: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-900 dark:text-green-100' }
              };
              
              const style = urgencyStyles[urgency];
              
              return (
                <div className={`p-4 rounded-lg border ${style.bg} ${style.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${style.text}`}>{motivation.message}</div>
                      <div className={`text-xs ${style.text} opacity-80`}>{motivation.description}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {motivation.urgency === 'critical' && (
                        <Badge variant="destructive" className="text-xs px-2 py-1">OUT OF AIM!</Badge>
                      )}
                      <Button size="sm" asChild className="text-xs">
                        <a href="https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/" target="_blank">
                          {motivation.action}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Last sync: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
              </div>
              <div className="flex gap-2">
                {platformSettings.hasGitHub && (
                  <Button size="sm" variant="outline" asChild className="text-xs">
                    <a href="https://github.com" target="_blank">GitHub <ArrowRight className="h-3 w-3 ml-1" /></a>
                  </Button>
                )}
                {platformSettings.hasLeetCode && (
                  <Button size="sm" variant="outline" asChild className="text-xs">
                    <a href="https://leetcode.com" target="_blank">LeetCode <ArrowRight className="h-3 w-3 ml-1" /></a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}