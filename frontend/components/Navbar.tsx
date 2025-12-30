"use client";

import { ProfileButton } from "@/components/ProfileButton";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
    const { isAuthenticated } = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="bg-[#0F1229]/95 backdrop-blur-xl border-b border-[#F5E7C6]/8 sticky top-0 z-50 shadow-xl shadow-black/30">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                <div className="h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                        <Image src="/logo.svg" alt="DevScope" width={36} height={36} className="rounded-lg group-hover:scale-110 transition-transform" />
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#FF6D1F] via-[#FF8A47] to-[#F5E7C6] bg-clip-text text-transparent font-['Gotham']">DevScope</h1>
                            <p className="text-[10px] text-[#6B6580] -mt-0.5 tracking-wide">GitHub Analytics</p>
                        </div>
                    </Link>

                    {/* Center - Navigation Links */}
                    <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <Link
                            href="/"
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${isActive("/")
                                ? "bg-gradient-to-r from-[#FF6D1F]/20 to-[#CC5719]/20 text-[#F5E7C6] border border-[#FF6D1F]/30 shadow-lg shadow-[#FF6D1F]/10"
                                : "text-[#A8A0B8] hover:text-[#F5E7C6] hover:bg-[#1E2345]/70 border border-transparent"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-sm">Home</span>
                        </Link>

                        <Link
                            href="/rankings"
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${isActive("/rankings")
                                ? "bg-gradient-to-r from-[#F5E7C6]/15 to-[#D4C9A8]/15 text-[#F5E7C6] border border-[#F5E7C6]/30 shadow-lg shadow-[#F5E7C6]/10"
                                : "text-[#A8A0B8] hover:text-[#F5E7C6] hover:bg-[#1E2345]/70 border border-transparent"
                                }`}
                        >
                            <svg className="w-4 h-4 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            <span className="text-sm">Rankings</span>
                        </Link>
                        <Link
                            href="/repos"
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${isActive("/repos")
                                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-[#F5E7C6] border border-green-500/30 shadow-lg shadow-green-500/10"
                                : "text-[#A8A0B8] hover:text-[#F5E7C6] hover:bg-[#1E2345]/70 border border-transparent"
                                }`}
                        >
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="text-sm">Repos</span>
                        </Link>

                        {isAuthenticated && (
                            <Link
                                href="/chat"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${isActive("/chat")
                                    ? "bg-gradient-to-r from-[#FF6D1F]/20 to-[#CC5719]/20 text-[#F5E7C6] border border-[#FF6D1F]/30 shadow-lg shadow-[#FF6D1F]/10"
                                    : "text-[#A8A0B8] hover:text-[#F5E7C6] hover:bg-[#1E2345]/70 border border-transparent"
                                    }`}
                            >
                                <svg className="w-4 h-4 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span className="text-sm">Dev AI</span>
                            </Link>
                        )}

                    </nav>

                    {/* Right Side - Auth */}
                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <NotificationBell />

                        {/* Mobile Navigation */}
                        <div className="flex md:hidden items-center gap-2">
                            <Link
                                href="/"
                                className={`p-2 rounded-lg transition-all ${isActive("/") ? "bg-[#1E2345]" : "hover:bg-[#1E2345]/50"
                                    }`}
                            >
                                <svg className="w-5 h-5 text-[#A8A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </Link>
                            <Link
                                href="/rankings"
                                className={`p-2 rounded-lg transition-all ${isActive("/rankings") ? "bg-[#1E2345]" : "hover:bg-[#1E2345]/50"
                                    }`}
                            >
                                <svg className="w-5 h-5 text-[#F5E7C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </Link>
                            <Link
                                href="/repos"
                                className={`p-2 rounded-lg transition-all ${isActive("/repos") ? "bg-[#1E2345]" : "hover:bg-[#1E2345]/50"
                                    }`}
                            >
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </Link>
                            {isAuthenticated && (
                                <Link
                                    href="/chat"
                                    className={`p-2 rounded-lg transition-all ${isActive("/chat") ? "bg-[#1E2345]" : "hover:bg-[#1E2345]/50"
                                        }`}
                                >
                                    <svg className="w-5 h-5 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </Link>
                            )}

                        </div>

                        {/* Profile Button */}
                        <ProfileButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
