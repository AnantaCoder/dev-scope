import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B1B]/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#0F1229] border border-[#F5E7C6]/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/40"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#F5E7C6] font-['Gotham']">Delete Conversation</h3>
                        <p className="text-sm text-[#6B6580]">This action cannot be undone</p>
                    </div>
                </div>
                <p className="text-[#A8A0B8] text-sm mb-6 font-['Gotham']">
                    Are you sure you want to delete this conversation? All messages will be permanently removed.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-[#1E2345] hover:bg-[#171B38] text-[#A8A0B8] hover:text-[#F5E7C6] rounded-xl text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
