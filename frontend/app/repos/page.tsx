"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SignInCard } from "@/components/SignInCard";
import { RepoCard } from "@/components/RepoCard";
import { Repository } from "@/types/github";


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

    const totalPages = Math.ceil(totalResults / resultsPerPage);

    return (
        <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
            {/* Floating Orbs - Warm tones */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-[#FF6D1F]/15 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-40 right-[15%] w-80 h-80 bg-[#F5E7C6]/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
            </div>

            <Navbar />

            <main className="flex-1 relative z-10">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold gradient-text-ember mb-2 font-['Gotham']">Repositories</h1>
                        <p className="text-[#A8A0B8] font-['Gotham']">Search and explore GitHub repositories</p>
                    </div>

                    {/* Search & Filters */}
                    <div className="mb-6 premium-card p-4 space-y-4">
                        {/* Search Bar */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search repositories... (e.g., react, machine learning)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && searchRepos(1)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#1E2345]/60 border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] placeholder:text-[#6B6580] focus:outline-none focus:border-[#FF6D1F]/50 focus:ring-1 focus:ring-[#FF6D1F]/30 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => searchRepos(1)}
                                disabled={searchLoading}
                                className="px-6 py-3 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6D1F]/20"
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
                                <label className="text-sm text-[#6B6580]">Language:</label>
                                <select
                                    value={filterLanguage}
                                    onChange={(e) => setFilterLanguage(e.target.value)}
                                    className="px-3 py-1.5 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] text-sm focus:outline-none focus:border-[#FF6D1F]/50"
                                >
                                    <option value="">All</option>
                                    {LANGUAGES_LIST.map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-[#6B6580]">Min stars:</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={minStars}
                                    onChange={(e) => setMinStars(e.target.value)}
                                    className="w-20 px-3 py-1.5 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] text-sm focus:outline-none focus:border-[#FF6D1F]/50"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-[#6B6580]">Sort:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                    className="px-3 py-1.5 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] text-sm focus:outline-none focus:border-[#FF6D1F]/50"
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
                                <h2 className="text-lg font-semibold text-[#F5E7C6]">
                                    Search Results <span className="text-[#6B6580] font-normal">({totalResults.toLocaleString()} found)</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                                {searchResults.map((repo) => (
                                    <RepoCard
                                        key={repo.id}
                                        repo={repo}
                                        copiedId={copiedId}
                                        onCopy={copyCloneCommand}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => searchRepos(currentPage - 1)}
                                        disabled={currentPage === 1 || searchLoading}
                                        className="px-3 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] rounded-lg transition-all border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/50"
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
                                                        ? "bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white"
                                                        : "bg-[#1E2345] hover:bg-[#171B38] text-[#6B6580] border border-[#F5E7C6]/10"
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
                                        className="px-3 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] rounded-lg transition-all border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <span className="ml-2 text-sm text-[#6B6580]">
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
                                <h2 className="text-lg font-semibold text-[#F5E7C6]">Your Repositories ({processRepos(myRepos).length})</h2>
                                {processRepos(myRepos).length > myReposPerPage && (
                                    <span className="text-sm text-[#6B6580]">
                                        Page {myReposPage} of {Math.ceil(processRepos(myRepos).length / myReposPerPage)}
                                    </span>
                                )}
                            </div>

                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6D1F]" />
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
                                                <RepoCard
                                                    key={repo.id}
                                                    repo={repo}
                                                    copiedId={copiedId}
                                                    onCopy={copyCloneCommand}
                                                />
                                            ))}
                                    </div>

                                    {/* Pagination for My Repos */}
                                    {processRepos(myRepos).length > myReposPerPage && (
                                        <div className="flex items-center justify-center gap-2 mt-6">
                                            <button
                                                onClick={() => setMyReposPage((p) => Math.max(1, p - 1))}
                                                disabled={myReposPage === 1}
                                                className="px-3 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] rounded-lg transition-all border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/50"
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
                                                                ? "bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white"
                                                                : "bg-[#1E2345] hover:bg-[#171B38] text-[#6B6580] border border-[#F5E7C6]/10"
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
                                                className="px-3 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-50 disabled:cursor-not-allowed text-[#F5E7C6] rounded-lg transition-all border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/50"
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
