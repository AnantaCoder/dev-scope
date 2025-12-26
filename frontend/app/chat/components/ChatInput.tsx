import React from 'react';
import Image from 'next/image';
import { DevAIMention, RepoResult, UserResult } from '../types';

interface ChatInputProps {
    message: string;
    isLoading: boolean;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    sendMessage: () => void;
    currentMentions: DevAIMention[];
    setCurrentMentions: React.Dispatch<React.SetStateAction<DevAIMention[]>>;
    // Mention Popup Props
    showMentionPopup: boolean;
    setShowMentionPopup: (show: boolean) => void;
    mentionType: "user" | "repo" | "file" | "pr";
    setMentionType: (type: "user" | "repo" | "file" | "pr") => void;
    mentionSearch: string;
    setMentionSearch: (search: string) => void;
    mentionResults: (RepoResult | UserResult)[];
    searchLoading: boolean;
    addMention: (result: RepoResult | UserResult) => void;
    mentionSearchRef: React.RefObject<HTMLInputElement | null>; // Fix type: HTMLInputElement | null
    setMessage: (msg: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    message,
    isLoading,
    inputRef,
    handleInputChange,
    handleKeyPress,
    sendMessage,
    currentMentions,
    setCurrentMentions,
    showMentionPopup,
    setShowMentionPopup,
    mentionType,
    setMentionType,
    mentionSearch,
    setMentionSearch,
    mentionResults,
    searchLoading,
    addMention,
    mentionSearchRef,
    setMessage
}) => {
    return (
        <div className="flex-shrink-0 p-4 border-t border-zinc-800/60 bg-zinc-900/95 lg:bg-zinc-900/50 sticky bottom-0 lg:relative z-10 backdrop-blur-lg lg:backdrop-blur-none pb-safe">
            <div className="max-w-3xl mx-auto">
                {/* Current mentions display */}
                {currentMentions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {currentMentions.map((m, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs font-medium text-indigo-300">
                                {m.type === "repo" ? "📁" : "👤"} {m.value}
                                <button onClick={() => setCurrentMentions(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-indigo-400 hover:text-white">×</button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Input box container */}
                <div className="relative">
                    {/* Sleek @ Mention Popup */}
                    {showMentionPopup && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-[60vh] lg:max-h-80 z-20">
                            <div className="p-2 lg:p-3 border-b border-zinc-800">
                                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
                                    <div className="flex flex-wrap gap-1">
                                        <button
                                            onClick={() => setMentionType("user")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "user" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                        >
                                            👤 Users
                                        </button>
                                        <button
                                            onClick={() => setMentionType("repo")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "repo" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                        >
                                            📁 Repos
                                        </button>
                                        <button
                                            onClick={() => setMentionType("file")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "file" ? "bg-cyan-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                        >
                                            📄 File
                                        </button>
                                        <button
                                            onClick={() => setMentionType("pr")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "pr" ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                        >
                                            📋 PR
                                        </button>
                                    </div>
                                    {mentionType !== "file" && mentionType !== "pr" && (
                                        <input
                                            ref={mentionSearchRef as React.RefObject<HTMLInputElement>}
                                            type="text"
                                            value={mentionSearch}
                                            onChange={(e) => setMentionSearch(e.target.value)}
                                            placeholder={`Search ${mentionType === "repo" ? "repos" : "users"}...`}
                                            className="w-full lg:flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>
                            {mentionType === "file" ? (
                                <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
                                    <p className="text-xs text-zinc-400">File path: <span className="text-cyan-400">owner/repo/path/file</span></p>
                                    <div className="flex flex-col gap-2 lg:flex-row lg:gap-2">
                                        <input
                                            type="text"
                                            value={mentionSearch}
                                            onChange={(e) => setMentionSearch(e.target.value)}
                                            placeholder="owner/repo/path/file.js"
                                            className="w-full lg:flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                if (mentionSearch && mentionSearch.split('/').length >= 3) {
                                                    const mention: DevAIMention = { type: "file", value: mentionSearch };
                                                    setCurrentMentions(prev => [...prev, mention]);
                                                    const cursorPos = inputRef.current?.selectionStart || message.length;
                                                    const textBeforeCursor = message.slice(0, cursorPos);
                                                    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
                                                    if (lastAtIndex !== -1) {
                                                        const newMessage = message.slice(0, lastAtIndex) + `@${mentionSearch} ` + message.slice(cursorPos);
                                                        setMessage(newMessage);
                                                    }
                                                    setShowMentionPopup(false);
                                                    setMentionSearch("");
                                                    inputRef.current?.focus();
                                                }
                                            }}
                                            disabled={!mentionSearch || mentionSearch.split('/').length < 3}
                                            className="w-full lg:w-auto px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 hidden lg:block">Example: AnantaCoder/dev-scope/backend/cmd/main.go</p>
                                </div>
                            ) : mentionType === "pr" ? (
                                <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
                                    <p className="text-xs text-zinc-400">Enter PR: <span className="text-green-400">owner/repo#123</span></p>
                                    <div className="flex flex-col gap-2 lg:flex-row lg:gap-2">
                                        <input
                                            type="text"
                                            value={mentionSearch}
                                            onChange={(e) => setMentionSearch(e.target.value)}
                                            placeholder="owner/repo#123"
                                            className="w-full lg:flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-green-500 font-mono"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                if (mentionSearch && mentionSearch.includes('/') && mentionSearch.includes('#')) {
                                                    const mention: DevAIMention = { type: "pr", value: mentionSearch };
                                                    setCurrentMentions(prev => [...prev, mention]);
                                                    const cursorPos = inputRef.current?.selectionStart || message.length;
                                                    const textBeforeCursor = message.slice(0, cursorPos);
                                                    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
                                                    if (lastAtIndex !== -1) {
                                                        const newMessage = message.slice(0, lastAtIndex) + `@${mentionSearch} ` + message.slice(cursorPos);
                                                        setMessage(newMessage);
                                                    }
                                                    setShowMentionPopup(false);
                                                    setMentionSearch("");
                                                    inputRef.current?.focus();
                                                }
                                            }}
                                            disabled={!mentionSearch || !mentionSearch.includes('#') || mentionSearch.split('#')[1]?.length === 0}
                                            className="w-full lg:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Review
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-600">Example: vercel/next.js#54321</p>
                                </div>
                            ) : (
                                <div className="max-h-52 overflow-y-auto">
                                    {searchLoading ? (
                                        <div className="flex items-center justify-center py-6">
                                            <div className="w-5 h-5 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                                        </div>
                                    ) : mentionResults.length === 0 && mentionSearch ? (
                                        <div className="text-center py-6 text-sm text-zinc-500">No results found</div>
                                    ) : (
                                        mentionResults.map((result, i) => (
                                            <button
                                                key={i}
                                                onClick={() => addMention(result)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left border-b border-zinc-800/50 last:border-0"
                                            >
                                                {"full_name" in result ? (
                                                    <>
                                                        <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center text-lg">📁</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-white truncate">{result.full_name}</div>
                                                            <div className="text-xs text-zinc-500 truncate">{result.description || "No description"}</div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                                                            <span>⭐</span> {result.stars.toLocaleString()}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Image src={result.avatar_url!} alt={result.login} width={36} height={36} className="w-9 h-9 rounded-lg" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-white">{result.login}</div>
                                                            <div className="text-xs text-zinc-500">{result.type}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setShowMentionPopup(false)}
                                className="w-full px-4 py-2 text-xs text-zinc-500 hover:bg-zinc-800/50 border-t border-zinc-800 transition-colors"
                            >
                                Press Esc to close
                            </button>
                        </div>
                    )}

                    {/* Main input */}
                    <div className="flex items-end gap-3 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-colors">
                        <textarea
                            ref={inputRef}
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask anything... (@ to mention users or repos)"
                            disabled={isLoading}
                            rows={1}
                            className="flex-1 px-3 py-2 bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none disabled:opacity-50 resize-y min-h-[40px] max-h-[50vh]"
                            style={{ height: 'auto' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                // Max height is 50vh
                                const maxHeight = window.innerHeight * 0.5;
                                target.style.height = Math.min(target.scrollHeight, maxHeight) + 'px';
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!message.trim() || isLoading}
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0"
                        >
                            <svg className="w-5 h-5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 text-center mt-2">Dev AI can make mistakes. Verify important information.</p>
                </div>
            </div>
        </div>
    );
};
