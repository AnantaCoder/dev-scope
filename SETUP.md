# 🛠️ DevScope Setup Guide

## Quick Start (Docker)

```bash
git clone https://github.com/AnantaCoder/github-insights.git
cd github-insights
# Create backend/.env with DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NVIDIA_API_KEY
docker-compose up --build
# Frontend: http://localhost:3000 | Backend: http://localhost:8000
```

## Manual Setup

```bash
cd backend && go mod download && go build -o github-api.exe ./cmd/main.go && ./github-api.exe
cd frontend && npm install && npm run dev
```

**Get API Keys**: [NVIDIA API](https://build.nvidia.com/) • [GitHub OAuth](https://github.com/settings/developers) • [Neon DB](https://neon.tech/)
