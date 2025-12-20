"use client";

import { AdminPanel } from "@/components/AdminPanel";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/");
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-white">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!user || (user.username !== "anantacoder" && user.username !== "AnantaCoder")) {
        return (
            <div className="min-h-screen flex flex-col premium-bg text-white">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="premium-card p-8 text-center max-w-md">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                        <p className="text-gray-400">You do not have permission to view this page.</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col premium-bg text-white">
            <Navbar />
            <main className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">Manage global leaderboard and user data.</p>
                </div>
                
                <AdminPanel />
            </main>
            <Footer />
        </div>
    );
}
