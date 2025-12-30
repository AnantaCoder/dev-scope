"use client";

import React, { useEffect, useState } from 'react';

interface SessionTimeoutModalProps {
    isOpen: boolean;
    onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ isOpen, onLogout }) => {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (!isOpen) {
            setCountdown(10);
            return;
        }

        // Start countdown when modal opens
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, onLogout]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B1B]/90 backdrop-blur-sm">
            <div className="bg-[#0F1229] border border-[#FF6D1F]/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/40">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-[#FF6D1F]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#F5E7C6] font-['Gotham']">Session Expired</h3>
                        <p className="text-sm text-[#6B6580]">Your session has timed out</p>
                    </div>
                </div>

                <p className="text-[#A8A0B8] text-sm mb-4 font-['Gotham']">
                    For your security, you will be logged out automatically. Please sign in again to continue.
                </p>

                {/* Countdown Timer */}
                <div className="flex items-center justify-center mb-6">
                    <div className="relative w-20 h-20">
                        {/* Background circle */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke="#1E2345"
                                strokeWidth="6"
                            />
                            {/* Animated progress circle */}
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke="#FF6D1F"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={226}
                                strokeDashoffset={226 - (countdown / 10) * 226}
                                className="transition-all duration-1000 ease-linear"
                            />
                        </svg>
                        {/* Countdown number */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-[#FF6D1F]">{countdown}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#FF6D1F]/20"
                >
                    Sign Out Now
                </button>
            </div>
        </div>
    );
};
