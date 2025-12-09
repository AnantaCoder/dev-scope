"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

interface UserRanking {
  id: number;
  username: string;
  github_id: number;
  avatar_url: string;
  score: number;
  followers: number;
  public_repos: number;
  total_stars: number;
  total_forks: number;
  contribution_count: number;
  rank_position: number;
  updated_at: string;
}

// Score breakdown calculation (mirrors backend algorithm)
function calculateScoreBreakdown(ranking: UserRanking) {
  const followerScore = ranking.followers * 0.40;
  const starScore = ranking.total_stars * 0.30;
  const repoScore = ranking.public_repos * 0.15;
  const forkScore = ranking.total_forks * 0.10;
  const contributionScore = ranking.contribution_count * 0.05;

  const rawTotal = followerScore + starScore + repoScore + forkScore + contributionScore;
  const scaledScore = rawTotal > 0 ? Math.log10(rawTotal + 1) * 100 : 0;

  return {
    followers: { raw: ranking.followers, weight: 40, contribution: followerScore },
    stars: { raw: ranking.total_stars, weight: 30, contribution: starScore },
    repos: { raw: ranking.public_repos, weight: 15, contribution: repoScore },
    forks: { raw: ranking.total_forks, weight: 10, contribution: forkScore },
    contributions: { raw: ranking.contribution_count, weight: 5, contribution: contributionScore },
    rawTotal,
    scaledScore: Math.round(scaledScore * 100) / 100,
  };
}

function ScoreTooltip({ ranking }: { ranking: UserRanking }) {
  const breakdown = calculateScoreBreakdown(ranking);

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-[#1c2128] border border-[#30363d] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
        <div className="border-8 border-transparent border-t-[#30363d]"></div>
      </div>
      <h4 className="text-sm font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-[#a371f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Score Breakdown
      </h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Followers ({breakdown.followers.weight}%)</span>
          <span className="text-[#e6edf3] font-mono">{breakdown.followers.raw.toLocaleString()} → {breakdown.followers.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Stars ({breakdown.stars.weight}%)</span>
          <span className="text-[#ffd700] font-mono">{breakdown.stars.raw.toLocaleString()} → {breakdown.stars.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Repos ({breakdown.repos.weight}%)</span>
          <span className="text-[#58a6ff] font-mono">{breakdown.repos.raw.toLocaleString()} → {breakdown.repos.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Forks ({breakdown.forks.weight}%)</span>
          <span className="text-[#8b949e] font-mono">{breakdown.forks.raw.toLocaleString()} → {breakdown.forks.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Activity ({breakdown.contributions.weight}%)</span>
          <span className="text-[#238636] font-mono">{breakdown.contributions.raw.toLocaleString()} → {breakdown.contributions.contribution.toFixed(1)}</span>
        </div>
        <div className="border-t border-[#30363d] pt-2 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b949e]">Raw Total</span>
            <span className="text-[#e6edf3] font-mono">{breakdown.rawTotal.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-[#8b949e]">Log Scale (×100)</span>
            <span className="text-[#a371f7] font-bold font-mono">{breakdown.scaledScore.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RankingsTable() {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchRankings();
  }, [page]);

  const fetchRankings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.getRankings(page, pageSize);
      if (!response.error) {
        setRankings(response.rankings || []);
        setTotal(response.total || 0);
      } else {
        setError("Failed to load rankings");
      }
    } catch (err) {
      setError("Failed to fetch rankings. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && rankings.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8b949e]">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 text-[#f85149] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[#f85149] font-medium">{error}</p>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
        <svg className="w-16 h-16 text-[#8b949e] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h3 className="text-xl font-semibold text-[#e6edf3] mb-2">No Rankings Yet</h3>
        <p className="text-[#8b949e]">Search for GitHub users to add them to the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rankings Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d1117] border-b border-[#30363d]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Developer</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    Score
                    <svg className="w-3 h-3 text-[#6e7681]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Followers</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Repos</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Stars</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Forks</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {rankings.map((ranking) => (
                <tr key={ranking.id} className="hover:bg-[#0d1117] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {ranking.rank_position <= 3 ? (
                        <span className="text-2xl">
                          {ranking.rank_position === 1 && "🥇"}
                          {ranking.rank_position === 2 && "🥈"}
                          {ranking.rank_position === 3 && "🥉"}
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-[#8b949e]">#{ranking.rank_position}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/profile/${ranking.username}`}
                      className="flex items-center gap-3 hover:text-[#58a6ff] transition-colors"
                    >
                      <Image
                        src={ranking.avatar_url}
                        alt={ranking.username}
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-[#30363d]"
                      />
                      <div>
                        <span className="font-medium text-[#e6edf3] block">{ranking.username}</span>
                        <span className="text-xs text-[#6e7681]">View Profile →</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="relative group inline-block">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-[#a371f7]/20 to-[#58a6ff]/20 text-[#a371f7] cursor-help">
                        {ranking.score.toFixed(2)}
                      </span>
                      <ScoreTooltip ranking={ranking} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-[#e6edf3]">
                    {ranking.followers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-[#e6edf3]">
                    {ranking.public_repos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-[#ffd700]">{ranking.total_stars.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-[#8b949e]">
                    {ranking.total_forks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-[#238636]">{ranking.contribution_count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6">
          <p className="text-sm text-[#8b949e]">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} developers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-sm font-medium text-[#e6edf3] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-[#8b949e]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-sm font-medium text-[#e6edf3] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
