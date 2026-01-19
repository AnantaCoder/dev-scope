"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { AnalysisAnimation } from "./AnalysisAnimation";

interface AdminStatus {
    total_users: number;
    updated_users: number;
    pending_users: number;
    disabled_users?: number;
    last_update: string | null;
    is_admin: boolean;
    admin_username: string;
}

interface ProgressState {
    isOpen: boolean;
    title: string;
    total: number;
    current: number;
    currentUser: string;
    successCount: number;
    failCount: number;
    completedUsers: { username: string; success: boolean; score?: number; message?: string }[];
    isComplete: boolean;
    operationType: "ranking" | "privateData" | null;
}

export function AdminPanel() {
    const [status, setStatus] = useState<AdminStatus | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({
        isOpen: false,
        title: "",
        total: 0,
        current: 0,
        currentUser: "",
        successCount: 0,
        failCount: 0,
        completedUsers: [],
        isComplete: false,
        operationType: null,
    });
    const progressListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    // Auto-scroll to bottom of progress list
    useEffect(() => {
        if (progressListRef.current) {
            progressListRef.current.scrollTop = progressListRef.current.scrollHeight;
        }
    }, [progress.completedUsers]);

    const checkAdminStatus = async () => {
        try {
            const data = await api.getAdminUpdateStatus();
            setStatus(data);
            setIsAdmin(data.is_admin);
        } catch {
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setUpdating(true);

        // Initialize progress modal for private data update
        setProgress({
            isOpen: true,
            title: "Updating Private Data",
            total: 0,
            current: 0,
            currentUser: "Starting bulk update...",
            successCount: 0,
            failCount: 0,
            completedUsers: [],
            isComplete: false,
            operationType: "privateData",
        });

        try {
            const data = await api.triggerPrivateDataUpdate();

            // Update progress with final results
            setProgress(prev => ({
                ...prev,
                total: data.total_users,
                current: data.total_users,
                currentUser: data.success ? "Complete!" : "Failed",
                successCount: data.success_count,
                failCount: data.fail_count,
                isComplete: true,
                completedUsers: [
                    ...(data.failed_users || []).map(u => ({ username: u, success: false, message: "Failed" })),
                    ...(data.disabled_users || []).map(u => ({ username: u, success: false, message: "Disabled" })),
                ],
            }));

            await checkAdminStatus();
        } catch (error) {
            setProgress(prev => ({
                ...prev,
                isComplete: true,
                currentUser: error instanceof Error ? error.message : "Update failed",
            }));
        } finally {
            setUpdating(false);
        }
    };

    const handleRecalculateRankings = async () => {
        setRecalculating(true);

        // Initialize progress modal
        setProgress({
            isOpen: true,
            title: "Recalculating Rankings",
            total: 0,
            current: 0,
            currentUser: "Fetching user list...",
            successCount: 0,
            failCount: 0,
            completedUsers: [],
            isComplete: false,
            operationType: "ranking",
        });

        try {
            // First, get all usernames
            const usernamesResponse = await api.getAllRankedUsernames();
            if (usernamesResponse.error || !usernamesResponse.usernames) {
                throw new Error("Failed to get usernames");
            }

            const usernames = usernamesResponse.usernames;
            setProgress(prev => ({
                ...prev,
                total: usernames.length,
                currentUser: "Starting...",
            }));

            let successCount = 0;
            let failCount = 0;

            // Process each user one by one
            for (let i = 0; i < usernames.length; i++) {
                const username = usernames[i];

                setProgress(prev => ({
                    ...prev,
                    current: i + 1,
                    currentUser: username,
                }));

                try {
                    const result = await api.updateSingleUserRanking(username);
                    const success = !result.error;

                    if (success) {
                        successCount++;
                    } else {
                        failCount++;
                    }

                    setProgress(prev => ({
                        ...prev,
                        successCount,
                        failCount,
                        completedUsers: [
                            ...prev.completedUsers,
                            {
                                username,
                                success,
                                score: result.ranking?.score,
                            },
                        ],
                    }));
                } catch {
                    failCount++;
                    setProgress(prev => ({
                        ...prev,
                        successCount,
                        failCount,
                        completedUsers: [
                            ...prev.completedUsers,
                            { username, success: false },
                        ],
                    }));
                }
            }

            // Mark as complete
            setProgress(prev => ({
                ...prev,
                isComplete: true,
                currentUser: "Complete!",
            }));
        } catch (error) {
            setProgress(prev => ({
                ...prev,
                isComplete: true,
                currentUser: error instanceof Error ? error.message : "Failed",
            }));
        } finally {
            setRecalculating(false);
        }
    };

    const closeProgressModal = () => {
        if (progress.isComplete) {
            setProgress(prev => ({ ...prev, isOpen: false }));
        }
    };

    if (loading) {
        return null;
    }

    if (!isAdmin) {
        return null;
    }

    const isAnyOperationRunning = updating || recalculating;

    return (
        <div>
            {/* Progress Modal */}
            {progress.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className={`w-full max-w-2xl mx-4 rounded-2xl border ${progress.operationType === "privateData" ? "border-yellow-500/30" : "border-blue-500/30"} bg-[#0d1117] shadow-2xl`}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                {!progress.isComplete ? (
                                    <svg className={`animate-spin h-5 w-5 ${progress.operationType === "privateData" ? "text-yellow-500" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                <h3 className="text-lg font-semibold text-white">{progress.title}</h3>
                            </div>
                            {progress.isComplete && (
                                <button
                                    onClick={closeProgressModal}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="p-4 border-b border-gray-700">
                            {/* Current Status */}
                            <div className="flex items-center justify-between text-sm mb-3">
                                <span className="text-gray-400">
                                    {progress.operationType === "privateData" ? "Status: " : "Processing: "}
                                    <span className={`${progress.operationType === "privateData" ? "text-yellow-400" : "text-blue-400"} font-mono font-medium`}>{progress.currentUser}</span>
                                </span>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="relative">
                                {/* Background */}
                                <div className="w-full h-6 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                    {/* Indeterminate Progress (when total is 0 and not complete) */}
                                    {progress.total === 0 && !progress.isComplete ? (
                                        <div
                                            className={`h-full w-1/3 relative ${progress.operationType === "privateData"
                                                ? "bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400"
                                                : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"
                                                }`}
                                            style={{
                                                animation: 'indeterminate-progress 1.5s ease-in-out infinite',
                                            }}
                                        >
                                            {/* Animated Stripes */}
                                            <div
                                                className="absolute inset-0 opacity-30"
                                                style={{
                                                    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                                    backgroundSize: '20px 20px',
                                                    animation: 'progress-stripes 1s linear infinite',
                                                }}
                                            />
                                            {/* Shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                        </div>
                                    ) : (
                                        /* Determinate Progress Fill */
                                        <div
                                            className={`h-full transition-all duration-500 ease-out relative ${progress.operationType === "privateData"
                                                ? "bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400"
                                                : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"
                                                }`}
                                            style={{
                                                width: progress.total > 0
                                                    ? `${(progress.current / progress.total) * 100}%`
                                                    : '100%'
                                            }}
                                        >
                                            {/* Animated Stripes */}
                                            {!progress.isComplete && (
                                                <div
                                                    className="absolute inset-0 opacity-30"
                                                    style={{
                                                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                                        backgroundSize: '20px 20px',
                                                        animation: 'progress-stripes 1s linear infinite',
                                                    }}
                                                />
                                            )}
                                            {/* Shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                        </div>
                                    )}
                                </div>

                                {/* Percentage Text Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold drop-shadow-lg">
                                        {progress.total === 0 && !progress.isComplete
                                            ? 'Processing...'
                                            : progress.total > 0
                                                ? `${Math.round((progress.current / progress.total) * 100)}%`
                                                : '100%'}
                                    </span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1.5 text-green-400">
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium">{progress.successCount}</span>
                                        <span className="text-gray-500">success</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-red-400">
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium">{progress.failCount}</span>
                                        <span className="text-gray-500">failed</span>
                                    </span>
                                </div>
                                {progress.total > 0 && (
                                    <span className="text-gray-400 text-sm font-mono">
                                        {progress.current} / {progress.total}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* User List */}
                        <div
                            ref={progressListRef}
                            className="max-h-64 overflow-y-auto p-4 space-y-1"
                        >
                            {/* Ranking recalculation - show each user as they complete */}
                            {progress.operationType === "ranking" && progress.completedUsers.map((user, idx) => (
                                <div
                                    key={`${user.username}-${idx}`}
                                    className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${user.success
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-red-500/10 text-red-400"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {user.success ? (
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                        <span className="font-mono">@{user.username}</span>
                                        {user.message && <span className="text-xs text-gray-500">({user.message})</span>}
                                    </div>
                                    {user.success && user.score !== undefined && (
                                        <span className="text-xs text-gray-400">
                                            Score: <span className="text-blue-400">{user.score.toFixed(2)}</span>
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* Loading state - waiting for data */}
                            {progress.completedUsers.length === 0 && !progress.isComplete && (
                                <div className="text-center text-gray-500 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-pulse h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        {progress.operationType === "privateData"
                                            ? "Processing bulk update... This may take a while."
                                            : "Waiting for updates..."}
                                    </div>
                                </div>
                            )}
                            {/* Success summary for private data (bulk operation doesn't return individual success list) */}
                            {progress.completedUsers.length === 0 && progress.isComplete && progress.operationType === "privateData" && progress.successCount > 0 && (
                                <div className="text-center py-6">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-green-400 font-medium text-lg">
                                            All {progress.successCount} users updated successfully!
                                        </div>
                                        <div className="text-gray-500 text-sm">
                                            Private data has been refreshed for all users.
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Show failed users list for private data if any */}
                            {progress.completedUsers.length > 0 && progress.isComplete && progress.operationType === "privateData" && (
                                <div className="py-2">
                                    {progress.successCount > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded bg-green-500/10 text-green-400">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm">{progress.successCount} users updated successfully</span>
                                        </div>
                                    )}
                                    {progress.failCount > 0 && (
                                        <div className="text-xs text-gray-500 mb-2 px-3">Failed/Disabled users:</div>
                                    )}
                                    {progress.completedUsers.map((user, idx) => (
                                        <div
                                            key={`${user.username}-${idx}`}
                                            className="flex items-center justify-between px-3 py-1.5 rounded text-sm bg-red-500/10 text-red-400"
                                        >
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span className="font-mono">@{user.username}</span>
                                                {user.message && <span className="text-xs text-gray-500">({user.message})</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {progress.isComplete && (
                            <div className="p-4 border-t border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-400">
                                        Completed: {progress.successCount} success, {progress.failCount} failed
                                    </div>
                                    <button
                                        onClick={closeProgressModal}
                                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${progress.operationType === "privateData"
                                            ? "bg-yellow-600 hover:bg-yellow-700"
                                            : "bg-blue-600 hover:bg-blue-700"}`}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Visual Analysis Animation */}
            <AnalysisAnimation />

            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg
                        className="h-5 w-5 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.333 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                    <h3 className="text-lg font-semibold text-yellow-500">Admin Panel</h3>
                </div>

                {/* Status */}
                {status && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span>Total: {status.total_users}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-500">Updated: {status.updated_users}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-orange-500">Pending: {status.pending_users}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                                {status.last_update
                                    ? new Date(status.last_update).toLocaleString()
                                    : "Never"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m-6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-500">Disabled: {status.disabled_users ?? 0}</span>
                        </div>
                    </div>
                )}

                {/* Update Button */}
                <button
                    onClick={handleUpdate}
                    disabled={isAnyOperationRunning}
                    className="w-full py-2 px-4 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    {updating ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Updating All Users...
                        </>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Update All Users&apos; Private Data
                        </>
                    )}
                </button>

                {/* Recalculate Rankings Button */}
                <button
                    onClick={handleRecalculateRankings}
                    disabled={isAnyOperationRunning}
                    className="w-full mt-3 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    {recalculating ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Recalculating Rankings...
                        </>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Recalculate All Rankings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
