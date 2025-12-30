"use client";

import { RankingsTable } from "@/components/RankingsTable";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SignInCard } from "@/components/SignInCard";
import { useAuth } from "@/contexts/AuthContext";

export default function RankingsPage() {
    const { loading, isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
            {/* Floating Orbs - Warm tones */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-[#F5E7C6]/15 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-40 right-[15%] w-80 h-80 bg-[#FF6D1F]/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-20 left-[20%] w-72 h-72 bg-[#FF8A47]/12 rounded-full blur-[90px] animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <Navbar />

            {/* Main Content */}
            <main className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 w-full relative z-10">
                {/* Page Header */}
                <div className="mb-8 md:mb-12">
                    <div className="flex flex-col items-center text-center mb-6 md:mb-8">
                        <div className="inline-flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                            <div className="p-2 md:p-3 bg-gradient-to-br from-[#F5E7C6]/20 to-[#FF6D1F]/10 border border-[#F5E7C6]/30 rounded-xl backdrop-blur-sm">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight gradient-text-ember font-['Gotham']">Global Rankings</h1>
                        </div>
                        <p className="text-[#A8A0B8] text-sm sm:text-base md:text-lg max-w-2xl px-4 font-['Gotham']">Top GitHub developers ranked by comprehensive performance metrics</p>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="premium-card p-4 hover:scale-105 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm group-hover:shadow-lg group-hover:shadow-green-500/10 transition-all">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-[#6B6580]">Scoring Algorithm</p>
                                    <p className="text-sm font-semibold text-[#F5E7C6]">Multi-factor Analysis</p>
                                </div>
                            </div>
                        </div>

                        <div className="premium-card p-4 hover:scale-105 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-[#FF6D1F]/20 to-[#FF8A47]/10 border border-[#FF6D1F]/30 rounded-lg backdrop-blur-sm group-hover:shadow-lg group-hover:shadow-[#FF6D1F]/10 transition-all">
                                    <svg className="w-5 h-5 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-[#6B6580]">Update Frequency</p>
                                    <p className="text-sm font-semibold text-[#F5E7C6]">Real-time Data</p>
                                </div>
                            </div>
                        </div>

                        <div className="premium-card p-4 hover:scale-105 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-[#F5E7C6]/20 to-[#D4C9A8]/10 border border-[#F5E7C6]/30 rounded-lg backdrop-blur-sm group-hover:shadow-lg group-hover:shadow-[#F5E7C6]/10 transition-all">
                                    <svg className="w-5 h-5 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-[#6B6580]">Ranking Factors</p>
                                    <p className="text-sm font-semibold text-[#F5E7C6]">Followers, Stars, Activity</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Login Banner for Non-authenticated Users */}
                    {!loading && !isAuthenticated && (
                        <SignInCard variant="rankings" className="mt-6" />
                    )}
                </div>

                {/* Rankings Table */}
                <RankingsTable />
            </main>

            <Footer />
        </div>
    );
}
