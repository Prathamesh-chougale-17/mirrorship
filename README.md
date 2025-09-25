# Mirrorship - Secure App with Better Auth

A Next.js application with Better Auth authentication system featuring Google OAuth and email/password authentication.

## Features

- ✅ **Better Auth Integration**: Modern authentication library for Next.js
- 🔐 **Google OAuth**: Sign in with Google account
- 📧 **Email/Password Auth**: Traditional email and password authentication
- 🛡️ **Route Protection**: All routes protected except home page
- 🎨 **Shadcn UI**: Beautiful and consistent UI components
- 📱 **Responsive Design**: Works on desktop and mobile
- 🌙 **Dark Mode Support**: Light and dark theme support

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- Google OAuth credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
pnpm install
```

### 2. Setup MongoDB

Make sure you have MongoDB running locally on `mongodb://localhost:27017` or set up a cloud MongoDB instance.

The database collections will be automatically created by Better Auth when you first run the application.

### 3. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
2. Create a new project or select existing one
3. Enable Google OAuth API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret

### 4. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your actual values:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mirrorship

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Next.js Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important**: Generate a secure secret key for `BETTER_AUTH_SECRET`. You can use:
```bash
openssl rand -base64 32
```

### 5. Run the Application

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Authentication Flow

### Public Routes
- `/` - Home page (public, shows auth status)

### Protected Routes
- `/dashboard` - User dashboard (requires authentication)
- All other routes are protected by default

### Auth Pages
- `/sign-in` - Sign in with Google or email/password
- `/sign-up` - Create account with Google or email/password

## Database Schema

Better Auth automatically creates the following MongoDB collections:

- `user` - User profiles and information
- `session` - User sessions
- `account` - OAuth accounts and password credentials
- `verification` - Email verification tokens (if enabled)

## Technologies Used

- **Framework**: Next.js 15 with App Router
- **Authentication**: Better Auth
- **Database**: MongoDB with official MongoDB adapter
- **UI Library**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: Better Auth's built-in state management
- **Notifications**: Sonner toast notifications

## Project Structure

```
├── app/
│   ├── api/auth/[...all]/route.ts    # Auth API routes
│   ├── sign-in/page.tsx              # Sign in page
│   ├── sign-up/page.tsx              # Sign up page  
│   ├── dashboard/page.tsx            # Protected dashboard
│   ├── layout.tsx                    # Root layout with Toaster
│   └── page.tsx                      # Home page
├── lib/
│   ├── auth-client.ts               # Auth client configuration
│   └── mongodb.ts                   # MongoDB connection
├── components/ui/                   # Shadcn UI components
├── auth.ts                          # Better Auth configuration
└── middleware.ts                    # Route protection middleware
```

## Security Features

1. **Route Protection**: Middleware redirects unauthenticated users
2. **Secure Sessions**: Server-side session management
3. **CSRF Protection**: Built-in CSRF protection
4. **Password Security**: Scrypt password hashing
5. **OAuth Security**: Secure Google OAuth implementation

## Customization

### Adding More OAuth Providers

Edit `auth.ts`:

```typescript
socialProviders: {
  google: { /* existing config */ },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  // Add more providers
}
```

### Modifying Protected Routes

Edit `middleware.ts` to change which routes require authentication.

### UI Customization

All UI components are in `components/ui/` and can be customized using Tailwind CSS.

## Production Deployment

1. Set production environment variables
2. Use a production MongoDB instance  
3. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your domain
4. Update Google OAuth redirect URI to your production domain
5. Use a secure `BETTER_AUTH_SECRET`

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB is running and URI is correct
2. **Google OAuth**: Check client ID, secret, and redirect URI configuration
3. **Environment Variables**: Make sure all required env vars are set
4. **CORS Issues**: Ensure `BETTER_AUTH_URL` matches your deployment URL

### Debug Mode

Set `NODE_ENV=development` for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test authentication flows
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
