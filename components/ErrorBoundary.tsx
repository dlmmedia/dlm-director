'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Auto-reload on ChunkLoadError if it hasn't happened recently
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      const lastReload = sessionStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('last_chunk_error_reload', String(now));
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message.includes('ChunkLoadError') || 
                          this.state.error?.message.includes('Loading chunk');

      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-8">
          <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-4">
              {isChunkError ? 'Update Available' : 'Something went wrong'}
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              {isChunkError 
                ? 'A new version of the application is available. Reloading...'
                : 'The application encountered an unexpected error. Please try refreshing the page.'}
            </p>
            {this.state.error && (
              <div className="bg-black/50 p-4 rounded-lg border border-white/5 mb-6 overflow-auto max-h-40">
                <code className="text-xs text-red-300 font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
