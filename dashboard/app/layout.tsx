// dashboard/app/layout.tsx
import React from 'react';
import './globals.css';
import { AgentProvider } from '@/lib/contexts/AgentContext';

export const metadata = {
  title: 'Traefik Log Dashboard',
  description: 'Real-time analytics and monitoring for Traefik reverse proxy logs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AgentProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AgentProvider>
      </body>
    </html>
  );
}