"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function ProfileButton() {
  const { user, isAuthenticated, loginBasic, loginFull, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowLoginMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const redirectToLogin = () => {
    router.push("/choose-signin?pref=basic");
  };

  if (!isAuthenticated) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={redirectToLogin}
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-br from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-[#FF6D1F]/20"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="sm:hidden">Sign in with Github</span>
          <span className="hidden sm:inline">Sign in with Github</span>
        </button>

        {/* Login Options Dropdown */}
        {showLoginMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowLoginMenu(false)}></div>
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[85vw] bg-[#0F1229]/98 backdrop-blur-xl border border-[#FF6D1F]/20 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
              <div className="p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-[#F5E7C6] mb-2 sm:mb-3 font-['Gotham']">Choose Sign-in Option</h3>

                {/* Basic Login Option */}
                <button
                  onClick={() => {
                    setShowLoginMenu(false);
                    loginBasic();
                  }}
                  className="w-full text-left p-2.5 sm:p-3 mb-2 bg-gradient-to-r from-[#F5A623]/10 to-[#E8941F]/10 hover:from-[#F5A623]/20 hover:to-[#E8941F]/15 border border-[#F5A623]/30 hover:border-[#F5A623]/50 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-[#F5A623]/15 rounded-lg group-hover:bg-[#F5A623]/25 transition-colors">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F5E7C6]">Quick Sign In</p>
                      <p className="text-[10px] sm:text-xs text-[#A8A0B8] truncate">Public profile & rankings</p>
                    </div>
                    <svg className="w-4 h-4 text-[#F5A623] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {/* Full Access Option */}
                <button
                  onClick={() => {
                    setShowLoginMenu(false);
                    loginFull();
                  }}
                  className="w-full text-left p-2.5 sm:p-3 bg-gradient-to-r from-[#FF6D1F]/20 to-[#CC5719]/15 hover:from-[#FF6D1F]/30 hover:to-[#CC5719]/20 border border-[#FF6D1F]/40 hover:border-[#FF6D1F]/60 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-[#FF6D1F]/20 rounded-lg group-hover:bg-[#FF6D1F]/30 transition-colors">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF8A47]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F5E7C6] flex items-center gap-1.5">
                        Full Access
                        <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] bg-[#FF6D1F]/20 text-[#FF8A47] rounded font-bold">PRO</span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-[#A8A0B8] truncate">Private repository stats</p>
                    </div>
                    <svg className="w-4 h-4 text-[#FF8A47] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-[#1E2345] hover:bg-[#171B38] border border-[#F5E7C6]/10 rounded-lg transition-all"
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
          <div className="w-7 h-7 rounded-full bg-[#FF6D1F] flex items-center justify-center text-white text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <span className="text-sm font-medium hidden sm:inline text-[#F5E7C6]">{user?.username}</span>
        <svg
          className={`w-3 h-3 text-[#6B6580] transition-transform ${showDropdown ? "rotate-180" : ""}`}
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
          <div className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] bg-[#0F1229] border border-[#F5E7C6]/10 rounded-xl shadow-2xl z-50 overflow-hidden origin-top-right">
            {/* User Info */}
            <div className="p-4 border-b border-[#F5E7C6]/8">
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
                  <div className="w-12 h-12 rounded-full bg-[#FF6D1F] flex items-center justify-center text-white text-lg font-bold">
                    {user?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#F5E7C6] truncate">{user?.name || user?.username}</p>
                  <p className="text-xs text-[#6B6580] truncate">@{user?.username}</p>
                </div>
              </div>
              {user?.has_private_access && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FF6D1F]/10 border border-[#FF6D1F]/30 rounded text-xs text-[#FF8A47]">
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
            <div className="p-3 border-b border-[#F5E7C6]/8">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-[#F5E7C6]">{user?.followers || 0}</p>
                  <p className="text-[10px] text-[#6B6580]">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#F5E7C6]">{user?.following || 0}</p>
                  <p className="text-[10px] text-[#6B6580]">Following</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#F5E7C6]">{user?.public_repos || 0}</p>
                  <p className="text-[10px] text-[#6B6580]">Repos</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <a
                href={`/profile/${user?.username}`}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#F5E7C6] hover:bg-[#1E2345] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My DevScope Profile</span>
              </a>

              {/* Admin Panel Link */}
              {(user?.username?.toLowerCase() === "anantacoder") && (
                <a
                  href="/admin"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#F5E7C6] hover:bg-[#1E2345] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Admin Panel</span>
                </a>
              )}



              {/* History Link */}
              <a
                href="/history"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#F5E7C6] hover:bg-[#1E2345] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-[#FF8A47]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Search History</span>
              </a>

              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className=" cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#1E2345] rounded-lg transition-colors"
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
