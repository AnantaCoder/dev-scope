"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Lock, Zap, ArrowLeft } from "lucide-react";

/**
 * Renders a card component allowing the user to choose between two sign-in scopes: "basic" or "full".
 * Both options redirect the user to an external login flow with a `pref` query parameter.
 */
export default function ChooseSignInCard() {
    const router = useRouter();

    // Initiates the login flow
    const startLogin = (scope: "basic" | "full") => {
        const pref = scope === "basic" ? "basic" : "full";
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const loginPath = `/api/auth/login?pref=${pref}`;

        if (apiUrl) {
            window.location.href = `${apiUrl}${loginPath}`;
        } else {
            window.location.href = loginPath;
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto p-3 sm:p-6 relative">

            {/* Back to Home Button */}
            <button
                onClick={() => router.push("/")}
                className="cursor-pointer absolute left-3 sm:left-4 top-3 sm:top-4 flex items-center gap-1.5 text-xs sm:text-sm text-[#9aa6b2] hover:text-white transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Home</span>
            </button>

            <div className="bg-[#0b1220] rounded-xl sm:rounded-2xl shadow-2xl border border-[#20232a] p-4 sm:p-6 mt-8 sm:mt-10">

                {/* Header */}
                <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                        Choose Your Access Level
                    </h2>
                    <p className="text-xs sm:text-sm text-[#9aa6b2] mt-1.5 sm:mt-2">
                        Select the sign-in scope that suits your needs. You can always update this later.
                    </p>
                </div>

                {/* Options */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">

                    {/* Quick Sign In */}
                    <div className="flex flex-col p-3 sm:p-4 rounded-lg sm:rounded-xl border border-[#F5A623]/30 bg-gradient-to-br from-[#F5A623]/10 to-[#E8941F]/5 hover:border-[#F5A623]/50 transition">
                        <div className="flex items-center text-[#F5A623] mb-2 sm:mb-3">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                            <h3 className="text-base sm:text-lg font-semibold text-white">
                                Quick Sign In
                            </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-[#9aa6b2] flex-grow leading-relaxed">
                            <strong>Basic Access.</strong> View your public profile, rankings, and leaderboards. No private data permissions required.
                        </p>

                        <button
                            onClick={() => startLogin("basic")}
                            className="cursor-pointer mt-3 sm:mt-4 w-full py-2 sm:py-2.5 bg-[#F5A623] hover:bg-[#E8941F] text-white text-sm font-bold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 shadow-lg shadow-[#F5A623]/20"
                        >
                            Start Quick Sign In
                        </button>
                    </div>

                    {/* Full Access */}
                    <div className="flex flex-col p-3 sm:p-4 rounded-lg sm:rounded-xl border border-[#FF6D1F]/30 bg-gradient-to-br from-[#FF6D1F]/15 to-[#CC5719]/10 hover:border-[#FF6D1F]/50 transition">
                        <div className="flex items-center text-[#FF6D1F] mb-2 sm:mb-3">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-white">
                                    Full Access
                                </h3>
                                <span className="text-[10px] sm:text-xs font-semibold text-[#FF8A47] px-1.5 py-0.5 bg-[#FF6D1F]/20 rounded-full">
                                    PRO
                                </span>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[#9aa6b2] flex-grow leading-relaxed">
                            <strong>Full Access.</strong> Includes private repository statistics and advanced analytics. Requires additional GitHub permissions.
                        </p>

                        <button
                            onClick={() => startLogin("full")}
                            className="cursor-pointer mt-3 sm:mt-4 w-full py-2 sm:py-2.5 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] text-white text-sm font-bold rounded-lg shadow-lg shadow-[#FF6D1F]/30 transition focus:outline-none focus:ring-2 focus:ring-[#FF6D1F]/50"
                        >
                            Enable Full Access
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs text-[#7b8794] leading-relaxed">
                    By continuing, you will be securely redirected to <strong>GitHub</strong> to approve the selected permissions. We request only what is necessary.
                </p>
            </div>
        </div>
    );
}
