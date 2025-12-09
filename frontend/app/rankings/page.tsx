"use client";

import { RankingsTable } from "@/components/RankingsTable";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

export default function RankingsPage() {
    const { loading, login, isAuthenticated } = useAuth();

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[#8b949e]">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show login required message if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
                <Navbar />

                {/* Login Required Content */}
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#ffd700]/20 to-[#ffa500]/20 border border-[#ffd700]/30 rounded-2xl flex items-center justify-center">
                                <svg className="w-10 h-10 text-[#ffd700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                            <p className="text-[#8b949e] mb-6">
                                Sign in with GitHub to access the developer rankings leaderboard.
                            </p>
                            <button
                                onClick={login}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-medium rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                </svg>
                                Sign in with GitHub
                            </button>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 w-full">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-[#ffd700]/20 to-[#ffa500]/20 border border-[#ffd700]/30 rounded-xl">
                            <svg className="w-8 h-8 text-[#ffd700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Developer Rankings</h1>
                            <p className="text-[#8b949e] mt-1">Top GitHub developers ranked by comprehensive score</p>
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#238636]/10 border border-[#238636]/30 rounded-lg">
                                    <svg className="w-5 h-5 text-[#238636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-[#8b949e]">Scoring Algorithm</p>
                                    <p className="text-sm font-semibold text-[#e6edf3]">Multi-factor Analysis</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-lg">
                                    <svg className="w-5 h-5 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-[#8b949e]">Update Frequency</p>
                                    <p className="text-sm font-semibold text-[#e6edf3]">Real-time Data</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#a371f7]/10 border border-[#a371f7]/30 rounded-lg">
                                    <svg className="w-5 h-5 text-[#a371f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-[#8b949e]">Ranking Factors</p>
                                    <p className="text-sm font-semibold text-[#e6edf3]">Followers, Stars, Activity</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rankings Table */}
                <RankingsTable />
            </main>

            <Footer />
        </div>
    );
}
