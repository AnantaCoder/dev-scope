"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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

function ScoreTooltip({ ranking, show, anchorRect }: { ranking: UserRanking; show: boolean; anchorRect: DOMRect | null }) {
  const breakdown = calculateScoreBreakdown(ranking);

  if (!show || !anchorRect) return null;

  // Calculate position - show below if near top of viewport, otherwise above
  const tooltipHeight = 280;
  const showBelow = anchorRect.top < tooltipHeight + 100;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: anchorRect.left + anchorRect.width / 2,
    transform: 'translateX(-50%)',
    ...(showBelow
      ? { top: anchorRect.bottom + 1 }
      : { top: anchorRect.top - tooltipHeight }
    ),
    zIndex: 9999,
  };

  return createPortal(
    <div
      style={style}
      className="w-72 p-4 premium-card rounded-2xl shadow-2xl"
    >
      {/* Arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={showBelow ? { top: -8 } : { bottom: -8 }}
      >
        <div className={`border-8 border-transparent ${showBelow ? 'border-b-[#1E2345]' : 'border-t-[#1E2345]'}`}></div>
      </div>
      <h4 className="text-sm font-semibold text-[#F5E7C6] mb-3 flex items-center gap-2 font-['Gotham']">
        <svg className="w-4 h-4 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Score Breakdown
      </h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B6580]">Followers ({breakdown.followers.weight}%)</span>
          <span className="text-[#F5E7C6] font-['JetBrains_Mono']">{breakdown.followers.raw.toLocaleString()} → {breakdown.followers.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B6580]">Stars ({breakdown.stars.weight}%)</span>
          <span className="text-[#F5E7C6] font-['JetBrains_Mono']">{breakdown.stars.raw.toLocaleString()} → {breakdown.stars.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B6580]">Repos ({breakdown.repos.weight}%)</span>
          <span className="text-[#FF6D1F] font-['JetBrains_Mono']">{breakdown.repos.raw.toLocaleString()} → {breakdown.repos.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B6580]">Forks ({breakdown.forks.weight}%)</span>
          <span className="text-[#A8A0B8] font-['JetBrains_Mono']">{breakdown.forks.raw.toLocaleString()} → {breakdown.forks.contribution.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B6580]">Activity ({breakdown.contributions.weight}%)</span>
          <span className="text-green-400 font-['JetBrains_Mono']">{breakdown.contributions.raw.toLocaleString()} → {breakdown.contributions.contribution.toFixed(1)}</span>
        </div>
        <div className="border-t border-[#F5E7C6]/10 pt-2 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B6580]">Raw Total</span>
            <span className="text-[#F5E7C6] font-['JetBrains_Mono']">{breakdown.rawTotal.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-[#6B6580]">Log Scale (×100)</span>
            <span className="text-[#FF6D1F] font-bold font-['JetBrains_Mono']">{breakdown.scaledScore.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ScoreCell({ ranking }: { ranking: UserRanking }) {
  const [show, setShow] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      setAnchorRect(ref.current.getBoundingClientRect());
      setShow(true);
    }
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-[#FF6D1F]/20 to-[#F5E7C6]/10 text-[#FF6D1F] cursor-help"
      >
        {ranking.score.toFixed(2)}
      </span>
      <ScoreTooltip ranking={ranking} show={show} anchorRect={anchorRect} />
    </>
  );
}

export function RankingsTable() {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchRankings = useCallback(async () => {
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
  }, [page, pageSize]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const totalPages = Math.ceil(total / pageSize);

  if (loading && rankings.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6D1F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6580]">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-card bg-red-500/10 border-red-500/30 rounded-2xl p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="premium-card rounded-2xl p-12 text-center">
        <svg className="w-16 h-16 text-[#6B6580] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h3 className="text-xl font-semibold text-[#F5E7C6] mb-2 font-['Gotham']">No Rankings Yet</h3>
        <p className="text-[#6B6580]">Search for GitHub users to add them to the leaderboard!</p>
      </div>
    );
  }

  // Separate top 3 from the rest
  const top3 = rankings.filter(r => r.rank_position <= 3);
  const restRankings = rankings.filter(r => r.rank_position > 3);

  // Get individual positions
  const firstPlace = top3.find(r => r.rank_position === 1);
  const secondPlace = top3.find(r => r.rank_position === 2);
  const thirdPlace = top3.find(r => r.rank_position === 3);

  const formatScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toFixed(0);
  };

  return (
    <div className="space-y-8">
      {/* Top 3 Podium - Only show on first page */}
      {page === 1 && top3.length > 0 && (
        <div className="py-6 md:py-12">
          {/* Crown Icon */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-[#FF6D1F] opacity-50 animate-pulse-glow"></div>
              <svg className="w-12 h-12 md:w-16 md:h-16 text-[#FF6D1F] relative z-10 drop-shadow-[0_0_15px_rgba(255,109,31,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
            </div>
          </div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-3 sm:gap-4 md:gap-8 mt-6 md:mt-8 px-2">
            {/* 2nd Place - Left */}
            {secondPlace && (
              <Link href={`/profile/${secondPlace.username}`} className="flex flex-col items-center group">
                <div className="relative mb-3 md:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 md:ring-4 ring-[#C0C0C0] group-hover:ring-[#FF6D1F] transition-all shadow-xl shadow-gray-500/20">
                    <Image
                      src={secondPlace.avatar_url}
                      alt={secondPlace.username}
                      width={96}
                      height={96}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C0C0C0] to-[#A8A8A8] text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full whitespace-nowrap shadow-lg">
                    🥈 Silver
                  </div>
                </div>
                <p className="text-[#F5E7C6] font-bold text-xs sm:text-sm md:text-base mt-1 md:mt-2 group-hover:text-[#FF6D1F] transition-colors truncate max-w-[80px] sm:max-w-none">{secondPlace.username}</p>
                <p className="text-[#C0C0C0] text-xs md:text-sm font-bold">{formatScore(secondPlace.score)} pts</p>
                {/* Silver Podium */}
                <div className="w-20 h-24 sm:w-24 sm:h-28 md:w-32 md:h-36 mt-2 md:mt-4 bg-gradient-to-b from-[#C0C0C0]/10 to-[#1E2345] border md:border-2 border-[#C0C0C0]/50 rounded-t-xl md:rounded-t-2xl flex items-end justify-center pb-3 md:pb-6 shadow-2xl shadow-gray-500/20">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#C0C0C0]/40">2</span>
                </div>
              </Link>
            )}

            {/* 1st Place - Center */}
            {firstPlace && (
              <Link href={`/profile/${firstPlace.username}`} className="flex flex-col items-center group -mt-6 sm:-mt-8 md:-mt-12">
                <div className="relative mb-3 md:mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-2 md:ring-4 ring-[#FF6D1F] group-hover:ring-[#F5E7C6] transition-all shadow-2xl shadow-[#FF6D1F]/40 animate-pulse-slow">
                    <Image
                      src={firstPlace.avatar_url}
                      alt={firstPlace.username}
                      width={112}
                      height={112}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] text-white text-[10px] sm:text-xs md:text-sm font-bold px-2 sm:px-3 md:px-4 py-0.5 md:py-1.5 rounded-full whitespace-nowrap shadow-xl animate-pulse-slow">
                    👑 Champion
                  </div>
                </div>
                <p className="text-[#F5E7C6] font-bold text-sm sm:text-base md:text-lg mt-1 md:mt-2 group-hover:text-[#FF6D1F] transition-colors truncate max-w-[90px] sm:max-w-none">{firstPlace.username}</p>
                <p className="text-[#FF6D1F] text-xs sm:text-sm md:text-base font-bold">{formatScore(firstPlace.score)} pts</p>
                {/* Gold Podium */}
                <div className="w-24 h-32 sm:w-28 sm:h-40 md:w-36 md:h-52 mt-2 md:mt-4 bg-gradient-to-b from-[#FF6D1F]/15 to-[#1E2345] border md:border-2 border-[#FF6D1F]/60 rounded-t-xl md:rounded-t-2xl flex items-end justify-center pb-4 sm:pb-6 md:pb-8 shadow-2xl shadow-[#FF6D1F]/30">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#FF6D1F]/40">1</span>
                </div>
              </Link>
            )}

            {/* 3rd Place - Right */}
            {thirdPlace && (
              <Link href={`/profile/${thirdPlace.username}`} className="flex flex-col items-center group">
                <div className="relative mb-3 md:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 md:ring-4 ring-[#CD7F32] group-hover:ring-[#FF6D1F] transition-all shadow-xl shadow-orange-800/20">
                    <Image
                      src={thirdPlace.avatar_url}
                      alt={thirdPlace.username}
                      width={96}
                      height={96}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#CD7F32] to-[#B87333] text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full whitespace-nowrap shadow-lg">
                    🥉 Bronze
                  </div>
                </div>
                <p className="text-[#F5E7C6] font-bold text-xs sm:text-sm md:text-base mt-1 md:mt-2 group-hover:text-[#FF6D1F] transition-colors truncate max-w-[80px] sm:max-w-none">{thirdPlace.username}</p>
                <p className="text-[#CD7F32] text-xs md:text-sm font-bold">{formatScore(thirdPlace.score)} pts</p>
                {/* Bronze Podium */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-28 mt-2 md:mt-4 bg-gradient-to-b from-[#CD7F32]/10 to-[#1E2345] border md:border-2 border-[#CD7F32]/50 rounded-t-xl md:rounded-t-2xl flex items-end justify-center pb-3 md:pb-6 shadow-2xl shadow-orange-800/20">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#CD7F32]/40">3</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Rankings Table - Starting from 4th place */}
      {restRankings.length > 0 && (
        <div className="premium-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#090B1B]/60 backdrop-blur-sm border-b border-[#F5E7C6]/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B6580] uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B6580] uppercase tracking-wider">Developer</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B6580] uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1">
                      Score
                      <svg className="w-3 h-3 text-[#6B6580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B6580] uppercase tracking-wider">Followers</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B6580] uppercase tracking-wider">Repos</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B6580] uppercase tracking-wider">Stars</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B6580] uppercase tracking-wider">Forks</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B6580] uppercase tracking-wider">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E7C6]/5">
                {restRankings.map((ranking) => (
                  <tr key={ranking.id} className="hover:bg-[#1E2345]/50 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-[#6B6580]">#{ranking.rank_position}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/profile/${ranking.username}`}
                        className="flex items-center gap-3 hover:text-[#FF6D1F] transition-colors"
                      >
                        <Image
                          src={ranking.avatar_url}
                          alt={ranking.username}
                          width={40}
                          height={40}
                          className="rounded-full ring-2 ring-[#1E2345]"
                          unoptimized
                        />
                        <div>
                          <span className="font-medium text-[#F5E7C6] block">{ranking.username}</span>
                          <span className="text-xs text-[#6B6580]">View Profile →</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ScoreCell ranking={ranking} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-[#F5E7C6]">
                      {ranking.followers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-[#F5E7C6]">
                      {ranking.public_repos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-[#F5E7C6]">{ranking.total_stars.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-[#6B6580]">
                      {ranking.total_forks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-green-400">{ranking.contribution_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6">
          <p className="text-sm text-[#6B6580]">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} developers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#1E2345]/60 backdrop-blur-sm border border-[#F5E7C6]/10 rounded-xl text-sm font-medium text-[#F5E7C6] hover:border-[#FF6D1F]/50 hover:shadow-lg hover:shadow-[#FF6D1F]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-[#6B6580]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[#1E2345]/60 backdrop-blur-sm border border-[#F5E7C6]/10 rounded-xl text-sm font-medium text-[#F5E7C6] hover:border-[#FF6D1F]/50 hover:shadow-lg hover:shadow-[#FF6D1F]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
