"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface GitHubNotification {
    id: string;
    unread: boolean;
    reason: string;
    updated_at: string;
    subject: {
        title: string;
        url: string;
        type: string;
    };
    repository: {
        full_name: string;
        html_url: string;
    };
}

export function NotificationBell() {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<GitHubNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/notifications`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch notifications");
            }

            const data = await response.json();
            if (!data.error) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            } else {
                setError(data.message || "Failed to load notifications");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
                method: "POST",
                credentials: "include",
            });

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "Issue":
                return (
                    <svg className="w-4 h-4 text-[#238636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case "PullRequest":
                return (
                    <svg className="w-4 h-4 text-[#a371f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                );
            case "Release":
                return (
                    <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                );
        }
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            assign: "Assigned",
            author: "Author",
            comment: "Commented",
            ci_activity: "CI Activity",
            invitation: "Invited",
            manual: "Subscribed",
            mention: "Mentioned",
            review_requested: "Review Requested",
            security_alert: "Security Alert",
            state_change: "State Changed",
            subscribed: "Watching",
            team_mention: "Team Mentioned",
        };
        return labels[reason] || reason;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) fetchNotifications();
                }}
                className="relative p-2 rounded-lg hover:bg-[#21262d]/50 transition-all"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-[#da3633] text-white rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#30363d] bg-gradient-to-r from-[#58a6ff]/5 to-transparent flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#e6edf3] flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-[#8b949e]">{unreadCount} unread</span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#58a6ff]"></div>
                                <p className="mt-2 text-sm text-[#8b949e]">Loading notifications...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center">
                                <svg className="w-8 h-8 text-[#da3633] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-[#da3633]">{error}</p>
                                <button
                                    onClick={fetchNotifications}
                                    className="mt-2 text-xs text-[#58a6ff] hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <svg className="w-12 h-12 text-[#30363d] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-sm text-[#8b949e]">No notifications</p>
                                <p className="text-xs text-[#6e7681] mt-1">You&apos;re all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#30363d]">
                                {notifications.slice(0, 20).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 hover:bg-[#21262d]/50 cursor-pointer transition-colors ${notification.unread ? 'bg-[#58a6ff]/5' : ''}`}
                                        onClick={() => {
                                            if (notification.unread) markAsRead(notification.id);
                                            window.open(notification.repository.html_url, "_blank");
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {getNotificationIcon(notification.subject.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-[#e6edf3] font-medium truncate">
                                                    {notification.subject.title}
                                                </p>
                                                <p className="text-xs text-[#8b949e] truncate mt-0.5">
                                                    {notification.repository.full_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
                                                        {getReasonLabel(notification.reason)}
                                                    </span>
                                                    <span className="text-[10px] text-[#6e7681]">
                                                        {formatTime(notification.updated_at)}
                                                    </span>
                                                    {notification.unread && (
                                                        <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-[#30363d] bg-[#0d1117]">
                            <a
                                href="https://github.com/notifications"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#58a6ff] hover:underline flex items-center justify-center gap-1"
                            >
                                View all on GitHub
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
