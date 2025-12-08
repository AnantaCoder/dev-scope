# GitHub Status API - Next.js Frontend

Modern Next.js frontend with Aceternity UI and NVIDIA AI integration.

## Setup

1. **Install dependencies:**

```powershell
npm install
```

2. **Configure environment variables:**

Edit `.env.local` and add your NVIDIA API key:

```env
NEXT_PUBLIC_GO_API_URL=http://localhost:8000
NVIDIA_API_KEY=your_nvidia_api_key_here
```

Get your NVIDIA API key from: https://build.nvidia.com/

3. **Start the Go backend:**

```powershell
cd ..
.\github-api.exe
```

4. **Start the Next.js frontend:**

```powershell
npm run dev
```

5. **Open in browser:**

```
http://localhost:3000
```

## Features

✅ Beautiful Aceternity UI components
✅ Single user search with AI insights
✅ Batch user comparison with NVIDIA AI
✅ Real-time cache statistics
✅ Responsive design
✅ Dark mode by default
✅ Smooth animations with Framer Motion

## NVIDIA AI Integration

The app uses NVIDIA's AI API to provide:

- **User Insights**: AI analysis of individual GitHub profiles
- **User Comparison**: AI-powered comparison of multiple developers
- **Smart Recommendations**: Actionable insights about developer activity

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Aceternity UI
- Framer Motion
- NVIDIA AI API
