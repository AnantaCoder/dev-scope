"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AIAnalysisResult } from "@/components/AIAnalysisResult";
import { AIAnalysisButton } from "@/components/AIAnalysisButton";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import Image from "next/image";
import Link from "next/link";

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

interface Contributor {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
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
    const [activeTab, setActiveTab] = useState<"commits" | "issues" | "contributors">("commits");
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [page, setPage] = useState(1);

    // AI Analysis hook with built-in rate limiting
    const aiAnalysis = useAIAnalysis({ cooldownSeconds: 30 });

    const fetchRepoData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [repoRes, commitsRes, issuesRes, langsRes, contributorsRes] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { Accept: "application/vnd.github.v3+json" } }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, { headers: { Accept: "application/vnd.github.v3+json" } }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=30`, { headers: { Accept: "application/vnd.github.v3+json" } }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers: { Accept: "application/vnd.github.v3+json" } }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`, { headers: { Accept: "application/vnd.github.v3+json" } }),
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
                    color: LANGUAGE_COLORS[name] || "#6B6580",
                })).sort((a, b) => b.percentage - a.percentage));
            }
            if (contributorsRes.ok) setContributors(await contributorsRes.json());
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
        if (!repoData) return;
        await aiAnalysis.analyzeRepo({
            owner: repoData.owner.login,
            name: repoData.name,
            description: repoData.description || "",
            language: repoData.language || "Unknown",
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
        });
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
    const currentItems = activeTab === "commits" ? commits : activeTab === "issues" ? issues : contributors;
    const paginatedItems = currentItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(currentItems.length / itemsPerPage);

    // Reset page when switching tabs
    useEffect(() => { setPage(1); }, [activeTab]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#1E2345] border-t-[#FF6D1F] rounded-full animate-spin" />
                        <p className="text-[#6B6580]">Loading repository...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !repoData) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center premium-card p-8 max-w-md">
                        <div className="w-14 h-14 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-[#F5E7C6] mb-2 font-['Gotham']">Repository Not Found</h2>
                        <p className="text-[#6B6580] mb-4">{error}</p>
                        <Link href="/repos" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] text-white rounded-lg transition-all">
                            ← Back to Repos
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col premium-bg text-[#F5E7C6]">
            {/* Background Effects - Warm tones */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#FF6D1F]/8 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#F5E7C6]/8 rounded-full blur-[100px]" />
            </div>

            <Navbar />

            <main className="flex-1 relative z-10">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-6">
                        <Link href="/repos" className="text-[#6B6580] hover:text-[#FF6D1F] transition-colors">Repos</Link>
                        <span className="text-[#4A4560]">/</span>
                        <span className="text-[#6B6580]">{owner}</span>
                        <span className="text-[#4A4560]">/</span>
                        <span className="text-[#F5E7C6] font-medium">{repo}</span>
                    </nav>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT COLUMN - Repository Info */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Header Card */}
                            <div className="premium-card p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <Image src={repoData.owner.avatar_url} alt={owner} width={44} height={44} className="rounded-xl ring-2 ring-[#FF6D1F]/20" />
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg font-bold text-[#F5E7C6] truncate font-['Gotham']">{repoData.name}</h1>
                                        <p className="text-sm text-[#6B6580]">{owner}</p>
                                    </div>
                                    {repoData.private && (
                                        <span className="px-2 py-1 text-[10px] bg-[#F5E7C6]/10 text-[#F5E7C6] border border-[#F5E7C6]/20 rounded-md">Private</span>
                                    )}
                                </div>

                                {repoData.description && (
                                    <p className="text-sm text-[#A8A0B8] mb-4 leading-relaxed font-['Gotham']">{repoData.description}</p>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {[
                                        { value: repoData.stargazers_count, label: "Stars", color: "text-[#F5E7C6]" },
                                        { value: repoData.forks_count, label: "Forks", color: "text-[#FF6D1F]" },
                                        { value: repoData.open_issues_count, label: "Issues", color: "text-[#FF8A47]" },
                                        { value: formatSize(repoData.size), label: "Size", color: "text-[#D4C9A8]" },
                                    ].map((stat) => (
                                        <div key={stat.label} className="text-center p-2 bg-[#1E2345]/60 rounded-lg">
                                            <p className={`text-lg font-bold ${stat.color}`}>{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
                                            <p className="text-[10px] text-[#6B6580]">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Topics */}
                                {repoData.topics && repoData.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {repoData.topics.slice(0, 5).map((topic) => (
                                            <span key={topic} className="text-[10px] px-2 py-0.5 bg-[#FF6D1F]/10 text-[#FF8A47] rounded-full">{topic}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="text-xs text-[#6B6580] space-y-1 pt-3 border-t border-[#F5E7C6]/10">
                                    <p>📅 Updated {formatTime(repoData.updated_at)}</p>
                                    {repoData.license && <p>📄 {repoData.license.name}</p>}
                                    <p>🌿 {repoData.default_branch}</p>
                                </div>
                            </div>

                            {/* Languages */}
                            {languages.length > 0 && (
                                <div className="premium-card p-4">
                                    <h3 className="text-sm font-semibold text-[#F5E7C6] mb-3 font-['Gotham']">Languages</h3>
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
                                                    <span className="text-[#D4C9A8]">{l.name}</span>
                                                </div>
                                                <span className="text-[#6B6580]">{l.percentage}%</span>
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
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#FF6D1F]/20"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                    View on GitHub
                                </a>

                                {!repoData.private && (
                                    <button
                                        onClick={copyCloneCommand}
                                        className={`flex items-center justify-center gap-2 w-full py-3 font-semibold rounded-xl border transition-all ${copiedClone ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-[#1E2345]/60 hover:bg-[#1E2345] text-[#F5E7C6] border-[#F5E7C6]/10"
                                            }`}
                                    >
                                        {copiedClone ? (
                                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                                        ) : (
                                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Clone Repository</>
                                        )}
                                    </button>
                                )}

                                <AIAnalysisButton
                                    onClick={getAIAnalysis}
                                    loading={aiAnalysis.loading}
                                    cooldown={aiAnalysis.cooldown}
                                    className="w-full"
                                />
                            </div>

                            {/* AI Analysis Result */}
                            {aiAnalysis.result && (
                                <AIAnalysisResult
                                    result={aiAnalysis.result}
                                    error={aiAnalysis.error}
                                    showClearButton={true}
                                    onClear={aiAnalysis.clearResult}
                                />
                            )}
                        </div>

                        {/* RIGHT COLUMN - Commits/Issues */}
                        <div className="lg:col-span-2">
                            <div className="premium-card overflow-hidden">
                                {/* Tab Header - At Top */}
                                <div className="flex items-center justify-between p-4 border-b border-[#F5E7C6]/10 bg-[#1E2345]/60">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab("commits")}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "commits"
                                                ? "bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white"
                                                : "bg-[#1E2345] text-[#6B6580] hover:text-[#F5E7C6] hover:bg-[#171B38]"
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
                                                ? "bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white"
                                                : "bg-[#1E2345] text-[#6B6580] hover:text-[#F5E7C6] hover:bg-[#171B38]"
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Issues
                                            <span className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded">{issues.length}</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("contributors")}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "contributors"
                                                ? "bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white"
                                                : "bg-[#1E2345] text-[#6B6580] hover:text-[#F5E7C6] hover:bg-[#171B38]"
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            Contributors
                                            <span className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded">{contributors.length}</span>
                                        </button>
                                    </div>

                                    {/* Pagination Info */}
                                    <div className="text-xs text-[#6B6580]">
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
                                                className="flex items-start gap-3 p-4 bg-[#1E2345]/60 rounded-xl border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/30 transition-all group"
                                            >
                                                {commit.author ? (
                                                    <Image src={commit.author.avatar_url} alt="" width={32} height={32} className="rounded-lg" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-[#1E2345] flex items-center justify-center text-[10px] text-[#6B6580]">?</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-[#F5E7C6] font-medium group-hover:text-[#FF6D1F] transition-colors line-clamp-1">{commit.commit.message.split("\n")[0]}</p>
                                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6B6580]">
                                                        <span className="text-[#A8A0B8]">{commit.author?.login || commit.commit.author.name}</span>
                                                        <span>•</span>
                                                        <span>{formatTime(commit.commit.author.date)}</span>
                                                        <span>•</span>
                                                        <code className="px-1.5 py-0.5 bg-[#1E2345] text-[#FF6D1F] rounded text-[10px] font-mono">{commit.sha.slice(0, 7)}</code>
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
                                                className="flex items-start gap-3 p-4 bg-[#1E2345]/60 rounded-xl border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/30 transition-all group"
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${issue.state === "open" ? "bg-green-500/10" : "bg-[#FF6D1F]/10"}`}>
                                                    <svg className={`w-4 h-4 ${issue.state === "open" ? "text-green-500" : "text-[#FF6D1F]"}`} fill="currentColor" viewBox="0 0 16 16">
                                                        {issue.state === "open" ? <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" /> : <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5zM16 8A8 8 0 110 8a8 8 0 0116 0z" />}
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-[#F5E7C6] font-medium group-hover:text-[#FF6D1F] transition-colors line-clamp-1">{issue.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        {issue.labels.slice(0, 2).map((l) => (
                                                            <span key={l.name} className="px-1.5 py-0.5 text-[9px] rounded-full" style={{ backgroundColor: `#${l.color}25`, color: `#${l.color}` }}>{l.name}</span>
                                                        ))}
                                                        <span className="text-xs text-[#6B6580]">#{issue.number} • {formatTime(issue.created_at)}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}

                                    {activeTab === "contributors" && paginatedItems.map((item) => {
                                        const contributor = item as Contributor;
                                        return (
                                            <Link
                                                key={contributor.id}
                                                href={`/profile/${contributor.login}`}
                                                className="flex items-center gap-3 p-4 bg-[#1E2345]/60 rounded-xl border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/30 transition-all group"
                                            >
                                                <Image
                                                    src={contributor.avatar_url}
                                                    alt={contributor.login}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full ring-2 ring-[#F5E7C6]/10"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-[#F5E7C6] font-medium group-hover:text-[#FF6D1F] transition-colors">
                                                        @{contributor.login}
                                                    </p>
                                                    <p className="text-xs text-[#6B6580]">
                                                        {contributor.contributions.toLocaleString()} commits
                                                    </p>
                                                </div>
                                                <div className="px-3 py-1.5 bg-[#FF6D1F]/10 text-[#FF6D1F] text-xs font-medium rounded-lg border border-[#FF6D1F]/20">
                                                    {contributor.contributions.toLocaleString()}
                                                </div>
                                            </Link>
                                        );
                                    })}

                                    {((activeTab === "commits" && commits.length === 0) ||
                                        (activeTab === "issues" && issues.length === 0) ||
                                        (activeTab === "contributors" && contributors.length === 0)) && (
                                            <div className="flex items-center justify-center h-40 text-[#6B6580]">
                                                No {activeTab} found
                                            </div>
                                        )}
                                </div>

                                {/* Pagination Footer */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 p-4 border-t border-[#F5E7C6]/10 bg-[#1E2345]/60">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-40 disabled:cursor-not-allowed text-[#F5E7C6] text-sm rounded-lg transition-all border border-[#F5E7C6]/10"
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
                                                        className={`w-9 h-9 rounded-lg text-sm transition-all ${page === pageNum ? "bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white" : "bg-[#1E2345] text-[#6B6580] hover:bg-[#171B38]"}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-4 py-2 bg-[#1E2345] hover:bg-[#171B38] disabled:opacity-40 disabled:cursor-not-allowed text-[#F5E7C6] text-sm rounded-lg transition-all border border-[#F5E7C6]/10"
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
