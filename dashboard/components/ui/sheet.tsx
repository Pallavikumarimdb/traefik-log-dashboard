import * as React from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
	open: boolean
	onOpenChange?: (open: boolean) => void
	children: React.ReactNode
}

export function Sheet({ open, children }: SheetProps) {
	return <div data-open={open}>{children}</div>
}

export function SheetTrigger({ onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return <button onClick={onClick} {...props} />
}

export function SheetContent({ className, side = 'left', ...props }: React.HTMLAttributes<HTMLDivElement> & { side?: 'left' | 'right' }) {
	const translate = {
		left: 'data-[open=false]:-translate-x-full',
		right: 'data-[open=false]:translate-x-full',
	}[side]
	return (
		<div
			className={cn(
				'fixed top-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-transform',
				translate,
				className
			)}
			{...props}
		/>
	)
}

export function SheetOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('fixed inset-0 bg-black/50', className)} {...props} />
}
