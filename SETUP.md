# Setup Guide - DevScope

Complete setup guide for running DevScope locally with GitHub OAuth and PostgreSQL.

## Prerequisites

- **Go 1.24.2+** - [Download](https://go.dev/dl/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL Database** - We use Neon (already configured)
- **GitHub Account** - For OAuth authentication

## Step 1: Clone the Repository

```bash
git clone https://github.com/AnantaCoder/github-insights.git
cd github-insights
```

## Step 2: Setup GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: DevScope Local
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:8080/api/auth/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it

## Step 3: Configure Environment Variables

### Backend Configuration

Create `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Backend Configuration
PORT=8080

# Database Configuration (Already configured with Neon)
DATABASE_URL=postgresql://neondb_owner:npg_JHbit7KAS0VU@ep-withered-scene-a12y3u8c-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# GitHub OAuth Configuration (Add your values)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URL=http://localhost:8080/api/auth/callback

# Optional: GitHub Personal Access Token for higher rate limits
GITHUB_TOKEN=your_github_token_here

# Optional: NVIDIA AI API Key for AI comparisons
NVIDIA_API_KEY=your_nvidia_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

Create `frontend/.env.local`:

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Step 4: Install Dependencies

### Backend Dependencies

```bash
cd backend
go mod download
```

### Frontend Dependencies

```bash
cd frontend
npm install
```

## Step 5: Start the Application

### Start Backend (Terminal 1)

```bash
cd backend
go run ./cmd/main.go
```

You should see:

```
✅ PostgreSQL connected successfully
✅ Database schema initialized
🚀 DevScope API - Full-Stack GitHub Analytics with Authentication
✅ Server: http://localhost:8080
🗄️  Database: PostgreSQL (Neon) Connected
💾 Cache: Enabled (TTL: 5m0s, Max: 1000)
🔐 Auth: GitHub OAuth Enabled
📊 Rankings: Enabled with scoring system
```

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

You should see:

```
▲ Next.js 16.0.7
- Local:        http://localhost:3000
- Ready in 2.1s
```

## Step 6: Test the Application

1. Open http://localhost:3000 in your browser
2. Click **"Sign in with GitHub"** in the top right
3. Authorize the application
4. You'll be redirected back with your profile visible
5. Try searching for GitHub users
6. Visit http://localhost:3000/rankings to see the leaderboard

## Features Available

✅ **GitHub OAuth Authentication**

- Sign in with GitHub
- Access to private repos (if authorized)
- Persistent sessions (30 days)

✅ **User Rankings**

- Top developers leaderboard
- Score based on followers, stars, repos, forks, contributions
- Pagination support

✅ **Profile Management**

- View your GitHub profile in the app
- Quick access to GitHub profile
- Sign out functionality

✅ **User Search & Analytics**

- Search any GitHub user
- Tech stack detection
- Activity streaks
- Batch user comparison
- AI-powered insights (with NVIDIA API key)

## Troubleshooting

### Backend won't start

**Error**: `DATABASE_URL is required`

- Make sure `.env` file exists in the root directory
- Check that `DATABASE_URL` is properly set

**Error**: `GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required`

- Verify you've created a GitHub OAuth app
- Double-check the credentials in `.env`

### Frontend can't connect to backend

**Error**: Network error or CORS issues

- Make sure backend is running on port 8080
- Check `frontend/.env.local` has correct `NEXT_PUBLIC_API_URL`
- Clear browser cache and cookies

### OAuth redirect not working

**Error**: Redirect URI mismatch

- Verify GitHub OAuth app callback URL is: `http://localhost:8080/api/auth/callback`
- Make sure ports match (8080 for backend, 3000 for frontend)
- Check `GITHUB_REDIRECT_URL` in `.env`

### Database connection fails

**Error**: Failed to connect to database

- Verify the `DATABASE_URL` is correct
- Check internet connection (Neon is cloud-hosted)
- Ensure no firewall is blocking the connection

## Running Tests

### Backend Tests

```bash
cd backend
go test ./... -v
```

### Test Coverage

```bash
cd backend
go test ./... -cover
```

## Development Tips

1. **Hot Reload**: Frontend has automatic hot reload. Backend requires restart on code changes.

2. **Database Changes**: If you modify the schema in `database/postgres.go`, restart the backend to apply changes.

3. **Cache Management**: Use the Insights dropdown to view and clear cache during development.

4. **API Testing**: Backend provides a health endpoint at `http://localhost:8080/api/health`

## Production Deployment

For production deployment:

1. Update `FRONTEND_URL` and `GITHUB_REDIRECT_URL` to your production domains
2. Set `Secure: true` for cookies in `auth_handler.go`
3. Use environment variables for all sensitive data
4. Enable HTTPS for both frontend and backend
5. Configure proper CORS origins
6. Set up monitoring and logging

## Need Help?

- Check the main [README.md](README.md) for architecture details
- Open an issue on GitHub
- Review the code comments for API documentation

---

Happy coding! 🚀
