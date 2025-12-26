import React from 'react';
import { Conversation } from '../types';

interface ChatSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    sidebarWidth: number;
    isResizing: boolean;
    handleMouseDown: (e: React.MouseEvent) => void;
    isLoadingConversations: boolean;
    conversations: Conversation[];
    currentConversation: Conversation | null;
    createNewConversation: () => void;
    loadConversationMessages: (id: number) => void;
    setDeleteConfirmId: (id: number) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    sidebarWidth,
    isResizing,
    handleMouseDown,
    isLoadingConversations,
    conversations,
    currentConversation,
    createNewConversation,
    loadConversationMessages,
    setDeleteConfirmId
}) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Responsive with resize */}
            <div
                className={`
                    ${isSidebarOpen ? '' : '-translate-x-full lg:translate-x-0 lg:w-0'}
                    fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto
                    bg-zinc-900/95 lg:bg-zinc-900/40 backdrop-blur-sm lg:backdrop-blur-none
                    border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0
                    transition-transform lg:transition-all duration-200
                `}
                style={{ width: isSidebarOpen ? sidebarWidth : 0 }}
            >
                <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Conversations</span>
                    <button
                        onClick={createNewConversation}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                        title="New Chat"
                    >
                        <svg className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable conversation list */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoadingConversations ? (
                        <div className="flex justify-center py-8">
                            <div className="w-5 h-5 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-zinc-600 text-sm">No conversations yet</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800/50 cursor-pointer group rounded-lg mb-1 transition-all ${currentConversation?.id === conv.id ? "bg-indigo-500/10 border border-indigo-500/30" : "border border-transparent"}`}
                                onClick={() => loadConversationMessages(conv.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm text-zinc-300 truncate block">{conv.title}</span>
                                    <span className="text-[10px] text-zinc-600">{new Date(conv.updated_at).toLocaleDateString()}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(conv.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-md transition-all ml-2"
                                >
                                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Resize Handle - Desktop only */}
            {isSidebarOpen && (
                <div
                    className="hidden lg:flex w-1 hover:w-2 bg-transparent hover:bg-indigo-500/50 cursor-col-resize flex-shrink-0 transition-all group"
                    onMouseDown={handleMouseDown}
                >
                    <div className={`w-full h-full ${isResizing ? 'bg-indigo-500' : ''}`} />
                </div>
            )}
        </>
    );
};
