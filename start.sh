#!/bin/bash
# Railway Health Check Script

echo "🔍 Verifying Railway Deployment Configuration..."
echo ""

# Check PORT
if [ -z "$PORT" ]; then
    echo "❌ PORT environment variable is not set"
    exit 1
else
    echo "✅ PORT is set to: $PORT"
fi

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
else
    echo "✅ DATABASE_URL is configured"
fi

# Check GitHub OAuth
if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo "❌ GitHub OAuth credentials are not configured"
    exit 1
else
    echo "✅ GitHub OAuth is configured"
fi

# Check FRONTEND_URL
if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  Warning: FRONTEND_URL is not set (CORS may fail)"
else
    echo "✅ FRONTEND_URL is set to: $FRONTEND_URL"
fi

echo ""
echo "🚀 Starting application..."
./main
