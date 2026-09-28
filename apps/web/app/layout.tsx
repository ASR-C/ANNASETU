import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANNASETU — Surplus Food Rescue Bridge',
  description: 'Bridging surplus food from restaurants to hungry communities. A warm, transparent, non-profit food rescue marketplace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#08120B" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 selection:bg-apple-100 selection:text-apple-900">
        {children}
      </body>
    </html>
  );
}
