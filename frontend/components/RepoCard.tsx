"use client";

import Image from "next/image";
import Link from "next/link";
import { Repository, LANGUAGE_COLORS, formatRepoDate } from "@/types/github";

interface RepoCardProps {
    repo: Repository;
    copiedId?: number | null;
    onCopy?: (repo: Repository, e: React.MouseEvent) => void;
    showCloneButton?: boolean;
}

export function RepoCard({ repo, copiedId, onCopy, showCloneButton = true }: RepoCardProps) {
    return (
        <div className="relative p-4 bg-gradient-to-br from-[#F5E7C6]/5 to-[#1E2345]/30 backdrop-blur-xl border border-[#F5E7C6]/10 rounded-xl hover:border-[#FF6D1F]/40 hover:shadow-lg hover:shadow-[#FF6D1F]/10 transition-all duration-300 group overflow-hidden">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D1F]/5 to-[#F5E7C6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
                {/* Header with repo name */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                        href={`/repos/${repo.owner.login}/${repo.name}`}
                        className="flex items-center gap-2 min-w-0 group/name"
                    >
                        <Image
                            src={repo.owner.avatar_url}
                            alt={repo.owner.login}
                            width={20}
                            height={20}
                            className="rounded-full flex-shrink-0 ring-2 ring-[#F5E7C6]/10"
                        />
                        <span className="text-[#FF6D1F] font-semibold truncate group-hover/name:text-[#FF8A47] transition-colors">
                            {repo.name}
                        </span>
                    </Link>
                    {repo.private && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#F5E7C6]/10 text-[#F5E7C6] border border-[#F5E7C6]/20 rounded flex-shrink-0">
                            Private
                        </span>
                    )}
                </div>

                {/* Description */}
                {repo.description && (
                    <p className="text-sm text-[#A8A0B8] line-clamp-2 mb-3 font-['Gotham']">{repo.description}</p>
                )}

                {/* Topics */}
                {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {repo.topics.slice(0, 3).map((topic) => (
                            <span
                                key={topic}
                                className="text-[10px] px-2 py-0.5 bg-[#FF6D1F]/10 text-[#FF8A47] rounded-full border border-[#FF6D1F]/20"
                            >
                                {topic}
                            </span>
                        ))}
                        {repo.topics.length > 3 && (
                            <span className="text-[10px] text-[#6B6580]">+{repo.topics.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6580] mb-3">
                    {repo.language && (
                        <div className="flex items-center gap-1">
                            <span
                                className="w-2.5 h-2.5 rounded-full ring-1 ring-[#F5E7C6]/20"
                                style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || "#6B6580" }}
                            />
                            <span className="text-[#D4C9A8]">{repo.language}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-[#F5E7C6]">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                        </svg>
                        <span>{repo.stargazers_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                        </svg>
                        <span>{repo.forks_count.toLocaleString()}</span>
                    </div>
                    <span className="text-[#4A4560]">•</span>
                    <span>{formatRepoDate(repo.updated_at)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/repos/${repo.owner.login}/${repo.name}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FF6D1F]/20 to-[#FF8A47]/20 hover:from-[#FF6D1F]/30 hover:to-[#FF8A47]/30 text-[#FF6D1F] text-xs font-medium rounded-lg border border-[#FF6D1F]/30 transition-all shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                    </Link>
                    {showCloneButton && !repo.private && onCopy && (
                        <button
                            onClick={(e) => onCopy(repo, e)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${copiedId === repo.id
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-[#F5E7C6]/5 hover:bg-[#F5E7C6]/10 text-[#6B6580] border-[#F5E7C6]/10"
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {copiedId === repo.id ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                )}
                            </svg>
                            {copiedId === repo.id ? "Copied!" : "Clone"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RepoCard;
