// dashboard/lib/contexts/FilterContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { FilterSettings, FilterCondition, defaultFilterSettings } from '../types/filter';

interface FilterContextType {
  settings: FilterSettings;
  updateSettings: (settings: Partial<FilterSettings>) => void;
  resetSettings: () => void;
  addCustomCondition: (condition: FilterCondition) => void;
  removeCustomCondition: (id: string) => void;
  updateCustomCondition: (id: string, condition: Partial<FilterCondition>) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEY = 'traefik-filter-settings';

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<FilterSettings>(defaultFilterSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultFilterSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse filter settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // PERFORMANCE FIX: Memoize callback functions to prevent unnecessary re-renders
  const updateSettings = useCallback((newSettings: Partial<FilterSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultFilterSettings);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addCustomCondition = useCallback((condition: FilterCondition) => {
    setSettings((prev) => ({
      ...prev,
      customConditions: [...prev.customConditions, condition],
    }));
  }, []);

  const removeCustomCondition = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      customConditions: prev.customConditions.filter((c) => c.id !== id),
    }));
  }, []);

  const updateCustomCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setSettings((prev) => ({
      ...prev,
      customConditions: prev.customConditions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  // PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
      addCustomCondition,
      removeCustomCondition,
      updateCustomCondition,
    }),
    [settings, updateSettings, resetSettings, addCustomCondition, removeCustomCondition, updateCustomCondition]
  );

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}