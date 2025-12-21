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
 * Format inline text elements (bold, italic, inline code)
 */
function formatInlineText(text: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    // Match bold (**text**), italic (*text* or _text_), and inline code (`code`)
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }

        const matched = match[0];
        if (matched.startsWith("**") && matched.endsWith("**")) {
            // Bold
            result.push(
                <strong key={key++} className="text-white font-semibold">
                    {matched.slice(2, -2)}
                </strong>
            );
        } else if (matched.startsWith("`") && matched.endsWith("`")) {
            // Inline code
            result.push(
                <code key={key++} className="px-1.5 py-0.5 bg-[#161b22] text-[#f0883e] rounded text-xs font-mono">
                    {matched.slice(1, -1)}
                </code>
            );
        } else if ((matched.startsWith("*") && matched.endsWith("*")) || (matched.startsWith("_") && matched.endsWith("_"))) {
            // Italic
            result.push(
                <em key={key++} className="text-gray-300 italic">
                    {matched.slice(1, -1)}
                </em>
            );
        }

        lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return result.length > 0 ? result : [text];
}

/**
 * Format analysis result with comprehensive markdown styling
 */
function formatAnalysisResult(text: string): React.ReactNode {
    // Split by newlines while preserving structure
    const lines = text.split(/\n/);
    const elements: React.ReactNode[] = [];
    let key = 0;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = "";
    let currentList: { type: "ul" | "ol"; items: { num?: string; content: React.ReactNode }[] } | null = null;

    const flushList = () => {
        if (currentList) {
            if (currentList.type === "ul") {
                elements.push(
                    <ul key={key++} className="my-2 ml-4 space-y-1">
                        {currentList.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>{item.content}</span>
                            </li>
                        ))}
                    </ul>
                );
            } else {
                elements.push(
                    <ol key={key++} className="my-2 ml-4 space-y-1">
                        {currentList.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-purple-400 font-semibold min-w-[1.5rem]">{item.num}</span>
                                <span>{item.content}</span>
                            </li>
                        ))}
                    </ol>
                );
            }
            currentList = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Handle code blocks
        if (trimmedLine.startsWith("```")) {
            if (inCodeBlock) {
                // End code block
                elements.push(
                    <pre key={key++} className="my-2 p-3 bg-[#161b22] border border-[#30363d] rounded-lg overflow-x-auto">
                        <code className="text-xs font-mono text-[#e6edf3]">
                            {codeBlockContent.join("\n")}
                        </code>
                    </pre>
                );
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                // Start code block
                flushList();
                codeBlockLang = trimmedLine.slice(3);
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Empty line - flush list and add spacing
        if (trimmedLine === "") {
            flushList();
            continue;
        }

        // Horizontal rule
        if (trimmedLine.match(/^[-*_]{3,}$/)) {
            flushList();
            elements.push(
                <hr key={key++} className="my-3 border-t border-[#30363d]" />
            );
            continue;
        }

        // Headers
        const headerMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/);
        if (headerMatch) {
            flushList();
            const level = headerMatch[1].length;
            const content = headerMatch[2];
            const headerStyles: Record<number, string> = {
                1: "text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2",
                2: "text-base font-semibold text-white mt-3 mb-2 flex items-center gap-2",
                3: "text-sm font-semibold text-purple-300 mt-2 mb-1",
                4: "text-sm font-medium text-gray-300 mt-2 mb-1",
            };
            const headerContent = (
                <>
                    {level <= 2 && <span className="text-purple-400">◆</span>}
                    {formatInlineText(content)}
                </>
            );
            if (level === 1) {
                elements.push(<h1 key={key++} className={headerStyles[1]}>{headerContent}</h1>);
            } else if (level === 2) {
                elements.push(<h2 key={key++} className={headerStyles[2]}>{headerContent}</h2>);
            } else if (level === 3) {
                elements.push(<h3 key={key++} className={headerStyles[3]}>{headerContent}</h3>);
            } else {
                elements.push(<h4 key={key++} className={headerStyles[4]}>{headerContent}</h4>);
            }
            continue;
        }

        // Bullet list items (-, *, •)
        const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
        if (bulletMatch) {
            if (!currentList || currentList.type !== "ul") {
                flushList();
                currentList = { type: "ul", items: [] };
            }
            currentList.items.push({ content: formatInlineText(bulletMatch[1]) });
            continue;
        }

        // Numbered list items
        const numberedMatch = trimmedLine.match(/^\d+[.)]\s+(.+)$/);
        if (numberedMatch) {
            if (!currentList || currentList.type !== "ol") {
                flushList();
                currentList = { type: "ol", items: [] };
            }
            currentList.items.push({ num: numberedMatch[0].match(/^\d+/)?.[0] + ".", content: formatInlineText(numberedMatch[1]) });
            continue;
        }

        // Regular paragraph
        flushList();
        elements.push(
            <p key={key++} className="my-1.5 leading-relaxed">
                {formatInlineText(trimmedLine)}
            </p>
        );
    }

    // Flush any remaining list
    flushList();

    return <>{elements}</>;
}

export default AIAnalysisResult;
