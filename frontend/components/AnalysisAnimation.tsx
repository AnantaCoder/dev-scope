"use client";

import { useEffect, useState } from "react";

export function AnalysisAnimation() {
    const [metrics, setMetrics] = useState(Array(12).fill(0));

    // Simulate changing metrics
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => prev.map(() => Math.random() * 100));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-64 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6 group">
            {/* Grid Background */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Scanning Line */}
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan z-10"></div>

            {/* Analysis Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-green-500 uppercase tracking-widest">System Active</span>
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                        PRO_MODE_ENABLED
                    </div>
                </div>

                {/* Central Visualization */}
                <div className="flex items-end justify-center gap-1 h-32 px-10">
                    {metrics.map((val, i) => (
                        <div
                            key={i}
                            className="w-full bg-gradient-to-t from-blue-500/20 to-blue-500/60 rounded-t-sm transition-all duration-700 ease-in-out border-t border-blue-400/50"
                            style={{ height: `${20 + (val * 0.8)}%` }}
                        ></div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                            <span className="w-16">CPU_LOAD</span>
                            <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 animate-pulse" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                            <span className="w-16">MEMORY</span>
                            <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 animate-pulse" style={{ width: '62%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-blue-400 font-mono animate-pulse">Scanning User Data...</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">Packet ID: {Math.floor(Date.now() / 1000)}</p>
                    </div>
                </div>
            </div>

            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-500/50 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-blue-500/50 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-blue-500/50 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-500/50 rounded-br-lg"></div>

            {/* Custom Styles for Scan Animation */}
            <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
        </div>
    );
}
