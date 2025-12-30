import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Conversation } from '../types';
import { parseMentions, formatContent } from '../utils/markdownUtils';

// Typewriter component for incremental text rendering
const Typewriter = ({ content, onComplete }: { content: string, onComplete?: () => void }) => {
    const [displayedContent, setDisplayedContent] = React.useState("");
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (currentIndex === 0 && content.length > 0) {
            setDisplayedContent("");
        }
    }, [content, currentIndex]);

    React.useEffect(() => {
        if (currentIndex < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(prev => prev + content[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 3);

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
    user: any;
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
    isSidebarOpen,
    setIsSidebarOpen,
    isSwitching,
    latestResponseId
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentConversation?.messages, isLoading]);

    return (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Fixed Header */}
            <div className="h-16 border-b border-[#F5E7C6]/8 flex items-center justify-between px-5 bg-[#0F1229]/30 flex-shrink-0 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-[#1E2345] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#A8A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6D1F] to-[#CC5719] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6D1F]/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-[#F5E7C6]">Dev AI</h1>
                            <p className="text-xs text-[#6B6580]">Your coding assistant</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {currentConversation && (
                        <button
                            onClick={exportConversation}
                            className="p-2 hover:bg-[#1E2345] rounded-lg transition-colors group"
                            title="Export as Markdown"
                        >
                            <svg className="w-4 h-4 text-[#6B6580] group-hover:text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => setShowCodeModal(true)}
                        className="p-2 hover:bg-[#1E2345] rounded-lg transition-colors group"
                        title="Analyze Code"
                    >
                        <svg className="w-4 h-4 text-[#6B6580] group-hover:text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="hidden md:flex p-2 text-[#6B6580] hover:text-[#FF6D1F] hover:bg-[#1E2345] rounded-lg transition-colors"
                        title="Keyboard Shortcuts (?)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {!currentConversation || currentConversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FF6D1F]/20 to-[#FF8A47]/10 rounded-3xl flex items-center justify-center mb-6 border border-[#FF6D1F]/20 shadow-lg shadow-[#FF6D1F]/10">
                            <svg className="w-10 h-10 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-[#F5E7C6] mb-2">Welcome to Dev AI</h2>
                        <p className="text-[#A8A0B8] mb-6 text-sm max-w-lg leading-relaxed">
                            Your intelligent coding assistant. Ask questions, analyze code, and get insights about GitHub users and repositories.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mb-6">
                            <div className="flex items-start gap-3 p-4 premium-card rounded-xl text-left hover:border-[#FF6D1F]/30 transition-all">
                                <div className="w-9 h-9 bg-[#FF6D1F]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">💡</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[#F5E7C6] mb-1">Explain Code</div>
                                    <div className="text-xs text-[#6B6580]">Get detailed explanations</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 premium-card rounded-xl text-left hover:border-[#FF6D1F]/30 transition-all">
                                <div className="w-9 h-9 bg-[#FF6D1F]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">🔍</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[#F5E7C6] mb-1">Review Code</div>
                                    <div className="text-xs text-[#6B6580]">Get best practices</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 premium-card rounded-xl text-left hover:border-[#FF6D1F]/30 transition-all">
                                <div className="w-9 h-9 bg-[#FF6D1F]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">📁</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[#F5E7C6] mb-1">Analyze Repos</div>
                                    <div className="text-xs text-[#6B6580]">Mention with @</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 premium-card rounded-xl text-left hover:border-[#FF6D1F]/30 transition-all">
                                <div className="w-9 h-9 bg-[#FF6D1F]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">🚀</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[#F5E7C6] mb-1">Debug Issues</div>
                                    <div className="text-xs text-[#6B6580]">Find and fix bugs</div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-[#6B6580]">
                            Tip: Use <kbd className="px-2 py-1 bg-[#1E2345] border border-[#F5E7C6]/10 rounded text-[10px] font-mono text-[#A8A0B8]">@</kbd> to mention users, repos, files, or PRs
                        </p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {isSwitching && (
                            <div className="flex justify-center py-8">
                                <div className="w-5 h-5 border-2 border-[#1E2345] border-t-[#FF6D1F] rounded-full animate-spin" />
                            </div>
                        )}
                        {!isSwitching && currentConversation.messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} chatbot-message-enter`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#FF6D1F] to-[#CC5719] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FF6D1F]/20">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                                    <div className={`${msg.role === 'user' ? 'bg-gradient-to-r from-[#AD4F09] to-[#AD4F09] text-white font-bold' : 'premium-card'} rounded-2xl px-4 py-3 shadow-lg`}>
                                        {msg.role === 'assistant' && latestResponseId === msg.id ? (
                                            <Typewriter content={msg.content} />
                                        ) : (
                                            <div className="text-sm leading-relaxed">{formatContent(msg.content)}</div>
                                        )}
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F5E7C6]/5">
                                                <button
                                                    onClick={() => copyToClipboard(msg.content, msg.id)}
                                                    className="text-xs text-[#6B6580] hover:text-[#FF6D1F] transition-colors flex items-center gap-1"
                                                >
                                                    {copiedMsgId === msg.id ? (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const blob = new Blob([msg.content], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `devai-response-${new Date().toISOString().slice(0, 10)}.txt`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="text-xs text-[#6B6580] hover:text-[#FF6D1F] transition-colors flex items-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {msg.role === 'user' && user && (
                                    <Image src={user.avatar_url} alt={user.username} width={32} height={32} className="w-8 h-8 rounded-lg flex-shrink-0" />
                                )}
                            </div>
                        ))}

                        {/* Thinking indicator while loading */}
                        {isLoading && (
                            <div className="flex gap-4 justify-start chatbot-message-enter">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6D1F] to-[#CC5719] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FF6D1F]/20 animate-pulse">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 max-w-[85%]">
                                    <div className="premium-card rounded-2xl px-4 py-3 shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-[#FF6D1F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-[#FF6D1F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-[#FF6D1F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-sm text-[#A8A0B8]">Dev AI is thinking...</span>
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
