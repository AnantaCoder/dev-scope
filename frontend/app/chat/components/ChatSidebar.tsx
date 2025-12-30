import React from 'react';
import { Conversation } from '../types';

interface ChatSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    isLoadingConversations: boolean;
    conversations: Conversation[];
    currentConversation: Conversation | null;
    createNewConversation: () => void;
    loadConversationMessages: (id: number) => void;
    setDeleteConfirmId: (id: number) => void;
    isSwitching: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    isLoadingConversations,
    conversations,
    currentConversation,
    createNewConversation,
    loadConversationMessages,
    setDeleteConfirmId,
    isSwitching
}) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#090B1B]/80 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Fixed width, no resize */}
            <div
                className={`
                    ${isSidebarOpen ? '' : '-translate-x-full lg:translate-x-0 lg:w-0'}
                    fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto w-72
                    bg-[#0F1229]/98 lg:bg-[#0F1229]/60 backdrop-blur-xl lg:backdrop-blur-sm
                    border-r border-[#F5E7C6]/8 flex flex-col overflow-hidden flex-shrink-0
                    transition-transform lg:transition-all duration-200
                `}
            >
                <div className="p-4 border-b border-[#F5E7C6]/8 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#A8A0B8] uppercase tracking-wider">Conversations</span>
                    <button
                        onClick={createNewConversation}
                        disabled={isSwitching}
                        className={`p-2 rounded-lg transition-colors group ${isSwitching ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1E2345]"}`}
                        title="New Chat"
                    >
                        <svg className="w-4 h-4 text-[#6B6580] group-hover:text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable conversation list */}
                <div className={`flex-1 overflow-y-auto p-2 ${isSwitching ? "pointer-events-none opacity-50" : ""}`}>
                    {isLoadingConversations ? (
                        <div className="flex justify-center py-8">
                            <div className="w-5 h-5 border-2 border-[#1E2345] border-t-[#FF6D1F] rounded-full animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-[#6B6580] text-sm font-['Gotham']">No conversations yet</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`flex items-center justify-between px-3 py-2.5 hover:bg-[#1E2345]/50 cursor-pointer group rounded-lg mb-1 transition-all ${currentConversation?.id === conv.id ? "bg-[#FF6D1F]/10 border border-[#FF6D1F]/30" : "border border-transparent"}`}
                                onClick={() => loadConversationMessages(conv.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm text-[#F5E7C6] truncate block">{conv.title}</span>
                                    <span className="text-[10px] text-[#6B6580]">{new Date(conv.updated_at).toLocaleDateString()}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(conv.id); }}
                                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-md transition-all ml-2"
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
        </>
    );
};
