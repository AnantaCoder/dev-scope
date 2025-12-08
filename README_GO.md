# GitHub Status API - Go

Fast REST API server written in Go for fetching GitHub user information.

## Quick Start

```powershell
# Build
go build -o github-api.exe ./cmd/main.go

# Run
.\github-api.exe
```

Server runs at `http://localhost:8000`

## Requirements

- Go 1.16 or higher
- Internet connection

## Features

- Fast single binary
- Thread-safe cache (5-minute TTL)
- Batch processing with goroutines
- CORS enabled
- No external dependencies
- Clean package structure

## API Endpoints

### 1. Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "cache_size": 5,
  "cache_hit_rate": "80%"
}
```

### 2. Get User Status

```http
GET /api/status/{username}?no_cache=false
```

**Example:**

```powershell
curl http://localhost:8000/api/status/torvalds
```

**Response:**

```json
{
  "error": false,
  "cached": true,
  "data": {
    "login": "torvalds",
    "name": "Linus Torvalds",
    "bio": "...",
    "public_repos": 6,
    "followers": 200000,
    "following": 0,
    "avatar_url": "https://avatars.githubusercontent.com/u/1024025",
    "html_url": "https://github.com/torvalds",
    ...
  }
}
```

### 4. Get User Status (POST)

```http
POST /api/status
Content-Type: application/json

{
  "username": "torvalds"
}
```

### 5. Batch Request (Concurrent)

```http
POST /api/batch
Content-Type: application/json

{
  "usernames": ["torvalds", "gvanrossum", "octocat"]
}
```

**Response:**

```json
{
  "error": false,
  "results": {
    "torvalds": { "error": false, "data": {...} },
    "gvanrossum": { "error": false, "cached": true, "data": {...} }
  }
}
```

Maximum 10 users per batch.

### 3. Cache Statistics

```http
GET /api/cache/stats
```

### 4. Clear Cache

```http
POST /api/cache/clear
```

## Testing

```powershell
# Run test suite
go run test/test_api.go

# Or manual tests
curl http://localhost:8000/api/health
curl http://localhost:8000/api/status/torvalds
```

## Project Structure

```
R1/
├── cmd/
│   └── main.go              # Entry point
├── internal/
│   ├── config/config.go     # Configuration
│   ├── models/models.go     # Data structures
│   ├── cache/cache.go       # LRU cache
│   ├── service/github.go    # GitHub API service
│   └── handlers/            # HTTP handlers
├── test/
│   └── test_api.go          # Tests
└── go.mod                   # Go modules
```

## Configuration

Edit `internal/config/config.go`:

```go
ServerPort:    ":8000"
CacheTTL:      5 * time.Minute
MaxCacheSize:  1000
MaxBatchSize:  10
```

## Build Options

```powershell
# Standard build
go build -o github-api.exe ./cmd/main.go

# Optimized build (smaller binary)
go build -ldflags="-s -w" -o github-api.exe ./cmd/main.go

# Cross-compile for Linux
$env:GOOS="linux"; $env:GOARCH="amd64"; go build -o github-api ./cmd/main.go
```

## Troubleshooting

### Port in use

```powershell
Get-NetTCPConnection -LocalPort 8000
Stop-Process -Id <PID> -Force
```

### Build errors

```powershell
go mod tidy
go clean -cache
```

## Performance

- First request: ~300-500ms
- Cached: <1ms
- Memory: ~30MB
- Startup: ~100ms

## License

MIT License
