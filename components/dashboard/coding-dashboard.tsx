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
  TrendingUp,
  Trophy
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

interface CodingDashboardProps {
  platformSettings: PlatformSettings;
  contributionData: ContributionData;
  contributionsLoading: boolean;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  getTodaysLeetCodeActivity: () => number;
  getLeetCodeMotivation: () => Motivation;
  onManualSync: (platforms?: string[]) => void;
}

export function CodingDashboard({
  platformSettings,
  contributionData,
  contributionsLoading,
  lastSyncTime,
  isSyncing,
  getTodaysLeetCodeActivity,
  getLeetCodeMotivation,
  onManualSync
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
            {/* Compact, Creative Streak Badges */}
            <div className="flex flex-wrap gap-3 justify-center items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 border border-green-300 dark:border-green-700 shadow-sm">
                <GitBranch className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-900 dark:text-green-100">GitHub</span>
                <span className="text-lg font-bold text-green-800 dark:text-green-200">
                  {platformSettings.hasGitHub ? contributionData.github.stats.currentStreak : '--'}
                </span>
                <span className="text-xs text-green-700 dark:text-green-300 ml-1">day streak</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 border border-orange-300 dark:border-orange-700 shadow-sm">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-900 dark:text-orange-100">LeetCode</span>
                <span className="text-lg font-bold text-orange-800 dark:text-orange-200">
                  {platformSettings.hasLeetCode ? contributionData.leetcode.stats.solveStreak : '--'}
                </span>
                <span className="text-xs text-orange-700 dark:text-orange-300 ml-1">day streak</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-200 dark:from-purple-900 dark:to-indigo-900 border border-purple-300 dark:border-purple-700 shadow-sm">
                <Flame className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">Combined</span>
                <span className="text-lg font-bold text-purple-800 dark:text-purple-200">
                  {(platformSettings.hasGitHub ? contributionData.github.stats.currentStreak : 0) + 
                   (platformSettings.hasLeetCode ? contributionData.leetcode.stats.solveStreak : 0)}
                </span>
                <span className="text-xs text-purple-700 dark:text-purple-300 ml-1">total days</span>
              </div>
              {lastSyncTime && (
                <span className="ml-2 text-xs text-muted-foreground">Synced {lastSyncTime.toLocaleTimeString()}</span>
              )}
            </div>

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