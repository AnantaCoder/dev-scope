"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SignInCard } from "@/components/SignInCard";
import Image from "next/image";
import Link from "next/link";

interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    clone_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    open_issues_count: number;
    private: boolean;
    updated_at: string;
    created_at: string;
    topics?: string[];
    size: number;
    default_branch: string;
    owner: {
        login: string;
        avatar_url: string;
    };
}

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Go: "#00ADD8",
    Rust: "#dea584",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Vue: "#41b883",
};

const LANGUAGES_LIST = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C++", "Ruby", "PHP", "Swift", "Kotlin"];

export default function ReposPage() {
    const { user, isAuthenticated } = useAuth();

    const [myRepos, setMyRepos] = useState<Repository[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"updated" | "stars" | "name" | "forks">("stars");
    const [filterLanguage, setFilterLanguage] = useState<string>("");
    const [minStars, setMinStars] = useState<string>("");
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Pagination for search results
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const resultsPerPage = 12;

    // Pagination for user's repos
    const [myReposPage, setMyReposPage] = useState(1);
    const myReposPerPage = 12;

    // Fetch user's repos if authenticated
    const fetchMyRepos = useCallback(async () => {
        if (!user?.username) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `https://api.github.com/users/${user.username}/repos?per_page=100&sort=updated`,
                { headers: { Accept: "application/vnd.github.v3+json" } }
            );
            if (!response.ok) throw new Error("Failed to fetch repositories");
            const data = await response.json();
            setMyRepos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load repositories");
        } finally {
            setLoading(false);
        }
    }, [user?.username]);

    // Search repos globally with filters
    const searchRepos = async (page: number = 1) => {
        if (!searchQuery.trim() && !filterLanguage && !minStars) return;
        setSearchLoading(true);
        setSearchError(null);
        if (page === 1) setSearchResults([]);

        try {
            let query = searchQuery.trim() || "stars:>100";
            if (filterLanguage) query += ` language:${filterLanguage}`;
            if (minStars) query += ` stars:>=${minStars}`;

            const sortParam = sortBy === "updated" ? "updated" : sortBy === "forks" ? "forks" : "stars";
            const response = await fetch(
                `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sortParam}&per_page=${resultsPerPage}&page=${page}`,
                { headers: { Accept: "application/vnd.github.v3+json" } }
            );
            if (!response.ok) throw new Error("Search failed");
            const data = await response.json();
            setSearchResults(data.items || []);
            setTotalResults(Math.min(data.total_count || 0, 1000)); // GitHub limits to 1000
            setCurrentPage(page);
        } catch (err) {
            setSearchError(err instanceof Error ? err.message : "Search failed");
        } finally {
            setSearchLoading(false);
        }
    };

    // Copy git clone command
    const copyCloneCommand = (repo: Repository, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(`git clone ${repo.clone_url}`);
        setCopiedId(repo.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        if (isAuthenticated && user?.username) {
            fetchMyRepos();
        }
    }, [isAuthenticated, user?.username, fetchMyRepos]);

    // Get unique languages from repos
    const getLanguages = (repos: Repository[]) => {
        const langs = new Set<string>();
        repos.forEach((r) => r.language && langs.add(r.language));
        return Array.from(langs).sort();
    };

    // Sort and filter repos
    const processRepos = (repos: Repository[]) => {
        let filtered = repos;
        if (filterLanguage) {
            filtered = repos.filter((r) => r.language === filterLanguage);
        }
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case "stars":
                    return b.stargazers_count - a.stargazers_count;
                case "forks":
                    return b.forks_count - a.forks_count;
                case "name":
                    return a.name.localeCompare(b.name);
                default:
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            }
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffDays < 1) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    const totalPages = Math.ceil(totalResults / resultsPerPage);

    // Repo card component
    const RepoCard = ({ repo }: { repo: Repository }) => (
        <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl hover:border-[#58a6ff]/50 transition-all group">
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Image
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        width={20}
                        height={20}
                        className="rounded-full flex-shrink-0"
                    />
                    <span className="text-[#58a6ff] font-semibold truncate">{repo.full_name}</span>
                </div>
                {repo.private && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded flex-shrink-0">Private</span>
                )}
            </div>

            {repo.description && (
                <p className="text-sm text-[#8b949e] line-clamp-2 mb-3">{repo.description}</p>
            )}

            {repo.topics && repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {repo.topics.slice(0, 3).map((topic) => (
                        <span key={topic} className="text-[10px] px-2 py-0.5 bg-[#388bfd]/10 text-[#58a6ff] rounded-full">
                            {topic}
                        </span>
                    ))}
                    {repo.topics.length > 3 && (
                        <span className="text-[10px] text-[#8b949e]">+{repo.topics.length - 3}</span>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#8b949e] mb-3">
                {repo.language && (
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || "#8b949e" }} />
                        <span>{repo.language}</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" /></svg>
                    <span>{repo.stargazers_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg>
                    <span>{repo.forks_count.toLocaleString()}</span>
                </div>
                <span className="text-[#6e7681]">•</span>
                <span>{formatDate(repo.updated_at)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Link
                    href={`/repos/${repo.owner.login}/${repo.name}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/20 transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                </Link>
                {!repo.private && (
                    <button
                        onClick={(e) => copyCloneCommand(repo, e)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${copiedId === repo.id
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] border-[#30363d]"
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {copiedId === repo.id ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            )}
                        </svg>
                        {copiedId === repo.id ? "Copied!" : "Clone"}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col premium-bg text-white">
            {/* Floating Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-40 right-[15%] w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
            </div>

            <Navbar />

            <main className="flex-1 relative z-10">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold gradient-text mb-2">Repositories</h1>
                        <p className="text-[#8b949e]">Search and explore GitHub repositories</p>
                    </div>

                    {/* Search & Filters */}
                    <div className="mb-6 premium-card p-4 space-y-4">
                        {/* Search Bar */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search repositories... (e.g., react, machine learning)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && searchRepos(1)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder:text-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => searchRepos(1)}
                                disabled={searchLoading}
                                className="px-6 py-3 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                {searchLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                                <span>Search</span>
                            </button>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-[#8b949e]">Language:</label>
                                <select
                                    value={filterLanguage}
                                    onChange={(e) => setFilterLanguage(e.target.value)}
                                    className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:border-[#58a6ff]"
                                >
                                    <option value="">All</option>
                                    {LANGUAGES_LIST.map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-[#8b949e]">Min stars:</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={minStars}
                                    onChange={(e) => setMinStars(e.target.value)}
                                    className="w-20 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:border-[#58a6ff]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-[#8b949e]">Sort:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                    className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:border-[#58a6ff]"
                                >
                                    <option value="stars">Stars</option>
                                    <option value="forks">Forks</option>
                                    <option value="updated">Recently Updated</option>
                                    <option value="name">Name</option>
                                </select>
                            </div>
                            {(filterLanguage || minStars || searchQuery) && (
                                <button
                                    onClick={() => { setFilterLanguage(""); setMinStars(""); setSearchQuery(""); setSearchResults([]); }}
                                    className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {searchError && (
                            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
                                {searchError}
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">
                                    Search Results <span className="text-[#8b949e] font-normal">({totalResults.toLocaleString()} found)</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                                {searchResults.map((repo) => (
                                    <RepoCard key={repo.id} repo={repo} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => searchRepos(currentPage - 1)}
                                        disabled={currentPage === 1 || searchLoading}
                                        className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => searchRepos(pageNum)}
                                                    disabled={searchLoading}
                                                    className={`w-10 h-10 rounded-lg transition-all ${currentPage === pageNum
                                                        ? "bg-[#58a6ff] text-white"
                                                        : "bg-[#21262d] hover:bg-[#30363d] text-[#8b949e]"
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => searchRepos(currentPage + 1)}
                                        disabled={currentPage === totalPages || searchLoading}
                                        className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <span className="ml-2 text-sm text-[#8b949e]">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Repos Section - Only show if authenticated and no search */}
                    {isAuthenticated && searchResults.length === 0 && (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Your Repositories ({processRepos(myRepos).length})</h2>
                                {processRepos(myRepos).length > myReposPerPage && (
                                    <span className="text-sm text-[#8b949e]">
                                        Page {myReposPage} of {Math.ceil(processRepos(myRepos).length / myReposPerPage)}
                                    </span>
                                )}
                            </div>

                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff]" />
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-center">
                                    {error}
                                    <button onClick={fetchMyRepos} className="ml-2 underline">Retry</button>
                                </div>
                            )}

                            {!loading && !error && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {processRepos(myRepos)
                                            .slice((myReposPage - 1) * myReposPerPage, myReposPage * myReposPerPage)
                                            .map((repo) => (
                                                <RepoCard key={repo.id} repo={repo} />
                                            ))}
                                    </div>

                                    {/* Pagination for My Repos */}
                                    {processRepos(myRepos).length > myReposPerPage && (
                                        <div className="flex items-center justify-center gap-2 mt-6">
                                            <button
                                                onClick={() => setMyReposPage((p) => Math.max(1, p - 1))}
                                                disabled={myReposPage === 1}
                                                className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {[...Array(Math.min(5, Math.ceil(processRepos(myRepos).length / myReposPerPage)))].map((_, i) => {
                                                    const totalMyPages = Math.ceil(processRepos(myRepos).length / myReposPerPage);
                                                    let pageNum;
                                                    if (totalMyPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (myReposPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (myReposPage >= totalMyPages - 2) {
                                                        pageNum = totalMyPages - 4 + i;
                                                    } else {
                                                        pageNum = myReposPage - 2 + i;
                                                    }
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setMyReposPage(pageNum)}
                                                            className={`w-10 h-10 rounded-lg transition-all ${myReposPage === pageNum
                                                                ? "bg-[#58a6ff] text-white"
                                                                : "bg-[#21262d] hover:bg-[#30363d] text-[#8b949e]"
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => setMyReposPage((p) => Math.min(Math.ceil(processRepos(myRepos).length / myReposPerPage), p + 1))}
                                                disabled={myReposPage === Math.ceil(processRepos(myRepos).length / myReposPerPage)}
                                                className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Not authenticated - show sign in card */}
                    {!isAuthenticated && searchResults.length === 0 && (
                        <SignInCard variant="repos" className="mt-6" />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
