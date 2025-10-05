'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card as UICard, CardHeader, CardTitle, CardContent } from './card';

interface CardProps {
	title?: string;
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
	action?: ReactNode;
}

export default function Card({ title, icon, children, className, action }: CardProps) {
	const hasHeader = Boolean(title || icon || action);
	return (
		<UICard className={cn('animate-fade-in', className)}>
			{hasHeader && (
				<CardHeader className="mb-0">
					<div className="flex items-center gap-2">
						{icon && <div className="flex-shrink-0">{icon}</div>}
						{title && <CardTitle>{title}</CardTitle>}
					</div>
					{action && <div>{action}</div>}
				</CardHeader>
			)}
			<CardContent className="p-6">{children}</CardContent>
		</UICard>
	);
}