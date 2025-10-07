import React from 'react';
import Link from 'next/link';
import { Activity, BarChart3, Terminal, ArrowRight, Github, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6" />
              <span className="text-xl font-semibold">Traefik Log Dashboard</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#components" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Components
              </a>
              <a href="https://github.com/hhftechnology/traefik-log-dashboard" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-6">
            <Star className="w-3 h-3" />
            <span>Open Source • Real-time Analytics • Beautiful UI</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
            Analytics for your
            <br />
            Traefik Reverse Proxy
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10">
            A comprehensive analytics platform for Traefik access logs with real-time monitoring,
            beautiful dashboards, and powerful insights. Deploy as an agent, web dashboard, or CLI.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Link href="/dashboard" className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              View Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link href="/dashboard/demo" className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
              Try Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Components Section */}
      <div id="components" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Agent Card */}
          <div className="border border-gray-200 rounded-xl p-8 hover:border-gray-300 transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Go Agent</h3>
            <p className="text-gray-600 mb-6">
              Backend API service that parses Traefik logs and exposes metrics via REST endpoints with real-time monitoring.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Parses 100k+ lines/second</li>
              <li>• GeoIP lookups included</li>
              <li>• System resource monitoring</li>
              <li>• Bearer token authentication</li>
            </ul>
          </div>

          {/* Dashboard Card */}
          <div className="border border-gray-200 rounded-xl p-8 hover:border-gray-300 transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Web Dashboard</h3>
            <p className="text-gray-600 mb-6">
              Modern web-based dashboard with interactive charts and real-time updates built with Next.js 15 and React 19.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 10+ interactive dashboard cards</li>
              <li>• Chart.js and D3.js powered</li>
              <li>• Geographic heat maps</li>
              <li>• Responsive Tailwind CSS 4</li>
            </ul>
          </div>

          {/* CLI Card */}
          <div className="border border-gray-200 rounded-xl p-8 hover:border-gray-300 transition-colors">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <Terminal className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Terminal CLI</h3>
            <p className="text-gray-600 mb-6">
              Beautiful terminal-based dashboard for analyzing logs directly in your terminal with Bubble Tea framework.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Interactive TUI interface</li>
              <li>• Real-time updates</li>
              <li>• Color-coded metrics</li>
              <li>• &lt;10ms UI refresh rate</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div id="features" className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Key Features
          </h2>
          
          <div className="space-y-4">
            {[
              'Real-time monitoring with live request tracking and metrics',
              'Comprehensive analytics including response times, status codes, and error rates',
              'Geographic distribution of requests with GeoIP support',
              'System resource monitoring for CPU, memory, and disk usage',
              'Flexible deployment options: agent API, web dashboard, or standalone CLI',
              'Support for both JSON and Common Log Format (CLF)',
              'Incremental log reading with efficient position tracking',
              'Gzip compressed log file support',
            ].map((feature, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
          Quick Start
        </h2>
        <p className="text-center text-gray-600 mb-10">
          Get started with Docker Compose in under a minute
        </p>
        
        <div className="bg-gray-900 rounded-xl p-6 text-gray-100 font-mono text-sm overflow-x-auto">
          <div className="space-y-2">
            <div><span className="text-gray-500"># Clone the repository</span></div>
            <div>git clone https://github.com/hhftechnology/traefik-log-dashboard.git</div>
            <div>cd traefik-log-dashboard</div>
            <div className="pt-2"><span className="text-gray-500"># Start all services</span></div>
            <div>docker compose up -d</div>
            <div className="pt-2"><span className="text-gray-500"># Access the dashboard at http://localhost:3000</span></div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">100k+</div>
              <div className="text-sm text-gray-600">Lines parsed per second</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">~50MB</div>
              <div className="text-sm text-gray-600">Per 1M log entries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">&lt;10ms</div>
              <div className="text-sm text-gray-600">UI refresh latency</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">&lt;5%</div>
              <div className="text-sm text-gray-600">CPU usage average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Activity className="w-5 h-5" />
              <span className="font-semibold">Traefik Log Dashboard</span>
            </div>
            <div className="text-sm text-gray-600">
              Built with ❤️ for the Traefik community • Open Source • MIT License
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}