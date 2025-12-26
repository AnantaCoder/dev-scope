import React from 'react';
import { DevAIMention } from '../types';

// Helper to parse mentions which could be string or array
export const parseMentions = (mentions: DevAIMention[] | string | undefined): DevAIMention[] => {
    if (!mentions) return [];
    if (Array.isArray(mentions)) return mentions;
    if (typeof mentions === 'string') {
        try {
            const parsed = JSON.parse(mentions);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

// Format inline elements (bold, italic, code, links) with support for nesting
export const formatInline = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Regex for various markdown elements
    // 1. Code: `...`
    // 2. Bold: **...**
    // 3. Italic: *...* or _..._
    // 4. Link: [text](url)
    const tokenRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*|_[^_]+_)|(\[[^\]]+\]\([^)]+\))/g;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
        // Add text before key
        if (match.index > lastIndex) {
            elements.push(text.slice(lastIndex, match.index));
        }

        const fullMatch = match[0];
        const [code, bold, italic, link] = match.slice(1);

        if (code) {
            elements.push(
                <code key={`code-${match.index}`} className="bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-300 text-[13px] font-mono">
                    {code.slice(1, -1)}
                </code>
            );
        } else if (bold) {
            elements.push(
                <strong key={`bold-${match.index}`} className="font-semibold text-white">
                    {formatInline(bold.slice(2, -2))}
                </strong>
            );
        } else if (italic) {
            elements.push(
                <em key={`italic-${match.index}`} className="italic">
                    {formatInline(italic.slice(1, -1))}
                </em>
            );
        } else if (link) {
            const linkMatch = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
                const [, linkText, linkUrl] = linkMatch;
                elements.push(
                    <a
                        key={`link-${match.index}`}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                        onClick={(e) => e.stopPropagation()} // Prevent parent clicks
                    >
                        {formatInline(linkText)}
                    </a>
                );
            } else {
                elements.push(fullMatch);
            }
        }

        lastIndex = tokenRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
    }

    return elements;
};

// Format message content with comprehensive markdown support
export const formatContent = (content: string): React.ReactNode[] => {
    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, partIndex) => {
        // Handle fenced code blocks
        if (part.startsWith("```")) {
            const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
            if (match) {
                const lang = match[1] || '';
                return (
                    <pre key={partIndex} className="bg-zinc-900 rounded-xl p-4 overflow-x-auto my-4 text-[13px] border border-zinc-700/50 shadow-lg">
                        {lang && (
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-700/50">
                                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{lang}</span>
                            </div>
                        )}
                        <code className="text-zinc-200 font-mono whitespace-pre leading-relaxed">{match[2]}</code>
                    </pre>
                );
            }
        }

        // Process non-code content
        const lines = part.split('\n');
        const elements: React.ReactNode[] = [];
        let tableBuffer: string[] = [];
        let listBuffer: { type: 'ul' | 'ol', items: string[] } | null = null;

        const flushTable = () => {
            if (tableBuffer.length >= 2) {
                const headerLine = tableBuffer[0];
                const dataLines = tableBuffer.slice(2); // Skip separator
                const headers = headerLine.split('|').filter(h => h.trim()).map(h => h.trim());

                elements.push(
                    <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-zinc-700/50">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-800/80">
                                <tr>
                                    {headers.map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider border-b border-zinc-700/50">
                                            {formatInline(h)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {dataLines.map((row, rowIndex) => {
                                    const cells = row.split('|').filter(c => c.trim()).map(c => c.trim());
                                    return (
                                        <tr key={rowIndex} className="hover:bg-zinc-800/40 transition-colors">
                                            {cells.map((cell, cellIndex) => (
                                                <td key={cellIndex} className="px-4 py-3 text-zinc-300">
                                                    {formatInline(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            }
            tableBuffer = [];
        };

        const flushList = () => {
            if (listBuffer) {
                const ListTag = listBuffer.type === 'ol' ? 'ol' : 'ul';
                elements.push(
                    <ListTag
                        key={`list-${elements.length}`}
                        className={`my-3 ml-4 space-y-1.5 ${listBuffer.type === 'ol' ? 'list-decimal' : 'list-disc'} list-inside`}
                    >
                        {listBuffer.items.map((item, i) => (
                            <li key={i} className="text-zinc-300 leading-relaxed">
                                <span className="-ml-1">{formatInline(item)}</span>
                            </li>
                        ))}
                    </ListTag>
                );
                listBuffer = null;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Check for table start
            if (trimmedLine.includes('|') && !trimmedLine.startsWith('|--')) {
                flushList();
                tableBuffer.push(trimmedLine);
                continue;
            }

            // Check for table separator
            if (trimmedLine.match(/^\|?[\s-:|]+\|?$/)) {
                tableBuffer.push(trimmedLine);
                continue;
            }

            // End of table
            if (tableBuffer.length > 0 && !trimmedLine.includes('|')) {
                flushTable();
            }

            // Skip empty lines but add spacing
            if (!trimmedLine) {
                flushList();
                if (elements.length > 0) {
                    elements.push(<div key={`space-${i}`} className="h-2" />);
                }
                continue;
            }

            // Headings
            const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                flushList();
                const level = headingMatch[1].length;
                const headingClasses = [
                    'text-xl font-bold text-white mt-5 mb-3',
                    'text-lg font-semibold text-white mt-4 mb-2',
                    'text-base font-semibold text-zinc-200 mt-3 mb-2',
                    'text-sm font-semibold text-zinc-300 mt-3 mb-1',
                    'text-sm font-medium text-zinc-400 mt-2 mb-1',
                    'text-xs font-medium text-zinc-500 mt-2 mb-1'
                ][level - 1] || 'text-sm font-medium';
                elements.push(
                    <div key={`h-${i}`} className={headingClasses}>
                        {formatInline(headingMatch[2])}
                    </div>
                );
                continue;
            }

            // Horizontal rule
            if (trimmedLine.match(/^([-*_]){3,}$/)) {
                flushList();
                elements.push(<hr key={`hr-${i}`} className="my-4 border-zinc-700/50" />);
                continue;
            }

            // Blockquote
            if (trimmedLine.startsWith('>')) {
                flushList();
                elements.push(
                    <blockquote key={`bq-${i}`} className="my-3 pl-4 border-l-4 border-indigo-500/50 text-zinc-400 italic">
                        {formatInline(trimmedLine.slice(1).trim())}
                    </blockquote>
                );
                continue;
            }

            // Unordered list
            const ulMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
            if (ulMatch) {
                if (!listBuffer || listBuffer.type !== 'ul') {
                    flushList();
                    listBuffer = { type: 'ul', items: [] };
                }
                listBuffer.items.push(ulMatch[1]);
                continue;
            }

            // Ordered list
            const olMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
            if (olMatch) {
                if (!listBuffer || listBuffer.type !== 'ol') {
                    flushList();
                    listBuffer = { type: 'ol', items: [] };
                }
                listBuffer.items.push(olMatch[1]);
                continue;
            }

            // Regular paragraph
            flushList();
            elements.push(
                <p key={`p-${i}`} className="text-zinc-300 leading-relaxed my-1">
                    {formatInline(trimmedLine)}
                </p>
            );
        }

        flushTable();
        flushList();

        return <div key={partIndex}>{elements}</div>;
    });
};
