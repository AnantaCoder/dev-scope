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

const getLanguageColor = (lang: string) => languageColors[lang] || '#8b949e';

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
      {/* Main Profile Card */}
      <div className="premium-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="shrink-0 mx-auto sm:mx-0">
              <Image
                src={user.avatar_url}
                alt={user.login}
                width={96}
                height={96}
                className="rounded-full ring-1 ring-[#30363d]"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-semibold text-[#e6edf3]">{user.name || user.login}</h3>
              <p className="text-[#8b949e]">@{user.login}</p>
              {user.bio && <p className="text-[#8b949e] text-sm mt-2 line-clamp-2">{user.bio}</p>}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-sm text-[#8b949e]">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {user.location}
                  </span>
                )}
                {user.company && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {user.company}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Joined {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/10">
            <div className="text-center p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-blue-500/30 transition-all">
              <p className="text-xl font-semibold text-white">{user.public_repos}</p>
              <p className="text-xs text-gray-400">Repositories</p>
            </div>
            <div className="text-center p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
              <p className="text-xl font-semibold text-white">{user.followers.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Followers</p>
            </div>
            <div className="text-center p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
              <p className="text-xl font-semibold text-white">{user.following.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Following</p>
            </div>
            <div className="text-center p-3 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl hover:border-blue-500/30 transition-all">
              <p className="text-xl font-semibold text-[#e6edf3]">{user.public_gists}</p>
              <p className="text-xs text-[#8b949e]">Gists</p>
            </div>
          </div>
        </div>
      </div>

      {/* Streak & Tech Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {streak && (
          <div className="premium-card rounded-2xl">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <span className="text-base">🔥</span>
              <h4 className="text-sm font-semibold text-[#e6edf3]">Activity Streak</h4>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-black/30 backdrop-blur-sm border border-orange-500/20 rounded-xl hover:border-orange-500/40 transition-all">
                <p className="text-lg font-semibold text-orange-500">{streak.current_streak}</p>
                <p className="text-[10px] text-gray-400">Current</p>
              </div>
              <div className="text-center p-2 bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-xl hover:border-yellow-500/40 transition-all">
                <p className="text-lg font-semibold text-yellow-500">{streak.longest_streak}</p>
                <p className="text-[10px] text-gray-400">Longest</p>
              </div>
              <div className="text-center p-2 bg-black/30 backdrop-blur-sm border border-green-500/20 rounded-xl hover:border-green-500/40 transition-all">
                <p className="text-lg font-semibold text-green-500">{streak.total_days}</p>
                <p className="text-[10px] text-gray-400">Active Days</p>
              </div>
              <div className="text-center p-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl">
                <p className="text-xs font-medium text-gray-400 truncate">{streak.last_active || 'N/A'}</p>
                <p className="text-[10px] text-gray-400">Last Active</p>
              </div>
            </div>
          </div>
        )}

        {techStack && allLanguages.length > 0 && (
          <div className="premium-card rounded-2xl">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💻</span>
                <h4 className="text-sm font-semibold text-[#e6edf3]">Tech Stack</h4>
                <span className="text-xs text-[#8b949e]">({techStack.total_repos} repos)</span>
              </div>
              {hiddenCount > 0 && (
                <button onClick={showAllHidden} className="text-xs text-[#58a6ff] hover:underline">
                  Show {hiddenCount} hidden
                </button>
              )}
            </div>
            <div className="p-4">
              {techStack.top_language && !hiddenLanguages.has(techStack.top_language) && (
                <div className="mb-3 inline-flex items-center gap-2 px-2 py-1 bg-[#388bfd26] rounded-full text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(techStack.top_language) }}></span>
                  <span className="text-[#58a6ff] font-medium">{techStack.top_language}</span>
                  <span className="text-[#8b949e]">Top</span>
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
                          <span className="text-sm text-[#e6edf3]">{lang}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#8b949e]">{count}</span>
                          <button
                            onClick={() => toggleLanguage(lang)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#30363d] rounded transition-opacity"
                            title="Hide"
                          >
                            <svg className="w-3 h-3 text-[#8b949e] hover:text-[#f85149]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="h-1.5 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: getLanguageColor(lang) }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMoreLanguages && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-3 w-full py-1.5 text-xs text-[#58a6ff] hover:bg-[#388bfd26] rounded-md transition-colors"
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
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-black/30 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 rounded-xl transition-all glow-blue"
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
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-black/30 backdrop-blur-sm border border-white/10 hover:border-green-500/50 rounded-xl transition-all glow-green"
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
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-black/30 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 rounded-xl transition-all glow-blue"
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
