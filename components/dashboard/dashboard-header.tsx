"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
  userName?: string;
  isSyncing: boolean;
  onSync: () => void;
}

export function DashboardHeader({ userName, isSyncing, onSync }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {userName?.split(' ')[0] || 'User'}! 👋</h1>
        <p className="text-sm text-muted-foreground">Your coding journey at a glance</p>
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <Button size="sm" asChild>
          <Link href="/diary">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Link>
        </Button>
      </div>
    </div>
  );
}