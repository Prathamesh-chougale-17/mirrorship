"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface ActivitySummary {
  _id: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

interface ActivitySummaryProps {
  activities?: ActivitySummary[];
  activityColors: { [key: string]: string };
}

export function ActivitySummaryCard({ activities, activityColors }: ActivitySummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!activities || activities.length === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-2">No activities tracked</p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 4).map((activity) => (
              <div key={activity._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activityColors[activity._id] }}
                  />
                  <span className="text-xs capitalize">{activity._id}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{activity.count}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}