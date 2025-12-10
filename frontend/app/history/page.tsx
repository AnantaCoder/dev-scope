'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Image from 'next/image';

interface SearchHistoryItem {
    id: number;
    user_id: number;
    searched_username: string;
    search_type: string;
    created_at: string;
}

export default function SearchHistoryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const pageSize = 50;
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchSearchHistory = useCallback(async () => {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            setIsLoading(true);
            setError(null); // Clear any previous errors
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/search/history?page=${currentPage}&limit=${pageSize}`, {
                credentials: 'include',
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch search history');
            }

            const data = await response.json();
            if (!data.error) {
                // Filter out the authenticated user's own profile
                const filteredHistory = (data.history || []).filter(
                    (item: SearchHistoryItem) => item.searched_username.toLowerCase() !== user?.username?.toLowerCase()
                );
                setHistory(filteredHistory);
                setTotalPages(data.total_pages || 1);
                setTotalEntries(data.total_entries || 0);
                setError(null); // Clear error on success
            } else {
                setError(data.message || 'Failed to load search history');
                setHistory([]); // Clear history on error
            }
        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            console.error('Search history fetch error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setHistory([]); // Clear history on error
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [currentPage, pageSize, user?.username]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchSearchHistory();
        }

        // Cleanup function to abort pending requests
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [user, loading, router, fetchSearchHistory]);

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }, []);

    const getSearchTypeLabel = useCallback((type: string) => {
        switch (type) {
            case 'status':
                return 'Status';
            case 'extended':
                return 'Extended Info';
            case 'compare':
                return 'Compare';
            default:
                return type;
        }
    }, []);

    const handleUsernameClick = useCallback((username: string) => {
        router.push(`/profile/${username}`);
    }, [router]);

    // Memoize loading component to prevent re-renders
    const loadingComponent = useMemo(() => (
        <div className="min-h-screen flex flex-col premium-bg">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    {/* Musical Bars Loader */}
                    <div className="flex items-end justify-center gap-1.5 h-12 mb-4">
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '20%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.1s_infinite]" style={{ height: '40%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.2s_infinite]" style={{ height: '60%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.3s_infinite]" style={{ height: '80%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.4s_infinite]" style={{ height: '100%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.5s_infinite]" style={{ height: '80%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.6s_infinite]" style={{ height: '60%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.7s_infinite]" style={{ height: '40%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.8s_infinite]" style={{ height: '20%' }}></div>
                    </div>
                    <p className="text-gray-400 text-sm">Loading your search history...</p>
                </div>
            </div>
        </div>
    ), []);

    if (loading || isLoading) {
        return loadingComponent;
    }

    return (
        <div className="min-h-screen flex flex-col premium-bg text-white">
            {/* Floating Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-40 right-[15%] w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-20 left-[20%] w-72 h-72 bg-cyan-500/20 rounded-full blur-[90px] animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <Navbar />

            <main className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 w-full relative z-10">
                {/* Page Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight gradient-text">Search History</h1>
                    <p className="text-gray-400 mt-1">Your recent GitHub profile searches</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 backdrop-blur-sm animate-pulse-glow">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {history.length === 0 && !error ? (
                    <div className="premium-card p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-300 text-lg mb-2 font-semibold">No search history yet</p>
                        <p className="text-gray-500 text-sm">Start searching for GitHub profiles to build your history</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="premium-card p-3 hover:scale-[1.01] hover:glow-blue transition-all cursor-pointer group"
                                    onClick={() => handleUsernameClick(item.searched_username)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <Image
                                                    src={`https://github.com/${item.searched_username}.png`}
                                                    alt={item.searched_username}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full border-2 border-white/20 group-hover:border-blue-500/50 group-hover:ring-2 group-hover:ring-blue-500/20 transition-all shadow-lg"
                                                    unoptimized
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.searched_username}&background=238636&color=fff&size=48`;
                                                    }}
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold text-base group-hover:gradient-text transition-all">
                                                    {item.searched_username}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 text-xs font-mono bg-white/5 border border-white/10 rounded text-gray-400 backdrop-blur-sm">
                                                        {getSearchTypeLabel(item.search_type)}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">
                                                        {formatDate(item.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination - Centered */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex flex-col items-center gap-4">
                                <p className="text-sm text-gray-400">
                                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} searches
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/10 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 text-sm text-gray-300 font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/10 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
