"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import Image from "next/image";

export function ProfileButton() {
  const { user, isAuthenticated, loginBasic, loginFull, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowLoginMenu(!showLoginMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg transition-all font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>Sign in with GitHub</span>
          <svg className={`w-3 h-3 transition-transform ${showLoginMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Login Options Dropdown */}
        {showLoginMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowLoginMenu(false)}></div>
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[#e6edf3] mb-3">Choose Sign-in Option</h3>

                {/* Basic Login Option */}
                <button
                  onClick={() => {
                    setShowLoginMenu(false);
                    loginBasic();
                  }}
                  className="w-full text-left p-4 mb-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-blue-500/30 rounded-lg transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 cursor-pointer">
                      <p className="font-semibold text-[#e6edf3] mb-1">Quick Sign In</p>
                      <p className="text-xs text-[#8b949e] leading-relaxed">View your public profile, rankings ...</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-green-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>No private permissions needed</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Full Access Option */}
                <button
                  onClick={() => {
                    setShowLoginMenu(false);
                    loginFull();
                  }}
                  className="w-full text-left p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1 cursor-pointer">
                      <p className="font-semibold text-[#e6edf3] mb-1 flex items-center gap-2">
                        Full Access
                        <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/20 text-purple-300 rounded font-bold">Pro</span>
                      </p>
                      <p className="text-xs text-[#8b949e] leading-relaxed">Access private repository stats ...</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-purple-300">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>Includes private repository access</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg transition-all"
      >
        {user?.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#58a6ff] flex items-center justify-center text-white text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <span className="text-sm font-medium hidden sm:inline text-[#e6edf3]">{user?.username}</span>
        <svg
          className={`w-3 h-3 text-[#8b949e] transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-[#30363d]">
              <div className="flex items-center gap-3 mb-2">
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#58a6ff] flex items-center justify-center text-white text-lg font-bold">
                    {user?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#e6edf3] truncate">{user?.name || user?.username}</p>
                  <p className="text-xs text-[#8b949e] truncate">@{user?.username}</p>
                </div>
              </div>
              {user?.has_private_access && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#238636]/10 border border-[#238636]/30 rounded text-xs text-[#238636]">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0a.5.5 0 0 1 .5.5v.939l5.446 3.537a.5.5 0 1 1-.532.818L8 2.461 2.586 5.794a.5.5 0 0 1-.532-.818L7.5 1.439V.5A.5.5 0 0 1 8 0z" />
                    <path d="M0 6.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5z" />
                    <path d="M0 8a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15A.5.5 0 0 1 0 8zm0 3.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5z" />
                  </svg>
                  <span className="font-medium">Private repos access</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="p-3 border-b border-[#30363d]">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-[#e6edf3]">{user?.followers || 0}</p>
                  <p className="text-[10px] text-[#8b949e]">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#e6edf3]">{user?.following || 0}</p>
                  <p className="text-[10px] text-[#8b949e]">Following</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#e6edf3]">{user?.public_repos || 0}</p>
                  <p className="text-[10px] text-[#8b949e]">Repos</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <a
                href={`/profile/${user?.username}`}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My DevScope Profile</span>
              </a>
              <a
                href={`https://github.com/${user?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span>View on GitHub</span>
              </a>
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#f85149] hover:bg-[#21262d] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
