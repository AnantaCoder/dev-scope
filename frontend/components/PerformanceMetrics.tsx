import React from 'react';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import type { CacheStats } from '@/types';

interface PerformanceMetricsProps {
    stats: CacheStats;
    onClearCache: () => void;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ stats, onClearCache }) => {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-300">Performance Metrics</h2>
                <button
                    onClick={onClearCache}
                    className="px-4 py-2 text-sm bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-600 rounded-lg transition-all duration-300 font-medium"
                >
                    🗑️ Clear Cache
                </button>
            </div>
            <BackgroundGradient className="rounded-[22px] p-1 bg-gray-950">
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-[20px] p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="group hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                                    <span className="text-blue-400 text-lg">💾</span>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.size}</p>
                            <p className="text-xs text-gray-500 mt-1">Cached entries</p>
                        </div>
                        <div className="group hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-all">
                                    <span className="text-green-400 text-lg">✅</span>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.hits}</p>
                            <p className="text-xs text-gray-500 mt-1">Cache hits</p>
                        </div>
                        <div className="group hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                                    <span className="text-red-400 text-lg">❌</span>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.misses}</p>
                            <p className="text-xs text-gray-500 mt-1">Cache misses</p>
                        </div>
                        <div className="group hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                                    <span className="text-purple-400 text-lg">%</span>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.hit_rate}%</p>
                            <p className="text-xs text-gray-500 mt-1">Success rate</p>
                        </div>
                    </div>
                </div>
            </BackgroundGradient>
        </div>
    );
};
