"use client";

import { useAuth } from "@/contexts/AuthContext";

interface SignInCardProps {
    title?: string;
    description?: string;
    variant?: "default" | "rankings" | "repos";
    className?: string;
}

/**
 * Reusable sign-in card component for unauthenticated users
 * Used across rankings, repos, and other pages
 */
export function SignInCard({
    title = "Sign in to get started",
    description = "Login with your GitHub account to access all features.",
    variant = "default",
    className = "",
}: SignInCardProps) {
    const { login } = useAuth();

    // Variant-specific content
    const variants = {
        default: {
            title: title,
            description: description,
            icon: (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        rankings: {
            title: "Want to appear in rankings?",
            description: "Login with your GitHub account to be included in the developer rankings leaderboard. Your profile will be automatically analyzed and ranked based on your contributions, stars, and activity.",
            icon: (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        repos: {
            title: "View Your Repositories",
            description: "Sign in with GitHub to view and manage your repositories. Your starred, forked, and personal projects will all be accessible.",
            icon: (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            ),
        },
    };

    const content = variants[variant];

    return (
        <div className={`premium-card p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 ${className}`}>
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="shrink-0 p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl backdrop-blur-sm">
                    {content.icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{content.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{content.description}</p>
                    <button
                        onClick={login}
                        className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-green-500/20"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        Login with GitHub
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SignInCard;
