"use client";

import { ProfileButton } from "@/components/ProfileButton";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
    const { isAuthenticated } = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="bg-[#161b22]/95 backdrop-blur-md border-b border-[#30363d] sticky top-0 z-50">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                <div className="h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Image src="/logo.svg" alt="DevScope" width={36} height={36} className="rounded-lg" />
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-semibold tracking-tight">DevScope</h1>
                            <p className="text-[10px] text-[#8b949e] -mt-0.5">GitHub Analytics</p>
                        </div>
                    </Link>

                    {/* Center - Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            href="/"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive("/")
                                ? "bg-[#21262d] text-[#e6edf3]"
                                : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/50"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-sm font-medium">Home</span>
                        </Link>

                        {isAuthenticated && (
                            <Link
                                href="/rankings"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive("/rankings")
                                        ? "bg-[#21262d] text-[#e6edf3]"
                                        : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/50"
                                    }`}
                            >
                                <svg className="w-4 h-4 text-[#ffd700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                <span className="text-sm font-medium">Rankings</span>
                            </Link>
                        )}
                    </nav>

                    {/* Right Side - Status Pills & Auth */}
                    <div className="flex items-center gap-3">
                        {/* Status Pills - Hidden on mobile */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-full">
                                <div className="w-2 h-2 rounded-full bg-[#238636] animate-pulse"></div>
                                <span className="text-xs text-[#8b949e]">Live</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#a371f7]/10 to-[#a371f7]/5 border border-[#a371f7]/30 rounded-full">
                                <svg className="w-3.5 h-3.5 text-[#a371f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-medium text-[#a371f7]">AI Powered</span>
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        <div className="flex md:hidden items-center gap-2">
                            <Link
                                href="/"
                                className={`p-2 rounded-lg transition-all ${isActive("/") ? "bg-[#21262d]" : "hover:bg-[#21262d]/50"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </Link>
                            {isAuthenticated && (
                                <Link
                                    href="/rankings"
                                    className={`p-2 rounded-lg transition-all ${isActive("/rankings") ? "bg-[#21262d]" : "hover:bg-[#21262d]/50"
                                        }`}
                                >
                                    <svg className="w-5 h-5 text-[#ffd700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
