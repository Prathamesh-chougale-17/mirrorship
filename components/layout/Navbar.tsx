"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useSession, signOut } from "@/lib/auth-client";
import { User, Settings, LogOut, BookOpen, BarChart3, Home,  Github, TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [platformData, setPlatformData] = useState<{
    githubUsername?: string;
    leetcodeUsername?: string;
    loading: boolean;
  }>({ loading: true });

  // Fetch platform usernames when user is logged in
  useEffect(() => {
    if (session?.user?.id) {
      fetchPlatformData();
    }
  }, [session]);

  const fetchPlatformData = async () => {
    try {
      const response = await fetch("/api/user/platform-settings");
      const data = await response.json();
      
      if (response.ok) {
        setPlatformData({
          githubUsername: data.githubUsername,
          leetcodeUsername: data.leetcodeUsername,
          loading: false
        });
      }
    } catch (error) {
      console.error("Error fetching platform data:", error);
      setPlatformData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully!");
            router.push("/");
          },
        },
      });
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home, public: true },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3, public: false },
    { href: "/diary", label: "Diary", icon: BookOpen, public: false },
    { href: "/aims", label: "Aims", icon: TargetIcon, public: false },
    { href: "/profile", label: "Profile", icon: User, public: false },
    {
      href: "/projects", label: "Projects", icon: Github, public: false
    }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">M</span>
          </div>
          <span className="text-xl font-bold">Mirrorship</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            // Show public items or private items only if authenticated
            if (!item.public && !session) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 text-sm transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-2">
          <AnimatedThemeToggler />
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user.name && (
                      <p className="font-medium">{session.user.name}</p>
                    )}
                    {session.user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                    {/* Platform Usernames */}
                    {!platformData.loading && (
                      <div className="flex flex-col space-y-1 mt-2">
                        {platformData.githubUsername && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Github className="h-3 w-3" />
                            <span>@{platformData.githubUsername}</span>
                          </div>
                        )}
                        {platformData.leetcodeUsername && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <div className="h-3 w-3 rounded-sm bg-orange-600 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">LC</span>
                            </div>
                            <span>@{platformData.leetcodeUsername}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/diary" className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Diary</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/aims" className="flex items-center">
                    <TargetIcon className="mr-2 h-4 w-4" />
                    <span>Aims</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu for navigation when authenticated */}
          {session && (
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {navItems
                    .filter((item) => item.public || session)
                    .map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}