import React from 'react';

interface BackendErrorBannerProps {
    onRetry: () => void;
}

export const BackendErrorBanner: React.FC<BackendErrorBannerProps> = ({ onRetry }) => {
    return (
        <div className="mb-6 bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-400 mb-2 font-['Gotham']">⚠️ Backend Server Not Running</h3>
                    <p className="text-red-300 mb-4 font-['Gotham']">
                        The Go backend server is not responding. Please start the server to use the application.
                    </p>
                    <div className="bg-[#090B1B]/70 rounded-lg p-4 font-mono text-sm border border-[#F5E7C6]/10">
                        <p className="text-[#6B6580] mb-2">To start the backend server:</p>
                        <code className="text-[#FF6D1F]">
                            cd d:\dev-scope\R1<br />
                            .\backend\cmd\go run main.go
                        </code>
                        <p className="text-[#6B6580] mt-3 text-xs">
                            The server will automatically load all API keys from the  .env file
                        </p>
                    </div>
                    <button
                        onClick={onRetry}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium text-white"
                    >
                        🔄 Retry Connection
                    </button>
                </div>
            </div>
        </div>
    );
};
