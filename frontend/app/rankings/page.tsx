"use client";

import { RankingsTable } from "@/components/RankingsTable";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function RankingsPage() {
    const { loading, login, isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen flex flex-col premium-bg text-white">
            {/* Floating Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-yellow-500/20 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-40 right-[15%] w-80 h-80 bg-orange-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-20 left-[20%] w-72 h-72 bg-amber-500/20 rounded-full blur-[90px] animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <Navbar />

            {/* Main Content */}
            <main className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 w-full relative z-10">
                {/* Page Header */}
                <div className="mb-8 md:mb-12">
                    <div className="flex flex-col items-center text-center mb-6 md:mb-8">
                        <div className="inline-flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                            <div className="p-2 md:p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight gradient-text-premium">Global Rankings</h1>
                        </div>
                        <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl px-4">Top GitHub developers ranked by comprehensive performance metrics</p>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="premium-card p-4 hover:scale-105 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg backdrop-blur-sm group-hover:glow-green transition-all">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Scoring Algorithm</p>
                                    <p className="text-sm font-semibold text-white">Multi-factor Analysis</p>
                                </div>
                            </div>
                        </div>

                        <div className="premium-card p-4 hover:scale-105 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm group-hover:glow-blue transition-all">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Update Frequency</p>
                                    <p className="text-sm font-semibold text-white">Real-time Data</p>
                                </div>
                            </div>
                        </div>

                        <div className="premium-card p-4 hover:scale-105 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg backdrop-blur-sm group-hover:glow-purple transition-all">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Ranking Factors</p>
                                    <p className="text-sm font-semibold text-white">Followers, Stars, Activity</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Login Banner for Non-authenticated Users */}
                    {!loading && !isAuthenticated && (
                        <div className="premium-card p-6 mt-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="shrink-0 p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl backdrop-blur-sm">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-2">Want to appear in rankings?</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Login with your GitHub account to be included in the developer rankings leaderboard. Your profile will be automatically analyzed and ranked based on your contributions, stars, and activity.
                                    </p>
                                    <button
                                        onClick={login}
                                        className="cursor-pointer inline-flex  items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-green-500/20 hover:glow-green"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                        </svg>
                                        Login with GitHub
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rankings Table */}
                <RankingsTable />
            </main>

            <Footer />
        </div>
    );
}
