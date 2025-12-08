import React from 'react';
import Image from 'next/image';
import type { GitHubUser } from '@/types';

interface UserProfileCardProps {
    user: GitHubUser;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
    return (
        <div className="mt-6 space-y-4">
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
                <div className="flex gap-6">
                    <div className="relative">
                        <Image
                            src={user.avatar_url}
                            alt={user.login}
                            width={120}
                            height={120}
                            className="rounded-2xl ring-2 ring-gray-700"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-gray-950"></div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1">{user.name || user.login}</h3>
                        <p className="text-gray-400 mb-3">@{user.login}</p>
                        {user.bio && (
                            <p className="text-gray-300 text-sm mb-4 leading-relaxed">{user.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
                            {user.location && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{user.location}</span>
                                </div>
                            )}
                            {user.company && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{user.company}</span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-blue-400">{user.public_repos}</p>
                                <p className="text-xs text-gray-500 mt-1">Repositories</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-purple-400">{user.followers}</p>
                                <p className="text-xs text-gray-500 mt-1">Followers</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-green-400">{user.following}</p>
                                <p className="text-xs text-gray-500 mt-1">Following</p>
                            </div>
                        </div>
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium group"
                        >
                            <span>View Profile on GitHub</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
