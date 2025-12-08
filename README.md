# GitHub Analytics

A full-stack GitHub user analytics platform with AI-powered comparisons.

## Project Structure

```
├── backend/              # Go REST API
│   ├── cmd/              # Application entry point
│   └── internal/         # Internal packages
│       ├── cache/        # LRU cache with TTL
│       ├── config/       # Configuration
│       ├── handlers/     # HTTP handlers & AI
│       ├── models/       # Data structures
│       └── service/      # GitHub API service
│
├── frontend/             # Next.js React app
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # API client
│   └── types/            # TypeScript types
│
└── .env                  # Environment variables
```

## Quick Start

### 1. Backend

```bash
cd backend
go build -o github-api.exe ./cmd/main.go
./github-api.exe
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Environment

Create `.env` in root:

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
```

## Features

- 👤 User profile analysis with tech stack & activity streak
- 👥 Multi-user comparison with professional metrics
- 🤖 NVIDIA AI-powered insights
- 💾 High-performance caching
- 📱 Mobile-friendly premium UI

## Tech Stack

- **Backend**: Go, Clean Architecture
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI**: NVIDIA LLaMA 3.1
