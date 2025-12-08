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
    const metrics: MetricData[] = [
        { label: 'Repos', key: 'public_repos', color: '#58a6ff', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
        { label: 'Followers', key: 'followers', color: '#a371f7', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { label: 'Following', key: 'following', color: '#238636', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
        { label: 'Gists', key: 'public_gists', color: '#d29922', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
        { label: 'Years', key: 'experience', color: '#f0883e', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    ];

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
    }, [users]);

    const overallScores = useMemo(() => {
        return users.map((_, idx) => {
            let score = 0;
            metrics.forEach((metric) => {
                const rank = rankings[metric.key][idx].rank;
                score += users.length - rank + 1;
            });
            return score;
        });
    }, [users, rankings]);

    const maxOverallScore = Math.max(...overallScores);

    return (
        <div className="space-y-4">
            {/* User Cards - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {users.map((user, idx) => {
                    const isTopOverall = overallScores[idx] === maxOverallScore;
                    const winsCount = metrics.filter((m) => rankings[m.key][idx].isTop).length;
                    return (
                        <div
                            key={user.login}
                            className={`bg-[#161b22] border rounded-xl p-3 sm:p-4 text-center relative ${isTopOverall ? 'border-[#d29922] ring-1 ring-[#d29922]/20' : 'border-[#30363d]'}`}
                        >
                            {isTopOverall && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-[#d29922] text-black rounded-full shadow-lg">
                                        👑 Winner
                                    </span>
                                </div>
                            )}
                            <Image src={user.avatar_url} alt={user.login} width={56} height={56} className="rounded-full mx-auto ring-2 ring-[#30363d] mt-1" />
                            <h3 className="mt-2 text-sm font-semibold text-[#e6edf3] truncate">{user.name || user.login}</h3>
                            <p className="text-xs text-[#8b949e] truncate">@{user.login}</p>
                            <div className="mt-2 flex items-center justify-center gap-1">
                                <span className="text-xs font-medium text-[#d29922]">{winsCount}</span>
                                <span className="text-[10px] text-[#8b949e]">wins</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Metrics Comparison - Mobile Friendly */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#30363d] bg-gradient-to-r from-[#58a6ff]/5 to-transparent">
                    <h4 className="text-sm font-semibold text-[#e6edf3] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Metrics Battle
                    </h4>
                </div>
                <div className="p-4 space-y-4">
                    {metrics.map((metric) => {
                        const values = users.map((u) => getUserValue(u, metric.key));
                        const maxValue = Math.max(...values, 1);
                        return (
                            <div key={metric.key} className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span style={{ color: metric.color }}>{metric.icon}</span>
                                    <span className="text-[#8b949e] font-medium">{metric.label}</span>
                                </div>
                                {/* Mobile: Stack vertically, Desktop: Grid */}
                                <div className="space-y-2 sm:space-y-0 sm:grid sm:gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(users.length, 5)}, minmax(0, 1fr))` }}>
                                    {users.map((user, idx) => {
                                        const value = values[idx];
                                        const percentage = (value / maxValue) * 100;
                                        const { isTop } = rankings[metric.key][idx];
                                        const displayValue = metric.key === 'experience' ? `${value}y` : formatNumber(value);
                                        return (
                                            <div key={user.login} className="flex sm:flex-col items-center gap-2 sm:gap-1">
                                                <Image src={user.avatar_url} alt={user.login} width={24} height={24} className="rounded-full sm:hidden shrink-0" />
                                                <div className="flex-1 sm:w-full">
                                                    <div className="flex items-center justify-between sm:justify-center gap-2 mb-1">
                                                        <span className="text-xs text-[#8b949e] sm:hidden truncate max-w-[80px]">{user.login}</span>
                                                        <span className={`text-sm font-semibold ${isTop ? 'text-[#e6edf3]' : 'text-[#8b949e]'}`}>{displayValue}</span>
                                                        {isTop && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#238636] text-white shrink-0">#1</span>}
                                                    </div>
                                                    <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: metric.color, opacity: isTop ? 1 : 0.5 }}></div>
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
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#30363d] bg-gradient-to-r from-[#d29922]/5 to-transparent">
                    <h4 className="text-sm font-semibold text-[#e6edf3] flex items-center gap-2">
                        <span>🏆</span>
                        Leaderboard
                    </h4>
                </div>
                <div className="p-4 space-y-2">
                    {users
                        .map((user, idx) => ({ user, score: overallScores[idx], idx }))
                        .sort((a, b) => b.score - a.score)
                        .map(({ user, score, idx }, position) => {
                            const percentage = (score / (metrics.length * users.length)) * 100;
                            const isTop = score === maxOverallScore;
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div key={user.login} className={`flex items-center gap-3 p-3 rounded-lg ${isTop ? 'bg-[#d29922]/10 border border-[#d29922]/30' : 'bg-[#0d1117]'}`}>
                                    <span className="text-lg w-6 text-center">{medals[position] || `#${position + 1}`}</span>
                                    <Image src={user.avatar_url} alt={user.login} width={36} height={36} className="rounded-full ring-1 ring-[#30363d] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-[#e6edf3] truncate">{user.name || user.login}</span>
                                            <span className={`text-sm font-bold ${isTop ? 'text-[#d29922]' : 'text-[#8b949e]'}`}>{score} pts</span>
                                        </div>
                                        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden mt-1">
                                            <div className={`h-full rounded-full transition-all duration-700 ${isTop ? 'bg-gradient-to-r from-[#d29922] to-[#f0883e]' : 'bg-[#58a6ff]'}`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Quick Stats Grid - Mobile Friendly */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {users.map((user, idx) => {
                    const winsCount = metrics.filter((m) => rankings[m.key][idx].isTop).length;
                    const followerRatio = user.following > 0 ? (user.followers / user.following).toFixed(1) : user.followers.toString();
                    return (
                        <div key={user.login} className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Image src={user.avatar_url} alt={user.login} width={20} height={20} className="rounded-full" />
                                <span className="text-xs text-[#8b949e] truncate">{user.login}</span>
                            </div>
                            <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between">
                                    <span className="text-[#8b949e]">Wins</span>
                                    <span className="text-[#d29922] font-medium">{winsCount}/{metrics.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#8b949e]">Ratio</span>
                                    <span className="text-[#e6edf3]">{followerRatio}x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#8b949e]">Since</span>
                                    <span className="text-[#e6edf3]">{new Date(user.created_at).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
