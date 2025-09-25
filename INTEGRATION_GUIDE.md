# GitHub & LeetCode Integration Guide

This document outlines how to integrate real GitHub and LeetCode APIs into the Mirrorship dashboard.

## 🚀 Current Implementation

The dashboard now features authentic GitHub-style contribution heatmaps and LeetCode problem-solving calendars:

### ✨ Features Implemented:
- **GitHub Contribution Heatmap**: Full 12-month calendar view with contribution levels
- **LeetCode Problem Heatmap**: Similar calendar showing daily problem-solving activity
- **Interactive Tooltips**: Hover to see exact contribution/problem counts per day
- **Visual Legend**: "Less" to "More" activity indicators
- **Total Count Display**: Year summary of contributions/problems solved
- **Responsive Design**: Proper scaling across different screen sizes

### 🎨 Visual Design:
- **GitHub Style**: Green gradient (light to dark) matching GitHub's actual colors
- **LeetCode Style**: Orange gradient matching LeetCode's branding
- **Smooth Animations**: Hover effects and transitions
- **Month Labels**: Automatic month indicators
- **Mobile Optimized**: Horizontal scrolling on smaller screens

## 📊 GitHub Integration

### Option 1: GitHub REST API (Recommended)
```bash
# Install GitHub API client
pnpm add @octokit/rest

# Environment variables needed:
GITHUB_TOKEN=your_personal_access_token
GITHUB_USERNAME=your_username
```

### Implementation Steps:
1. **Get GitHub Personal Access Token**
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens
   - Create token with `repo` and `user` scopes

2. **Update API endpoint** (`app/api/contributions/route.ts`):
```typescript
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Get user events (commits, PRs, etc.)
const events = await octokit.rest.activity.listEventsForAuthenticatedUser({
  username: process.env.GITHUB_USERNAME,
  per_page: 100
});

// Calculate streak from events
const contributionDays = events.data
  .filter(event => ['PushEvent', 'PullRequestEvent'].includes(event.type))
  .map(event => event.created_at.split('T')[0]);
```

### Option 2: GitHub GraphQL API
```typescript
// Get contribution calendar data
const query = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;
```

## 🧩 LeetCode Integration

### Option 1: Community Package
```bash
pnpm add leetcode-query
```

```typescript
import LeetCodeQuery from 'leetcode-query';

const leetcode = new LeetCodeQuery();
const userProfile = await leetcode.user('your-username');
const submissions = await leetcode.submissions('your-username');
```

### Option 2: Direct GraphQL (Unofficial)
```typescript
const query = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      submissionCalendar
    }
  }
`;

const response = await fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { username: 'your-username' } })
});
```

## 🔄 Real-time Updates

### Browser Extension Approach (Recommended)
1. **Create Chrome Extension** to track activity
2. **Send data to your app** via webhook/API
3. **Store in database** for persistence

### Polling Approach
```typescript
// Set up periodic updates
setInterval(async () => {
  await fetch('/api/contributions/sync');
}, 30 * 60 * 1000); // Every 30 minutes
```

### Webhook Approach
1. **GitHub Webhooks** for repository events
2. **Custom webhook handler** for LeetCode submissions
3. **Real-time dashboard updates** via WebSocket

## 📱 Enhanced Features

### Streak Protection Alerts
```typescript
// Check if streak is at risk
const lastActivity = new Date(lastContributionDate);
const now = new Date();
const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

if (hoursSinceLastActivity > 18) {
  // Send notification: "Your streak is at risk!"
  sendPushNotification({
    title: "🔥 Streak Alert!",
    body: "Don't break your coding streak! Time to commit some code."
  });
}
```

### Gamification Elements
- **Achievement badges** for milestones
- **Leaderboard** with friends
- **Challenge modes** (30-day streak, etc.)
- **Habit tracking** integration

## 🛠 Environment Setup

Add to `.env.local`:
```bash
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-github-username

# LeetCode Integration (if using API)
LEETCODE_SESSION=your-session-cookie
LEETCODE_USERNAME=your-leetcode-username

# Webhooks
WEBHOOK_SECRET=your-webhook-secret
```

## 🚀 Deployment Considerations

1. **Rate Limiting**: GitHub API has rate limits (5000 requests/hour)
2. **Caching**: Cache data to reduce API calls
3. **Error Handling**: Graceful fallbacks when APIs are down
4. **Data Privacy**: Don't store sensitive tokens in client
5. **CORS**: Configure properly for cross-origin requests

## 📈 Future Enhancements

- **Multiple Platform Support**: GitLab, Bitbucket, CodeForces, HackerRank
- **Team/Organization Tracking**: Track team contributions
- **Custom Goals**: Set personal coding goals and track progress
- **Social Features**: Share achievements, compare with friends
- **Analytics**: Detailed insights into coding patterns
- **Integration with Mirrorship**: Link coding activity with journal entries

Start with GitHub REST API for quick wins, then gradually add more sophisticated features!