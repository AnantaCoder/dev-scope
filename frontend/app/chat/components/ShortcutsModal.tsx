import React from 'react';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-4 z-40 bg-zinc-900 border border-zinc-700/60 rounded-xl p-4 shadow-2xl w-72">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Keyboard Shortcuts</h4>
                <button onClick={onClose} className="text-zinc-500 hover:text-white">
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
    );
};
