# Quick Start Guide

## Start the Backend (Go Server)

1. Open PowerShell terminal
2. Navigate to project root:

```powershell
cd d:\Anantacoder_python\R1
```

3. Run the server:

```powershell
.\github-api.exe
```

You should see:

```
======================================================================
🚀 GitHub Status API - Pure Go with Clean Architecture
======================================================================
✅ Server: http://localhost:8000
💾 Cache: Enabled (TTL: 5m0s, Max: 1000)
📦 Architecture: Clean package-based structure
⚡ Concurrency: Batch processing with goroutines
🔥 Performance: Native Go - Zero dependencies
🤖 AI: NVIDIA API Enabled
======================================================================
```

The server will log ALL requests in real-time:

- `📥` Incoming requests
- `📤` Outgoing responses
- `🤖` AI comparison requests
- Duration for each request

## Start the Frontend (Next.js)

1. Open another PowerShell terminal
2. Navigate to frontend:

```powershell
cd d:\Anantacoder_python\R1\frontend
```

3. Start Next.js:

```powershell
npm run dev
```

4. Open browser: http://localhost:3000

## Features

### Single User Analysis

- Enter a GitHub username
- Get instant profile data
- NO AI analysis (removed as requested)

### Multi-User Comparison

1. Enter multiple usernames (comma-separated)
2. Click "Compare Users" to fetch profiles
3. Click "🤖 Get NVIDIA AI Comparison" button
4. AI analysis is done by Go backend (not frontend)

### Real-Time Logging

Watch the Go terminal to see:

```
📥 [15:04:05] POST /api/batch from 127.0.0.1:54321
📤 [15:04:06] Response sent for /api/batch - Duration: 823ms
📥 [15:04:10] POST /api/ai/compare from 127.0.0.1:54321
🤖 [AI] Received AI comparison request from 127.0.0.1:54321
📊 [AI] Comparing 3 users
🔄 [AI] Sending request to NVIDIA API...
✅ [AI] Comparison generated successfully in 2.3s
📝 [AI] Response length: 542 characters
📤 [15:04:12] Response sent for /api/ai/compare - Duration: 2.3s
```

## Environment Variables

### Backend (.env in project root)

```
NVIDIA_API_KEY=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
```

### Frontend (.env.local in frontend folder)

```
NEXT_PUBLIC_GO_API_URL=http://localhost:8000
NVIDIA_API_KEY=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
```

Note: Frontend no longer uses NVIDIA API directly. Backend handles all AI requests.

## API Endpoints

### GitHub Data

- `GET /api/status/:username` - Get single user
- `POST /api/batch` - Get multiple users
- `GET /api/health` - Server health
- `GET /api/cache/stats` - Cache statistics

### AI (New!)

- `POST /api/ai/compare` - AI comparison (backend only)
  - Body: `{ "users": [GitHubUser, ...] }`
  - Response: `{ "comparison": "AI analysis text" }`

## Changes Made

✅ AI endpoint moved to Go backend (`/api/ai/compare`)
✅ Frontend AI code removed (no direct NVIDIA API calls)
✅ Single user AI insights removed
✅ AI button added for batch comparison only
✅ Real-time logging for all requests in Go terminal
✅ Detailed AI request/response logging

## Testing

1. Start both servers
2. Open http://localhost:3000
3. Test single user: Enter "torvalds"
4. Test batch: Enter "torvalds, gvanrossum, kentcdodds"
5. Click "🤖 Get NVIDIA AI Comparison" button
6. Watch Go terminal for real-time logs!
