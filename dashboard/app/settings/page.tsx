'use client';

import Link from 'next/link';
import {
  Server,
  Bell,
  Database,
  Filter,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const settingsItems = [
  {
    title: 'Agent Management',
    description: 'Configure and monitor your Traefik log agents',
    icon: Server,
    href: '/settings/agents',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBorderColor: 'hover:border-red-500',
  },
  {
    title: 'Alert Configuration',
    description: 'Manage webhooks and alert rules for notifications',
    icon: Bell,
    href: '/settings/alerts',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBorderColor: 'hover:border-red-500',
  },
  {
    title: 'Historical Data',
    description: 'Configure long-term data retention and archival',
    icon: Database,
    href: '/settings/historical',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBorderColor: 'hover:border-red-500',
  },
  {
    title: 'Filters',
    description: 'Configure log filtering and search settings',
    icon: Filter,
    href: '/settings/filters',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBorderColor: 'hover:border-red-500',
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure your Traefik Log Dashboard
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group block p-6 bg-white rounded-lg border-2 ${item.borderColor} ${item.hoverBorderColor} transition-all hover:shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 ${item.bgColor} rounded-lg`}>
                        <Icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                        {item.title}
                      </h2>
                    </div>
                    <p className="text-gray-600">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
