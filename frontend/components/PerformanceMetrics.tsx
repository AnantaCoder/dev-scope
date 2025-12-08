"use client";

import React, { useState } from 'react';
import type { CacheStats } from '@/types';

interface PerformanceMetricsProps {
    stats: CacheStats;
    onClearCache: () => void;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ stats, onClearCache }) => {
    const [showMobileStats, setShowMobileStats] = useState(false);
    const [clearing, setClearing] = useState(false);

    const handleClearCache = async () => {
        setClearing(true);
        await onClearCache();
        setTimeout(() => setClearing(false), 1000);
    };

    return (
        <>
            {/* Desktop: Fixed right sidebar */}
            <div className="hidden lg:block fixed right-4 top-20 z-40">
                <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 w-40 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-[#8b949e] uppercase">Cache</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#238636]"></div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-[#8b949e]">Entries</span>
                            <span className="text-[#e6edf3]">{stats.size}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8b949e]">Hits</span>
                            <span className="text-[#238636]">{stats.hits}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8b949e]">Misses</span>
                            <span className="text-[#f85149]">{stats.misses}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8b949e]">Rate</span>
                            <span className="text-[#58a6ff]">{stats.hit_rate}%</span>
                        </div>
                    </div>
                    <button
                        onClick={handleClearCache}
                        disabled={clearing}
                        className={`mt-2 w-full py-1 text-[10px] border rounded transition-colors ${clearing ? 'bg-[#23863626] border-[#238636] text-[#238636]' : 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-[#8b949e] hover:text-[#f85149] hover:border-[#f85149]'}`}
                    >
                        {clearing ? '✓ Cleared' : 'Clear'}
                    </button>
                </div>
            </div>

            {/* Mobile: Bottom floating button */}
            <div className="lg:hidden fixed bottom-20 right-4 z-40">
                <button
                    onClick={() => setShowMobileStats(true)}
                    className="w-10 h-10 bg-[#161b22] border border-[#30363d] rounded-full flex items-center justify-center shadow-lg hover:border-[#58a6ff] transition-colors"
                >
                    <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </button>
            </div>

            {/* Mobile: Stats popup modal */}
            {showMobileStats && (
                <div className="lg:hidden fixed inset-0 z-50 flex items-end">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileStats(false)} />
                    <div className="relative w-full bg-[#161b22] border-t border-[#30363d] rounded-t-xl p-4">
                        <div className="w-10 h-1 bg-[#30363d] rounded-full mx-auto mb-3" />
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-[#e6edf3]">Cache Stats</h3>
                            <button onClick={() => setShowMobileStats(false)} className="p-1 hover:bg-[#21262d] rounded">
                                <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            <div className="text-center p-2 bg-[#0d1117] rounded">
                                <p className="text-lg font-semibold text-[#e6edf3]">{stats.size}</p>
                                <p className="text-[10px] text-[#8b949e]">Cached</p>
                            </div>
                            <div className="text-center p-2 bg-[#0d1117] rounded">
                                <p className="text-lg font-semibold text-[#58a6ff]">{stats.hit_rate}%</p>
                                <p className="text-[10px] text-[#8b949e]">Rate</p>
                            </div>
                            <div className="text-center p-2 bg-[#0d1117] rounded">
                                <p className="text-lg font-semibold text-[#238636]">{stats.hits}</p>
                                <p className="text-[10px] text-[#8b949e]">Hits</p>
                            </div>
                            <div className="text-center p-2 bg-[#0d1117] rounded">
                                <p className="text-lg font-semibold text-[#f85149]">{stats.misses}</p>
                                <p className="text-[10px] text-[#8b949e]">Miss</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { handleClearCache(); setShowMobileStats(false); }}
                            className="w-full py-2 text-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md transition-colors"
                        >
                            Clear Cache
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
