import React from 'react';

interface CodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    codeLanguage: string;
    setCodeLanguage: (lang: string) => void;
    codeInput: string;
    setCodeInput: (input: string) => void;
    analyzeCode: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({
    isOpen, onClose, codeLanguage, setCodeLanguage, codeInput, setCodeInput, analyzeCode
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B1B]/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#0F1229] border border-[#F5E7C6]/10 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl shadow-black/40"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#F5E7C6] flex items-center gap-2 font-['Gotham']">
                        <svg className="w-5 h-5 text-[#FF6D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Analyze Code
                    </h3>
                    <button onClick={onClose} className="text-[#6B6580] hover:text-[#F5E7C6] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="mb-4">
                    <label className="text-sm text-[#A8A0B8] mb-2 block">Language</label>
                    <select
                        value={codeLanguage}
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-lg text-[#F5E7C6] text-sm focus:border-[#FF6D1F] focus:outline-none"
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
                    <label className="text-sm text-[#A8A0B8] mb-2 block">Paste your code</label>
                    <textarea
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="Paste your code here..."
                        className="w-full h-64 px-4 py-3 bg-[#1E2345] border border-[#F5E7C6]/10 rounded-xl text-[#F5E7C6] text-sm font-['JetBrains_Mono'] resize-none focus:outline-none focus:border-[#FF6D1F] placeholder:text-[#6B6580]"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-[#1E2345] hover:bg-[#171B38] text-[#A8A0B8] hover:text-[#F5E7C6] rounded-xl text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={analyzeCode}
                        disabled={!codeInput.trim()}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-br from-[#FF6D1F] to-[#CC5719] hover:from-[#FF8A47] hover:to-[#FF6D1F] disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-[#FF6D1F]/20"
                    >
                        Analyze Code
                    </button>
                </div>
            </div>
        </div>
    );
};
