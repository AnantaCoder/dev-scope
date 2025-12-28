import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Message, Conversation, UserResult } from '../types';
import { parseMentions, formatContent } from '../utils/markdownUtils';
// import { UserComparisonCard } from './UserComparisonCard';

// Typewriter component for incremental text rendering
const Typewriter = ({ content, onComplete }: { content: string, onComplete?: () => void }) => {
    const [displayedContent, setDisplayedContent] = React.useState("");
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        // Reset if content changes drastically (e.g. new message)
        if (currentIndex === 0 && content.length > 0) {
            setDisplayedContent("");
        }
    }, [content, currentIndex]);

    React.useEffect(() => {
        if (currentIndex < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(prev => prev + content[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 3); // Fast typing speed

            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, content, onComplete]);

    return <div className="text-sm leading-relaxed">{formatContent(displayedContent)}</div>;
};

interface MessageListProps {
    currentConversation: Conversation | null;
    isLoading: boolean;
    user: any; // Using any for auth user context flexibility
    copyToClipboard: (content: string, msgId: number) => void;
    copiedMsgId: number | null;
    setShowCodeModal: (show: boolean) => void;
    exportConversation: () => void;
    setShowShortcuts: (show: boolean) => void;
    showShortcuts: boolean;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    isSwitching: boolean;
    latestResponseId: number | null;
}

export const MessageList: React.FC<MessageListProps> = ({
    currentConversation,
    isLoading,
    user,
    copyToClipboard,
    copiedMsgId,
    setShowCodeModal,
    exportConversation,
    setShowShortcuts,
    showShortcuts,
    isSidebarOpen,
    setIsSidebarOpen,
    isSwitching,
    latestResponseId
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentConversation?.messages, isLoading]);

    return (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Fixed Header */}
            <div className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-5 bg-zinc-900/30 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-white">Dev AI</h1>
                            <p className="text-xs text-zinc-500">Your coding assistant</p>
                        </div>
                    </div>
                </div>
                {/* Header Actions */}
                <div className="flex items-center gap-2">
                    {currentConversation && (
                        <button
                            onClick={exportConversation}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                            title="Export as Markdown"
                        >
                            <svg className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => setShowCodeModal(true)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                        title="Analyze Code"
                    >
                        <svg className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowShortcuts(!showShortcuts)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                        title="Keyboard Shortcuts (?)"
                    >
                        <svg className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {!currentConversation || currentConversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20">
                            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Welcome to Dev AI</h2>
                        <p className="text-zinc-500 mb-6 text-sm max-w-lg leading-relaxed">
                            Your intelligent coding assistant. Ask questions, analyze code, and get insights about GitHub users and repositories.
                        </p>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mb-6">
                            <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/40 text-left">
                                <div className="w-9 h-9 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-white mb-1">@user Mention</h3>
                                    <p className="text-xs text-zinc-500">Get GitHub profile info, repos, followers, and bio</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/40 text-left">
                                <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-white mb-1">@owner/repo Mention</h3>
                                    <p className="text-xs text-zinc-500">Get repo stats, description, recent commits, and activity</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/40 text-left">
                                <div className="w-9 h-9 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-white mb-1">File Analysis</h3>
                                    <p className="text-xs text-zinc-500">Type @owner/repo/path/file.js to fetch and analyze any file</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/40 text-left">
                                <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-white mb-1">Code Analysis</h3>
                                    <p className="text-xs text-zinc-500">Click &lt;/&gt; icon to paste code for AI review</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/40 text-left md:col-span-2 md:max-w-sm md:mx-auto">
                                <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-white mb-1">Export Chat</h3>
                                    <p className="text-xs text-zinc-500">Download conversation as Markdown file</p>
                                </div>
                            </div>
                        </div>

                        {/* Keyboard shortcuts hint */}
                        <div className="flex items-center gap-4 text-xs text-zinc-600">
                            <span>Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">?</kbd> for shortcuts</span>
                            <span>•</span>
                            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl+N</kbd> new chat</span>
                            <span>•</span>
                            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl+K</kbd> focus input</span>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {isSwitching ? (
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                </div>
                                <p className="text-zinc-500 text-sm animate-pulse">Loading conversation...</p>
                            </div>
                        ) : (
                            currentConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] group ${msg.role === "user" ? "" : ""}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {msg.role === "assistant" ? (
                                                <>
                                                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-medium text-zinc-400">Dev AI</span>
                                                    <button
                                                        onClick={() => copyToClipboard(msg.content, msg.id)}
                                                        className="ml-auto p-1.5 hover:bg-zinc-700 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Copy response"
                                                    >
                                                        {copiedMsgId === msg.id ? (
                                                            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-xs font-medium text-zinc-400">You</span>
                                                    {user?.avatar_url && (
                                                        <Image src={user.avatar_url} alt="You" width={28} height={28} className="w-7 h-7 rounded-lg" />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50"}`}>
                                            {parseMentions(msg.mentions).length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {parseMentions(msg.mentions).map((m, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 rounded-md text-[11px] font-medium text-indigo-300">
                                                            {m.type === "repo" ? "📁" : "👤"} {m.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {msg.role === "assistant" && latestResponseId === msg.id ? (
                                                <Typewriter content={msg.content} />
                                            ) : (
                                                <div className="text-sm leading-relaxed">{formatContent(msg.content)}</div>
                                            )}
                                        </div>
                                        {/* Copy button below AI messages */}
                                        {msg.role === "assistant" && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    onClick={() => copyToClipboard(msg.content, msg.id)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                                                >
                                                    {copiedMsgId === msg.id ? (
                                                        <>
                                                            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-green-400">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[85%]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-zinc-400">Dev AI</span>
                                    </div>
                                    <div className="bg-zinc-800/80 rounded-2xl px-4 py-4 border border-zinc-700/50">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-xs text-zinc-500">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
};
