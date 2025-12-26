<div align="center">

# 🚀 DevScope - GitHub Analytics Platform

### AI-Powered Developer Insights & Performance Analytics

[![Go Version](https://img.shields.io/badge/Go-1.24.2-00ADD8?logo=go)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-000000?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<p align="center">
  <img src="frontend/public/logo.svg" alt="DevScope Logo" width="120" />
</p>

**DevScope** is a full-stack GitHub analytics platform that provides deep insights into developer profiles, real-time performance metrics, and AI-powered comparisons. Built with modern technologies for speed, scalability, and an exceptional user experience.

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

---

</div>

## 🆕 What's New (December 2025)

### 🤖 Dev AI Chatbot - Your Intelligent Coding Assistant

**Full-featured AI chatbot with GitHub integration!**

- **@user Mentions** - Get detailed GitHub profile insights
- **@owner/repo Mentions** - Repository analysis with stats, recent commits
- **@owner/repo/path/file Analysis** - Fetch and analyze any file from GitHub repos
- **📋 PR Review** - Analyze Pull Requests with `@owner/repo#123` format
- **Conversation Storage** - All chats saved to PostgreSQL database
- **Export to Markdown** - Download conversations as `.md` files
- **Code Analysis Modal** - Paste code for AI review
- **Keyboard Shortcuts** - `Ctrl+N` new chat, `Ctrl+K` focus, `?` shortcuts

### 🎨 Responsive UI Updates

- **Resizable Sidebar** - Drag to resize (200-500px), mobile overlay
- **Premium Privacy Page** - Gradient design at `/privacy`
- **Improved Landing Page** - Simplified binary animation, chatbot features

### Previously Added

🔐 **GitHub OAuth Authentication** - Sign in with your GitHub account

📊 **User Rankings Leaderboard** - Top developers ranked by comprehensive score

🗄️ **PostgreSQL Database** - Persistent data storage with Neon

[See full changelog →](#)

---

## ✨ Features

### 🎯 Current Features

#### 🔍 **Advanced User Analytics**

- **Profile Analysis**: Comprehensive GitHub profile data including bio, stats, and social links
- **Tech Stack Detection**: Automatically identifies programming languages and frameworks from repositories
- **Activity Streaks**: Tracks current and longest contribution streaks with visual indicators
- **Real-time Metrics**: Live updates of followers, repos, gists, and contribution statistics

#### 👥 **Multi-User Comparison**

- **Batch Processing**: Compare up to 10 GitHub users simultaneously
- **Concurrent API Calls**: Lightning-fast parallel data fetching with Go goroutines
- **Side-by-Side Metrics**: Visual comparison of followers, repos, and engagement rates
- **Professional Insights**: Detailed breakdown of each developer's profile and activity

#### 🤖 **AI-Powered Insights**

- **Dev AI Chatbot**: Full-featured conversational assistant at `/chat`
- **GitHub Mentions**: `@user`, `@owner/repo`, `@owner/repo/path/file`, `@owner/repo#PR`
- **PR Review**: Analyze Pull Requests with diff inspection and code review
- **File Analysis**: Fetch and review any file from public GitHub repos
- **Code Review Modal**: Paste code directly for AI analysis
- **NVIDIA LLaMA 3.1 Integration**: Advanced AI model for deep analysis
- **Context-Aware Analysis**: AI considers tech stack, contribution patterns, and specializations
- **Rate Limiting**: 10 AI requests per minute per IP with smart throttling

#### ⚡ **Performance Optimization**

- **LRU Cache with TTL**: Thread-safe caching system with 5-minute expiration
- **Hit Rate Tracking**: Real-time cache performance metrics (typical 70-90% hit rate)
- **Lazy Eviction**: Automatic cleanup of expired entries
- **Memory Efficient**: Maximum 1000 cached entries with LRU eviction policy

#### 🎨 **Premium UI/UX**

- **Dark Theme**: GitHub-inspired design with modern glassmorphism effects
- **Responsive Layout**: Fully optimized for desktop, tablet, and mobile devices
- **Live Performance Metrics**: Real-time display of cache stats and system health
- **Animated Components**: Smooth transitions and micro-interactions with Framer Motion
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation support

#### 🛡️ **Security & Rate Limiting**

- **IP-Based Rate Limiting**: Token bucket algorithm for API protection
- **CORS Support**: Configurable cross-origin resource sharing
- **Header Validation**: Request validation and sanitization
- **Environment Security**: Secure API key management with dotenv

#### 📊 **Analytics Dashboard**

- **Session Tracking**: Monitor total searches and usage patterns
- **Cache Statistics**: View hits, misses, and hit rate in real-time
- **Performance Insights**: Detailed breakdown of system performance
- **Clear Cache**: Manual cache clearing for testing and maintenance

---

### 🚧 Upcoming Features

#### 🔐 Enhanced Security

- [ ] Two-factor authentication support
- [ ] API key management for programmatic access
- [ ] Session management dashboard
- [ ] IP-based login alerts

#### 📊 Advanced Analytics

- [ ] Historical data tracking and trends
- [ ] Contribution heatmaps and calendars
- [ ] Repository deep-dive analysis
- [ ] Code quality metrics integration

#### 🌐 Social Features

- [ ] Public profile sharing with custom URLs
- [ ] Developer badges and achievements
- [ ] Follow/unfollow developers
- [ ] Activity feed

#### 📈 Data & Reporting

- [ ] Export analytics to PDF/CSV
- [ ] Custom report generation
- [ ] Scheduled report delivery
- [ ] Data visualization improvements

#### 🔔 Notifications & Alerts

- [ ] Email notifications for tracked users
- [ ] Browser push notifications
- [ ] Webhook support for integrations
- [ ] Custom alert rules

#### 🤝 Team Features

- [ ] Organization analytics
- [ ] Team comparisons
- [ ] Private team workspaces
- [ ] Recruitment tools

#### 🛠️ Developer Tools

- [ ] Public REST API with API keys
- [ ] GraphQL endpoint
- [ ] SDK libraries (Python, JavaScript, Go)
- [ ] CLI tool for terminal users
- [ ] VS Code extension

#### 📱 Mobile Experience

- [ ] Progressive Web App (PWA)
- [ ] Offline mode with cached data
- [ ] Touch-optimized interactions
- [ ] Mobile push notifications

#### 🌍 Internationalization

- [ ] Multi-language support (i18n)
- [ ] Localized date/time formats
- [ ] RTL language support

#### 🔍 Search & Discovery

- [ ] Advanced search with filters
- [ ] Trending developers discovery
- [ ] Similar developer recommendations
- [ ] Topic-based suggestions

#### 🎨 UI Enhancements

- [ ] Theme customization (light/dark/custom)
- [ ] Interactive data visualizations
- [ ] Keyboard shortcuts panel
- [ ] Print-friendly views

> **Note**: See [UPCOMING.md](UPCOMING.md) for detailed roadmap and recently completed features.

---

## 🚀 Quick Start

### Prerequisites

#### Option A: Using Docker (Recommended)

- **Docker Desktop** - [Download Docker](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** - Included with Docker Desktop

#### Option B: Manual Setup

- **Go 1.24.2+** - [Download Go](https://go.dev/dl/)
- **Node.js 20+** - [Download Node.js](https://nodejs.org/)
- **npm or yarn** - Package manager

#### Common (Both Options)

- **GitHub Token** (optional) - For higher API rate limits
- **NVIDIA API Key** (optional) - For AI-powered comparisons

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/AnantaCoder/github-insights.git
cd github-insights
```

### 2️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Required for AI features
NVIDIA_API_KEY=your_nvidia_api_key_here

# Optional - increases GitHub API rate limits
GITHUB_TOKEN=your_github_personal_access_token

# Optional - custom configuration
PORT=8000
CACHE_TTL=5m
MAX_CACHE_SIZE=1000
```

<details>
<summary>🔑 How to get API keys</summary>

**NVIDIA API Key:**

1. Visit [NVIDIA AI Playground](https://build.nvidia.com/)
2. Sign up for a free account
3. Generate an API key from your dashboard

**GitHub Token:**

1. Go to GitHub Settings → Developer settings
2. Personal access tokens → Generate new token
3. Select `public_repo` scope
4. Copy the token

</details>

### 3️⃣ Start the Application

#### Option A: Using Docker (Recommended)

```bash
docker-compose up --build
```

**Expected Output:**

```
✅ Backend running on http://localhost:8000
✅ Frontend running on http://localhost:3000
```

That's it! Both services will start automatically. Skip to step 5.

#### Option B: Manual Setup

**Start the Backend:**

```bash
cd backend
go mod download
go build -o github-api.exe ./cmd/main.go
./github-api.exe
```

**Expected Output:**

```
=======================================================================
🚀 GitHub Status API - Pure Go with Clean Architecture
=======================================================================
✅ Server: http://localhost:8000
💾 Cache: Enabled (TTL: 5m0s, Max: 1000)
📦 Architecture: Clean package-based structure
⚡ Concurrency: Batch processing with goroutines
🔥 Performance: Native Go - Zero dependencies
🤖 AI: NVIDIA API Enabled
=======================================================================
```

**Start the Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**

```
▲ Next.js 16.0.7
- Local:        http://localhost:3000
- Ready in 2.1s
```

### 4️⃣ Access the Application

Open your browser and navigate to:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Health**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🏗️ Architecture

### Project Structure

```
dev-scope/
├── backend/                    # Go REST API Server
│   ├── cmd/
│   │   └── main.go            # Application entry point
│   ├── internal/              # Private application code
│   │   ├── cache/
│   │   │   └── cache.go       # LRU cache with TTL implementation
│   │   ├── config/
│   │   │   └── config.go      # Configuration management
│   │   ├── handlers/
│   │   │   ├── handlers.go    # HTTP route handlers
│   │   │   ├── ai_handler.go  # NVIDIA AI integration
│   │   │   ├── middleware.go  # CORS and logging
│   │   │   └── ratelimit.go   # Rate limiting logic
│   │   ├── models/
│   │   │   └── models.go      # Data structures and types
│   │   └── service/
│   │       └── github.go      # GitHub API service layer
│   ├── go.mod                 # Go module definition
│   └── README.md              # Backend documentation
│
├── frontend/                   # Next.js React Application
│   ├── app/
│   │   ├── layout.tsx         # Root layout component
│   │   ├── page.tsx           # Home page (main app)
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── BackendErrorBanner.tsx
│   │   ├── Footer.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   ├── UserProfileCard.tsx
│   │   ├── UserComparisonCard.tsx
│   │   └── ui/                # Reusable UI components
│   │       ├── background-gradient.tsx
│   │       └── card-spotlight.tsx
│   ├── lib/
│   │   ├── api.ts             # API client for backend
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── tsconfig.json          # TypeScript configuration
│
├── .env                        # Environment variables (not in repo)
├── go.mod                      # Root Go module
├── README.md                   # This file
└── CONTRIBUTING.md             # Contribution guidelines
```

### Technology Stack

#### Backend

- **Language**: Go 1.24.2
- **Architecture**: Clean Architecture with layered structure
- **HTTP Server**: Native `net/http` package
- **Concurrency**: Goroutines and sync primitives
- **Caching**: Custom LRU cache with TTL
- **AI Integration**: NVIDIA AI API client
- **Config Management**: godotenv for environment variables

#### Frontend

- **Framework**: Next.js 16.0 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion 12
- **HTTP Client**: Axios
- **Build Tool**: Turbopack (Next.js default)

#### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL (Neon)
- **Cache**: In-memory LRU with TTL (thread-safe)
- **Rate Limiting**: Token bucket algorithm
- **CORS**: Configurable cross-origin support
- **Error Handling**: Structured error responses

---

## 📡 API Documentation

### Base URL

```
http://localhost:8000/api
```

### Endpoints

#### 1. Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-09T10:30:00Z",
  "cache_enabled": true
}
```

#### 2. Get User Profile

```http
GET /api/user/{username}
```

**Response:**

```json
{
  "error": false,
  "cached": true,
  "data": {
    "user": {
      "login": "torvalds",
      "name": "Linus Torvalds",
      "bio": "Creator of Linux",
      "followers": 200000,
      "following": 0,
      "public_repos": 10
    },
    "tech_stack": {
      "languages": ["C", "Python", "Shell"],
      "top_language": "C"
    },
    "streak": {
      "current_streak": 45,
      "longest_streak": 120,
      "last_contribution_date": "2025-12-09"
    }
  }
}
```

#### 3. Batch User Comparison

```http
POST /api/batch
Content-Type: application/json

{
  "usernames": ["torvalds", "gvanrossum", "octocat"]
}
```

#### 4. AI Comparison

```http
POST /api/ai/compare
Content-Type: application/json

{
  "users": [
    { "login": "user1", "followers": 1000, ... },
    { "login": "user2", "followers": 2000, ... }
  ]
}
```

**Rate Limit**: 10 requests/minute per IP

#### 5. Cache Management

```http
GET /api/cache/stats    # View cache statistics
POST /api/cache/clear   # Clear all cache entries
```

### Rate Limits

- **AI Endpoints**: 10 requests/minute per IP
- **General Endpoints**: No limit (uses GitHub API rate limits)
- **Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Limit`

---

## 🧪 Testing

```bash
# Backend tests
cd backend
go test ./... -v -cover

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e
```

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build images
docker build -t devscope-backend ./backend
docker build -t devscope-frontend ./frontend

# Run with docker-compose
docker-compose up -d
```

### Manual Deployment

#### Backend (Linux/Windows Server)

```bash
go build -o github-api ./backend/cmd/main.go
./github-api
```

#### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build
npm start
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository
- 📢 Share with others

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow Go best practices and conventions
- Use TypeScript for all frontend code
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/AnantaCoder/github-insights/issues)
- **Discussions**: [Join community discussions](https://github.com/AnantaCoder/github-insights/discussions)
- **Twitter**: [@AnantaCoder](https://twitter.com/AnantaCoder)

---

## 🙏 Acknowledgments

- GitHub API for providing comprehensive developer data
- NVIDIA for AI/ML API access
- Next.js and Go communities for excellent tools
- All contributors who help improve this project

---

<div align="center">

**Built with ❤️ by developers, for developers**

[⬆ Back to Top](#-devscope---github-analytics-platform)

</div>
