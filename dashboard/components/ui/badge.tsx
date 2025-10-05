import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
	const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
	const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
		default: 'bg-blue-600 text-white',
		secondary: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white',
		destructive: 'bg-red-600 text-white',
		outline: 'border border-gray-300 text-gray-900 dark:border-gray-700 dark:text-white',
	}
	return <span className={cn(base, variants[variant], className)} {...props} />
}
