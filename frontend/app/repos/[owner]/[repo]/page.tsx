"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Image from "next/image";
import { api } from "@/lib/api";

interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    clone_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    open_issues_count: number;
    private: boolean;
    updated_at: string;
    created_at: string;
    topics?: string[];
    size: number;
    default_branch: string;
    license?: { name: string } | null;
    owner: { login: string; avatar_url: string; html_url: string };
}

interface Commit {
    sha: string;
    commit: { message: string; author: { name: string; date: string } };
    author: { login: string; avatar_url: string } | null;
    html_url: string;
}

interface Issue {
    id: number;
    number: number;
    title: string;
    state: string;
    html_url: string;
    created_at: string;
    labels: Array<{ name: string; color: string }>;
    user: { login: string; avatar_url: string };
}

interface Language {
    name: string;
    percentage: number;
    color: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Go: "#00ADD8",
    Rust: "#dea584", Java: "#b07219", "C++": "#f34b7d", C: "#555555", Ruby: "#701516",
    PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26",
    CSS: "#563d7c", Shell: "#89e051", Vue: "#41b883", SCSS: "#c6538c",
};

export default function RepoDetailPage() {
    const params = useParams();
    const owner = params.owner as string;
    const repo = params.repo as string;

    const [repoData, setRepoData] = useState<Repository | null>(null);
    const [commits, setCommits] = useState<Commit[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedClone, setCopiedClone] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string>("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiCooldown, setAiCooldown] = useState(0);
    const [activeTab, setActiveTab] = useState<"commits" | "issues">("commits");
    const [page, setPage] = useState(1);

    // Rate limit cooldown timer
    useEffect(() => {
        if (aiCooldown > 0) {
            const timer = setTimeout(() => setAiCooldown(aiCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [aiCooldown]);

    const fetchRepoData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [repoRes, commitsRes, issuesRes, langsRes] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { Accept: "application/vnd.github.v3+json" } }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, { headers: { Accept: "application/vnd.github.v3+json" } }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=30`, { headers: { Accept: "application/vnd.github.v3+json" } }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers: { Accept: "application/vnd.github.v3+json" } }),
            ]);

            if (!repoRes.ok) throw new Error("Repository not found");
            setRepoData(await repoRes.json());
            if (commitsRes.ok) setCommits(await commitsRes.json());
            if (issuesRes.ok) setIssues(await issuesRes.json());

            if (langsRes.ok) {
                const langsJson = await langsRes.json();
                const total = Object.values(langsJson).reduce((a: number, b) => a + (b as number), 0);
                setLanguages(Object.entries(langsJson).map(([name, bytes]) => ({
                    name,
                    percentage: Math.round(((bytes as number) / total) * 1000) / 10,
                    color: LANGUAGE_COLORS[name] || "#8b949e",
                })).sort((a, b) => b.percentage - a.percentage));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load repository");
        } finally {
            setLoading(false);
        }
    }, [owner, repo]);

    useEffect(() => {
        if (owner && repo) fetchRepoData();
    }, [owner, repo, fetchRepoData]);

    const copyCloneCommand = () => {
        if (repoData) {
            navigator.clipboard.writeText(`git clone ${repoData.clone_url}`);
            setCopiedClone(true);
            setTimeout(() => setCopiedClone(false), 2000);
        }
    };

    const getAIAnalysis = async () => {
        if (!repoData || aiCooldown > 0) return;
        setAiLoading(true);
        setAiAnalysis("");
        try {
            const result = await api.getAIComparison([{
                login: repoData.owner.login, name: repoData.name, avatar_url: repoData.owner.avatar_url,
                bio: repoData.description || "", public_repos: 1, followers: repoData.stargazers_count,
                following: repoData.forks_count, html_url: repoData.html_url,
                repos_url: "", starred_url: "", subscriptions_url: "", organizations_url: "",
                events_url: "", received_events_url: "", created_at: repoData.created_at,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }] as any);
            setAiAnalysis(result.comparison || `Analysis complete for ${repoData.full_name}`);
        } catch {
            setAiAnalysis(`**${repoData.name}** is a ${repoData.language || "code"} repository with ${repoData.stargazers_count} stars and ${repoData.forks_count} forks.\n\n${repoData.description || ""}`);
        } finally {
            setAiLoading(false);
            setAiCooldown(30); // 30 second cooldown
        }
    };

    const formatTime = (dateString: string) => {
        const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
        if (diffDays < 1) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    const formatSize = (kb: number) => kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;

    const itemsPerPage = 6;
    const currentItems = activeTab === "commits" ? commits : issues;
    const paginatedItems = currentItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(currentItems.length / itemsPerPage);

    // Reset page when switching tabs
    useEffect(() => { setPage(1); }, [activeTab]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-white">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
                        <p className="text-[#8b949e]">Loading repository...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !repoData) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-white">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center premium-card p-8 max-w-md">
                        <div className="w-14 h-14 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Repository Not Found</h2>
                        <p className="text-[#8b949e] mb-4">{error}</p>
                        <a href="/repos" className="inline-flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg transition-all">
                            ← Back to Repos
                        </a>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col premium-bg text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[100px]" />
            </div>

            <Navbar />

            <main className="flex-1 relative z-10">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-6">
                        <a href="/repos" className="text-[#8b949e] hover:text-white transition-colors">Repos</a>
                        <span className="text-[#30363d]">/</span>
                        <span className="text-[#8b949e]">{owner}</span>
                        <span className="text-[#30363d]">/</span>
                        <span className="text-white font-medium">{repo}</span>
                    </nav>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT COLUMN - Repository Info */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Header Card */}
                            <div className="premium-card p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <Image src={repoData.owner.avatar_url} alt={owner} width={44} height={44} className="rounded-xl" />
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg font-bold text-white truncate">{repoData.name}</h1>
                                        <p className="text-sm text-[#8b949e]">{owner}</p>
                                    </div>
                                    {repoData.private && (
                                        <span className="px-2 py-1 text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md">Private</span>
                                    )}
                                </div>

                                {repoData.description && (
                                    <p className="text-sm text-[#8b949e] mb-4 leading-relaxed">{repoData.description}</p>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {[
                                        { value: repoData.stargazers_count, label: "Stars", color: "text-yellow-400" },
                                        { value: repoData.forks_count, label: "Forks", color: "text-blue-400" },
                                        { value: repoData.open_issues_count, label: "Issues", color: "text-green-400" },
                                        { value: formatSize(repoData.size), label: "Size", color: "text-purple-400" },
                                    ].map((stat) => (
                                        <div key={stat.label} className="text-center p-2 bg-[#0d1117] rounded-lg">
                                            <p className={`text-lg font-bold ${stat.color}`}>{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
                                            <p className="text-[10px] text-[#6e7681]">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Topics */}
                                {repoData.topics && repoData.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {repoData.topics.slice(0, 5).map((topic) => (
                                            <span key={topic} className="text-[10px] px-2 py-0.5 bg-[#388bfd]/10 text-[#58a6ff] rounded-full">{topic}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="text-xs text-[#6e7681] space-y-1 pt-3 border-t border-[#21262d]">
                                    <p>📅 Updated {formatTime(repoData.updated_at)}</p>
                                    {repoData.license && <p>📄 {repoData.license.name}</p>}
                                    <p>🌿 {repoData.default_branch}</p>
                                </div>
                            </div>

                            {/* Languages */}
                            {languages.length > 0 && (
                                <div className="premium-card p-4">
                                    <h3 className="text-sm font-semibold text-white mb-3">Languages</h3>
                                    <div className="h-2 rounded-full overflow-hidden flex mb-3">
                                        {languages.map((l) => (
                                            <div key={l.name} style={{ width: `${l.percentage}%`, backgroundColor: l.color }} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {languages.slice(0, 4).map((l) => (
                                            <div key={l.name} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                                                    <span className="text-white">{l.name}</span>
                                                </div>
                                                <span className="text-[#6e7681]">{l.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <a
                                    href={repoData.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                    View on GitHub
                                </a>

                                {!repoData.private && (
                                    <button
                                        onClick={copyCloneCommand}
                                        className={`flex items-center justify-center gap-2 w-full py-3 font-semibold rounded-xl border transition-all ${copiedClone ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d]"
                                            }`}
                                    >
                                        {copiedClone ? (
                                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                                        ) : (
                                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Clone Repository</>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={getAIAnalysis}
                                    disabled={aiLoading || aiCooldown > 0}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                                >
                                    {aiLoading ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing...</>
                                    ) : aiCooldown > 0 ? (
                                        <>⏱️ Wait {aiCooldown}s</>
                                    ) : (
                                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>AI Analysis</>
                                    )}
                                </button>
                            </div>

                            {/* AI Analysis Result */}
                            {aiAnalysis && (
                                <div className="premium-card p-4 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                                    <h4 className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">AI Insights</h4>
                                    <p className="text-sm text-[#c9d1d9] whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN - Commits/Issues */}
                        <div className="lg:col-span-2">
                            <div className="premium-card overflow-hidden">
                                {/* Tab Header - At Top */}
                                <div className="flex items-center justify-between p-4 border-b border-[#21262d] bg-[#0d1117]">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab("commits")}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "commits"
                                                ? "bg-[#238636] text-white"
                                                : "bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]"
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Commits
                                            <span className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded">{commits.length}</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("issues")}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "issues"
                                                ? "bg-[#238636] text-white"
                                                : "bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]"
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Issues
                                            <span className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded">{issues.length}</span>
                                        </button>
                                    </div>

                                    {/* Pagination Info */}
                                    <div className="text-xs text-[#6e7681]">
                                        Page {page} of {totalPages || 1}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-3 min-h-[500px]">
                                    {activeTab === "commits" && paginatedItems.map((item) => {
                                        const commit = item as Commit;
                                        return (
                                            <a
                                                key={commit.sha}
                                                href={commit.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-start gap-3 p-4 bg-[#0d1117] rounded-xl border border-[#21262d] hover:border-[#30363d] transition-all group"
                                            >
                                                {commit.author ? (
                                                    <Image src={commit.author.avatar_url} alt="" width={32} height={32} className="rounded-lg" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center text-[10px] text-[#6e7681]">?</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-medium group-hover:text-[#58a6ff] transition-colors line-clamp-1">{commit.commit.message.split("\n")[0]}</p>
                                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6e7681]">
                                                        <span className="text-[#8b949e]">{commit.author?.login || commit.commit.author.name}</span>
                                                        <span>•</span>
                                                        <span>{formatTime(commit.commit.author.date)}</span>
                                                        <span>•</span>
                                                        <code className="px-1.5 py-0.5 bg-[#21262d] text-[#58a6ff] rounded text-[10px] font-mono">{commit.sha.slice(0, 7)}</code>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}

                                    {activeTab === "issues" && paginatedItems.map((item) => {
                                        const issue = item as Issue;
                                        return (
                                            <a
                                                key={issue.id}
                                                href={issue.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-start gap-3 p-4 bg-[#0d1117] rounded-xl border border-[#21262d] hover:border-[#30363d] transition-all group"
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${issue.state === "open" ? "bg-green-500/10" : "bg-purple-500/10"}`}>
                                                    <svg className={`w-4 h-4 ${issue.state === "open" ? "text-green-500" : "text-purple-500"}`} fill="currentColor" viewBox="0 0 16 16">
                                                        {issue.state === "open" ? <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" /> : <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5zM16 8A8 8 0 110 8a8 8 0 0116 0z" />}
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-medium group-hover:text-[#58a6ff] transition-colors line-clamp-1">{issue.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        {issue.labels.slice(0, 2).map((l) => (
                                                            <span key={l.name} className="px-1.5 py-0.5 text-[9px] rounded-full" style={{ backgroundColor: `#${l.color}25`, color: `#${l.color}` }}>{l.name}</span>
                                                        ))}
                                                        <span className="text-xs text-[#6e7681]">#{issue.number} • {formatTime(issue.created_at)}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}

                                    {paginatedItems.length === 0 && (
                                        <div className="flex items-center justify-center h-40 text-[#6e7681]">
                                            No {activeTab} found
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Footer */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 p-4 border-t border-[#21262d] bg-[#0d1117]">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setPage(pageNum)}
                                                        className={`w-9 h-9 rounded-lg text-sm transition-all ${page === pageNum ? "bg-[#238636] text-white" : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]"}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
