// dashboard/components/providers/Providers.tsx
'use client';

import { AgentProvider } from '@/lib/contexts/AgentContext';
import { FilterProvider } from '@/lib/contexts/FilterContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AgentProvider>
      <FilterProvider>
        {children}
      </FilterProvider>
    </AgentProvider>
  );
}