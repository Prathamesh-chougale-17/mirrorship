"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface KanbanSummary {
  todo: number;
  'in-progress': number;
  done: number;
  total: number;
}

interface TaskProgressProps {
  kanbanSummary?: KanbanSummary;
}

export function TaskProgress({ kanbanSummary }: TaskProgressProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>To Do</span>
            <Badge variant="secondary" className="text-xs">{kanbanSummary?.todo || 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span>In Progress</span>
            <Badge variant="secondary" className="text-xs">{kanbanSummary?.['in-progress'] || 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Done</span>
            <Badge variant="secondary" className="text-xs">{kanbanSummary?.done || 0}</Badge>
          </div>
        </div>
        <Progress 
          value={kanbanSummary?.total ? 
            (kanbanSummary.done / kanbanSummary.total) * 100 : 0
          }
          className="h-2"
        />
        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
          <Link href="/aims">Manage Tasks</Link>
        </Button>
      </CardContent>
    </Card>
  );
}