"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="flex justify-center">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={200}
              height={42}
              priority
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white">
              Welcome to{" "}
              <span className="text-blue-600">Mirrorship</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A secure Next.js application with Better Auth authentication, 
              featuring Google OAuth and beautiful UI components.
            </p>
          </div>

          {/* Authentication Status */}
          <div className="max-w-md mx-auto">
            {isPending ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : session ? (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardHeader className="text-center">
                  <CardTitle className="text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
                    ✅ Welcome back, {session.user.name}!
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-300">
                    You are successfully authenticated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    Sign in to access protected features and your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/sign-up">Create Account</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 Secure Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Built with Better Auth featuring Google OAuth and email/password authentication.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛡️ Route Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Middleware-based route protection ensures only authenticated users access protected content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎨 Beautiful UI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Consistent design system using Shadcn UI components with dark mode support.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Built with Modern Technology
          </h2>
          <div className="flex flex-wrap justify-center gap-4 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border">
              <Image src="/next.svg" alt="Next.js" width={24} height={24} className="dark:invert" />
              <span className="font-medium">Next.js 15</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border">
              <span className="text-2xl">🔐</span>
              <span className="font-medium">Better Auth</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border">
              <span className="text-2xl">🍃</span>
              <span className="font-medium">MongoDB</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border">
              <span className="text-2xl">🎨</span>
              <span className="font-medium">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
