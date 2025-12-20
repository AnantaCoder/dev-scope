"use client";

import { ReactNode } from "react";

interface AIAnalysisButtonProps {
    onClick: () => void;
    loading: boolean;
    cooldown: number;
    disabled?: boolean;
    variant?: "default" | "compact" | "outline";
    className?: string;
    children?: ReactNode;
}

/**
 * Reusable AI Analysis button with loading, cooldown, and disabled states
 */
export function AIAnalysisButton({
    onClick,
    loading,
    cooldown,
    disabled = false,
    variant = "default",
    className = "",
    children,
}: AIAnalysisButtonProps) {
    const isDisabled = disabled || loading || cooldown > 0;

    const baseStyles = "flex items-center justify-center gap-2 font-semibold rounded-xl transition-all";

    const variantStyles = {
        default: "py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white",
        compact: "py-2 px-4 text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20",
        outline: "py-3 px-6 bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10",
    };

    const disabledStyles = "disabled:opacity-60 disabled:cursor-not-allowed";

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
        >
            {loading ? (
                <>
                    <LoadingSpinner />
                    <span>Analyzing...</span>
                </>
            ) : cooldown > 0 ? (
                <>
                    <span>⏱️</span>
                    <span>Wait {cooldown}s</span>
                </>
            ) : (
                children || (
                    <>
                        <AIIcon />
                        <span>AI Analysis</span>
                    </>
                )
            )}
        </button>
    );
}

// Loading spinner component
function LoadingSpinner() {
    return (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
    );
}

// AI icon component
function AIIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
        </svg>
    );
}

export default AIAnalysisButton;
