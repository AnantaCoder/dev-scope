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
        <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 relative">

            {/* Back to Home Button */}
            <button
                onClick={() => router.push("/")}
                className="cursor-pointer absolute left-4 top-4 flex items-center gap-2 text-sm text-[#9aa6b2] hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
            </button>

            <div className="bg-[#0b1220] rounded-2xl shadow-2xl border border-[#20232a] p-6 sm:p-8 mt-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Choose Your Access Level
                    </h2>
                    <p className="text-sm sm:text-base text-[#9aa6b2] mt-2">
                        Select the sign-in scope that suits your needs. You can always update this later.
                    </p>
                </div>

                {/* Options */}
                <div className="grid gap-6 sm:grid-cols-2">

                    {/* Quick Sign In */}
                    <div className="flex flex-col p-5 rounded-xl border border-[#25303a] bg-[#0d1523] hover:border-[#2ea043] transition">
                        <div className="flex items-center text-[#238636] mb-3">
                            <Zap className="w-6 h-6 mr-3" />
                            <h3 className="text-xl font-semibold text-white">
                                Quick Sign In
                            </h3>
                        </div>

                        <p className="text-sm text-[#9aa6b2] flex-grow">
                            <strong>Basic Access.</strong> View your public profile, rankings, and leaderboards. No private data permissions required.
                        </p>

                        <button
                            onClick={() => startLogin("basic")}
                            className="cursor-pointer mt-6 w-full py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#238636]/50"
                        >
                            Start Quick Sign In
                        </button>
                    </div>

                    {/* Full Access */}
                    <div className="flex flex-col p-5 rounded-xl border border-[#33263a] bg-[#0d1523] hover:border-[#6b46c1] transition">
                        <div className="flex items-center text-purple-400 mb-3">
                            <Lock className="w-6 h-6 mr-3" />
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-semibold text-white">
                                    Full Access
                                </h3>
                                <span className="text-xs font-semibold text-purple-300 px-2 py-0.5 bg-purple-600/20 rounded-full">
                                    PRO
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-[#9aa6b2] flex-grow">
                            <strong>Full Access.</strong> Includes private repository statistics and advanced analytics. Requires additional GitHub permissions.
                        </p>

                        <button
                            onClick={() => startLogin("full")}
                            className="cursor-pointer mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/40 transition focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                        >
                            Enable Full Access
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-[#7b8794] leading-relaxed">
                    By continuing, you will be securely redirected to <strong>GitHub</strong> to approve the selected permissions. We request only what is necessary.
                </p>
            </div>
        </div>
    );
}
