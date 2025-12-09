# DevScope Deployment Checklist

## Quick Setup (15 minutes)

### 1. Railway (Backend) ⚡
```
1. Go to railway.app → New Project → Deploy from GitHub
2. Root directory: backend
3. Add these environment variables:
```

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `PORT` | `8080` | Fixed value |
| `GITHUB_TOKEN` | `ghp_xxxxx` | GitHub Settings → Developer settings → Personal access tokens |
| `NVIDIA_API_KEY` | `nvapi-xxxxx` | NVIDIA AI Playground |
| `DATABASE_URL` | `postgresql://...` | Neon dashboard (use direct connection, NOT pooler) |
| `GITHUB_CLIENT_ID` | From OAuth app | GitHub OAuth App settings |
| `GITHUB_CLIENT_SECRET` | From OAuth app | GitHub OAuth App settings |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Will get from Vercel (step 2) |
| `SESSION_SECRET` | Random 32 chars | Generate with: `openssl rand -base64 32` |
| `ENVIRONMENT` | `production` | Fixed value |

**Copy your Railway URL**: `https://xxxxx.up.railway.app`

---

### 2. Vercel (Frontend) 🚀
```
1. Go to vercel.com → New Project → Import from GitHub
2. Framework: Next.js
3. Root directory: frontend
4. Add environment variable:
```

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway URL from step 1 |

**Copy your Vercel URL**: `https://your-app.vercel.app`

---

### 3. Update Railway 🔄
Go back to Railway and update:
- `FRONTEND_URL` = Your Vercel URL from step 2

---

### 4. GitHub OAuth App 🔐
Go to GitHub → Settings → Developer settings → OAuth Apps → Your app

Update:
- **Homepage URL**: Your Vercel URL
- **Callback URL**: `https://your-railway-url.up.railway.app/api/auth/callback`

---

## Test Your Deployment ✅

1. Visit your Vercel URL
2. Click "Login with GitHub"
3. Authorize the app
4. Should redirect back logged in
5. Check navbar shows your profile
6. Visit `/rankings` page
7. Visit your profile page

---

## Common Issues & Fixes 🔧

### "Unauthorized" after login
- ✅ Check `FRONTEND_URL` in Railway matches Vercel URL exactly (no trailing slash)
- ✅ Verify `ENVIRONMENT=production` is set in Railway
- ✅ Check browser cookies (DevTools → Application → Cookies)

### CORS errors
- ✅ Verify `FRONTEND_URL` is correct in Railway
- ✅ Make sure both URLs use HTTPS

### OAuth callback fails
- ✅ Check GitHub OAuth callback URL matches Railway URL exactly
- ✅ Add `/api/auth/callback` to the end

### Database errors
- ✅ Use direct connection URL, NOT pooler URL
- ✅ Wrong: `ep-xxx-pooler.us-east-2.aws.neon.tech`
- ✅ Right: `ep-xxx.us-east-2.aws.neon.tech`

### Private repos not showing
- ✅ Users must re-login after OAuth scope changes
- ✅ Verify `repo` scope in GitHub OAuth app

---

## Environment Variables Summary

### Railway (9 variables)
```env
PORT=8080
GITHUB_TOKEN=ghp_xxxxx
NVIDIA_API_KEY=nvapi-xxxxx
DATABASE_URL=postgresql://...
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
FRONTEND_URL=https://your-app.vercel.app
SESSION_SECRET=random_32_chars
ENVIRONMENT=production
```

### Vercel (1 variable)
```env
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

---

## Cost: $0/month 💰

- Railway: $5 free credit/month
- Vercel: Free hobby tier
- Neon: Free tier (0.5GB)

---

## Need Help?

Check the full guide: `DEPLOYMENT.md`
