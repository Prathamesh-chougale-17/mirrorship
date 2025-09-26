"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, GitBranch } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
          <Link href="/diary">
            <Plus className="h-3 w-3 mr-2" />
            New Entry
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
          <Link href="/notes">
            <Target className="h-3 w-3 mr-2" />
            Add Task
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
          <Link href="/sync">
            <GitBranch className="h-3 w-3 mr-2" />
            Sync Settings
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}