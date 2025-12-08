# GitHub Analytics Backend

Go-based REST API for GitHub user analytics with NVIDIA AI integration.

## Structure

```
backend/
├── cmd/
│   └── main.go           # Application entry point
├── internal/
│   ├── cache/            # LRU cache with TTL
│   ├── config/           # Application configuration
│   ├── handlers/         # HTTP handlers & middleware
│   ├── models/           # Data structures
│   └── service/          # Business logic (GitHub API)
├── go.mod
└── go.sum
```

## Quick Start

```bash
cd backend
go build -o github-api.exe ./cmd/main.go
./github-api.exe
```

## Environment Variables

Create a `.env` file in the project root:

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status/{username}` | GET | Get user profile |
| `/api/user/{username}/extended` | GET | Get extended info (tech stack, streak) |
| `/api/batch` | POST | Compare multiple users |
| `/api/ai/compare` | POST | AI-powered comparison |
| `/api/health` | GET | Health check |
| `/api/cache/stats` | GET | Cache statistics |
| `/api/cache/clear` | POST | Clear cache |

## Features

- High-performance concurrent processing
- Thread-safe LRU cache with TTL
- Tech stack analysis from repositories
- Activity streak calculation
- NVIDIA AI-powered comparisons
