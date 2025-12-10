"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { AdminPanel } from "@/components/AdminPanel";
import Image from "next/image";
import Link from "next/link";
import type { GitHubUser, TechStack, StreakInfo } from "@/types";

interface UserRanking {
    id: number;
    username: string;
    github_id: number;
    avatar_url: string;
    score: number;
    followers: number;
    public_repos: number;
    total_stars: number;
    total_forks: number;
    contribution_count: number;
    rank_position: number;
    updated_at: string;
}

interface PrivateData {
    private_repos: number;
    total_private_repos: number;
    owned_private_repos: number;
    private_gists: number;
    disk_usage: number;
    collaborators: number;
    two_factor_enabled: boolean;
    plan_name: string;
    plan_space: number;
    primary_email: string;
    emails_count: number;
    verified_emails_count: number;
    organizations_count: number;
    starred_repos_count: number;
    watching_repos_count: number;
    ssh_keys_count: number;
    gpg_keys_count: number;
}

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();

    const [user, setUser] = useState<GitHubUser | null>(null);
    const [techStack, setTechStack] = useState<TechStack | null>(null);
    const [streak, setStreak] = useState<StreakInfo | null>(null);
    const [ranking, setRanking] = useState<UserRanking | null>(null);
    const [privateData, setPrivateData] = useState<PrivateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [updating, setUpdating] = useState(false);

    const isOwnProfile = authUser?.username === username;

    // Fetch public user data
    useEffect(() => {
        const fetchData = async () => {
            if (!username) return;
            setLoading(true);
            setError("");
            try {
                const extendedResult = await api.getExtendedUserInfo(username);
                // Check if error response
                if (extendedResult.error) {
                    setError(extendedResult.message || "User not found");
                    return;
                }
                // Data is directly in the result (not nested in .data)
                if (extendedResult.user) {
                    setUser(extendedResult.user);
                    setTechStack(extendedResult.tech_stack || null);
                    setStreak(extendedResult.streak || null);
                } else {
                    setError("User not found");
                    return;
                }

                try {
                    const rankingResult = await api.getUserRanking(username);
                    if (!rankingResult.error && rankingResult.ranking) {
                        setRanking(rankingResult.ranking);
                    }
                } catch {
                    // Ranking not found is okay
                }
            } catch (err) {
                setError("Failed to fetch user data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [username]);

    // Fetch private data separately when auth is ready (SECURE: only fetches own data)
    useEffect(() => {
        const fetchPrivate = async () => {
            // Only fetch private data for the authenticated user's own profile
            // The backend endpoint /api/me/private ONLY returns the authenticated user's data
            // This ensures users can NEVER access other users' private data
            if (authLoading || !isAuthenticated || authUser?.username !== username) {
                return;
            }

            try {
                console.log("Fetching private data for own profile...");
                // Use the secure endpoint that only returns authenticated user's own data
                const result = await api.getMyPrivateData();
                console.log("Private data response:", result);

                if (!result.error && result.data) {
                    setPrivateData({
                        private_repos: result.data.private_repos || 0,
                        total_private_repos: result.data.total_private_repos || 0,
                        owned_private_repos: result.data.owned_private_repos || 0,
                        private_gists: result.data.private_gists || 0,
                        disk_usage: result.data.disk_usage || 0,
                        collaborators: result.data.collaborators || 0,
                        two_factor_enabled: result.data.two_factor_enabled || false,
                        plan_name: result.data.plan_name || "Free",
                        plan_space: result.data.plan_space || 0,
                        primary_email: result.data.primary_email || "",
                        emails_count: result.data.emails_count || 0,
                        verified_emails_count: result.data.verified_emails_count || 0,
                        organizations_count: result.data.organizations_count || 0,
                        starred_repos_count: result.data.starred_repos_count || 0,
                        watching_repos_count: result.data.watching_repos_count || 0,
                        ssh_keys_count: result.data.ssh_keys_count || 0,
                        gpg_keys_count: result.data.gpg_keys_count || 0,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch private data:", err);
            }
        };
        fetchPrivate();
    }, [authLoading, isAuthenticated, authUser, username]);

    const updateRanking = async () => {
        setUpdating(true);
        try {
            await api.updateUserRanking(username);
            // Refetch ranking
            const rankingResult = await api.getUserRanking(username);
            if (!rankingResult.error && rankingResult.ranking) {
                setRanking(rankingResult.ranking);
            }
        } catch (err) {
            console.error("Failed to update ranking:", err);
        } finally {
            setUpdating(false);
        }
    };

    // Calculate score breakdown
    const getScoreBreakdown = () => {
        if (!ranking) return null;
        const followerScore = ranking.followers * 0.40;
        const starScore = ranking.total_stars * 0.30;
        const repoScore = ranking.public_repos * 0.15;
        const forkScore = ranking.total_forks * 0.10;
        const contributionScore = ranking.contribution_count * 0.05;
        const rawTotal = followerScore + starScore + repoScore + forkScore + contributionScore;
        return {
            followers: { raw: ranking.followers, weight: 40, contribution: followerScore },
            stars: { raw: ranking.total_stars, weight: 30, contribution: starScore },
            repos: { raw: ranking.public_repos, weight: 15, contribution: repoScore },
            forks: { raw: ranking.total_forks, weight: 10, contribution: forkScore },
            contributions: { raw: ranking.contribution_count, weight: 5, contribution: contributionScore },
            rawTotal,
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-white">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-white">
                {/* Floating Orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 left-[10%] w-96 h-96 bg-red-500/20 rounded-full blur-[120px] animate-float" />
                    <div className="absolute top-40 right-[15%] w-80 h-80 bg-orange-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
                </div>

                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 relative z-10">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 gradient-text">User Not Found</h2>
                        <p className="text-gray-400 mb-6">{error || `Could not find user @${username}`}</p>
                        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all shadow-lg shadow-green-500/20 hover:glow-green">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Home
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const breakdown = getScoreBreakdown();

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
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
                    {/* Profile Header */}
                    <div className="premium-card rounded-2xl overflow-hidden mb-6 relative">
                        {/* Video background in the header box - for all users */}
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                        >
                            <source src="/glitch.mp4" type="video/mp4" />
                        </video>
                        <div className="h-32 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 relative z-10"></div>
                        <div className="px-6 pb-6 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
                                <Image
                                    src={user.avatar_url}
                                    alt={user.login}
                                    width={128}
                                    height={128}
                                    className="rounded-2xl ring-4 ring-[#0d1117] bg-[#0d1117]"
                                />
                                <div className="flex-1 md:pb-2">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h1 className="text-2xl font-bold">{user.name || user.login}</h1>
                                        {isOwnProfile && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-[#238636]/20 text-[#238636] border border-[#238636]/30 rounded-full">You</span>
                                        )}
                                        {user.login.toLowerCase() === 'anantacoder' && (
                                            <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white border-2 border-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 animate-pulse flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                ADMIN
                                            </span>
                                        )}
                                        {ranking && ranking.rank_position <= 10 && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/30 rounded-full">Top 10</span>
                                        )}
                                    </div>
                                    <p className="text-[#8b949e]">@{user.login}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={user.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                        </svg>
                                        GitHub
                                    </a>
                                    {isAuthenticated && (
                                        <button
                                            onClick={updateRanking}
                                            disabled={updating}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white rounded-lg transition-colors"
                                        >
                                            {updating ? (
                                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            )}
                                            Update Ranking
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Panel - Only visible to admin users (anantacoder) */}
                    {isOwnProfile && <AdminPanel />}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - User Info */}
                        <div className="space-y-6">
                            {/* Bio & Info */}
                            <div className="premium-card rounded-2xl p-5">
                                {user.bio && <p className="text-[#e6edf3] mb-4">{user.bio}</p>}
                                <div className="space-y-3">
                                    {user.company && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="text-[#e6edf3]">{user.company}</span>
                                        </div>
                                    )}
                                    {user.location && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-[#e6edf3]">{user.location}</span>
                                        </div>
                                    )}
                                    {user.blog && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline truncate">{user.blog}</a>
                                        </div>
                                    )}
                                    {user.twitter_username && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-[#8b949e]" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                            <a href={`https://twitter.com/${user.twitter_username}`} target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">@{user.twitter_username}</a>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                        <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-[#8b949e]">Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="premium-card rounded-2xl p-5">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="gradient-text">GitHub Stats</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl text-center hover:border-blue-500/30 transition-all">
                                        <p className="text-xl font-bold text-white">{user.public_repos}</p>
                                        <p className="text-xs text-gray-400">Public Repos</p>
                                    </div>
                                    <div className="p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl text-center hover:border-blue-500/30 transition-all">
                                        <p className="text-xl font-bold text-white">{user.public_gists}</p>
                                        <p className="text-xs text-gray-400">Public Gists</p>
                                    </div>
                                    <div className="p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl text-center hover:border-purple-500/30 transition-all">
                                        <p className="text-xl font-bold text-white">{user.followers.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">Followers</p>
                                    </div>
                                    <div className="p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl text-center hover:border-purple-500/30 transition-all">
                                        <p className="text-xl font-bold text-[#e6edf3]">{user.following.toLocaleString()}</p>
                                        <p className="text-xs text-[#8b949e]">Following</p>
                                    </div>
                                </div>
                            </div>

                            {/* Private Stats (only for own profile) */}
                            {isOwnProfile && privateData && (
                                <div className="premium-card bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 rounded-2xl p-5">
                                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#a371f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Private Stats
                                        <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-[#a371f7]/20 text-[#a371f7] rounded-full">Only You</span>
                                    </h3>

                                    {/* Repository Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl text-center hover:border-purple-500/40 transition-all">
                                            <p className="text-xl font-bold text-purple-400">{privateData.total_private_repos}</p>
                                            <p className="text-xs text-gray-400">Private Repos</p>
                                        </div>
                                        <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl text-center hover:border-purple-500/40 transition-all">
                                            <p className="text-xl font-bold text-purple-400">{privateData.private_gists}</p>
                                            <p className="text-xs text-gray-400">Private Gists</p>
                                        </div>
                                        <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl text-center hover:border-purple-500/40 transition-all">
                                            <p className="text-xl font-bold text-purple-400">{privateData.starred_repos_count}</p>
                                            <p className="text-xs text-gray-400">Starred</p>
                                        </div>
                                        <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl text-center hover:border-purple-500/40 transition-all">
                                            <p className="text-xl font-bold text-purple-400">{privateData.watching_repos_count}</p>
                                            <p className="text-xs text-gray-400">Watching</p>
                                        </div>
                                    </div>

                                    {/* Account Details */}
                                    <div className="space-y-2 mb-4">
                                        <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    Organizations
                                                </span>
                                                <span className="text-sm font-bold text-white">{privateData.organizations_count}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                    </svg>
                                                    Disk Usage
                                                </span>
                                                <span className="text-sm font-bold text-white">{(privateData.disk_usage / 1024).toFixed(1)} MB</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Verified Emails
                                                </span>
                                                <span className="text-sm font-bold text-white">{privateData.verified_emails_count} / {privateData.emails_count}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Section */}
                                    <div className="p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl">
                                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Security
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-2 py-1 text-[10px] font-medium rounded-full ${privateData.two_factor_enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {privateData.two_factor_enabled ? '✓ 2FA Enabled' : '✗ 2FA Disabled'}
                                            </span>
                                            <span className="px-2 py-1 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded-full">
                                                {privateData.ssh_keys_count} SSH Keys
                                            </span>
                                            <span className="px-2 py-1 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded-full">
                                                {privateData.gpg_keys_count} GPG Keys
                                            </span>
                                        </div>
                                    </div>

                                    {/* Plan Info */}
                                    {privateData.plan_name && (
                                        <div className="mt-3 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400">GitHub Plan</span>
                                                <span className="text-sm font-bold text-purple-300 capitalize">{privateData.plan_name}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total Repos Summary */}
                                    <div className="mt-3 p-3 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Total Repositories</span>
                                            <span className="text-sm font-bold text-white">{user.public_repos + privateData.total_private_repos}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Middle Column - Ranking & Score */}
                        <div className="space-y-6">
                            {/* Ranking Card */}
                            {ranking ? (
                                <div className="premium-card rounded-2xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-transparent">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                            <span className="gradient-text">Leaderboard Ranking</span>
                                        </h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <p className="text-4xl font-bold">
                                                    {ranking.rank_position <= 3 ? (
                                                        <span>{ranking.rank_position === 1 ? "🥇" : ranking.rank_position === 2 ? "🥈" : "🥉"}</span>
                                                    ) : (
                                                        <span className="text-[#ffd700]">#{ranking.rank_position}</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-[#8b949e]">Global Rank</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-[#a371f7]">{ranking.score.toFixed(2)}</p>
                                                <p className="text-sm text-[#8b949e]">Total Score</p>
                                            </div>
                                        </div>

                                        {/* Score Breakdown */}
                                        {breakdown && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Score Breakdown</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between p-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-blue-500/30 transition-all">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-[#e6edf3]"></div>
                                                            <span className="text-xs text-[#8b949e]">Followers ({breakdown.followers.weight}%)</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-white">{breakdown.followers.raw.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-yellow-500/30 transition-all">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                            <span className="text-xs text-gray-400">Stars ({breakdown.stars.weight}%)</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-yellow-500">{breakdown.stars.raw.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-blue-500/30 transition-all">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                            <span className="text-xs text-gray-400">Repos ({breakdown.repos.weight}%)</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-blue-500">{breakdown.repos.raw.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-gray-500/30 transition-all">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                            <span className="text-xs text-gray-400">Forks ({breakdown.forks.weight}%)</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-gray-400">{breakdown.forks.raw.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-green-500/30 transition-all">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <span className="text-xs text-gray-400">Activity ({breakdown.contributions.weight}%)</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-green-500">{breakdown.contributions.raw.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="premium-card rounded-2xl p-6 text-center">
                                    <svg className="w-12 h-12 text-[#8b949e] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    <h3 className="font-semibold mb-2">Not Ranked Yet</h3>
                                    <p className="text-sm text-[#8b949e] mb-4">This user hasn&apos;t been added to the leaderboard yet.</p>
                                    {isAuthenticated && (
                                        <button
                                            onClick={updateRanking}
                                            disabled={updating}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white rounded-lg transition-colors"
                                        >
                                            {updating ? "Adding..." : "Add to Leaderboard"}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Activity Streak */}
                            {streak && (
                                <div className="premium-card rounded-2xl p-5">
                                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#f0883e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                        </svg>
                                        Activity Streak
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-black/30 backdrop-blur-sm border border-orange-500/20 rounded-xl text-center hover:border-orange-500/40 transition-all">
                                            <p className="text-2xl font-bold text-orange-500">{streak.current_streak}</p>
                                            <p className="text-xs text-gray-400">Current Streak</p>
                                        </div>
                                        <div className="p-3 bg-black/30 backdrop-blur-sm border border-purple-500/20 rounded-xl text-center hover:border-purple-500/40 transition-all">
                                            <p className="text-2xl font-bold text-purple-500">{streak.longest_streak}</p>
                                            <p className="text-xs text-gray-400">Longest Streak</p>
                                        </div>
                                        <div className="p-3 bg-black/30 backdrop-blur-sm border border-green-500/20 rounded-xl text-center col-span-2 hover:border-green-500/40 transition-all">
                                            <p className="text-2xl font-bold text-[#238636]">{streak.total_days}</p>
                                            <p className="text-xs text-[#8b949e]">Total Active Days</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Tech Stack */}
                        <div className="space-y-6">
                            {/* Tech Stack */}
                            {techStack && techStack.languages && Object.keys(techStack.languages).length > 0 && (
                                <div className="premium-card rounded-2xl p-5">
                                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#a371f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                        Tech Stack
                                        {techStack.top_language && (
                                            <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-[#a371f7]/20 text-[#a371f7] rounded-full">{techStack.top_language}</span>
                                        )}
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(techStack.languages)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 8)
                                            .map(([lang, count]) => {
                                                const total = Object.values(techStack.languages).reduce((a, b) => a + b, 0);
                                                const percentage = (count / total) * 100;
                                                return (
                                                    <div key={lang}>
                                                        <div className="flex items-center justify-between text-sm mb-1">
                                                            <span className="text-[#e6edf3]">{lang}</span>
                                                            <span className="text-[#8b949e]">{count} repos ({percentage.toFixed(1)}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    <p className="mt-4 text-xs text-[#6e7681]">Based on {techStack.total_repos} public repositories</p>
                                </div>
                            )}

                            {/* Private Access Badge (if authenticated user has it) */}
                            {isOwnProfile && authUser?.has_private_access && (
                                <div className="premium-card bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-[#238636]/20 rounded-lg">
                                            <svg className="w-5 h-5 text-[#238636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#238636]">Private Access Enabled</h3>
                                            <p className="text-xs text-[#8b949e]">You have granted access to private repositories</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="premium-card rounded-2xl p-5">
                                <h3 className="text-sm font-semibold mb-4"><span className="gradient-text">Quick Links</span></h3>
                                <div className="space-y-2">
                                    <a
                                        href={`https://github.com/${user.login}?tab=repositories`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-black/30 backdrop-blur-sm border border-white/5 hover:border-blue-500/30 rounded-xl transition-all"
                                    >
                                        <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        <span className="text-sm text-[#e6edf3]">View Repositories</span>
                                    </a>
                                    <a
                                        href={`https://github.com/${user.login}?tab=stars`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-black/30 backdrop-blur-sm border border-white/5 hover:border-yellow-500/30 rounded-xl transition-all"
                                    >
                                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        <span className="text-sm text-white">Starred Repos</span>
                                    </a>
                                    <a
                                        href={`https://github.com/${user.login}?tab=followers`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-black/30 backdrop-blur-sm border border-white/5 hover:border-purple-500/30 rounded-xl transition-all"
                                    >
                                        <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span className="text-sm text-[#e6edf3]">Followers</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
