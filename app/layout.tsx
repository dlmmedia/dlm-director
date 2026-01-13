import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'DLM Director - Elite AI Cinematic Video Agent',
  description: 'AI-powered film direction with character consistency, professional cinematography, and seamless scene stitching.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // #region agent log
  // This is a server component so we can't use hooks, but we can log execution
  try {
    const fs = require('fs');
    const logPath = '/Users/shaji/dlm-director-new/.cursor/debug.log';
    const logEntry = JSON.stringify({
        location: 'app/layout.tsx:16',
        message: 'RootLayout rendering',
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'H_LAYOUT'
    }) + '\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (e) {}
  // #endregion

  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js"></script>
        <script src="https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js"></script>
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
