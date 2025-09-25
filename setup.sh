#!/bin/bash

echo "🚀 Setting up Mirrorship Authentication..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created!"
    echo ""
    echo "⚠️  IMPORTANT: Please update the following in .env.local:"
    echo "   - BETTER_AUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - GOOGLE_CLIENT_ID (from Google Cloud Console)"
    echo "   - GOOGLE_CLIENT_SECRET (from Google Cloud Console)"
    echo "   - MONGODB_URI (if using a different MongoDB instance)"
    echo ""
else
    echo "✅ .env.local already exists"
fi

# Check if MongoDB is running (basic check)
echo "🔍 Checking MongoDB connection..."
if command -v mongosh >/dev/null 2>&1; then
    mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB not accessible. Please start MongoDB or update MONGODB_URI"
    fi
else
    echo "ℹ️  mongosh not found, skipping MongoDB check"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your credentials"
echo "2. Run: pnpm dev"
echo "3. Visit: http://localhost:3000"
echo ""
echo "📚 For detailed setup instructions, see README.md"