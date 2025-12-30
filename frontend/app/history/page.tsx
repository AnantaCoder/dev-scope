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
    const [isClearing, setIsClearing] = useState(false);
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

    const clearSearchHistory = useCallback(async () => {
        if (!confirm('Are you sure you want to clear all your search history? This action cannot be undone.')) {
            return;
        }

        setIsClearing(true);
        setError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/search/history/clear`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to clear search history');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.message || 'Failed to clear search history');
            }

            // Clear local state
            setHistory([]);
            setTotalEntries(0);
            setTotalPages(1);
            setCurrentPage(1);
        } catch (err) {
            console.error('Clear history error:', err);
            setError(err instanceof Error ? err.message : 'Failed to clear search history');
        } finally {
            setIsClearing(false);
        }
    }, []);

    // Memoize loading component to prevent re-renders
    const loadingComponent = useMemo(() => (
        <div className="min-h-screen flex flex-col premium-bg">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    {/* Musical Bars Loader */}
                    <div className="flex items-end justify-center gap-1.5 h-12 mb-4">
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '20%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.1s_infinite]" style={{ height: '40%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.2s_infinite]" style={{ height: '60%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.3s_infinite]" style={{ height: '80%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.4s_infinite]" style={{ height: '100%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.5s_infinite]" style={{ height: '80%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.6s_infinite]" style={{ height: '60%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.7s_infinite]" style={{ height: '40%' }}></div>
                        <div className="w-1.5 bg-gradient-to-t from-[#FF6D1F] to-[#F5E7C6] rounded-full animate-[bounce_0.6s_ease-in-out_0.8s_infinite]" style={{ height: '20%' }}></div>
                    </div>
                    <p className="text-[#6B6580] text-sm">Loading your search history...</p>
                </div>
            </div>
        </div>
    ), []);

    if (loading || isLoading) {
        return loadingComponent;
    }

    return (
        <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
            {/* Floating Orbs - Warm tones */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-[#FF6D1F]/15 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-40 right-[15%] w-80 h-80 bg-[#F5E7C6]/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-20 left-[20%] w-72 h-72 bg-[#FF8A47]/12 rounded-full blur-[90px] animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <Navbar />

            <main className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 w-full relative z-10">
                {/* Page Header */}
                <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold tracking-tight gradient-text-ember font-['Gotham']">Search History</h1>
                        <p className="text-[#A8A0B8] mt-1 font-['Gotham']">Your recent GitHub profile searches</p>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={clearSearchHistory}
                            disabled={isClearing}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isClearing ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span>Clearing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Clear All</span>
                                </>
                            )}
                        </button>
                    )}
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5E7C6]/5 border border-[#F5E7C6]/10 mb-4">
                            <svg className="w-8 h-8 text-[#6B6580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-[#D4C9A8] text-lg mb-2 font-semibold">No search history yet</p>
                        <p className="text-[#6B6580] text-sm">Start searching for GitHub profiles to build your history</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="premium-card p-3 hover:scale-[1.01] hover:shadow-lg hover:shadow-[#FF6D1F]/10 transition-all cursor-pointer group"
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
                                                    className="rounded-full border-2 border-[#F5E7C6]/20 group-hover:border-[#FF6D1F]/50 group-hover:ring-2 group-hover:ring-[#FF6D1F]/20 transition-all shadow-lg"
                                                    unoptimized
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.searched_username}&background=238636&color=fff&size=48`;
                                                    }}
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#FF6D1F] to-[#CC5719] rounded-full border-2 border-[#090B1B] flex items-center justify-center shadow-lg">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[#F5E7C6] font-semibold text-base group-hover:text-[#FF6D1F] transition-all">
                                                    {item.searched_username}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 text-xs font-mono bg-[#F5E7C6]/5 border border-[#F5E7C6]/10 rounded text-[#A8A0B8] backdrop-blur-sm">
                                                        {getSearchTypeLabel(item.search_type)}
                                                    </span>
                                                    <span className="text-[#6B6580] text-sm">
                                                        {formatDate(item.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-[#6B6580] group-hover:text-[#FF6D1F] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination - Centered */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex flex-col items-center gap-4">
                                <p className="text-sm text-[#6B6580]">
                                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} searches
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-[#1E2345]/60 border border-[#F5E7C6]/10 rounded-lg text-sm font-medium text-[#F5E7C6] hover:bg-[#1E2345] hover:border-[#FF6D1F]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 text-sm text-[#A8A0B8] font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-[#1E2345]/60 border border-[#F5E7C6]/10 rounded-lg text-sm font-medium text-[#F5E7C6] hover:bg-[#1E2345] hover:border-[#FF6D1F]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
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
