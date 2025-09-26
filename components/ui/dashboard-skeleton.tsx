import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1">
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
      <div className="space-y-2">
        {/* Week labels */}
        <div className="flex gap-1">
          <Skeleton className="h-3 w-6" />
          <div className="flex-1 grid grid-cols-53 gap-1">
            {Array.from({ length: 53 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-3" />
            ))}
          </div>
        </div>
        {/* Days grid */}
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <div key={dayIndex} className="flex gap-1">
            <Skeleton className="h-3 w-6" />
            <div className="flex-1 grid grid-cols-53 gap-1">
              {Array.from({ length: 53 }).map((_, weekIndex) => (
                <Skeleton key={weekIndex} className="h-3 w-3" />
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
            <Skeleton key={i} className="h-3 w-3" />
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
          {/* Stats Row Skeleton */}
          <StatsRowSkeleton />
          
          {/* Sync Status */}
          <div className="text-center">
            <Skeleton className="h-3 w-40 mx-auto" />
          </div>
          
          {/* Heatmaps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ContributionHeatmapSkeleton />
            <ContributionHeatmapSkeleton />
            <ContributionHeatmapSkeleton />
          </div>
          
          {/* Motivation Section */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-5 w-80 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentEntriesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-6" />
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart area */}
          <Skeleton className="h-64 w-full" />
          
          {/* Legend */}
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-4 w-16" />
            </div>
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