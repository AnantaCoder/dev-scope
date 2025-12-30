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
        <div className="flex-shrink-0 p-4 border-t border-[#F5E7C6]/8 bg-[#0F1229]/95 lg:bg-[#0F1229]/60 sticky bottom-0 lg:relative z-10 backdrop-blur-xl pb-safe">
            <div className="max-w-3xl mx-auto">
                {/* Current mentions display */}
                {currentMentions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {currentMentions.map((m, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6D1F]/20 border border-[#FF6D1F]/30 rounded-lg text-xs font-medium text-[#FF8A47]">
                                {m.type === "repo" ? "📁" : m.type === "file" ? "📄" : m.type === "pr" ? "📋" : "👤"} {m.value}
                                <button onClick={() => setCurrentMentions(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-[#FF6D1F] hover:text-[#F5E7C6]">×</button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Input box container */}
                <div className="relative">
                    {/* Sleek @ Mention Popup */}
                    {showMentionPopup && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 premium-card rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-[60vh] lg:max-h-80 z-20">
                            <div className="p-2 lg:p-3 border-b border-[#F5E7C6]/8">
                                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
                                    <div className="flex flex-wrap gap-1">
                                        <button
                                            onClick={() => setMentionType("user")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "user" ? "bg-[#FF6D1F] text-white" : "bg-[#1E2345] text-[#A8A0B8] hover:text-[#F5E7C6]"}`}
                                        >
                                            👤 Users
                                        </button>
                                        <button
                                            onClick={() => setMentionType("repo")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "repo" ? "bg-[#FF6D1F] text-white" : "bg-[#1E2345] text-[#A8A0B8] hover:text-[#F5E7C6]"}`}
                                        >
                                            📁 Repos
                                        </button>
                                        <button
                                            onClick={() => setMentionType("file")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "file" ? "bg-[#FF6D1F] text-white" : "bg-[#1E2345] text-[#A8A0B8] hover:text-[#F5E7C6]"}`}
                                        >
                                            📄 File
                                        </button>
                                        <button
                                            onClick={() => setMentionType("pr")}
                                            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all ${mentionType === "pr" ? "bg-[#FF6D1F] text-white" : "bg-[#1E2345] text-[#A8A0B8] hover:text-[#F5E7C6]"}`}
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
                                            className="w-full lg:flex-1 px-3 py-2 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] text-sm placeholder:text-[#6B6580] focus:outline-none focus:border-[#FF6D1F]/50 focus:ring-2 focus:ring-[#FF6D1F]/20"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>
                            {mentionType === "file" ? (
                                <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
                                    <p className="text-xs text-[#A8A0B8]">File path: <span className="text-[#FF8A47]">owner/repo/path/file</span></p>
                                    <div className="flex flex-col gap-2 lg:flex-row lg:gap-2">
                                        <input
                                            type="text"
                                            value={mentionSearch}
                                            onChange={(e) => setMentionSearch(e.target.value)}
                                            placeholder="owner/repo/path/file.js"
                                            className="w-full lg:flex-1 px-3 py-2 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] text-sm placeholder:text-[#6B6580] focus:outline-none focus:border-[#FF6D1F]/50 focus:ring-2 focus:ring-[#FF6D1F]/20 font-mono"
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
                                            className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] disabled:from-[#1E2345] disabled:to-[#171B38] disabled:text-[#6B6580] text-white rounded-lg text-sm font-medium transition-all"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[#6B6580] hidden lg:block">Example: AnantaCoder/dev-scope/backend/cmd/main.go</p>
                                </div>
                            ) : mentionType === "pr" ? (
                                <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
                                    <p className="text-xs text-[#A8A0B8]">Enter PR: <span className="text-[#FF8A47]">owner/repo#123</span></p>
                                    <div className="flex flex-col gap-2 lg:flex-row lg:gap-2">
                                        <input
                                            type="text"
                                            value={mentionSearch}
                                            onChange={(e) => setMentionSearch(e.target.value)}
                                            placeholder="owner/repo#123"
                                            className="w-full lg:flex-1 px-3 py-2 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] text-sm placeholder:text-[#6B6580] focus:outline-none focus:border-[#FF6D1F]/50 focus:ring-2 focus:ring-[#FF6D1F]/20 font-mono"
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
                                            className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] disabled:from-[#1E2345] disabled:to-[#171B38] disabled:text-[#6B6580] text-white rounded-lg text-sm font-medium transition-all"
                                        >
                                            Review
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[#6B6580]">Example: vercel/next.js#54321</p>
                                </div>
                            ) : (
                                <div className="max-h-52 overflow-y-auto">
                                    {searchLoading ? (
                                        <div className="flex items-center justify-center py-6">
                                            <div className="w-5 h-5 border-2 border-[#1E2345] border-t-[#FF6D1F] rounded-full animate-spin" />
                                        </div>
                                    ) : mentionResults.length === 0 && mentionSearch ? (
                                        <div className="text-center py-6 text-sm text-[#6B6580]">No results found</div>
                                    ) : (
                                        mentionResults.map((result, i) => (
                                            <button
                                                key={i}
                                                onClick={() => addMention(result)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1E2345]/60 transition-colors text-left border-b border-[#F5E7C6]/5 last:border-0"
                                            >
                                                {"full_name" in result ? (
                                                    <>
                                                        <div className="w-9 h-9 bg-[#1E2345] rounded-lg flex items-center justify-center text-lg">📁</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-[#F5E7C6] truncate">{result.full_name}</div>
                                                            <div className="text-xs text-[#6B6580] truncate">{result.description || "No description"}</div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-[#A8A0B8]">
                                                            <span>⭐</span> {result.stars.toLocaleString()}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Image src={result.avatar_url!} alt={result.login} width={36} height={36} className="w-9 h-9 rounded-lg" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-[#F5E7C6]">{result.login}</div>
                                                            <div className="text-xs text-[#6B6580]">{result.type}</div>
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
                                className="w-full px-4 py-2 text-xs text-[#6B6580] hover:bg-[#1E2345]/50 border-t border-[#F5E7C6]/8 transition-colors"
                            >
                                Press Esc to close
                            </button>
                        </div>
                    )}

                    {/* Main input */}
                    <div className="flex items-end gap-3 premium-card rounded-2xl p-2">
                        <textarea
                            ref={inputRef}
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask anything... (@ to mention users or repos)"
                            disabled={isLoading}
                            rows={1}
                            className="chat-input-no-focus flex-1 px-3 py-2 bg-transparent text-[#F5E7C6] text-sm placeholder:text-[#6B6580] outline-none focus:outline-none focus:ring-0 focus:border-0 disabled:opacity-50 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
                            style={{ height: 'auto', boxShadow: 'none', border: 'none' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!message.trim() || isLoading}
                            className="p-3 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] disabled:from-[#1E2345] disabled:to-[#171B38] disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0 shadow-lg shadow-[#FF6D1F]/20 disabled:shadow-none outline-none focus:outline-none"
                        >
                            <svg className="w-5 h-5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-[10px] text-[#6B6580] text-center mt-2">Dev AI can make mistakes. Verify important information.</p>
                </div>
            </div>
        </div>
    );
};
