"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RepoCard } from "@/components/RepoCard";
import { Repository, GitHubFollower } from "@/types/github";
import Image from "next/image";
import Link from "next/link";
import type { GitHubUser, TechStack, StreakInfo } from "@/types";
import { ThreeBackground } from "@/components/ThreeBackground";


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

    // Repository state
    const [repos, setRepos] = useState<Repository[]>([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [reposPage, setReposPage] = useState(1);
    const [copiedRepoId, setCopiedRepoId] = useState<number | null>(null);
    const reposPerPage = 12;

    // Starred repos state
    const [starredRepos, setStarredRepos] = useState<Repository[]>([]);
    const [starredLoading, setStarredLoading] = useState(false);
    const [starredPage, setStarredPage] = useState(1);

    // Tab state
    const [activeTab, setActiveTab] = useState<'overview' | 'repos' | 'starred'>('overview');

    // Followers/Following popup state
    const [popupType, setPopupType] = useState<'followers' | 'following' | null>(null);
    const [followers, setFollowers] = useState<GitHubFollower[]>([]);
    const [following, setFollowing] = useState<GitHubFollower[]>([]);
    const [popupLoading, setPopupLoading] = useState(false);

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

    // Fetch user repositories
    const fetchUserRepos = async () => {
        if (repos.length > 0) return; // Already fetched
        setReposLoading(true);
        try {
            const response = await fetch(
                `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
                { headers: { Accept: "application/vnd.github.v3+json" } }
            );
            if (response.ok) {
                const data = await response.json();
                setRepos(data);
            }
        } catch (err) {
            console.error("Failed to fetch repositories:", err);
        } finally {
            setReposLoading(false);
        }
    };

    const copyRepoCloneCommand = (repo: Repository, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(`git clone ${repo.clone_url}`);
        setCopiedRepoId(repo.id);
        setTimeout(() => setCopiedRepoId(null), 2000);
    };

    // Fetch starred repos
    const fetchStarredRepos = async () => {
        if (starredRepos.length > 0) return; // Already fetched
        setStarredLoading(true);
        try {
            const response = await fetch(
                `https://api.github.com/users/${username}/starred?per_page=100`,
                { headers: { Accept: "application/vnd.github.v3+json" } }
            );
            if (response.ok) {
                const data = await response.json();
                setStarredRepos(data);
            }
        } catch (err) {
            console.error("Failed to fetch starred repositories:", err);
        } finally {
            setStarredLoading(false);
        }
    };

    // Handle tab change  
    const handleTabChange = (tab: 'overview' | 'repos' | 'starred') => {
        setActiveTab(tab);
        if (tab === 'repos' && repos.length === 0) {
            fetchUserRepos();
        } else if (tab === 'starred' && starredRepos.length === 0) {
            fetchStarredRepos();
        }
    };

    // Fetch followers
    const fetchFollowers = async () => {
        if (followers.length > 0) return followers;
        setPopupLoading(true);
        try {
            const response = await fetch(
                `https://api.github.com/users/${username}/followers?per_page=100`,
                { headers: { Accept: "application/vnd.github.v3+json" } }
            );
            if (response.ok) {
                const data = await response.json();
                setFollowers(data);
                return data;
            }
        } catch (err) {
            console.error("Failed to fetch followers:", err);
        } finally {
            setPopupLoading(false);
        }
        return [];
    };

    // Fetch following
    const fetchFollowing = async () => {
        if (following.length > 0) return following;
        setPopupLoading(true);
        try {
            const response = await fetch(
                `https://api.github.com/users/${username}/following?per_page=100`,
                { headers: { Accept: "application/vnd.github.v3+json" } }
            );
            if (response.ok) {
                const data = await response.json();
                setFollowing(data);
                return data;
            }
        } catch (err) {
            console.error("Failed to fetch following:", err);
        } finally {
            setPopupLoading(false);
        }
        return [];
    };

    // Open popup
    const openPopup = async (type: 'followers' | 'following') => {
        setPopupType(type);
        if (type === 'followers') {
            await fetchFollowers();
        } else {
            await fetchFollowing();
        }
    };

    // Close popup
    const closePopup = () => {
        setPopupType(null);
    };

    // Process repos for display
    const sortedRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
    const paginatedRepos = sortedRepos.slice((reposPage - 1) * reposPerPage, reposPage * reposPerPage);
    const totalRepoPages = Math.ceil(repos.length / reposPerPage);

    // Process starred repos for display
    const paginatedStarredRepos = starredRepos.slice((starredPage - 1) * reposPerPage, starredPage * reposPerPage);
    const totalStarredPages = Math.ceil(starredRepos.length / reposPerPage);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#1E2345] border-t-[#FF6D1F] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[#6B6580]">Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
                {/* Floating Orbs - Warm tones */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 left-[10%] w-96 h-96 bg-[#FF6D1F]/15 rounded-full blur-[120px] animate-float" />
                    <div className="absolute top-40 right-[15%] w-80 h-80 bg-[#F5E7C6]/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
                </div>

                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 relative z-10">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 gradient-text-ember font-['Gotham']">User Not Found</h2>
                        <p className="text-[#6B6580] mb-6">{error || `Could not find user @${username}`}</p>
                        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] text-white rounded-lg transition-all shadow-lg shadow-[#FF6D1F]/20">
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
        <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
            {/* Floating Orbs - Warm tones */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-[#FF6D1F]/15 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-40 right-[15%] w-80 h-80 bg-[#F5E7C6]/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-20 left-[20%] w-72 h-72 bg-[#FF8A47]/12 rounded-full blur-[90px] animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <Navbar />

            <main className="flex-1 relative z-10">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
                    {/* Solar Eclipse Profile Header with Three.js Background */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#000000] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] mb-8 group perspective-[1000px] min-h-[400px]">

                        {/* Three.js Background */}
                        <ThreeBackground />

                        <div className="relative z-10 p-8 sm:p-14 flex flex-col items-center text-center">

                            {/* Avatar - The Eclipse */}
                            <div className="relative mb-8 group/avatar">
                                {/* Corona Effect */}
                                <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-blue-500/30 blur-2xl animate-pulse-slow opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-1000" />

                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-white/40 via-blue-400/40 to-white/40 opacity-50 blur-md animate-[spin_6s_linear_infinite]" />
                                <div className="relative w-36 h-36 rounded-full p-1.5 bg-black/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl">
                                    <Image
                                        src={user.avatar_url}
                                        alt={user.login}
                                        fill
                                        className="object-cover rounded-full"
                                    />
                                </div>
                                {isOwnProfile && (
                                    <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] font-black tracking-widest px-3 py-1 rounded-full border-4 border-black shadow-lg transform rotate-[-5deg]">
                                        YOU
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-3 mb-6 relative">
                                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter drop-shadow-2xl">{user.name || user.login}</h1>
                                <div className="flex items-center gap-3">
                                    <p className="text-zinc-400 font-mono tracking-wider text-sm bg-white/5 px-3 py-1 rounded-full border border-white/5">@{user.login}</p>

                                    {/* Badges */}
                                    {user.login.toLowerCase() === 'anantacoder' && (
                                        <span className="px-3 py-1 text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full shadow-lg shadow-red-500/20 animate-pulse tracking-widest">
                                            ADMIN
                                        </span>
                                    )}
                                    {ranking && ranking.rank_position <= 10 && (
                                        <span className="px-3 py-1 text-[10px] font-bold bg-[#ffd700] text-black border border-[#ffd700] rounded-full shadow-lg shadow-[#ffd700]/20 tracking-wider flex items-center gap-1">
                                            TOP 10
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                <a
                                    href={user.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 group/btn"
                                >
                                    <svg className="w-5 h-5 text-zinc-400 group-hover/btn:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                    </svg>
                                    <span className="font-semibold text-zinc-300 group-hover/btn:text-white transition-colors">GitHub Profile</span>
                                </a>

                                {isAuthenticated && (
                                    <button
                                        onClick={updateRanking}
                                        disabled={updating}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] disabled:opacity-50 text-white rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#FF6D1F]/30"
                                    >
                                        {updating ? (
                                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        )}
                                        <span className="font-semibold">Update Ranking</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex gap-1 p-1.5 bg-[#0d1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/20">
                            <button
                                onClick={() => handleTabChange('overview')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'overview'
                                    ? 'bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white shadow-lg shadow-[#FF6D1F]/25'
                                    : 'text-[#6B6580] hover:text-[#F5E7C6] hover:bg-[#F5E7C6]/10'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Overview
                            </button>
                            <button
                                onClick={() => handleTabChange('repos')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'repos'
                                    ? 'bg-gradient-to-r from-[#FF6D1F] to-[#FF8A47] text-white shadow-lg shadow-[#FF6D1F]/25'
                                    : 'text-[#6B6580] hover:text-[#F5E7C6] hover:bg-[#F5E7C6]/10'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                Repos
                                {repos.length > 0 && <span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">{repos.length}</span>}
                            </button>
                            <button
                                onClick={() => handleTabChange('starred')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'starred'
                                    ? 'bg-gradient-to-r from-[#F5E7C6] to-[#FF6D1F] text-[#090B1B] shadow-lg shadow-[#F5E7C6]/25'
                                    : 'text-[#6B6580] hover:text-[#F5E7C6] hover:bg-[#F5E7C6]/10'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                Starred
                                {starredRepos.length > 0 && <span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">{starredRepos.length}</span>}
                            </button>
                        </div>
                    </div>

                    {/* Overview Tab Content */}
                    {activeTab === 'overview' && (
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

                                {/* Private Stats (only for own profile WITH private access) */}
                                {isOwnProfile && authUser && authUser.has_private_access && privateData && (
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
                                            <svg className="w-4 h-4 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                            </svg>
                                            Activity Streak
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-[#1E2345]/60 backdrop-blur-sm border border-[#FF6D1F]/20 rounded-xl text-center hover:border-[#FF6D1F]/40 transition-all">
                                                <p className="text-2xl font-bold text-[#FF6D1F]">{streak.current_streak}</p>
                                                <p className="text-xs text-[#6B6580]">Current Streak</p>
                                            </div>
                                            <div className="p-3 bg-[#1E2345]/60 backdrop-blur-sm border border-[#F5E7C6]/20 rounded-xl text-center hover:border-[#F5E7C6]/40 transition-all">
                                                <p className="text-2xl font-bold text-[#F5E7C6]">{streak.longest_streak}</p>
                                                <p className="text-xs text-[#6B6580]">Longest Streak</p>
                                            </div>
                                            <div className="p-3 bg-[#1E2345]/60 backdrop-blur-sm border border-[#FF8A47]/20 rounded-xl text-center col-span-2 hover:border-[#FF8A47]/40 transition-all">
                                                <p className="text-2xl font-bold text-[#FF8A47]">{streak.total_days}</p>
                                                <p className="text-xs text-[#6B6580]">Total Active Days</p>
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
                                            <svg className="w-4 h-4 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                            Tech Stack
                                            {techStack.top_language && (
                                                <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-[#FF6D1F]/20 text-[#FF6D1F] rounded-full">{techStack.top_language}</span>
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
                                                                <span className="text-[#F5E7C6]">{lang}</span>
                                                                <span className="text-[#6B6580]">{count} repos ({percentage.toFixed(1)}%)</span>
                                                            </div>
                                                            <div className="h-2 bg-[#1E2345]/60 backdrop-blur-sm border border-[#F5E7C6]/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#FF6D1F] to-[#F5E7C6] rounded-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        <p className="mt-4 text-xs text-[#6B6580]">Based on {techStack.total_repos} public repositories</p>
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
                                    <h3 className="text-sm font-semibold mb-4"><span className="gradient-text-ember">Quick Links</span></h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => openPopup('followers')}
                                            className="w-full flex items-center gap-3 p-3 bg-[#1E2345]/60 backdrop-blur-sm border border-[#F5E7C6]/5 hover:border-[#FF6D1F]/30 rounded-xl transition-all text-left"
                                        >
                                            <svg className="w-4 h-4 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span className="text-sm text-[#F5E7C6] flex-1">Followers</span>
                                            <span className="text-xs text-[#6B6580] bg-[#F5E7C6]/5 px-2 py-1 rounded-lg">{user.followers}</span>
                                        </button>
                                        <button
                                            onClick={() => openPopup('following')}
                                            className="w-full flex items-center gap-3 p-3 bg-[#1E2345]/60 backdrop-blur-sm border border-[#F5E7C6]/5 hover:border-[#FF6D1F]/30 rounded-xl transition-all text-left"
                                        >
                                            <svg className="w-4 h-4 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span className="text-sm text-[#F5E7C6] flex-1">Following</span>
                                            <span className="text-xs text-[#6B6580] bg-[#F5E7C6]/5 px-2 py-1 rounded-lg">{user.following}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Upgrade Banner - Compact version at bottom */}
                                {isOwnProfile && authUser && !authUser.has_private_access && (
                                    <div className="premium-card bg-gradient-to-r from-[#FF6D1F]/10 to-[#F5E7C6]/10 border-[#FF6D1F]/30 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#FF6D1F]/20 rounded-lg">
                                                <svg className="w-5 h-5 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-bold text-[#F5E7C6]">Unlock Private Stats</h3>
                                                    <span className="px-1.5 py-0.5 text-[10px] bg-[#FF6D1F]/20 text-[#FF8A47] rounded font-bold">PREMIUM</span>
                                                </div>
                                                <p className="text-xs text-[#6B6580]">Access private repos, analytics & more</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    window.location.href = `/choose-signin?pref=full`;
                                                }}
                                                className="px-3 py-1.5 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] text-white rounded-lg transition-all font-semibold text-xs shadow-lg shadow-[#FF6D1F]/20 whitespace-nowrap"
                                            >
                                                Upgrade
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Repos Tab Content */}
                    {activeTab === 'repos' && (
                        <div className="premium-card rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#F5E7C6]/10 flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <span className="gradient-text-ember">Repositories</span>
                                    {repos.length > 0 && <span className="text-sm text-[#6B6580]">({repos.length})</span>}
                                </h3>
                                {totalRepoPages > 1 && (
                                    <span className="text-sm text-[#6B6580]">Page {reposPage} of {totalRepoPages}</span>
                                )}
                            </div>
                            <div className="p-5">
                                {reposLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-10 h-10 border-4 border-[#1E2345] border-t-[#FF6D1F] rounded-full animate-spin" />
                                    </div>
                                ) : repos.length === 0 ? (
                                    <div className="text-center py-16 text-[#6B6580]">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-[#4A4560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        <p className="text-lg">No public repositories found</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {paginatedRepos.map((repo) => (
                                                <RepoCard
                                                    key={repo.id}
                                                    repo={repo}
                                                    copiedId={copiedRepoId}
                                                    onCopy={copyRepoCloneCommand}
                                                />
                                            ))}
                                        </div>

                                        {totalRepoPages > 1 && (
                                            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-[#F5E7C6]/10">
                                                <button
                                                    onClick={() => setReposPage((p) => Math.max(1, p - 1))}
                                                    disabled={reposPage === 1}
                                                    className="px-4 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] text-sm rounded-lg transition-all border border-[#F5E7C6]/10"
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-sm text-[#6B6580]">{reposPage} / {totalRepoPages}</span>
                                                <button
                                                    onClick={() => setReposPage((p) => Math.min(totalRepoPages, p + 1))}
                                                    disabled={reposPage === totalRepoPages}
                                                    className="px-4 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] text-sm rounded-lg transition-all border border-[#F5E7C6]/10"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Starred Tab Content */}
                    {activeTab === 'starred' && (
                        <div className="premium-card rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#F5E7C6]/10 flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    <span className="gradient-text-ember">Starred Repositories</span>
                                    {starredRepos.length > 0 && <span className="text-sm text-[#6B6580]">({starredRepos.length})</span>}
                                </h3>
                                {totalStarredPages > 1 && (
                                    <span className="text-sm text-[#6B6580]">Page {starredPage} of {totalStarredPages}</span>
                                )}
                            </div>
                            <div className="p-5">
                                {starredLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-10 h-10 border-4 border-[#1E2345] border-t-[#F5E7C6] rounded-full animate-spin" />
                                    </div>
                                ) : starredRepos.length === 0 ? (
                                    <div className="text-center py-16 text-[#6B6580]">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-[#4A4560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        <p className="text-lg">No starred repositories found</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {paginatedStarredRepos.map((repo) => (
                                                <RepoCard
                                                    key={repo.id}
                                                    repo={repo}
                                                    copiedId={copiedRepoId}
                                                    onCopy={copyRepoCloneCommand}
                                                />
                                            ))}
                                        </div>

                                        {totalStarredPages > 1 && (
                                            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-[#F5E7C6]/10">
                                                <button
                                                    onClick={() => setStarredPage((p) => Math.max(1, p - 1))}
                                                    disabled={starredPage === 1}
                                                    className="px-4 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] text-sm rounded-lg transition-all border border-[#F5E7C6]/10"
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-sm text-[#6B6580]">{starredPage} / {totalStarredPages}</span>
                                                <button
                                                    onClick={() => setStarredPage((p) => Math.min(totalStarredPages, p + 1))}
                                                    disabled={starredPage === totalStarredPages}
                                                    className="px-4 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] text-sm rounded-lg transition-all border border-[#F5E7C6]/10"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Followers/Following Popup Modal */}
            {popupType && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={closePopup}
                >
                    <div
                        className="relative w-full max-w-lg bg-[#0d1117] border border-[#F5E7C6]/10 rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative flex items-center justify-center p-5 border-b border-[#F5E7C6]/10 bg-gradient-to-r from-[#FF6D1F]/10 to-[#F5E7C6]/10">
                            <h3 className="text-lg font-bold text-[#F5E7C6] flex items-center gap-2">
                                {popupType === 'followers' ? (
                                    <>
                                        <svg className="w-5 h-5 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Followers
                                        <span className="text-sm text-[#6B6580]">({user?.followers || 0})</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Following
                                        <span className="text-sm text-[#6B6580]">({user?.following || 0})</span>
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={closePopup}
                                className="absolute right-4 p-2 hover:bg-[#F5E7C6]/10 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-[#6B6580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {popupLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-10 h-10 border-4 border-[#1E2345] border-t-[#FF6D1F] rounded-full animate-spin" />
                                </div>
                            ) : (popupType === 'followers' ? followers : following).length === 0 ? (
                                <div className="text-center py-12 text-[#6B6580]">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-[#4A4560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-lg">No {popupType} found</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3 justify-center">
                                    {(popupType === 'followers' ? followers : following).map((person) => (
                                        <Link
                                            key={person.id}
                                            href={`/profile/${person.login}`}
                                            onClick={closePopup}
                                            className="group relative"
                                        >
                                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent hover:border-[#FF6D1F]/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#FF6D1F]/20">
                                                <Image
                                                    src={person.avatar_url}
                                                    alt={person.login}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-xs text-[#F5E7C6] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                @{person.login}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}