'use client';

import { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchSearchHistory();
        }
    }, [user, loading, router]);

    const fetchSearchHistory = async () => {
        try {
            setIsLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/search/history`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch search history');
            }

            const data = await response.json();
            if (!data.error) {
                setHistory(data.history || []);
            } else {
                setError(data.message || 'Failed to load search history');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
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
    };

    const getSearchTypeLabel = (type: string) => {
        switch (type) {
            case 'status':
                return 'Status';
            case 'extended':
                return 'Extended Info';
            default:
                return type;
        }
    };

    const handleUsernameClick = (username: string) => {
        router.push(`/?search=${username}`);
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#0d1117]">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff]"></div>
                        <p className="mt-4 text-[#8b949e]">Loading your search history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
            <Navbar />

            <main className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 w-full">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-[#238636]/10 border border-[#238636]/30 rounded-xl">
                            <svg className="w-8 h-8 text-[#238636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Search History</h1>
                            <p className="text-[#8b949e] mt-1">Your recent GitHub profile searches</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-[#da3633]/10 border border-[#da3633]/30 text-[#ff7b72] px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {history.length === 0 && !error ? (
                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#21262d] border border-[#30363d] mb-4">
                            <svg className="w-8 h-8 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-[#8b949e] text-lg mb-2">No search history yet</p>
                        <p className="text-[#6e7681] text-sm">Start searching for GitHub profiles to build your history</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 hover:border-[#58a6ff]/50 hover:bg-[#1c2128] transition-all cursor-pointer group"
                                onClick={() => handleUsernameClick(item.searched_username)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative shrink-0">
                                            <Image
                                                src={`https://github.com/${item.searched_username}.png`}
                                                alt={item.searched_username}
                                                width={48}
                                                height={48}
                                                className="rounded-full border-2 border-[#30363d] group-hover:border-[#58a6ff]/50 transition-all"
                                                unoptimized
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.searched_username}&background=238636&color=fff&size=48`;
                                                }}
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#238636] rounded-full border-2 border-[#161b22] flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[#e6edf3] font-semibold text-lg group-hover:text-[#58a6ff] transition-colors">
                                                {item.searched_username}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 text-xs font-mono bg-[#21262d] border border-[#30363d] rounded text-[#8b949e]">
                                                    {getSearchTypeLabel(item.search_type)}
                                                </span>
                                                <span className="text-[#6e7681] text-sm">
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-[#6e7681] group-hover:text-[#58a6ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
