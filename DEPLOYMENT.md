# DevScope Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free $5/month credit)
- Neon PostgreSQL database (free tier)
- GitHub OAuth App
- NVIDIA API key

## Step 1: Prepare Your Code

### Update Backend for Production

1. The backend needs to detect production environment and set cookies appropriately
2. CORS must allow credentials from your Vercel domain

### Update Frontend

1. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Click "Add variables" and set:

```env
PORT=8080
GITHUB_TOKEN=your_github_personal_access_token
NVIDIA_API_KEY=your_nvidia_api_key
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret
FRONTEND_URL=https://your-app.vercel.app
SESSION_SECRET=generate_random_32_char_string
ENVIRONMENT=production
```

5. In Settings → Set root directory to `backend`
6. Railway will auto-detect Go and deploy
7. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project" → Import your GitHub repo
3. Set Framework Preset: Next.js
4. Set Root Directory: `frontend`
5. Add Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

6. Click "Deploy"
7. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Edit your OAuth app:
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-railway-app.up.railway.app/api/auth/callback`

## Step 5: Update Environment Variables

### Railway (Backend)
Update `FRONTEND_URL` with your actual Vercel URL:
```
FRONTEND_URL=https://your-app.vercel.app
```

### Vercel (Frontend)
Update `NEXT_PUBLIC_API_URL` with your actual Railway URL:
```
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

## Step 6: Configure Database

Make sure your `DATABASE_URL` uses the **direct connection** (not pooler):
- ❌ Wrong: `ep-xxx-pooler.us-east-2.aws.neon.tech`
- ✅ Correct: `ep-xxx.us-east-2.aws.neon.tech`

## Important Notes

### Cookie Configuration
The backend automatically detects production and sets:
- `Secure: true` (requires HTTPS)
- `SameSite: None` (allows cross-origin cookies)

### CORS
Backend CORS is configured to allow your frontend domain with credentials.

### Session Secret
Generate a secure random string for `SESSION_SECRET`:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### GitHub Token Scopes
Your GitHub Personal Access Token needs:
- `read:user`
- `user:email`
- `repo` (for private repo access)

### OAuth Scopes
Your OAuth app requests:
- `read:user`
- `user:email`
- `repo` (for private repo data)

## Troubleshooting

### "Unauthorized" after login
- Check that `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Verify cookies are being set (check browser DevTools → Application → Cookies)
- Ensure Railway backend has `ENVIRONMENT=production`

### CORS errors
- Verify `FRONTEND_URL` is set correctly in Railway
- Check browser console for specific CORS error messages

### OAuth callback fails
- Verify GitHub OAuth callback URL matches Railway backend URL
- Check Railway logs for error messages

### Private repos not showing
- Users need to re-login after OAuth scope changes
- Verify `repo` scope is included in OAuth app settings

## Testing Deployment

1. Visit your Vercel URL
2. Click "Login with GitHub"
3. Authorize the app
4. You should be redirected back and logged in
5. Check that your profile shows in the navbar
6. Visit `/rankings` to see the leaderboard
7. Visit your profile to see private repo stats

## Monitoring

### Railway
- View logs: Railway dashboard → Your service → Deployments → View logs
- Check metrics: CPU, Memory, Network usage

### Vercel
- View logs: Vercel dashboard → Your project → Deployments → View function logs
- Check analytics: Vercel dashboard → Analytics

## Cost Estimates

- **Railway**: Free $5/month credit (enough for small apps)
- **Vercel**: Free for hobby projects
- **Neon**: Free tier (0.5GB storage, 1 compute unit)
- **Total**: $0/month for small usage

## Scaling

If you exceed free tiers:
- Railway: ~$5-10/month for small production apps
- Vercel: Free for most use cases, Pro at $20/month if needed
- Neon: $19/month for Pro tier with more storage
