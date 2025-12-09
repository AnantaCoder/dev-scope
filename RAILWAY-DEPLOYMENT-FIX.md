# Railway Deployment Fix

## The Problem

**Error**: "Application failed to respond"

This error occurs when Railway cannot connect to your application. Common causes:

1. ❌ App not listening on `0.0.0.0:$PORT`
2. ❌ Missing environment variables
3. ❌ Database connection failure
4. ❌ Build errors

## ✅ Solution

### Step 1: Verify Railway Configuration Files

**Files created:**

- `railway.toml` - Railway deployment config
- `nixpacks.toml` - Build configuration
- `Procfile` - Startup command
- `.dockerignore` - Exclude unnecessary files

### Step 2: Set Required Environment Variables in Railway

Go to Railway Dashboard → Your Project → Variables and add:

```bash
# CRITICAL - Required for app to start
PORT=8000
DATABASE_URL=<your-neon-postgres-url>
GITHUB_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-secret>

# Required for OAuth
GITHUB_REDIRECT_URL=https://<your-railway-domain>.up.railway.app/api/auth/callback
GITHUB_TOKEN=<your-github-personal-access-token>

# Required for CORS
FRONTEND_URL=https://dev-scope-roan.vercel.app
ENVIRONMENT=production

# Optional
NVIDIA_API_KEY=<your-nvidia-api-key>
```

### Step 3: Verify Your Backend Code

The backend MUST listen on `0.0.0.0:PORT` (not just `localhost`). Your `main.go` correctly uses:

```go
cfg.ServerPort = ":" + port  // This binds to 0.0.0.0:PORT ✅
```

### Step 4: Deploy to Railway

**Option A: Using Railway CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

**Option B: Using GitHub Integration**

1. Connect your GitHub repository to Railway
2. Railway will auto-deploy on push to main branch
3. Check deployment logs

### Step 5: Verify Deployment

**Check these in Railway dashboard:**

1. **Build Logs** - Should show:

   ```
   ✓ go build -o ../main ./cmd/main.go
   ```

2. **Deploy Logs** - Should show:

   ```
   🚀 DevScope API - Full-Stack GitHub Analytics with Authentication
   ✅ Server: http://localhost:8000
   🗄️  Database: PostgreSQL (Neon) Connected
   ```

3. **Health Check** - Test your endpoint:
   ```
   https://<your-railway-domain>.up.railway.app/api/health
   ```

### Step 6: Common Fixes

#### Issue: "Application failed to respond"

**Causes:**

- ❌ Missing `PORT` environment variable
- ❌ Missing `DATABASE_URL`
- ❌ Database connection timeout

**Fix:**

1. Add all required environment variables
2. Check database URL is correct
3. Ensure database allows connections from Railway

#### Issue: Build fails

**Causes:**

- ❌ Go module download timeout
- ❌ Missing `go.mod`

**Fix:**

- The `nixpacks.toml` includes retry logic for module downloads
- Verify `backend/go.mod` exists

#### Issue: Database connection fails

**Causes:**

- ❌ Wrong `DATABASE_URL` format
- ❌ SSL mode not configured

**Fix:**
Ensure your DATABASE_URL includes `?sslmode=require`:

```
postgresql://user:pass@host.neon.tech/db?sslmode=require
```

#### Issue: CORS errors in frontend

**Causes:**

- ❌ Wrong `FRONTEND_URL` in Railway
- ❌ Trailing slash mismatch

**Fix:**

- Set `FRONTEND_URL=https://dev-scope-roan.vercel.app` (no trailing slash)
- Verify in Railway dashboard

## Testing Checklist

After deployment:

- [ ] Railway deployment status shows "Success"
- [ ] No errors in deploy logs
- [ ] Health endpoint responds: `https://<domain>.up.railway.app/api/health`
- [ ] Frontend can connect (no CORS errors in browser console)
- [ ] Can login with GitHub OAuth
- [ ] Rankings page loads data

## Railway Dashboard Quick Links

**Environment Variables:**
Railway Dashboard → Your Service → Variables → + New Variable

**Deployment Logs:**
Railway Dashboard → Your Service → Deployments → Click latest deployment

**Domain Settings:**
Railway Dashboard → Your Service → Settings → Generate Domain

## Still Having Issues?

1. **Check Railway Logs:**

   ```bash
   railway logs
   ```

2. **Test locally first:**

   ```bash
   cd backend
   go run cmd/main.go
   ```

3. **Verify all environment variables are set in Railway:**

   - Go to Variables tab
   - Compare with `.env.production.example`
   - Click "Restart" after adding variables

4. **Check database connection:**
   - Test DATABASE_URL format
   - Ensure Neon database allows external connections
   - Verify SSL mode is `require`

## Next Steps

1. Commit and push these new files:

   ```bash
   git add railway.toml nixpacks.toml Procfile .dockerignore
   git commit -m "Add Railway deployment configuration"
   git push
   ```

2. Railway will auto-deploy (if GitHub integration is enabled)

3. Monitor deployment logs in Railway dashboard

4. Test the health endpoint once deployed
