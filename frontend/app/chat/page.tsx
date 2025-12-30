'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Conversation, Message, DevAIMention, RepoResult, UserResult } from './types';
import { ChatSidebar } from './components/ChatSidebar';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { CodeModal } from './components/CodeModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { ShortcutsModal } from './components/ShortcutsModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);
    const [latestResponseId, setLatestResponseId] = useState<number | null>(null);

    // @ mention state
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [mentionResults, setMentionResults] = useState<(RepoResult | UserResult)[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentMentions, setCurrentMentions] = useState<DevAIMention[]>([]);
    const [mentionType, setMentionType] = useState<"user" | "repo" | "file" | "pr">("user");

    // Delete confirmation state
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Code analysis state
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [codeInput, setCodeInput] = useState("");
    const [codeLanguage, setCodeLanguage] = useState("javascript");

    // Shortcuts help
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Copy feedback
    const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);

    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const mentionSearchRef = useRef<HTMLInputElement | null>(null);

    // Close sidebar on mobile by default
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/');
        }
    }, [loading, isAuthenticated, router]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+N - New conversation
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                createNewConversation();
            }
            // Ctrl+K - Focus input
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            // Escape - Close modals/popups
            if (e.key === 'Escape') {
                setShowMentionPopup(false);
                setShowCodeModal(false);
                setShowShortcuts(false);
                setDeleteConfirmId(null);
            }
            // ? - Show shortcuts
            if (e.key === '?' && !e.ctrlKey && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
                setShowShortcuts(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Export conversation as Markdown
    const exportConversation = () => {
        if (!currentConversation) return;

        let md = `# ${currentConversation.title}\n\n`;
        md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

        currentConversation.messages.forEach(msg => {
            const role = msg.role === 'user' ? '**You**' : '**Dev AI**';
            md += `### ${role}\n\n${msg.content}\n\n---\n\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentConversation.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Copy message to clipboard
    const copyToClipboard = async (content: string, msgId: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMsgId(msgId);
            setTimeout(() => setCopiedMsgId(null), 2000);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

    // Analyze code with AI
    const analyzeCode = async () => {
        if (!codeInput.trim()) return;

        const codeMessage = `Please analyze this ${codeLanguage} code:\n\n\`\`\`${codeLanguage}\n${codeInput}\n\`\`\`\n\nProvide:\n1. Code explanation\n2. Potential issues or bugs\n3. Suggestions for improvement\n4. Best practices recommendations`;

        setMessage(codeMessage);
        setShowCodeModal(false);
        setCodeInput('');

        // Focus input and trigger send
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    // Load conversations from API
    useEffect(() => {
        if (isAuthenticated && user) {
            loadConversations();
        }
    }, [isAuthenticated, user]);

    const loadConversations = async () => {
        try {
            setIsLoadingConversations(true);
            const response = await fetch(`${API_BASE}/api/devai/conversations`, {
                credentials: "include"
            });
            const data = await response.json();
            if (!data.error && data.conversations) {
                setConversations(data.conversations);
            }
        } catch (e) {
            console.error("Failed to load conversations", e);
        } finally {
            setIsLoadingConversations(false);
        }
    };

    const loadConversationMessages = async (convId: number) => {
        try {
            setIsSwitching(true);
            const response = await fetch(`${API_BASE}/api/devai/conversations/${convId}`, {
                credentials: "include"
            });
            const data = await response.json();
            if (!data.error && data.conversation) {
                setCurrentConversation(data.conversation);
                setLatestResponseId(null);
            }
        } catch (e) {
            console.error("Failed to load conversation", e);
        } finally {
            setIsSwitching(false);
        }
    };

    // Search for users/repos with GitHub API via our backend
    const searchMentions = useCallback(async (query: string, type: "repo" | "user" | "file" | "pr") => {
        if (type === "file" || type === "pr") return; // File and PR paths don't need search
        if (!query.trim()) {
            setMentionResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const endpoint = type === "repo" ? "repos" : "users";
            const response = await fetch(`${API_BASE}/api/devai/search/${endpoint}?q=${encodeURIComponent(query)}`, {
                credentials: "include"
            });
            const data = await response.json();
            if (!data.error) {
                setMentionResults(data.results || []);
            }
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (showMentionPopup && mentionSearch) {
            const timer = setTimeout(() => {
                if (mentionType !== "file" && mentionType !== "pr") {
                    searchMentions(mentionSearch, mentionType);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [mentionSearch, mentionType, searchMentions, showMentionPopup]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setMessage(value);

        // Check for @ at cursor position
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1 && !showMentionPopup) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            // Show popup if @ is the last char or followed by non-space chars
            if (textAfterAt === '' || !/\s/.test(textAfterAt)) {
                setShowMentionPopup(true);
                setMentionSearch(textAfterAt);
                setMentionType("user"); // Default to user search
            }
        }

        if (showMentionPopup && lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            if (/\s/.test(textAfterAt)) {
                setShowMentionPopup(false);
            } else {
                setMentionSearch(textAfterAt);
            }
        }
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !showMentionPopup) {
            e.preventDefault();
            sendMessage();
        }
        if (e.key === "Escape" && showMentionPopup) {
            setShowMentionPopup(false);
        }
    };

    // Add mention
    const addMention = (result: RepoResult | UserResult) => {
        const isRepo = "full_name" in result;
        const mention: DevAIMention = {
            type: isRepo ? "repo" : "user",
            value: isRepo ? (result as RepoResult).full_name : (result as UserResult).login
        };

        setCurrentMentions(prev => [...prev, mention]);

        // Replace @query with @value in message
        const cursorPos = inputRef.current?.selectionStart || message.length;
        const textBeforeCursor = message.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const newMessage = message.slice(0, lastAtIndex) + `@${mention.value} ` + message.slice(cursorPos);
            setMessage(newMessage);
        }

        setShowMentionPopup(false);
        setMentionSearch("");
        inputRef.current?.focus();
    };

    // Create new conversation
    const createNewConversation = async () => {
        setCurrentConversation(null);
        setLatestResponseId(null);
        setCurrentMentions([]);
        setMessage("");
    };

    // Send message
    const sendMessage = async () => {
        if (!message.trim() || isLoading || !isAuthenticated) return;

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: message,
            mentions: currentMentions.length > 0 ? [...currentMentions] : undefined,
            created_at: new Date().toISOString()
        };

        // Optimistic update
        const tempConversation = currentConversation
            ? { ...currentConversation, messages: [...currentConversation.messages, userMessage] }
            : { id: 0, title: message.slice(0, 30), messages: [userMessage], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

        setCurrentConversation(tempConversation);
        setMessage("");
        setCurrentMentions([]);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/devai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    message: userMessage.content,
                    conversation_id: currentConversation?.id || 0,
                    mentions: userMessage.mentions
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.message || "Failed to get response");
            }

            const assistantMessage: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content: data.response,
                created_at: new Date().toISOString()
            };

            // Update with real conversation ID from server
            const finalConv: Conversation = {
                id: data.conversation_id,
                title: currentConversation?.title || message.slice(0, 30),
                messages: [...tempConversation.messages, assistantMessage],
                created_at: currentConversation?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            setCurrentConversation(finalConv);
            setLatestResponseId(assistantMessage.id);

            // Refresh conversations list to get updated data
            loadConversations();

        } catch (e) {
            console.error("Chat error:", e);
            const errorMessage: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
                created_at: new Date().toISOString()
            };
            setCurrentConversation({
                ...tempConversation,
                messages: [...tempConversation.messages, errorMessage]
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Delete conversation
    const deleteConversation = async (convId: number) => {
        try {
            await fetch(`${API_BASE}/api/devai/conversations/${convId}`, {
                method: "DELETE",
                credentials: "include"
            });
            setConversations(prev => prev.filter(c => c.id !== convId));
            if (currentConversation?.id === convId) {
                setCurrentConversation(null);
            }
            setDeleteConfirmId(null);
        } catch (e) {
            console.error("Failed to delete conversation", e);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-screen flex flex-col premium-bg">
                <Navbar />
                <div className="flex-1 flex items-center justify-center flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#FF6D1F] rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-[#FF6D1F] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#FF6D1F] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="h-screen flex flex-col premium-bg text-[#F5E7C6] overflow-hidden">
            <Navbar />

            <main className="flex-1 flex overflow-hidden relative">
                <ChatSidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isLoadingConversations={isLoadingConversations}
                    conversations={conversations}
                    currentConversation={currentConversation}
                    createNewConversation={createNewConversation}
                    loadConversationMessages={loadConversationMessages}
                    setDeleteConfirmId={setDeleteConfirmId}
                    isSwitching={isSwitching}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <MessageList
                        currentConversation={currentConversation}
                        isLoading={isLoading}
                        user={user}
                        copyToClipboard={copyToClipboard}
                        copiedMsgId={copiedMsgId}
                        setShowCodeModal={setShowCodeModal}
                        exportConversation={exportConversation}
                        setShowShortcuts={setShowShortcuts}
                        showShortcuts={showShortcuts}
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen}
                        isSwitching={isSwitching}
                        latestResponseId={latestResponseId}
                    />

                    <ChatInput
                        message={message}
                        isLoading={isLoading}
                        inputRef={inputRef}
                        handleInputChange={handleInputChange}
                        handleKeyPress={handleKeyPress}
                        sendMessage={sendMessage}
                        currentMentions={currentMentions}
                        setCurrentMentions={setCurrentMentions}
                        showMentionPopup={showMentionPopup}
                        setShowMentionPopup={setShowMentionPopup}
                        mentionType={mentionType}
                        setMentionType={setMentionType}
                        mentionSearch={mentionSearch}
                        setMentionSearch={setMentionSearch}
                        mentionResults={mentionResults}
                        searchLoading={searchLoading}
                        addMention={addMention}
                        mentionSearchRef={mentionSearchRef}
                        setMessage={setMessage}
                    />
                </div>
            </main>

            <DeleteConfirmationModal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onDelete={async () => { if (deleteConfirmId) await deleteConversation(deleteConfirmId); }}
            />

            <CodeModal
                isOpen={showCodeModal}
                onClose={() => setShowCodeModal(false)}
                codeLanguage={codeLanguage}
                setCodeLanguage={setCodeLanguage}
                codeInput={codeInput}
                setCodeInput={setCodeInput}
                analyzeCode={analyzeCode}
            />

            <ShortcutsModal
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />
        </div>
    );
}
