import React from 'react';
import { GitHubUserStats } from '../types';

export const UserComparisonCard = ({ users }: { users: GitHubUserStats[] }) => {
    if (users.length < 2) return null;

    const maxFollowers = Math.max(...users.map(u => u.followers));
    const maxRepos = Math.max(...users.map(u => u.public_repos));

    return (
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                User Comparison
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {users.map((user, i) => (
                    <div key={i} className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-700/30">
                        <div className="flex items-center gap-2 mb-2">
                            <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-lg" />
                            <div>
                                <div className="text-sm font-medium text-white">{user.login}</div>
                                {user.name && <div className="text-[10px] text-zinc-500">{user.name}</div>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="text-zinc-500">Followers</span>
                                    <span className="text-zinc-300">{user.followers.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: `${(user.followers / maxFollowers) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="text-zinc-500">Repos</span>
                                    <span className="text-zinc-300">{user.public_repos.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all"
                                        style={{ width: `${(user.public_repos / maxRepos) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
