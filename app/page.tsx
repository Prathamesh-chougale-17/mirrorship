"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BarChart3, Brain, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <div className="container px-4 py-20 mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Personal Reflection Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Mirrorship combines daily journaling with AI-powered insights and activity tracking. 
              Write, reflect, and discover patterns in your personal growth journey.
            </p>
            
            {/* CTA Based on Auth Status */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isPending ? (
                <div className="h-12 w-32 bg-muted animate-pulse rounded-lg" />
              ) : session ? (
                <div className="space-y-4">
                  <p className="text-lg text-green-600 dark:text-green-400">
                    Welcome back, {session.user.name}! 👋
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button asChild size="lg" className="text-lg px-8">
                      <Link href="/dashboard">
                        <BarChart3 className="mr-2 h-5 w-5" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-lg px-8">
                      <Link href="/diary">
                        <BookOpen className="mr-2 h-5 w-5" />
                        Write Entry
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link href="/sign-up">
                      Get Started Free
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8">
                    <Link href="/sign-in">
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Feature Preview */}
            <div className="relative mx-auto max-w-4xl">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border shadow-2xl overflow-hidden">
                <div className="p-8 h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      Diary • AI Insights • Activity Tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need for personal growth</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combine journaling, AI insights, and activity tracking in one beautiful platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle>Rich Diary Editor</CardTitle>
                <CardDescription>
                  Write your thoughts with a beautiful, distraction-free editor powered by advanced text formatting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-12 w-12 text-purple-500 mb-4" />
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Get daily summaries and insights from your entries using advanced AI to track your emotional patterns
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-green-500 mb-4" />
                <CardTitle>Activity Dashboard</CardTitle>
                <CardDescription>
                  Track your coding, social media, and creative activities with beautiful charts and analytics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-red-500 mb-4" />
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  Your personal reflections are encrypted and private. Only you have access to your thoughts and data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-500 mb-4" />
                <CardTitle>Smart Reminders</CardTitle>
                <CardDescription>
                  Get gentle nudges to maintain your journaling habit and track your consistency over time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-cyan-500 mb-4" />
                <CardTitle>Personal Growth</CardTitle>
                <CardDescription>
                  Discover patterns in your thoughts, mood, and productivity to make meaningful life improvements
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container px-4 mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl font-bold mb-4">
              Start Your Reflection Journey Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of people using Mirrorship to understand themselves better and achieve personal growth.
            </p>
            {!session && (
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link href="/sign-up">
                  Get Started - It's Free
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
