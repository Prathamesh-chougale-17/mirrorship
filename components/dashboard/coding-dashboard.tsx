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
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-full">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Coding Dashboard</CardTitle>
              <CardDescription className="text-slate-300">GitHub + LeetCode Progress</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {lastSyncTime && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                Synced {lastSyncTime.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
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
            {/* Unified Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center justify-center mb-2">
                  <GitBranch className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">GitHub</span>
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {platformSettings.hasGitHub ? contributionData.github.stats.currentStreak : '--'}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">day streak</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">LeetCode</span>
                </div>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {platformSettings.hasLeetCode ? contributionData.leetcode.stats.solveStreak : '--'}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">day streak</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Combined</span>
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {(platformSettings.hasGitHub ? contributionData.github.stats.currentStreak : 0) + 
                   (platformSettings.hasLeetCode ? contributionData.leetcode.stats.solveStreak : 0)}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">total days</div>
              </div>
            </div>

            {/* Contribution Heatmaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {platformSettings.hasGitHub && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-green-600" />
                      GitHub Contributions
                    </h4>
                    <div className="text-xs text-muted-foreground">
                      {contributionData.github.stats.thisWeek} this week
                    </div>
                  </div>
                  <TooltipProvider>
                    <ContributionGraph 
                      data={contributionData.github.data} 
                      blockSize={8}
                      blockMargin={2}
                      fontSize={10}
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
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      LeetCode Problems
                    </h4>
                    <div className="text-xs text-muted-foreground">
                      {contributionData.leetcode.stats.totalSolved} solved
                    </div>
                  </div>
                  <TooltipProvider>
                    <ContributionGraph 
                      data={contributionData.leetcode.data} 
                      blockSize={8}
                      blockMargin={2}
                      fontSize={10}
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