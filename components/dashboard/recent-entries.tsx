"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RecentEntry {
  id: string;
  title: string;
  date: string;
  mood?: number;
  wordCount: number;
  aiSummary?: string;
}

interface RecentEntriesProps {
  entries?: RecentEntry[];
  moodEmojis: { [key: number]: string };
  isLoading?: boolean;
}

export function RecentEntries({ entries, moodEmojis, isLoading = false }: RecentEntriesProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Recent Entries
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/diary" className="text-xs">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
        ) : entries?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-3">No diary entries yet</p>
            <Button size="sm" asChild>
              <Link href="/diary">Write your first entry</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries?.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()} • {entry.wordCount} words
                  </p>
                </div>
                {entry.mood && (
                  <div className="ml-3 text-lg">
                    {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}