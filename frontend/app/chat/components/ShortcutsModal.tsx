import React from 'react';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-4 z-40 bg-[#0F1229] border border-[#F5E7C6]/10 rounded-xl p-4 shadow-2xl shadow-black/40 w-72 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#F5E7C6] font-['Gotham']">Keyboard Shortcuts</h4>
                <button onClick={onClose} className="text-[#6B6580] hover:text-[#F5E7C6] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#A8A0B8]">
                    <span>New conversation</span>
                    <kbd className="px-2 py-0.5 bg-[#1E2345] rounded text-[#F5E7C6] font-['JetBrains_Mono']">Ctrl+N</kbd>
                </div>
                <div className="flex justify-between text-[#A8A0B8]">
                    <span>Focus input</span>
                    <kbd className="px-2 py-0.5 bg-[#1E2345] rounded text-[#F5E7C6] font-['JetBrains_Mono']">Ctrl+K</kbd>
                </div>
                <div className="flex justify-between text-[#A8A0B8]">
                    <span>Close popups</span>
                    <kbd className="px-2 py-0.5 bg-[#1E2345] rounded text-[#F5E7C6] font-['JetBrains_Mono']">Esc</kbd>
                </div>
                <div className="flex justify-between text-[#A8A0B8]">
                    <span>Toggle shortcuts</span>
                    <kbd className="px-2 py-0.5 bg-[#1E2345] rounded text-[#F5E7C6] font-['JetBrains_Mono']">?</kbd>
                </div>
            </div>
        </div>
    );
};
