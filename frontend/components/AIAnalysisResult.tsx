"use client";

interface AIAnalysisResultProps {
    result: string;
    error?: string | null;
    onClear?: () => void;
    showClearButton?: boolean;
    className?: string;
}

/**
 * Reusable AI Analysis result display component
 */
export function AIAnalysisResult({
    result,
    error,
    onClear,
    showClearButton = false,
    className = "",
}: AIAnalysisResultProps) {
    if (!result) return null;

    return (
        <div
            className={`premium-card p-4 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent ${className}`}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                    </svg>
                    AI Insights
                </h4>
                {showClearButton && onClear && (
                    <button
                        onClick={onClear}
                        className="text-[#6e7681] hover:text-white text-xs transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-2 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                    ⚠️ Using fallback analysis (API error)
                </div>
            )}

            <div className="text-sm text-[#c9d1d9] whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none">
                {formatAnalysisResult(result)}
            </div>
        </div>
    );
}

/**
 * Format analysis result with basic markdown-like styling
 */
function formatAnalysisResult(text: string): React.ReactNode {
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((para, i) => {
        // Check for bold text marked with **
        const formatted = para.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={j} className="text-white font-semibold">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });

        return (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
                {formatted}
            </p>
        );
    });
}

export default AIAnalysisResult;
