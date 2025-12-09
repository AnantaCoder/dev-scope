# Frontend-Backend Connection Fix for Production

## Problem Identified

The frontend on Vercel (`https://dev-scope-roan.vercel.app`) cannot connect to the backend on Railway (`https://dev-scope-production.up.railway.app`) due to CORS configuration issues.

## Root Cause

1. **Trailing slash mismatch**: Backend had `https://dev-scope-roan.vercel.app/` but browser sends `https://dev-scope-roan.vercel.app`
2. **Missing environment variable**: Frontend needs `NEXT_PUBLIC_API_URL` set to Railway backend URL

## Fixes Applied

### 1. Backend CORS Fix (middleware.go)

✅ Added URL normalization to remove trailing slashes
✅ Fixed allowed origins list
✅ Improved wildcard domain matching for Vercel preview deployments

### 2. Frontend Environment Configuration

✅ Created `.env.production` with Railway backend URL

## Deployment Steps

### For Railway (Backend):

1. **Environment Variables to Set:**

   ```
   DATABASE_URL=<your-railway-postgres-url>
   GITHUB_CLIENT_ID=<your-github-oauth-client-id>
   GITHUB_CLIENT_SECRET=<your-github-oauth-secret>
   GITHUB_REDIRECT_URL=https://dev-scope-production.up.railway.app/api/auth/callback
   GITHUB_TOKEN=<your-github-token>
   FRONTEND_URL=https://dev-scope-roan.vercel.app
   ENVIRONMENT=production
   PORT=8000
   ```

2. **Push changes and redeploy**

### For Vercel (Frontend):

1. **Environment Variables to Set:**

   ```
   NEXT_PUBLIC_API_URL=https://dev-scope-production.up.railway.app
   ```

2. **Redeploy from dashboard or push changes**

## Verification Checklist

### Backend (Railway):

- [ ] All environment variables are set correctly
- [ ] `FRONTEND_URL` is set to `https://dev-scope-roan.vercel.app` (no trailing slash)
- [ ] Deployment successful
- [ ] Health check works: `https://dev-scope-production.up.railway.app/api/health`
- [ ] Logs show no errors

### Frontend (Vercel):

- [ ] `NEXT_PUBLIC_API_URL` environment variable is set
- [ ] Deployment successful
- [ ] Can access the site
- [ ] Browser console shows no CORS errors
- [ ] API requests go to Railway backend

## Testing the Connection

1. **Open browser DevTools (F12)**
2. **Go to Network tab**
3. **Visit your Vercel frontend**
4. **Try to search for a GitHub user**
5. **Check the request:**
   - Should go to `https://dev-scope-production.up.railway.app`
   - Response headers should include `Access-Control-Allow-Origin: https://dev-scope-roan.vercel.app`
   - Should not see CORS errors

## Common Issues and Solutions

### Issue: Still getting CORS errors

**Solution:**

- Verify `FRONTEND_URL` in Railway matches exactly (no trailing slash)
- Check Railway logs for incoming requests
- Clear browser cache and cookies

### Issue: Backend not responding

**Solution:**

- Check Railway deployment logs
- Verify all environment variables are set
- Check database connection string

### Issue: "Backend Server Not Running" message

**Solution:**

- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Check that Railway service is running
- Test backend health endpoint directly

### Issue: Session/Auth not working

**Solution:**

- Ensure `ENVIRONMENT=production` is set in Railway
- Verify `GITHUB_REDIRECT_URL` points to Railway backend
- Check that cookies are being set (Secure=true in production)

## Important Notes

1. **Cookie Settings**: In production with `ENVIRONMENT=production`, cookies use:

   - `Secure=true` (HTTPS only)
   - `SameSite=None` (allows cross-site)
   - This is required for frontend (Vercel) and backend (Railway) on different domains

2. **Environment Variable Format**:

   - Railway: Set directly in dashboard (no `.env` file needed)
   - Vercel: Set in Project Settings → Environment Variables

3. **Redeployment**: After setting environment variables, redeploy both services

## Quick Commands

### Test Backend Health:

```bash
curl https://dev-scope-production.up.railway.app/api/health
```

### Test CORS from Browser Console:

```javascript
fetch("https://dev-scope-production.up.railway.app/api/health", {
  method: "GET",
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```
