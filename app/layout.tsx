import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DLM Director - Elite AI Cinematic Video Agent',
  description: 'AI-powered film direction with character consistency, professional cinematography, and seamless scene stitching.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js"></script>
        <script src="https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js"></script>
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
