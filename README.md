# GitHub Status API

A fast REST API server written in Go that fetches GitHub user information.

## Quick Start

```powershell
# Build the application
go build -o github-api.exe ./cmd/main.go

# Run the server
.\github-api.exe
```

Server runs at `http://localhost:8000`

## Test the API

```powershell
# In another terminal
go run test/test_api.go
```

## Features

- ✅ Fast and lightweight (single binary)
- ✅ Thread-safe cache (5-minute TTL)
- ✅ Batch processing with goroutines
- ✅ CORS enabled for web apps
- ✅ No external dependencies
- ✅ Clean package structure

```

The server will start on `http://localhost:5000`

## API Endpoints

### 1. Home / Documentation
```

GET /

```
Returns API documentation and available endpoints.

### 2. Health Check
```

GET /api/health

## API Endpoints

### 1. Health Check

```powershell
curl http://localhost:8000/api/health
```

**Response:**

```json
{
  "status": "healthy",
  "cache_size": 3,
  "cache_hit_rate": "75%"
}
```

### 2. Get User Status

```powershell
curl http://localhost:8000/api/status/torvalds
```

**Response:**

```json
{
  "error": false,
  "data": {
    "login": "torvalds",
    "name": "Linus Torvalds",
    "public_repos": 9,
    "followers": 263000,
    "location": "Portland, OR",
    "company": "Linux Foundation"
  }
}
```

### 3. Get Status by POST

```powershell
curl -X POST http://localhost:8000/api/status -H "Content-Type: application/json" -d '{\"username\":\"gvanrossum\"}'
```

### 4. Batch Request (Multiple Users)

```powershell
$body = '{"usernames":["torvalds","gvanrossum","octocat"]}'; Invoke-WebRequest -Uri http://localhost:8000/api/batch -Method POST -Body $body -ContentType 'application/json'
```

**Response:**

```json
{
  "error": false,
  "results": {
    "torvalds": { "error": false, "data": {...} },
    "gvanrossum": { "error": false, "data": {...} },
    "octocat": { "error": false, "data": {...} }
  }
}
```

**Note:** Maximum 10 users per batch request.

### 5. Cache Statistics

```powershell
curl http://localhost:8000/api/cache/stats
```

### 6. Clear Cache

```powershell
curl -X POST http://localhost:8000/api/cache/clear
```

## Project Structure

````
R1/
├── cmd/
│   └── main.go              # Application entry point
├── internal/
│   ├── config/config.go     # Configuration
│   ├── models/models.go     # Data structures
│   ├── cache/cache.go       # LRU cache with TTL
│   ├── service/github.go    # GitHub API service
│   └── handlers/            # HTTP handlers
│       ├── handlers.go
│       └── middleware.go
├── test/
│   └── test_api.go          # Test suite
├── go.mod                   # Go module file
└── github-api.exe           # Compiled binary

## Error Handling

HTTP status codes:
- `200`: Success
- `400`: Bad request
- `404`: User not found
- `500`: Server error

**Error Response:**
```json
{
  "error": true,
  "message": "user not found"
}
````

## Troubleshooting

### Port already in use

```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000

# Kill the process
Stop-Process -Id <PID> -Force

### GitHub API rate limit

GitHub API allows 60 requests/hour without authentication. For higher limits, use a GitHub token.

## Performance

- Response time: ~300-500ms (first request), <1ms (cached)
- Memory usage: ~30MB
- Startup time: ~100ms
- Cache TTL: 5 minutes

## License

MIT License - Free to use.
```
