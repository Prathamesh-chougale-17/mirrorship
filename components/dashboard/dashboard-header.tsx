"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
  userName?: string;
  isSyncing: boolean;
  onSync: () => void;
  isLoading?: boolean;
  dailyQuote?: string | null;
}

export function DashboardHeader({ userName, isSyncing, onSync, isLoading = false, dailyQuote }: DashboardHeaderProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-10" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {userName?.split(' ')[0] || 'User'}! 👋</h1>
        <p className="text-sm text-muted-foreground">Your coding journey at a glance</p>
        {dailyQuote ? (
          <p className="mt-2 text-sm italic text-muted-foreground">"{dailyQuote}"</p>
        ) : null}
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