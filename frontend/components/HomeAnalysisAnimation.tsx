"use client";

import { useEffect, useState, useCallback } from "react";

// Terminal output simulation
const TERMINAL_COMMANDS = [
    "$ git log --oneline | head -5",
    "a3f2c1d feat: implement OAuth flow",
    "b7e4f9a fix: resolve memory leak",
    "c8d5e2b refactor: optimize queries",
    "$ npm run analyze",
    "> Scanning repositories...",
    "> Found 47 public repos",
    "$ gh api user/repos --jq '.[].language'",
    "TypeScript",
    "Python",
    "Go",
    "$ wc -l **/*.ts | tail -1",
    "  24,847 total",
    "$ docker stats --no-stream",
    "CPU: 12.4% | MEM: 256MB",
];

export function HomeAnalysisAnimation() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [chartData, setChartData] = useState(Array(12).fill(30));
    const [progress, setProgress] = useState(0);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [codeMetrics, setCodeMetrics] = useState({ commits: 0, lines: 0, files: 0 });
    const [binaryStream, setBinaryStream] = useState<string[]>([]);

    // Add terminal line
    const addTerminalLine = useCallback(() => {
        setTerminalLines(prev => {
            const newLine = TERMINAL_COMMANDS[Math.floor(Math.random() * TERMINAL_COMMANDS.length)];
            const updated = [...prev, newLine];
            return updated.slice(-6);
        });
    }, []);

    // Cycle through analysis stages
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Animate chart bars
    useEffect(() => {
        const interval = setInterval(() => {
            setChartData((prev) => prev.map(() => 15 + Math.random() * 70));
        }, 600);
        return () => clearInterval(interval);
    }, []);

    // Progress + metrics animation
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 1.5));
            setCodeMetrics({
                commits: Math.floor(Math.random() * 500) + 100,
                lines: Math.floor(Math.random() * 50000) + 10000,
                files: Math.floor(Math.random() * 200) + 50,
            });
        }, 80);
        return () => clearInterval(interval);
    }, []);

    // Terminal updates
    useEffect(() => {
        const interval = setInterval(addTerminalLine, 1200);
        return () => clearInterval(interval);
    }, [addTerminalLine]);

    // Simple binary stream - just 01s
    useEffect(() => {
        const generateBinaryRow = () => {
            let row = "";
            for (let i = 0; i < 50; i++) {
                row += Math.random() > 0.5 ? "1" : "0";
            }
            return row;
        };

        const interval = setInterval(() => {
            setBinaryStream(prev => {
                const newRows = [...prev, generateBinaryRow()];
                return newRows.slice(-8);
            });
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const stages = [
        { icon: "git", label: "Fetching Commits", color: "text-orange-400", code: "git fetch --all" },
        { icon: "chart", label: "Analyzing Stats", color: "text-blue-400", code: "npm run metrics" },
        { icon: "code", label: "Parsing Languages", color: "text-green-400", code: "tokei ./src" },
        { icon: "ai", label: "AI Processing", color: "text-purple-400", code: "nvidia-smi" },
    ];

    return (
        <div className="relative w-full bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] rounded-2xl border border-white/10 overflow-hidden">
            {/* Subtle Grid Background */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                }}
            />

            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono ml-2">devscope-analyzer — zsh</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        LIVE
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row">
                {/* Left Panel: Terminal Output */}
                <div className="flex-1 p-4 border-r border-white/5">
                    <div className="bg-black/60 rounded-lg p-3 h-40 overflow-hidden font-mono text-[11px]">
                        <div className="space-y-1">
                            {terminalLines.map((line, i) => (
                                <div
                                    key={i}
                                    className={`${line.startsWith("$")
                                        ? "text-green-400"
                                        : line.startsWith(">")
                                            ? "text-cyan-400"
                                            : "text-gray-400"
                                        } animate-fade-in`}
                                >
                                    {line}
                                </div>
                            ))}
                            <div className="text-green-400 animate-pulse">$ █</div>
                        </div>
                    </div>

                    {/* Stage Indicators */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {stages.map((stage, i) => (
                            <div
                                key={stage.label}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-300 ${activeIndex === i
                                    ? "bg-white/5 border-white/20 scale-[1.02]"
                                    : "border-transparent opacity-50"
                                    }`}
                            >
                                <div className={`w-4 h-4 ${stage.color}`}>
                                    {stage.icon === "git" && (
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M21.62 11.108l-8.731-8.729a1.292 1.292 0 0 0-1.823 0L9.257 4.19l2.299 2.3a1.532 1.532 0 0 1 1.939 1.95l2.214 2.217a1.53 1.53 0 0 1 1.583 2.531 1.534 1.534 0 0 1-2.12-.007 1.536 1.536 0 0 1-.336-1.678l-2.066-2.066v5.435a1.534 1.534 0 1 1-1.26-.04V9.265a1.534 1.534 0 0 1-.832-2.012L8.39 4.967l-6.011 6.01a1.292 1.292 0 0 0 0 1.823l8.731 8.729a1.292 1.292 0 0 0 1.823 0l8.686-8.689a1.292 1.292 0 0 0 0-1.823" />
                                        </svg>
                                    )}
                                    {stage.icon === "chart" && (
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    )}
                                    {stage.icon === "code" && (
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                    )}
                                    {stage.icon === "ai" && (
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-white truncate">{stage.label}</p>
                                    <p className="text-[9px] text-gray-500 font-mono truncate">{stage.code}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Panel: Chart + Binary Stream - Hidden on mobile */}
                <div className="hidden lg:flex flex-1 p-4 flex-col">
                    <div className="text-[10px] text-gray-500 font-mono mb-2 flex items-center justify-between">
                        <span>CONTRIBUTION_GRAPH</span>
                        <span className="text-blue-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="flex-1 flex items-end gap-0.5 min-h-[100px]">
                        {chartData.map((height, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-t transition-all duration-300 ease-out"
                                style={{
                                    height: `${height}%`,
                                    background: `linear-gradient(to top, rgba(59,130,246,0.6), rgba(147,51,234,0.4))`,
                                    boxShadow: height > 50 ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                                }}
                            />
                        ))}
                    </div>

                    {/* Metrics Row */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="bg-black/60 rounded-lg p-2 text-center border border-white/5">
                            <p className="text-lg font-bold text-orange-400 font-mono">{codeMetrics.commits}</p>
                            <p className="text-[9px] text-gray-500">COMMITS</p>
                        </div>
                        <div className="bg-black/60 rounded-lg p-2 text-center border border-white/5">
                            <p className="text-lg font-bold text-blue-400 font-mono">{codeMetrics.lines.toLocaleString()}</p>
                            <p className="text-[9px] text-gray-500">LINES</p>
                        </div>
                        <div className="bg-black/60 rounded-lg p-2 text-center border border-white/5">
                            <p className="text-lg font-bold text-green-400 font-mono">{codeMetrics.files}</p>
                            <p className="text-[9px] text-gray-500">FILES</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Binary Stream + Chatbot Features */}
                <div className="flex-1 p-4 border-l border-white/5">
                    {/* Binary Data Stream */}
                    <div className="bg-black/60 rounded-lg p-3 border border-green-500/20 mb-3 overflow-hidden">
                        <div className="text-[10px] text-green-400 font-mono mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            DATA_STREAM
                        </div>
                        <div className="font-mono text-[10px] sm:text-[11px] md:text-xs leading-relaxed text-green-500 h-24 sm:h-28 overflow-hidden">
                            {binaryStream.map((row, i) => (
                                <div key={i} className="whitespace-nowrap tracking-wider animate-fade-in">
                                    {row}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Chatbot Features */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-3 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <span className="text-[11px] font-semibold text-white">Dev AI Chatbot</span>
                        </div>
                        <div className="space-y-1.5 text-[9px]">
                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-indigo-400">@user</span>
                                <span className="text-gray-600">→</span>
                                <span>GitHub profile insights</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-purple-400">@repo</span>
                                <span className="text-gray-600">→</span>
                                <span>Repository analysis</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-green-400">&lt;/&gt;</span>
                                <span className="text-gray-600">→</span>
                                <span>Code review & suggestions</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-amber-400">↓</span>
                                <span className="text-gray-600">→</span>
                                <span>Export conversations</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40">
                <div className="flex items-center gap-4 text-[10px] font-mono">
                    <span className="text-gray-400">
                        <span className="text-blue-400">main</span> ⟨git⟩
                    </span>
                    <span className="text-gray-500">|</span>
                    <span className="text-green-400">✓ 0 errors</span>
                    <span className="text-yellow-400">⚠ 2 warnings</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
                    <span>UTF-8</span>
                    <span>LF</span>
                    <span>Analyzing...</span>
                </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-500/20 rounded-tl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-500/20 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-500/20 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-500/20 rounded-br" />

            <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
