import Link from 'next/link';
import { ArrowRight, Activity, BarChart3, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 py-16">
				<div className="text-center mb-16">
					<h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">TRAEFIK LOG DASHBOARD</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Real-time analytics and monitoring for your Traefik reverse proxy</p>
					<div className="flex gap-4 justify-center">
						<Button asChild>
							<Link href="/dashboard" className="inline-flex items-center gap-2">
								View Dashboard
								<ArrowRight className="w-5 h-5" />
							</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/dashboard/demo" className="inline-flex items-center gap-2">Try Demo</Link>
						</Button>
					</div>
				</div>

				<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
					<Card className="rounded-xl shadow-lg">
						<CardContent className="p-8">
							<div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
								<Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
							</div>
							<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Real-time Monitoring</h3>
							<p className="text-gray-600 dark:text-gray-300">Monitor your Traefik logs in real-time with live updates and instant insights into your traffic patterns.</p>
						</CardContent>
					</Card>

					<Card className="rounded-xl shadow-lg">
						<CardContent className="p-8">
							<div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
								<BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
							</div>
							<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Advanced Analytics</h3>
							<p className="text-gray-600 dark:text-gray-300">Deep dive into router performance, service metrics, response times, and error rates with detailed visualizations.</p>
						</CardContent>
					</Card>

					<Card className="rounded-xl shadow-lg">
						<CardContent className="p-8">
							<div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
								<Gauge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
							</div>
							<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">System Resources</h3>
							<p className="text-gray-600 dark:text-gray-300">Track CPU, memory, and disk usage alongside your log analytics for complete system visibility.</p>
						</CardContent>
					</Card>
				</div>

				<div className="mt-16 text-center">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Key Features</h2>
					<div className="max-w-3xl mx-auto">
						<ul className="text-left space-y-3 text-gray-600 dark:text-gray-300">
							<li className="flex items-start gap-3">
								<span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
								<span>Router and service-level metrics with overhead tracking</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
								<span>Geographic distribution of requests with interactive maps</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
								<span>Response time analysis with P95 and P99 percentiles</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
								<span>Status code distribution and error rate monitoring</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
								<span>Top routes and backends by request volume</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
								<span>User agent and browser analytics</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}