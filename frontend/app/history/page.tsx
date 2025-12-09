'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search/history`, {
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
        router.push(`/profile/${username}`);
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Search History</h1>
                    <p className="text-gray-300">Your recent GitHub profile searches</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {history.length === 0 && !error ? (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 text-center">
                        <p className="text-gray-400 text-lg">No search history yet</p>
                        <p className="text-gray-500 mt-2">Start searching for GitHub profiles to build your history</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer"
                                onClick={() => handleUsernameClick(item.searched_username)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {item.searched_username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">
                                                {item.searched_username}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {getSearchTypeLabel(item.search_type)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        {formatDate(item.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
