'use client';

import Link from 'next/link';
import { Activity, Home } from 'lucide-react';

interface HeaderProps {
  title: string;
  connected?: boolean;
  demoMode?: boolean;
}

export default function Header({ title, connected = false, demoMode = false }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {demoMode && (
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Demo Mode - Simulated Data
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {connected !== undefined && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}
                />
                <span className="text-sm text-muted-foreground">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )}

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}