import React, { useState } from 'react';
import Image from 'next/image';
import type { GitHubUser, TechStack, StreakInfo } from '@/types';

interface UserProfileCardProps {
  user: GitHubUser;
  techStack?: TechStack;
  streak?: StreakInfo;
}

const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Scala: '#c22d40',
};

const getLanguageColor = (lang: string) => languageColors[lang] || '#A8A0B8';

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, techStack, streak }) => {
  const memberSince = new Date(user.created_at).getFullYear();
  const [hiddenLanguages, setHiddenLanguages] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const allLanguages = techStack?.languages
    ? Object.entries(techStack.languages).sort(([, a], [, b]) => b - a)
    : [];

  const visibleLanguages = allLanguages.filter(([lang]) => !hiddenLanguages.has(lang));
  const displayedLanguages = showAll ? visibleLanguages : visibleLanguages.slice(0, 6);
  const hasMoreLanguages = visibleLanguages.length > 6;
  const hiddenCount = hiddenLanguages.size;

  const toggleLanguage = (lang: string) => {
    setHiddenLanguages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lang)) {
        newSet.delete(lang);
      } else {
        newSet.add(lang);
      }
      return newSet;
    });
  };

  const showAllHidden = () => {
    setHiddenLanguages(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Solar Eclipse Profile Card - Warm Theme */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#090B1B] border border-[#F5E7C6]/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">

        {/* Eclipse Background Effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-transparent via-[#090B1B]/90 to-[#090B1B] z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#FF6D1F]/10 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
        </div>

        <div className="relative z-10 p-8 sm:p-10 flex flex-col items-center text-center">

          {/* Avatar - The Eclipse */}
          <div className="relative mb-6">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#FF6D1F] via-[#F5E7C6] to-[#FF6D1F] opacity-75 blur-md animate-spin-slow group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute -inset-4 rounded-full bg-[#F5E7C6]/5 blur-xl" />
            <div className="relative w-32 h-32 rounded-full p-1 bg-[#090B1B] overflow-hidden ring-1 ring-[#F5E7C6]/20 shadow-[0_0_30px_rgba(255,109,31,0.2)]">
              <Image
                src={user.avatar_url}
                alt={user.login}
                fill
                className="object-cover rounded-full"
              />
            </div>

            {/* Orbiting Elements */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-[#FF6D1F] rounded-full border-2 border-[#090B1B] shadow-[0_0_10px_rgba(255,109,31,0.8)] animate-pulse" title="Online" />
          </div>

          <h3 className="text-3xl font-bold text-[#F5E7C6] tracking-tight mb-1 drop-shadow-md font-['Gotham']">{user.name || user.login}</h3>
          <p className="text-[#A8A0B8] font-medium tracking-wide mb-4">@{user.login}</p>

          {user.bio && (
            <div className="max-w-md mx-auto mb-6 relative">
              <span className="absolute -left-2 -top-2 text-2xl text-[#6B6580] font-serif">"</span>
              <p className="text-[#D4C9A8] text-sm leading-relaxed italic font-['Gotham']">{user.bio}</p>
              <span className="absolute -right-2 bottom-0 text-2xl text-[#6B6580] font-serif">"</span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-[#A8A0B8] mb-8">
            {user.location && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5E7C6]/5 border border-[#F5E7C6]/10">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {user.location}
              </span>
            )}
            {user.company && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5E7C6]/5 border border-[#F5E7C6]/10">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {user.company}
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5E7C6]/5 border border-[#F5E7C6]/10">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Joined {memberSince}
            </span>
          </div>

          {/* Metrics Band */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            {[
              { label: 'Repos', value: user.public_repos, color: 'text-[#FF6D1F]' },
              { label: 'Followers', value: user.followers.toLocaleString(), color: 'text-[#F5E7C6]' },
              { label: 'Following', value: user.following.toLocaleString(), color: 'text-[#D4C9A8]' },
              { label: 'Gists', value: user.public_gists, color: 'text-[#FF8A47]' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-[#F5E7C6]/[0.03] border border-[#F5E7C6]/10 hover:bg-[#F5E7C6]/[0.06] transition-colors">
                <span className={`text-2xl font-bold ${stat.color} drop-shadow-sm`}>{stat.value}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#6B6580] font-semibold mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Streak & Tech Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {streak && (
          <div className="premium-card rounded-2xl">
            <div className="px-4 py-3 border-b border-[#F5E7C6]/10 flex items-center gap-2">
              <span className="text-base">🔥</span>
              <h4 className="text-sm font-semibold text-[#F5E7C6]">Activity Streak</h4>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-[#090B1B]/50 backdrop-blur-sm border border-[#FF6D1F]/20 rounded-xl hover:border-[#FF6D1F]/40 transition-all">
                <p className="text-lg font-semibold text-[#FF6D1F]">{streak.current_streak}</p>
                <p className="text-[10px] text-[#6B6580]">Current</p>
              </div>
              <div className="text-center p-2 bg-[#090B1B]/50 backdrop-blur-sm border border-[#F5E7C6]/20 rounded-xl hover:border-[#F5E7C6]/40 transition-all">
                <p className="text-lg font-semibold text-[#F5E7C6]">{streak.longest_streak}</p>
                <p className="text-[10px] text-[#6B6580]">Longest</p>
              </div>
              <div className="text-center p-2 bg-[#090B1B]/50 backdrop-blur-sm border border-green-500/20 rounded-xl hover:border-green-500/40 transition-all">
                <p className="text-lg font-semibold text-green-400">{streak.total_days}</p>
                <p className="text-[10px] text-[#6B6580]">Active Days</p>
              </div>
              <div className="text-center p-2 bg-[#090B1B]/50 backdrop-blur-sm border border-[#F5E7C6]/5 rounded-xl">
                <p className="text-xs font-medium text-[#A8A0B8] truncate">{streak.last_active || 'N/A'}</p>
                <p className="text-[10px] text-[#6B6580]">Last Active</p>
              </div>
            </div>
          </div>
        )}

        {techStack && allLanguages.length > 0 && (
          <div className="premium-card rounded-2xl">
            <div className="px-4 py-3 border-b border-[#F5E7C6]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💻</span>
                <h4 className="text-sm font-semibold text-[#F5E7C6]">Tech Stack</h4>
                <span className="text-xs text-[#6B6580]">({techStack.total_repos} repos)</span>
              </div>
              {hiddenCount > 0 && (
                <button onClick={showAllHidden} className="text-xs text-[#FF6D1F] hover:underline">
                  Show {hiddenCount} hidden
                </button>
              )}
            </div>
            <div className="p-4">
              {techStack.top_language && !hiddenLanguages.has(techStack.top_language) && (
                <div className="mb-3 inline-flex items-center gap-2 px-2 py-1 bg-[#FF6D1F]/10 rounded-full text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(techStack.top_language) }}></span>
                  <span className="text-[#FF6D1F] font-medium">{techStack.top_language}</span>
                  <span className="text-[#6B6580]">Top</span>
                </div>
              )}
              <div className="space-y-2">
                {displayedLanguages.map(([lang, count]) => {
                  const maxCount = visibleLanguages[0]?.[1] || 1;
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={lang} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(lang) }}></span>
                          <span className="text-sm text-[#F5E7C6]">{lang}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B6580]">{count}</span>
                          <button
                            onClick={() => toggleLanguage(lang)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#1E2345] rounded transition-opacity"
                            title="Hide"
                          >
                            <svg className="w-3 h-3 text-[#6B6580] hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#090B1B]/50 backdrop-blur-sm border border-[#F5E7C6]/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: getLanguageColor(lang) }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMoreLanguages && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-3 w-full py-1.5 text-xs text-[#FF6D1F] hover:bg-[#FF6D1F]/10 rounded-md transition-colors"
                >
                  {showAll ? 'Show less' : `Show ${visibleLanguages.length - 6} more`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <a
          href={user.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[#090B1B]/50 backdrop-blur-sm border border-[#F5E7C6]/10 hover:border-[#FF6D1F]/50 rounded-xl transition-all text-[#F5E7C6] hover:shadow-lg hover:shadow-[#FF6D1F]/10"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          View Profile
        </a>
        {user.blog && (
          <a
            href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[#090B1B]/50 backdrop-blur-sm border border-[#F5E7C6]/10 hover:border-green-500/50 rounded-xl transition-all text-[#F5E7C6] hover:shadow-lg hover:shadow-green-500/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Website
          </a>
        )}
        {user.twitter_username && (
          <a
            href={`https://twitter.com/${user.twitter_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[#090B1B]/50 backdrop-blur-sm border border-[#F5E7C6]/10 hover:border-[#F5E7C6]/50 rounded-xl transition-all text-[#F5E7C6] hover:shadow-lg hover:shadow-[#F5E7C6]/10"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @{user.twitter_username}
          </a>
        )}
      </div>
    </div>
  );
};
