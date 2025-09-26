"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { CalendarDays, User, Shield, Github, Edit, Trash2, Plus, ExternalLink, Settings, Activity, BookOpen, Target } from "lucide-react";
import { toast } from "sonner";


interface PlatformData {
  githubUsername?: string;
  githubAccessToken?: string;
  leetcodeUsername?: string;
  hasGitHub?: boolean;
  hasLeetCode?: boolean;
}

interface ProfileStats {
  totalEntries: number;
  totalNotes: number;
  currentStreak: number;
  joinedDays: number;
}

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [platformData, setPlatformData] = useState<PlatformData>({});
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [editTokenDialogOpen, setEditTokenDialogOpen] = useState(false);
  const [newGithubToken, setNewGithubToken] = useState("");
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalEntries: 0,
    totalNotes: 0,
    currentStreak: 0,
    joinedDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<'github' | 'leetcode' | null>(null);
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    }
  }, [session]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      // Fetch platform settings
      const platformResponse = await fetch("/api/user/platform-settings");
      if (platformResponse.ok) {
        const platformJson = await platformResponse.json();
        const settings = platformJson.settings || {};
        setPlatformData({
          githubUsername: settings.github?.username,
          githubAccessToken: settings.github?.accessToken,
          leetcodeUsername: settings.leetcode?.username,
          hasGitHub: !!(settings.github?.username && settings.github?.accessToken),
          hasLeetCode: !!settings.leetcode?.username
        });
      }

      // Fetch dashboard stats for profile stats
      const statsResponse = await fetch("/api/dashboard");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setProfileStats({
          totalEntries: statsData.stats?.totalEntries || 0,
          totalNotes: statsData.kanbanSummary?.total || 0,
          currentStreak: statsData.stats?.currentStreak || 0,
          joinedDays: Math.floor((Date.now() - new Date(session!.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlatform = (platform: 'github' | 'leetcode') => {
    setEditingPlatform(platform);
    setNewUsername(platform === 'github' ? platformData.githubUsername || "" : platformData.leetcodeUsername || "");
    setEditDialogOpen(true);
  };

  const handleEditGithubToken = () => {
    setNewGithubToken(platformData.githubAccessToken || "");
    setEditTokenDialogOpen(true);
  };

  const handleSavePlatform = async () => {
    if (!editingPlatform || !newUsername.trim()) return;

    try {
      const patch: any = {};
      if (editingPlatform === 'github') {
        patch.github = { username: newUsername.trim() };
      } else {
        patch.leetcode = { username: newUsername.trim() };
      }
      const response = await fetch("/api/user/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });

      if (response.ok) {
        setPlatformData(prev => ({
          ...prev,
          [`${editingPlatform}Username`]: newUsername.trim(),
          [`has${editingPlatform.charAt(0).toUpperCase() + editingPlatform.slice(1)}`]: true
        }));
        toast.success(`${editingPlatform === 'github' ? 'GitHub' : 'LeetCode'} username updated successfully`);
        setEditDialogOpen(false);
        fetchProfileData();
      } else {
        throw new Error("Failed to update username");
      }
    } catch (error) {
      toast.error(`Failed to update ${editingPlatform === 'github' ? 'GitHub' : 'LeetCode'} username`);
    }
  };

  const handleSaveGithubToken = async () => {
    if (!newGithubToken.trim()) return;
    try {
      const response = await fetch("/api/user/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github: { accessToken: newGithubToken.trim() } })
      });
      if (response.ok) {
        setPlatformData(prev => ({ ...prev, githubAccessToken: newGithubToken.trim() }));
        toast.success("GitHub access token updated successfully");
        setEditTokenDialogOpen(false);
        fetchProfileData();
      } else {
        throw new Error("Failed to update token");
      }
    } catch (error) {
      toast.error("Failed to update GitHub access token");
    }
  };

  const handleDeleteGithubToken = async () => {
    try {
      const response = await fetch("/api/user/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github: { accessToken: null } })
      });
      if (response.ok) {
        setPlatformData(prev => ({ ...prev, githubAccessToken: undefined }));
        toast.success("GitHub access token removed");
        setEditTokenDialogOpen(false);
        fetchProfileData();
      } else {
        throw new Error("Failed to remove token");
      }
    } catch (error) {
      toast.error("Failed to remove GitHub access token");
    }
  };

  const handleDeletePlatform = async (platform: 'github' | 'leetcode') => {
    try {
      const response = await fetch("/api/user/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [`${platform}Username`]: null,
          [`has${platform.charAt(0).toUpperCase() + platform.slice(1)}`]: false
        })
      });

      if (response.ok) {
        setPlatformData(prev => ({
          ...prev,
          [`${platform}Username`]: undefined,
          [`has${platform.charAt(0).toUpperCase() + platform.slice(1)}`]: false
        }));
        toast.success(`${platform === 'github' ? 'GitHub' : 'LeetCode'} account disconnected`);
      } else {
        throw new Error("Failed to disconnect account");
      }
    } catch (error) {
      toast.error(`Failed to disconnect ${platform === 'github' ? 'GitHub' : 'LeetCode'} account`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
              <AvatarImage 
                src={session.user.image || undefined} 
                alt={session.user.name || "User"} 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-4xl">
                {getInitials(session.user.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2">
              <Badge className="bg-green-500 hover:bg-green-600">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
          <h1 className="text-4xl font-bold mt-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {session.user.name}
          </h1>
          <p className="text-xl text-muted-foreground mt-2">{session.user.email}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Member since {new Date(session.user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{isLoading ? "..." : profileStats.totalEntries}</div>
              <div className="text-sm opacity-90">Diary Entries</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{isLoading ? "..." : profileStats.totalNotes}</div>
              <div className="text-sm opacity-90">Total Notes</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <Target className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{isLoading ? "..." : profileStats.currentStreak}</div>
              <div className="text-sm opacity-90">Current Streak</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <CalendarDays className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{profileStats.joinedDays}</div>
              <div className="text-sm opacity-90">Days Active</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your account details and basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-medium">{session.user.name}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <p className="text-lg font-medium">{session.user.email}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="font-mono text-sm bg-muted px-3 py-2 rounded-md">
                    {session.user.id}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                  <Badge variant="secondary" className="text-sm">
                    <Shield className="w-3 h-3 mr-1" />
                    Active & Verified
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage your account and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/dashboard")}
              >
                <Activity className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/diary")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Diary
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/notes")}
              >
                <Activity className="w-4 h-4 mr-2" />
                Notes
              </Button>

              <Separator />

              <Button 
                variant="outline" 
                className="w-full justify-start"
                disabled
              >
                <Shield className="w-4 h-4 mr-2" />
                Security Settings
                <Badge variant="secondary" className="ml-auto text-xs">
                  Soon
                </Badge>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Platform Connections */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Platform Connections
            </CardTitle>
            <CardDescription>
              Manage your GitHub and LeetCode account connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GitHub Connection */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-8 w-8" />
                    <div>
                      <h3 className="font-semibold">GitHub</h3>
                      <p className="text-sm text-muted-foreground">Connect your GitHub account</p>
                    </div>
                  </div>
                  {platformData.hasGitHub ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not Connected</Badge>
                  )}
                </div>
                {platformData.githubUsername && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Username:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">@{platformData.githubUsername}</code>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Access Token:</span>
                  {platformData.githubAccessToken ? (
                    <>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {showGithubToken ? platformData.githubAccessToken : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => setShowGithubToken(v => !v)}>
                        {showGithubToken ? 'Hide' : 'Show'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleEditGithubToken}>
                        <Edit className="h-4 w-4 mr-1" />Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDeleteGithubToken}>
                        <Trash2 className="h-4 w-4 mr-1" />Remove
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleEditGithubToken}>
                      <Plus className="h-4 w-4 mr-1" />Add Token
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditPlatform('github')}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {platformData.githubUsername ? 'Edit Username' : 'Add Username'}
                  </Button>
                  {platformData.githubUsername && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeletePlatform('github')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Username
                    </Button>
                  )}
                </div>
              </div>

              {/* LeetCode Connection */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-orange-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">LC</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">LeetCode</h3>
                      <p className="text-sm text-muted-foreground">Connect your LeetCode account</p>
                    </div>
                  </div>
                  {platformData.hasLeetCode ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not Connected</Badge>
                  )}
                </div>
                
                {platformData.leetcodeUsername && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Username:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">@{platformData.leetcodeUsername}</code>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditPlatform('leetcode')}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {platformData.leetcodeUsername ? 'Edit' : 'Add'}
                  </Button>
                  
                  {platformData.leetcodeUsername && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeletePlatform('leetcode')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Username Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlatform === 'github' ? 'Edit GitHub Username' : 'Edit LeetCode Username'}
              </DialogTitle>
              <DialogDescription>
                Enter your {editingPlatform === 'github' ? 'GitHub' : 'LeetCode'} username to connect your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={`Enter your ${editingPlatform === 'github' ? 'GitHub' : 'LeetCode'} username`}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlatform} disabled={!newUsername.trim()}>
                Save Username
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit GitHub Token Dialog */}
        <Dialog open={editTokenDialogOpen} onOpenChange={setEditTokenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit GitHub Access Token</DialogTitle>
              <DialogDescription>
                Enter your GitHub personal access token. This is required to sync your private and public contributions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Token</label>
              <Input
                value={newGithubToken}
                onChange={(e) => setNewGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxx"
                type="password"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTokenDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGithubToken} disabled={!newGithubToken.trim()}>
                Save Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}