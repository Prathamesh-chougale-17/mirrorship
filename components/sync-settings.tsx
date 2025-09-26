"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Code, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SyncStatus {
  platform: 'github' | 'leetcode';
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  lastSync?: string;
}

export default function SyncSettings() {
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([
    { platform: 'github', status: 'idle' },
    { platform: 'leetcode', status: 'idle' }
  ]);

  // Load existing platform settings on component mount
  useEffect(() => {
    const loadPlatformSettings = async () => {
      try {
        const response = await fetch('/api/user/platform-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.githubUsername) {
            setGithubUsername(data.githubUsername);
          }
          if (data.leetcodeUsername) {
            setLeetcodeUsername(data.leetcodeUsername);
          }
        }
      } catch (error) {
        console.error('Failed to load platform settings:', error);
      }
    };

    loadPlatformSettings();
  }, []);

  const updateSyncStatus = (platform: 'github' | 'leetcode', updates: Partial<SyncStatus>) => {
    setSyncStatus(prev => prev.map(status => 
      status.platform === platform 
        ? { ...status, ...updates }
        : status
    ));
  };

  const handleGitHubSync = async () => {
    if (!githubUsername) {
      updateSyncStatus('github', { 
        status: 'error', 
        message: 'Please enter GitHub username' 
      });
      return;
    }

    if (!githubToken) {
      updateSyncStatus('github', { 
        status: 'error', 
        message: 'Personal Access Token is required for your own GitHub data' 
      });
      return;
    }

    updateSyncStatus('github', { status: 'syncing', message: 'Fetching contributions...' });

    try {
      // First, save the GitHub username to user settings
      await fetch('/api/user/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUsername,
          hasGitHub: true
        })
      });

      // Then sync the data
      const response = await fetch('/api/sync/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUsername,
          accessToken: githubToken,
          dateRange: {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        updateSyncStatus('github', {
          status: 'success',
          message: `Synced ${data.contributionsCount} contributions. Username saved to profile!`,
          lastSync: new Date().toISOString()
        });
      } else {
        updateSyncStatus('github', {
          status: 'error',
          message: data.error || 'Sync failed'
        });
      }
    } catch (error) {
      updateSyncStatus('github', {
        status: 'error',
        message: 'Network error occurred'
      });
    }
  };

  const handleLeetCodeSync = async () => {
    if (!leetcodeUsername) {
      updateSyncStatus('leetcode', { 
        status: 'error', 
        message: 'Please enter LeetCode username' 
      });
      return;
    }

    updateSyncStatus('leetcode', { status: 'syncing', message: 'Fetching submissions...' });

    try {
      // First, save the LeetCode username to user settings
      await fetch('/api/user/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leetcodeUsername,
          hasLeetCode: true
        })
      });

      // Then sync the data
      const response = await fetch('/api/sync/leetcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leetcodeUsername,
          dateRange: {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        updateSyncStatus('leetcode', {
          status: 'success',
          message: `Synced ${data.submissionsCount} submissions. Username saved to profile!`,
          lastSync: new Date().toISOString()
        });
      } else {
        updateSyncStatus('leetcode', {
          status: 'error',
          message: data.error || 'Sync failed'
        });
      }
    } catch (error) {
      updateSyncStatus('leetcode', {
        status: 'error',
        message: 'Network error occurred'
      });
    }
  };

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: SyncStatus) => {
    const variant = status.status === 'success' ? 'default' : 
                   status.status === 'error' ? 'destructive' : 
                   status.status === 'syncing' ? 'secondary' : 'outline';

    return (
      <Badge variant={variant} className="ml-2">
        {getStatusIcon(status.status)}
        <span className="ml-1">{status.status}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sync Settings</h2>
        <p className="text-muted-foreground">
          Connect your GitHub and LeetCode accounts to track your real contribution data.
        </p>
      </div>

      {/* GitHub Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Github className="h-5 w-5 mr-2" />
            GitHub Integration
            {getStatusBadge(syncStatus.find(s => s.platform === 'github')!)}
          </CardTitle>
          <CardDescription>
            Sync your GitHub contributions and commit activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="github-username" className="text-sm font-medium">GitHub Username</label>
              <Input
                id="github-username"
                placeholder="octocat"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="github-token" className="text-sm font-medium">
                Personal Access Token (Required - Must be YOUR token for YOUR GitHub account)
              </label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <p>
                  Get your token from{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    GitHub Settings → Developer settings → Personal access tokens
                  </a>
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 mt-2">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">⚠️ Security Notice:</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Each user must use their own Personal Access Token. You cannot use someone else's token 
                    to fetch their GitHub data due to GitHub's security policies.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {syncStatus.find(s => s.platform === 'github')?.message && (
            <div className="text-sm text-muted-foreground">
              {syncStatus.find(s => s.platform === 'github')?.message}
            </div>
          )}

          <Button 
            onClick={handleGitHubSync}
            disabled={syncStatus.find(s => s.platform === 'github')?.status === 'syncing'}
            className="w-full"
          >
            {syncStatus.find(s => s.platform === 'github')?.status === 'syncing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Github className="h-4 w-4 mr-2" />
                Sync GitHub Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* LeetCode Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            LeetCode Integration
            {getStatusBadge(syncStatus.find(s => s.platform === 'leetcode')!)}
          </CardTitle>
          <CardDescription>
            Sync your LeetCode submissions and problem solving activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="leetcode-username" className="text-sm font-medium">LeetCode Username</label>
            <Input
              id="leetcode-username"
              placeholder="your-username"
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
            />
          </div>
          
          {syncStatus.find(s => s.platform === 'leetcode')?.message && (
            <div className="text-sm text-muted-foreground">
              {syncStatus.find(s => s.platform === 'leetcode')?.message}
            </div>
          )}

          <Button 
            onClick={handleLeetCodeSync}
            disabled={syncStatus.find(s => s.platform === 'leetcode')?.status === 'syncing'}
            className="w-full"
          >
            {syncStatus.find(s => s.platform === 'leetcode')?.status === 'syncing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Code className="h-4 w-4 mr-2" />
                Sync LeetCode Data
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground">
            Note: Uses LeetCode's GraphQL API to fetch real submission calendar data for the past year.
            This provides actual problem-solving activity from your LeetCode profile.
          </div>
        </CardContent>
      </Card>

      {/* Last Sync Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {syncStatus.map(status => (
              <div key={status.platform} className="flex justify-between items-center">
                <span className="capitalize font-medium">{status.platform}</span>
                <div className="flex items-center text-sm text-muted-foreground">
                  {status.lastSync ? (
                    <span>Last sync: {new Date(status.lastSync).toLocaleString()}</span>
                  ) : (
                    <span>Never synced</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}