"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface AdminStatus {
    total_users: number;
    updated_users: number;
    pending_users: number;
    last_update: string | null;
    is_admin: boolean;
    admin_username: string;
}

interface UpdateResult {
    success: boolean;
    message: string;
    total_users: number;
    success_count: number;
    fail_count: number;
    duration: string;
}

export function AdminPanel() {
    const [status, setStatus] = useState<AdminStatus | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [result, setResult] = useState<UpdateResult | null>(null);

    useEffect(() => {
        checkAdminStatus();
    }, []);

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
        setResult(null);
        try {
            const data = await api.triggerPrivateDataUpdate();
            setResult(data);
            // Refresh status after update
            await checkAdminStatus();
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : "Update failed",
                total_users: 0,
                success_count: 0,
                fail_count: 0,
                duration: "0s",
            });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return null;
    }

    if (!isAdmin) {
        return null;
    }

    return (
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                </svg>
                <h3 className="text-lg font-semibold text-yellow-500">Admin Panel</h3>
            </div>

            {/* Status */}
            {status && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                </div>
            )}

            {/* Update Button */}
            <button
                onClick={handleUpdate}
                disabled={updating}
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

            {/* Result */}
            {result && (
                <div
                    className={`mt-4 p-3 rounded-lg text-sm ${result.success
                            ? "bg-green-500/10 text-green-500 border border-green-500/30"
                            : "bg-red-500/10 text-red-500 border border-red-500/30"
                        }`}
                >
                    <div className="flex items-center gap-2 font-medium">
                        {result.success ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {result.message}
                    </div>
                    {result.success && (
                        <div className="mt-2 text-xs opacity-80">
                            Success: {result.success_count} | Failed: {result.fail_count} |
                            Duration: {result.duration}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
