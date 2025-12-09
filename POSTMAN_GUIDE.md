# DevScope API - Postman Testing Guide

## 🚀 Quick Start

### 1. Import Collection into Postman

1. Open Postman
2. Click **Import** button
3. Select `DevScope-API.postman_collection.json`
4. Collection will appear in your workspace

### 2. Configure Environment Variables (Optional)

The collection has two variables you can customize:

- `base_url`: Default is `http://localhost:8080`
- `username`: Default is `anantacoder` (change to test different users)

### 3. Start the Backend

```bash
cd backend
go run cmd/main.go
```

Backend should be running on `http://localhost:8080`

---

## 📋 API Endpoints Overview

### ✅ Health & Status

- **GET** `/api/health` - Check API health
- **GET** `/` - Get API info and endpoints

### 🔐 Authentication

- **GET** `/api/auth/login` - Initiate GitHub OAuth (use in browser)
- **GET** `/api/auth/me` - Get current user (requires session)
- **POST** `/api/auth/logout` - Logout

### 👤 User Lookup

- **GET** `/api/status/{username}` - Get user status
- **POST** `/api/status` - Get user status (body)
- **GET** `/api/user/{username}` - Get extended user info
- **POST** `/api/batch` - Batch lookup (up to 10 users)

### 📊 Rankings

- **GET** `/api/rankings?page=1&page_size=50` - Get leaderboard
- **GET** `/api/rankings/{username}` - Get user ranking
- **POST** `/api/rankings/update` - Update ranking (auth required)

### 🤖 AI Comparison

- **POST** `/api/ai/compare` - Compare two users with AI

### 💾 Cache Management

- **GET** `/api/cache/stats` - Get cache statistics
- **POST** `/api/cache/clear` - Clear cache

---

## 🔑 GitHub Token Setup (IMPORTANT)

If you get `401` errors, your GitHub token is invalid/expired. Generate a new one:

### Steps:

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Set **Note**: `DevScope API`
4. Set **Expiration**: 90 days (or custom)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
   - ✅ `user:email` (Access user email)
6. Click **Generate token**
7. **Copy the token** (you can only see it once!)
8. Update `backend/.env`:
   ```
   GITHUB_TOKEN=ghp_YOUR_NEW_TOKEN_HERE
   ```
9. Restart the backend server

---

## 🧪 Testing Examples

### Test Health Endpoint

```bash
curl http://localhost:8080/api/health
```

Expected Response:

```json
{
  "status": "healthy",
  "server": "running",
  "language": "Go",
  "cache_enabled": true,
  "cache_size": 0,
  "uptime_seconds": "123.45"
}
```

### Test User Lookup

```bash
curl http://localhost:8080/api/status/anantacoder
```

### Test Rankings

```bash
curl http://localhost:8080/api/rankings?page=1&page_size=10
```

### Test Batch Lookup

```bash
curl -X POST http://localhost:8080/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "usernames": ["anantacoder", "torvalds", "gaearon"]
  }'
```

---

## 📊 Response Examples

### User Status Response

```json
{
  "error": false,
  "user": {
    "login": "anantacoder",
    "id": 123456,
    "avatar_url": "https://avatars.githubusercontent.com/u/123456",
    "name": "Ananta Coder",
    "company": "Tech Corp",
    "location": "India",
    "followers": 150,
    "following": 100,
    "public_repos": 50,
    "total_stars": 1200,
    "total_forks": 300
  }
}
```

### Rankings Response

```json
{
  "error": false,
  "rankings": [
    {
      "username": "anantacoder",
      "github_id": 123456,
      "avatar_url": "https://...",
      "score": 245.67,
      "rank_position": 1,
      "followers": 150,
      "public_repos": 50,
      "total_stars": 1200,
      "total_forks": 300,
      "contribution_count": 500
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 50
}
```

---

## 🐛 Troubleshooting

### Backend not responding

```bash
# Check if backend is running
Get-NetTCPConnection -LocalPort 8080
```

### 401 Unauthorized

- Your GitHub token is expired or invalid
- Generate a new token (see GitHub Token Setup above)
- Update `.env` file and restart backend

### Database connection issues

- Check DATABASE_URL in `.env`
- Ensure Neon PostgreSQL is accessible
- Check firewall/network settings

### CORS errors (from frontend)

- Backend CORS is configured for `http://localhost:3000`
- If using different port, update CORS settings in `backend/internal/handlers/middleware.go`

---

## 🎯 Postman Tips

1. **Save responses** - Click "Save Response" to use as examples
2. **Use variables** - Change `{{username}}` in collection variables
3. **Environment setup** - Create environments for dev/staging/prod
4. **Test scripts** - Add tests to validate responses automatically
5. **Mock server** - Use Postman mock server for frontend testing

---

## 📦 Collection Features

✅ Pre-configured requests for all endpoints
✅ Variables for easy customization
✅ Organized by functionality
✅ Detailed descriptions for each endpoint
✅ Query parameters with descriptions
✅ Request body examples

---

## 🔗 Additional Resources

- **Backend Code**: `backend/cmd/main.go`
- **Handlers**: `backend/internal/handlers/`
- **API Documentation**: `README.md`
- **Setup Guide**: `SETUP.md`

---

**Need Help?** Check the logs in your terminal where the backend is running for detailed error messages.
