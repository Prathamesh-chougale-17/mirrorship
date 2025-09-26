"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Heart, BookOpen, TrendingUp } from "lucide-react";

interface TrendData {
  mood: Array<{ date: string; mood: number }>;
  wordCount: Array<{ date: string; words: number }>;
}

interface TrendsChartProps {
  trends?: TrendData;
  isLoading?: boolean;
}

export function TrendsChart({ trends, isLoading = false }: TrendsChartProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Writing & Mood Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Mood Trend
              </div>
              <Skeleton className="h-[150px] w-full" />
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Writing Volume
              </div>
              <Skeleton className="h-[150px] w-full" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Mood Trend
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={trends?.mood || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis domain={[1, 5]} fontSize={10} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Writing Volume
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={trends?.wordCount || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="words" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}