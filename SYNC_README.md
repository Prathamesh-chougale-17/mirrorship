# Data Sync System

This document explains how to set up and use the automated data sync system for GitHub and LeetCode contributions.

## Overview

The sync system automatically fetches and updates contribution data from GitHub and LeetCode for all users who have configured their platform settings. It runs every 6 hours via GitHub Actions and can also be executed manually.

## Files Created

### Scripts
- `scripts/sync-data.js` - Main Node.js sync script
- `scripts/sync.sh` - Bash script wrapper (Linux/macOS)
- `scripts/sync.bat` - Batch script wrapper (Windows)

### GitHub Actions
- `.github/workflows/sync-data.yml` - Automated workflow that runs every 6 hours

## Setup

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
API_BASE_URL=https://your-app-domain.com
```

### 2. GitHub Actions Secrets

Add the following secrets to your GitHub repository settings:

- `MONGODB_URI` - Your MongoDB connection string
- `API_BASE_URL` - Your application's base URL (optional, defaults to localhost for development)
- `SLACK_WEBHOOK_URL` - (Optional) Slack webhook for failure notifications

### 3. Dependencies

The sync script requires the `mongodb` package. Install it:

```bash
npm install mongodb
```

## Usage

### Manual Execution

#### Using npm scripts:
```bash
# Sync all platforms
npm run sync

# Sync only GitHub (future feature)
npm run sync:github

# Sync only LeetCode (future feature)
npm run sync:leetcode
```

#### Using Node.js directly:
```bash
node scripts/sync-data.js
```

#### Using shell scripts:

**Linux/macOS:**
```bash
chmod +x scripts/sync.sh
./scripts/sync.sh
```

**Windows:**
```batch
scripts\sync.bat
```

### Automated Execution

The GitHub Actions workflow automatically runs every 6 hours:
- 00:00 UTC
- 06:00 UTC
- 12:00 UTC
- 18:00 UTC

You can also trigger it manually from the GitHub Actions tab.

### Cron Job Setup (Alternative to GitHub Actions)

If you prefer to run the sync on your own server, set up a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run every 6 hours
0 */6 * * * /path/to/your/project/scripts/sync.sh >> /path/to/your/project/sync.log 2>&1
```

## How It Works

### Data Sources

1. **GitHub API**
   - Fetches contribution calendar data
   - Retrieves pull request information
   - Gets issue contribution data
   - Uses GitHub GraphQL API for efficient data fetching

2. **LeetCode API**
   - Fetches submission calendar data
   - Retrieves recent accepted submissions
   - Gets problem-solving statistics
   - Uses LeetCode's unofficial GraphQL endpoint

### Data Processing

1. **User Discovery**: Finds all users with enabled platform integrations
2. **Data Fetching**: Calls respective APIs for each configured platform
3. **Data Transformation**: Converts API responses to our database schema
4. **Data Storage**: Saves processed data to MongoDB collections:
   - `github_contributions` - GitHub contribution data
   - `leetcode_submissions` - LeetCode submission data

### Error Handling

- Individual user failures don't stop the entire sync process
- Detailed logging for debugging
- Graceful handling of API rate limits
- Retry logic for transient failures

## Monitoring

### Logs

- Console output shows sync progress and results
- `sync.log` file contains timestamped sync history
- GitHub Actions logs available in the repository's Actions tab

### Success Indicators

- ✅ Successful syncs are logged with user email and platform
- 📊 Summary shows total users processed
- 🔄 Individual platform sync status

### Failure Handling

- ❌ Failed syncs are logged with error details
- 🚨 Optional Slack notifications for critical failures
- 🔄 Automatic retry on next scheduled run

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` environment variable
   - Verify database connectivity
   - Ensure database user has proper permissions

2. **GitHub API Rate Limits**
   - GitHub allows 5000 requests/hour for authenticated requests
   - The script respects rate limits and will retry if needed
   - Consider spreading sync times for large user bases

3. **LeetCode API Issues**
   - LeetCode's API is unofficial and may change
   - Username case sensitivity matters
   - Some profiles may be private

4. **User Authentication Issues**
   - Verify GitHub access tokens are valid and have required scopes
   - Check that LeetCode usernames exist and are public

### Debug Mode

Run with debug output:

```bash
DEBUG=1 node scripts/sync-data.js
```

### Manual Testing

Test individual user sync:

```bash
# Add this to the script for testing specific users
SYNC_USER_EMAIL=user@example.com node scripts/sync-data.js
```

## Security Considerations

- Store sensitive tokens in environment variables or secrets
- Use GitHub App tokens when possible (more secure than personal tokens)
- Regularly rotate access tokens
- Monitor for unusual API usage patterns

## Performance Optimization

- The script processes users sequentially to avoid overwhelming APIs
- Consider implementing concurrent processing with rate limiting for large user bases
- Monitor database performance during sync operations
- Use database indexes on frequently queried fields

## Future Enhancements

- [ ] Add support for more platforms (GitLab, Codeforces, etc.)
- [ ] Implement incremental syncs (only fetch new data)
- [ ] Add webhook support for real-time updates
- [ ] Create a web UI for monitoring sync status
- [ ] Implement user-specific sync scheduling
- [ ] Add data retention policies