"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { GitHubUser, CacheStats, APIResponse, TechStack, StreakInfo } from "@/types";
import { BackendErrorBanner } from "@/components/BackendErrorBanner";
import { UserProfileCard } from "@/components/UserProfileCard";
import { UserComparisonCard } from "@/components/UserComparisonCard";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { HomeAnalysisAnimation } from "@/components/HomeAnalysisAnimation";
import Image from "next/image";

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [batchUsers, setBatchUsers] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [backendError, setBackendError] = useState<boolean>(false);
  const [singleUser, setSingleUser] = useState<GitHubUser | null>(null);
  const [techStack, setTechStack] = useState<TechStack | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [batchResults, setBatchResults] = useState<Record<string, APIResponse> | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [aiComparison, setAiComparison] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [totalSearches, setTotalSearches] = useState(0);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { fetchCacheStats(); }, []);

  const fetchCacheStats = async () => {
    try {
      const stats = await api.getCacheStats();
      setCacheStats(stats);
      setBackendError(false);
    } catch { setBackendError(true); }
  };

  const fetchSingleUser = async () => {
    if (!username.trim()) { setError("Please enter a username"); return; }
    setLoading(true); setError(""); setSingleUser(null); setTechStack(null); setStreak(null);
    setTotalSearches(prev => prev + 1);
    try {
      const result = await api.getExtendedUserInfo(username);
      if (result.error) {
        setError(result.message || "User not found");
      } else if (result.user) {
        setSingleUser(result.user);
        setTechStack(result.tech_stack || null);
        setStreak(result.streak || null);
        fetchCacheStats();
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || "Failed to fetch user. Make sure the Go server is running.");
    }
    finally { setLoading(false); }
  };

  const fetchBatchUsers = async () => {
    const usernames = batchUsers.split(",").map((u) => u.trim()).filter((u) => u);
    if (usernames.length === 0) { setError("Please enter at least one username"); return; }
    if (usernames.length > 10) { setError("Maximum 10 usernames allowed"); return; }
    setLoading(true); setError(""); setBatchResults(null); setAiComparison("");
    setTotalSearches(prev => prev + usernames.length);
    try {
      const result = await api.getBatchStatus(usernames);
      if (result.error) { setError("Failed to fetch batch data"); }
      else { setBatchResults(result.results); fetchCacheStats(); }
    } catch { setError("Failed to fetch batch data. Make sure the Go server is running."); }
    finally { setLoading(false); }
  };

  const getAIComparison = async () => {
    if (!batchResults) return;
    const users = Object.values(batchResults).filter((r: APIResponse) => !r.error && r.data).map((r: APIResponse) => r.data);
    if (users.length < 2) { setError("Need at least 2 users for AI comparison"); return; }
    setLoadingAI(true); setAiComparison("");
    try {
      const result = await api.getAIComparison(users as GitHubUser[]);
      setAiComparison(result.comparison);
    } catch { setError("Failed to get AI comparison."); }
    finally { setLoadingAI(false); }
  };

  const clearCache = async () => {
    setClearing(true);
    try { await api.clearCache(); fetchCacheStats(); } catch { setError("Failed to clear cache"); }
    setTimeout(() => setClearing(false), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col premium-bg text-white">
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-40 right-[15%] w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-[20%] w-72 h-72 bg-cyan-500/20 rounded-full blur-[90px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
          {backendError && <BackendErrorBanner onRetry={fetchCacheStats} />}

          {/* Hero Section */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-xs font-medium gradient-text">AI-Powered Developer Analytics</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              <span className="gradient-text-premium">Analyze GitHub</span>
              <br />
              <span className="gradient-text-alt">Profiles with AI</span>
            </h1>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
              Deep insights into developer profiles with AI-powered comparisons, tech stack analysis, and real-time metrics
            </p>
          </div>

          {/* Analysis Animation */}
          <div className="mb-8 lg:mb-10">
            <HomeAnalysisAnimation />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
            {/* Main Content */}
            <div className="xl:col-span-8 space-y-4 lg:space-y-6">
              {/* Search Section */}
              <div className="premium-card group">
                <div className="px-4 sm:px-5 py-4 border-b border-white/5 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="gradient-text">Profile Analysis</span>
                  </h2>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative group">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Enter GitHub username..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && fetchSingleUser()}
                        className="w-full pl-10 pr-4 py-3 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:glow-blue placeholder:text-gray-500 transition-all backdrop-blur-sm"
                      />
                    </div>
                    <button
                      onClick={fetchSingleUser}
                      disabled={loading}
                      className="px-6 py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 text-white rounded-lg transition-all flex items-center justify-center gap-2 hover:glow-blue disabled:glow-none shadow-lg shadow-blue-500/20"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          <span className="hidden sm:inline">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>Analyze</span>
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <div className="mt-4 px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2 backdrop-blur-sm">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* User Profile Result */}
              {singleUser && <UserProfileCard user={singleUser} techStack={techStack || undefined} streak={streak || undefined} />}

              {/* Compare Section */}
              <div className="premium-card group">
                <div className="px-4 sm:px-5 py-4 border-b border-white/5 bg-gradient-to-r from-purple-500/5 to-transparent">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="gradient-text-alt">Compare Developers</span>
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full border border-purple-500/20">Pro</span>
                  </h2>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="relative group">
                    <svg className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="torvalds, gvanrossum, defunkt..."
                      value={batchUsers}
                      onChange={(e) => setBatchUsers(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 text-sm bg-black/40 border rounded-lg focus:outline-none transition-all placeholder:text-gray-500 backdrop-blur-sm ${batchUsers.split(',').filter(u => u.trim()).length > 10 ? 'border-red-500/50 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:glow-red' : 'border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:glow-purple'}`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-gray-400">Separate with commas (max 10)</span>
                    {batchUsers && (
                      <span className={`px-2 py-1 rounded-full font-medium transition-all ${batchUsers.split(',').filter(u => u.trim()).length > 10 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                        {batchUsers.split(',').filter(u => u.trim()).length}/10 users
                      </span>
                    )}
                  </div>
                  {batchUsers.split(',').filter(u => u.trim()).length > 10 && (
                    <div className="mt-3 px-3 py-2 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2 backdrop-blur-sm animate-pulse-glow">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      Too many users! Please remove {batchUsers.split(',').filter(u => u.trim()).length - 10} to continue.
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={fetchBatchUsers}
                      disabled={loading || batchUsers.split(',').filter(u => u.trim()).length > 10}
                      className="flex-1 py-3 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all backdrop-blur-sm"
                    >
                      Compare
                    </button>
                    {batchResults && Object.keys(batchResults).length > 1 && (
                      <button
                        onClick={getAIComparison}
                        disabled={loadingAI}
                        className="flex-1 py-3 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 hover:glow-purple shadow-lg shadow-purple-500/20"
                      >
                        {loadingAI ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                            <span className="hidden sm:inline">Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span>AI Analysis</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Comparison Result */}
              {aiComparison && !loadingAI && (
                <div className="premium-card border-purple-500/30 glow-purple">
                  <div className="px-4 sm:px-5 py-4 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <h3 className="text-sm font-semibold gradient-text-alt flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      AI Analysis
                      <span className="ml-auto text-[10px] px-2 py-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-full border border-green-500/30">NVIDIA</span>
                    </h3>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{aiComparison}</p>
                  </div>
                </div>
              )}

              {/* Batch Results */}
              {batchResults && (
                <div className="space-y-4">
                  {Object.entries(batchResults).some(([, r]) => r.error) && (
                    <div className="space-y-2">
                      {Object.entries(batchResults).filter(([, r]) => r.error).map(([uname, r]) => (
                        <div key={uname} className="px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg backdrop-blur-sm">
                          <span className="font-medium">@{uname}</span>: {r.message || "Not found"}
                        </div>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const users = Object.values(batchResults).filter(r => !r.error && r.data).map(r => r.data as GitHubUser);
                    if (users.length >= 2) return <UserComparisonCard users={users} />;
                    if (users.length === 1) return (
                      <div className="premium-card p-4 sm:p-5 flex items-center gap-4">
                        <Image src={users[0].avatar_url} alt={users[0].login} width={48} height={48} className="rounded-full ring-2 ring-white/10 shadow-lg" />
                        <div>
                          <p className="font-medium text-white">{users[0].name || users[0].login}</p>
                          <p className="text-sm text-gray-400">Add more users to compare</p>
                        </div>
                      </div>
                    );
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="xl:col-span-4 space-y-4">
              {/* Quick Stats Card */}
              <div className="premium-card overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="gradient-text">Quick Stats</span>
                  </h3>
                  <button
                    onClick={clearCache}
                    disabled={clearing || !cacheStats?.size}
                    className="px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all"
                  >
                    {clearing ? "Clearing..." : "Clear"}
                  </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg text-center backdrop-blur-sm hover:glow-blue transition-all">
                    <p className="text-2xl font-bold gradient-text">{cacheStats?.size || 0}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Profiles Cached</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg text-center backdrop-blur-sm hover:glow-green transition-all">
                    <p className="text-2xl font-bold text-green-400">{cacheStats?.hit_rate || 0}%</p>
                    <p className="text-[10px] text-gray-400 mt-1">Cache Speed</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg text-center backdrop-blur-sm hover:glow-purple transition-all">
                    <p className="text-2xl font-bold gradient-text-alt">{totalSearches}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Searches</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg text-center backdrop-blur-sm hover:glow-orange transition-all">
                    <p className="text-2xl font-bold text-orange-400">{(cacheStats?.hits || 0) + (cacheStats?.misses || 0)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">API Calls</p>
                  </div>
                </div>
              </div>

              {/* About Card */}
              <div className="premium-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="gradient-text">About DevScope</span>
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Analyze GitHub profiles with detailed tech stack insights, activity streaks, and AI-powered comparisons using NVIDIA.
                </p>
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                    Open Source
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    MIT License
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="premium-card p-4">
                <h3 className="text-sm font-semibold mb-3 gradient-text">Built With</h3>
                <div className="flex flex-wrap gap-2">
                  {[{ name: 'Go', color: '#00ADD8' }, { name: 'Next.js', color: '#fff' }, { name: 'TypeScript', color: '#3178c6' }, { name: 'NVIDIA AI', color: '#76b900' }, { name: 'Tailwind', color: '#38bdf8' }, { name: 'Neon DB', color: '#00e599' }].map(tech => (
                    <span key={tech.name} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all hover:scale-105" style={{ borderColor: tech.color + '40', color: tech.color, backgroundColor: tech.color + '10' }}>{tech.name}</span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
