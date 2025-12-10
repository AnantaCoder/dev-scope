"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import type { GitHubUser } from '@/types';

interface UserComparisonCardProps {
    users: GitHubUser[];
}

interface MetricData {
    label: string;
    key: keyof GitHubUser | 'experience';
    color: string;
    icon: React.ReactNode;
}

const calculateExperience = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365));
};

const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export const UserComparisonCard: React.FC<UserComparisonCardProps> = ({ users }) => {
    const metrics: MetricData[] = useMemo(() => [
        { label: 'Repos', key: 'public_repos', color: '#58a6ff', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
        { label: 'Followers', key: 'followers', color: '#a371f7', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { label: 'Following', key: 'following', color: '#238636', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
        { label: 'Gists', key: 'public_gists', color: '#d29922', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
        { label: 'Years', key: 'experience', color: '#f0883e', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    ], []);

    const getUserValue = (user: GitHubUser, key: keyof GitHubUser | 'experience'): number => {
        if (key === 'experience') return calculateExperience(user.created_at);
        const value = user[key];
        return typeof value === 'number' ? value : 0;
    };

    const rankings = useMemo(() => {
        const result: Record<string, { rank: number; isTop: boolean }[]> = {};
        metrics.forEach((metric) => {
            const values = users.map((u) => getUserValue(u, metric.key));
            const sorted = [...values].sort((a, b) => b - a);
            result[metric.key] = values.map((v) => ({
                rank: sorted.indexOf(v) + 1,
                isTop: v === sorted[0] && sorted[0] > 0,
            }));
        });
        return result;
    }, [users, metrics]);

    const overallScores = useMemo(() => {
        return users.map((_, idx) => {
            let score = 0;
            metrics.forEach((metric) => {
                const rank = rankings[metric.key][idx].rank;
                score += users.length - rank + 1;
            });
            return score;
        });
    }, [users, rankings, metrics]);

    const maxOverallScore = Math.max(...overallScores);

    return (
        <div className="space-y-6">
            {/* User Cards - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                {users.map((user, idx) => {
                    const isTopOverall = overallScores[idx] === maxOverallScore;
                    const winsCount = metrics.filter((m) => rankings[m.key][idx].isTop).length;
                    return (
                        <div
                            key={user.login}
                            className={`premium-card p-4 text-center relative group hover:scale-105 transition-all ${isTopOverall ? 'border-yellow-500/50 glow-orange ring-2 ring-yellow-500/20' : ''}`}
                        >
                            {isTopOverall && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full shadow-xl animate-pulse-glow">
                                        👑 Winner
                                    </span>
                                </div>
                            )}
                            <div className="relative inline-block mt-2">
                                <Image src={user.avatar_url} alt={user.login} width={64} height={64} className="rounded-full mx-auto ring-2 ring-white/20 shadow-xl group-hover:ring-white/40 transition-all" />
                                {isTopOverall && <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 animate-pulse" />}
                            </div>
                            <h3 className="mt-3 text-sm font-semibold text-white truncate">{user.name || user.login}</h3>
                            <p className="text-xs text-gray-400 truncate">@{user.login}</p>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-full">
                                <span className="text-sm font-bold text-yellow-400">{winsCount}</span>
                                <span className="text-[10px] text-gray-400 font-medium">wins</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Metrics Comparison - Mobile Friendly */}
            <div className="premium-card overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <h4 className="text-sm font-semibold gradient-text flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Metrics Battle
                    </h4>
                </div>
                <div className="p-4 sm:p-5 space-y-5">
                    {metrics.map((metric) => {
                        const values = users.map((u) => getUserValue(u, metric.key));
                        const maxValue = Math.max(...values, 1);
                        return (
                            <div key={metric.key} className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <span style={{ color: metric.color }}>{metric.icon}</span>
                                    <span className="text-gray-300 font-semibold">{metric.label}</span>
                                </div>
                                {/* Mobile: Stack vertically, Desktop: Grid */}
                                <div className="space-y-2.5 sm:space-y-0 sm:grid sm:gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(users.length, 5)}, minmax(0, 1fr))` }}>
                                    {users.map((user, idx) => {
                                        const value = values[idx];
                                        const percentage = (value / maxValue) * 100;
                                        const { isTop } = rankings[metric.key][idx];
                                        const displayValue = metric.key === 'experience' ? `${value}y` : formatNumber(value);
                                        return (
                                            <div key={user.login} className="flex sm:flex-col items-center gap-2 sm:gap-1.5 group">
                                                <Image src={user.avatar_url} alt={user.login} width={28} height={28} className="rounded-full sm:hidden shrink-0 ring-1 ring-white/20" />
                                                <div className="flex-1 sm:w-full">
                                                    <div className="flex items-center justify-between sm:justify-center gap-2 mb-1.5">
                                                        <span className="text-xs text-gray-400 sm:hidden truncate max-w-[80px] font-medium">{user.login}</span>
                                                        <span className={`text-sm font-bold ${isTop ? 'text-white' : 'text-gray-400'}`}>{displayValue}</span>
                                                        {isTop && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shrink-0 shadow-lg">#1</span>}
                                                    </div>
                                                    <div className="h-2.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                                        <div className={`h-full rounded-full transition-all duration-700 ${isTop ? 'shadow-lg' : ''}`} style={{ width: `${percentage}%`, backgroundColor: metric.color, opacity: isTop ? 1 : 0.6, boxShadow: isTop ? `0 0 10px ${metric.color}` : 'none' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Overall Leaderboard */}
            <div className="premium-card overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-white/5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <span className="gradient-text-premium">Leaderboard</span>
                    </h4>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                    {users
                        .map((user, idx) => ({ user, score: overallScores[idx], idx }))
                        .sort((a, b) => b.score - a.score)
                        .map(({ user, score }, position) => {
                            const percentage = (score / (metrics.length * users.length)) * 100;
                            const isTop = score === maxOverallScore;
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div key={user.login} className={`flex items-center gap-3 sm:gap-4 p-4 rounded-xl backdrop-blur-sm transition-all hover:scale-[1.02] ${isTop ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 glow-orange' : 'bg-white/5 border border-white/10'}`}>
                                    <span className="text-2xl w-8 text-center shrink-0">{medals[position] || `#${position + 1}`}</span>
                                    <Image src={user.avatar_url} alt={user.login} width={40} height={40} className="rounded-full ring-2 ring-white/20 shrink-0 shadow-lg" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span className="text-sm font-semibold text-white truncate">{user.name || user.login}</span>
                                            <span className={`text-sm font-bold ${isTop ? 'text-yellow-400' : 'text-gray-400'}`}>{score} pts</span>
                                        </div>
                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                            <div className={`h-full rounded-full transition-all duration-700 ${isTop ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} style={{ width: `${percentage}%`, boxShadow: isTop ? '0 0 15px rgba(234, 179, 8, 0.5)' : 'none' }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Quick Stats Grid - Mobile Friendly */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                {users.map((user, idx) => {
                    const winsCount = metrics.filter((m) => rankings[m.key][idx].isTop).length;
                    const followerRatio = user.following > 0 ? (user.followers / user.following).toFixed(1) : user.followers.toString();
                    return (
                        <div key={user.login} className="premium-card p-3 sm:p-4 hover:scale-105 transition-all group">
                            <div className="flex items-center gap-2 mb-3">
                                <Image src={user.avatar_url} alt={user.login} width={24} height={24} className="rounded-full ring-1 ring-white/20 group-hover:ring-white/40 transition-all" />
                                <span className="text-xs text-gray-300 truncate font-medium">{user.login}</span>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Wins</span>
                                    <span className="text-yellow-400 font-bold">{winsCount}/{metrics.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Ratio</span>
                                    <span className="text-white font-semibold">{followerRatio}x</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Since</span>
                                    <span className="text-white font-semibold">{new Date(user.created_at).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
