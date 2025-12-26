'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Image from 'next/image';

// Types
interface DevAIMention {
    type: "repo" | "user" | "file" | "pr";
    value: string;
}

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    mentions?: DevAIMention[] | string; // Can be array or JSON string from DB
    created_at: string;
}

// Helper to parse mentions which could be string or array
const parseMentions = (mentions: DevAIMention[] | string | undefined): DevAIMention[] => {
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

interface Conversation {
    id: number;
    title: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
}

interface UserResult {
    login: string;
    avatar_url: string;
    html_url: string;
    type: string;
}

interface RepoResult {
    full_name: string;
    description: string;
    stars: number;
    language: string;
    html_url: string;
}

// Extended user stats for comparison
interface GitHubUserStats {
    login: string;
    name: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
    bio: string;
}

// User Comparison Card Component
const UserComparisonCard = ({ users }: { users: GitHubUserStats[] }) => {
    if (users.length < 2) return null;

    const maxFollowers = Math.max(...users.map(u => u.followers));
    const maxRepos = Math.max(...users.map(u => u.public_repos));

    return (
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                User Comparison
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {users.map((user, i) => (
                    <div key={i} className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-700/30">
                        <div className="flex items-center gap-2 mb-2">
                            <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-lg" />
                            <div>
                                <div className="text-sm font-medium text-white">{user.login}</div>
                                {user.name && <div className="text-[10px] text-zinc-500">{user.name}</div>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="text-zinc-500">Followers</span>
                                    <span className="text-zinc-300">{user.followers.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: `${(user.followers / maxFollowers) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="text-zinc-500">Repos</span>
                                    <span className="text-zinc-300">{user.public_repos.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all"
                                        style={{ width: `${(user.public_repos / maxRepos) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(288); // 288px = 18rem = w-72
    const [isResizing, setIsResizing] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);

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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const mentionSearchRef = useRef<HTMLInputElement>(null);

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

    // Sidebar resize handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = Math.min(Math.max(e.clientX, 200), 500); // Min 200px, Max 500px
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

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
            const response = await fetch(`${API_BASE}/api/devai/conversations/${convId}`, {
                credentials: "include"
            });
            const data = await response.json();
            if (!data.error && data.conversation) {
                setCurrentConversation(data.conversation);
            }
        } catch (e) {
            console.error("Failed to load conversation", e);
        }
    };

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentConversation?.messages]);

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

    // Format message content with comprehensive markdown support
    const formatContent = (content: string) => {
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

    // Format inline elements (bold, italic, code, links)
    const formatInline = (text: string): React.ReactNode => {
        // Process inline code first
        const parts = text.split(/(`[^`]+`)/g);

        return parts.map((part, i) => {
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code key={i} className="bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-300 text-[13px] font-mono">
                        {part.slice(1, -1)}
                    </code>
                );
            }

            // Process bold and italic
            let processed: React.ReactNode = part;

            // Bold **text**
            processed = processPattern(processed, /(\*\*[^*]+\*\*)/g, (match, key) => (
                <strong key={key} className="font-semibold text-white">{match.slice(2, -2)}</strong>
            ));

            // Italic *text* or _text_
            processed = processPattern(processed, /(\*[^*]+\*|_[^_]+_)/g, (match, key) => (
                <em key={key} className="italic">{match.slice(1, -1)}</em>
            ));

            // Links [text](url)
            processed = processPattern(processed, /(\[[^\]]+\]\([^)]+\))/g, (match, key) => {
                const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (linkMatch) {
                    return (
                        <a key={key} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            {linkMatch[1]}
                        </a>
                    );
                }
                return match;
            });

            return <span key={i}>{processed}</span>;
        });
    };

    // Helper to process regex patterns in content
    const processPattern = (
        content: React.ReactNode,
        pattern: RegExp,
        replacer: (match: string, key: string) => React.ReactNode
    ): React.ReactNode => {
        if (typeof content !== 'string') return content;

        const parts = content.split(pattern);
        return parts.map((part, i) => {
            if (pattern.test(part)) {
                return replacer(part, `${i}`);
            }
            return part;
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-screen flex flex-col bg-[#09090b]">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-zinc-600 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-zinc-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-zinc-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
            <Navbar />

            <main className="flex-1 flex overflow-hidden relative">
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

                {/* Main Chat Area - Fixed layout with scrollable messages */}
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
                                {currentConversation.messages.map(msg => (
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
                                                <div className="text-sm leading-relaxed">{formatContent(msg.content)}</div>
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
                                ))}

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

                    {/* Fixed Input Area at Bottom */}
                    <div className="flex-shrink-0 p-4 border-t border-zinc-800/60 bg-zinc-900/50">
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
                                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-80 z-20">
                                        <div className="p-3 border-b border-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setMentionType("user")}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mentionType === "user" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                                    >
                                                        👤 Users
                                                    </button>
                                                    <button
                                                        onClick={() => setMentionType("repo")}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mentionType === "repo" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                                    >
                                                        📁 Repos
                                                    </button>
                                                    <button
                                                        onClick={() => setMentionType("file")}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mentionType === "file" ? "bg-cyan-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                                    >
                                                        📄 File
                                                    </button>
                                                    <button
                                                        onClick={() => setMentionType("pr")}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mentionType === "pr" ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                                    >
                                                        📋 PR
                                                    </button>
                                                </div>
                                                {mentionType !== "file" && mentionType !== "pr" && (
                                                    <input
                                                        ref={mentionSearchRef}
                                                        type="text"
                                                        value={mentionSearch}
                                                        onChange={(e) => setMentionSearch(e.target.value)}
                                                        placeholder={`Search ${mentionType === "repo" ? "repositories" : "users"}...`}
                                                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                                                        autoFocus
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        {mentionType === "file" ? (
                                            <div className="p-4 space-y-3">
                                                <p className="text-xs text-zinc-400">Enter file path: <span className="text-cyan-400">owner/repo/path/to/file.ext</span></p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={mentionSearch}
                                                        onChange={(e) => setMentionSearch(e.target.value)}
                                                        placeholder="facebook/react/packages/react/index.js"
                                                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
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
                                                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-zinc-600">Example: AnantaCoder/dev-scope/backend/cmd/main.go</p>
                                            </div>
                                        ) : mentionType === "pr" ? (
                                            <div className="p-4 space-y-3">
                                                <p className="text-xs text-zinc-400">Enter PR reference: <span className="text-green-400">owner/repo#123</span></p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={mentionSearch}
                                                        onChange={(e) => setMentionSearch(e.target.value)}
                                                        placeholder="facebook/react#12345"
                                                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-green-500 font-mono"
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
                                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
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
                                                                    <Image src={result.avatar_url} alt={result.login} width={36} height={36} className="w-9 h-9 rounded-lg" />
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
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-600 text-center mt-2">Dev AI can make mistakes. Verify important information.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
                    <div
                        className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Delete Conversation</h3>
                                <p className="text-sm text-zinc-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-zinc-300 text-sm mb-6">
                            Are you sure you want to delete this conversation? All messages will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteConversation(deleteConfirmId)}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Code Analysis Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCodeModal(false)}>
                    <div
                        className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                                Analyze Code
                            </h3>
                            <button onClick={() => setShowCodeModal(false)} className="text-zinc-500 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="text-sm text-zinc-400 mb-2 block">Language</label>
                            <select
                                value={codeLanguage}
                                onChange={(e) => setCodeLanguage(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="go">Go</option>
                                <option value="rust">Rust</option>
                                <option value="java">Java</option>
                                <option value="c">C</option>
                                <option value="cpp">C++</option>
                                <option value="csharp">C#</option>
                                <option value="php">PHP</option>
                                <option value="ruby">Ruby</option>
                                <option value="sql">SQL</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="text-sm text-zinc-400 mb-2 block">Paste your code</label>
                            <textarea
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                                placeholder="Paste your code here..."
                                className="w-full h-64 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-mono resize-none focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCodeModal(false)}
                                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={analyzeCode}
                                disabled={!codeInput.trim()}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium"
                            >
                                Analyze Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Help */}
            {showShortcuts && (
                <div className="fixed bottom-20 right-4 z-40 bg-zinc-900 border border-zinc-700/60 rounded-xl p-4 shadow-2xl w-72">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Keyboard Shortcuts</h4>
                        <button onClick={() => setShowShortcuts(false)} className="text-zinc-500 hover:text-white">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-zinc-400">
                            <span>New conversation</span>
                            <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Ctrl+N</kbd>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Focus input</span>
                            <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Ctrl+K</kbd>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Close popups</span>
                            <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Esc</kbd>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Toggle shortcuts</span>
                            <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">?</kbd>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
