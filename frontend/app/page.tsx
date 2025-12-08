"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { GitHubUser, CacheStats, APIResponse } from "@/types";
import { BackendErrorBanner } from "@/components/BackendErrorBanner";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { UserProfileCard } from "@/components/UserProfileCard";
import Image from "next/image";

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [batchUsers, setBatchUsers] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [backendError, setBackendError] = useState<boolean>(false);
  const [singleUser, setSingleUser] = useState<GitHubUser | null>(null);
  const [batchResults, setBatchResults] = useState<Record<string, APIResponse> | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [aiComparison, setAiComparison] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    try {
      const stats = await api.getCacheStats();
      setCacheStats(stats);
      setBackendError(false);
    } catch (err) {
      console.error("Failed to fetch cache stats:", err);
      setBackendError(true);
    }
  };

  const fetchSingleUser = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");
    setSingleUser(null);

    try {
      const result = await api.getUserStatus(username);
      if (result.error) {
        setError(result.message || "User not found");
      } else if (result.data) {
        setSingleUser(result.data);
        fetchCacheStats();
      }
    } catch (err) {
      setError("Failed to fetch user. Make sure the Go server is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchUsers = async () => {
    const usernames = batchUsers.split(",").map((u) => u.trim()).filter((u) => u);

    if (usernames.length === 0) {
      setError("Please enter at least one username");
      return;
    }

    if (usernames.length > 10) {
      setError("Maximum 10 usernames allowed");
      return;
    }

    setLoading(true);
    setError("");
    setBatchResults(null);
    setAiComparison("");

    try {
      const result = await api.getBatchStatus(usernames);
      if (result.error) {
        setError("Failed to fetch batch data");
      } else {
        setBatchResults(result.results);
        fetchCacheStats();
      }
    } catch (err) {
      setError("Failed to fetch batch data. Make sure the Go server is running.");
    } finally {
      setLoading(false);
    }
  };

  const getAIComparison = async () => {
    if (!batchResults) return;

    const users = Object.values(batchResults)
      .filter((r: any) => !r.error && r.data)
      .map((r: any) => r.data);

    if (users.length < 2) {
      setError("Need at least 2 users for AI comparison");
      return;
    }

    setLoadingAI(true);
    setAiComparison("");

    try {
      const result = await api.getAIComparison(users);
      setAiComparison(result.comparison);
    } catch (err) {
      setError("Failed to get AI comparison. Make sure the Go server is running.");
    } finally {
      setLoadingAI(false);
    }
  };

  const clearCache = async () => {
    try {
      await api.clearCache();
      fetchCacheStats();
      alert("Cache cleared successfully!");
    } catch (err) {
      setError("Failed to clear cache");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                G
              </div>
              <div>
                <h1 className="text-xl font-bold">GitHub Analytics</h1>
                <p className="text-xs text-gray-400">Powered by Go & NVIDIA AI</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">v1.0.0</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Backend Error Banner */}
        {backendError && <BackendErrorBanner onRetry={fetchCacheStats} />}

        {/* Performance Metrics Dashboard */}
        {cacheStats && !backendError && (
          <PerformanceMetrics stats={cacheStats} onClearCache={clearCache} />
        )}

        {/* Single User Analysis */}
        <div className="mb-8">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">User Profile Analysis</h2>
                <p className="text-sm text-gray-400">Search and analyze GitHub developers</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Enter GitHub username (e.g., torvalds)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchSingleUser()}
                className="flex-1 px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 hover:border-gray-600 transition-all duration-300 placeholder:text-gray-500"
              />
              <button
                onClick={fetchSingleUser}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all duration-300 font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {singleUser && <UserProfileCard user={singleUser} />}
          </div>
        </div>

        {/* Batch Comparison */}
        <div>
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Multi-User Comparison</h2>
                <p className="text-sm text-gray-400">Compare multiple developers with AI analysis</p>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter usernames separated by commas (e.g., torvalds, gvanrossum, kentcdodds)"
                value={batchUsers}
                onChange={(e) => setBatchUsers(e.target.value)}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 hover:border-gray-600 transition-all duration-300 placeholder:text-gray-500"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">Maximum 10 users • Comma separated</p>
                {batchUsers && (
                  <p className="text-xs text-gray-400">
                    {batchUsers.split(',').filter((u: string) => u.trim()).length} user(s)
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={fetchBatchUsers}
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all duration-300 font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Compare Users</span>
                </>
              )}
            </button>

            {/* AI Comparison Button and Results */}
            {batchResults && Object.keys(batchResults).length > 1 && (
              <div className="mt-6">
                <button
                  onClick={getAIComparison}
                  disabled={loadingAI}
                  className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-all duration-300 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50"
                >
                  {loadingAI ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Generating AI Analysis...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🤖</span>
                      <span>Get NVIDIA AI Comparison</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {aiComparison && !loadingAI && (
              <div className="mt-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <h4 className="font-semibold text-purple-300">NVIDIA AI Comparative Analysis</h4>
                </div>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{aiComparison}</p>
              </div>
            )}

            {batchResults && (
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {Object.entries(batchResults).map(([username, result]) => (
                  <div key={username}>
                    {result.error ? (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
                        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium">@{username}</p>
                          <p className="text-sm">{result.message || "Not found"}</p>
                        </div>
                      </div>
                    ) : result.data ? (
                      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all duration-300">
                        <div className="flex gap-4">
                          <div className="relative shrink-0">
                            <Image
                              src={result.data.avatar_url}
                              alt={result.data.login}
                              width={64}
                              height={64}
                              className="rounded-xl ring-2 ring-gray-800"
                            />
                            {result.cached && (
                              <div className="absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-gray-950 flex items-center justify-center">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {result.data.name || result.data.login}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">@{result.data.login}</p>
                            <div className="flex gap-2 mt-3 text-xs">
                              <div className="bg-gray-900 px-2 py-1 rounded flex items-center gap-1">
                                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-gray-300">{result.data.public_repos}</span>
                              </div>
                              <div className="bg-gray-900 px-2 py-1 rounded flex items-center gap-1">
                                <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span className="text-gray-300">{result.data.followers}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
