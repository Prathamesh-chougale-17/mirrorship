import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-24 rounded" />
      </div>
    </div>
  );
}

export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-3 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
            <div className="flex-1 min-w-0 sm:text-left text-center">
              <Skeleton className="h-4 w-8 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ContributionHeatmapSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
      {/* Compact 9-month heatmap skeleton */}
      <div className="space-y-1">
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <div key={dayIndex} className="flex gap-1">
            <div className="flex-1 grid grid-cols-39 gap-1">
              {Array.from({ length: 39 }).map((_, weekIndex) => (
                <Skeleton key={weekIndex} className="h-2 w-2 rounded-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-3 w-16" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-12" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-2 rounded-sm" />
          ))}
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export function CodingDashboardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-4 md:p-6">
        <div className="space-y-6">
        {/* LeetCode Motivation Section */}
          <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-5 w-72 mb-2" />
                <Skeleton className="h-4 w-80" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </div>
          {/* Stats Row Skeleton - 6 cards including YouTube */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="p-3 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block">
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0 sm:text-left text-center">
                    <Skeleton className="h-4 w-8 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Sync Status */}
          <div className="text-center mb-4">
            <Skeleton className="h-3 w-40 mx-auto" />
          </div>
          
          {/* Heatmaps Grid - 2 platforms per row on large screens to match actual layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
                {/* Heatmap skeleton matching actual blockSize and layout */}
                <div className="space-y-1">
                  {Array.from({ length: 7 }).map((_, dayIndex) => (
                    <div key={dayIndex} className="flex gap-1">
                      <div className="flex-1 grid grid-cols-39 gap-1">
                        {Array.from({ length: 39 }).map((_, weekIndex) => (
                          <Skeleton key={weekIndex} className="h-3.5 w-3.5 rounded-sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Skeleton className="h-3 w-16" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-12" />
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Skeleton key={k} className="h-3 w-3 rounded-sm" />
                    ))}
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentEntriesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </span>
          <Skeleton className="h-6 w-16" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full ml-3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendsChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mood Trend Chart */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-[150px] w-full rounded" />
          </div>
          
          {/* Writing Volume Chart */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-[150px] w-full rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="w-full max-w-none">
        {/* Trends Chart Skeleton */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-1">
            <div className="bg-background rounded-lg shadow-sm border">
              <TrendsChartSkeleton />
            </div>
          </div>
        </div>
        
        {/* Recent Entries Skeleton */}
        <div className="w-full">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-1">
            <div className="bg-background rounded-lg shadow-sm border">
              <RecentEntriesSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}