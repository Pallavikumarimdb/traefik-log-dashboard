'use client';

import { useState } from 'react';
import { MapPin, Globe } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { GeoLocation } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

import Link from 'next/link';
import { GlobeToMapTransform } from '@/components/dashboard/GlobeToMapTransform';

interface Props {
  locations: GeoLocation[];
}

export default function InteractiveGeoMap({ locations }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  if (!locations || locations.length === 0) {
    return (
      <Card title="Interactive Geographic Map" icon={<Globe className="w-5 h-5 text-red-600" />}>
        <div className="space-y-4">
           {/* Show globe even if no data, or just show the empty message? 
               User request implies adding the globe. 
               But "No geographic data available" suggests we shouldn't show a map that pretends to have data.
               However, the globe is interactive. 
               Let's render it but maybe with a note, or just keep the empty state separate.
               Actually, let's put it in the main block. If no locations, maybe we don't show the component?
               Let's stick to the main block for now.
           */}
           <div className="text-center py-8 text-gray-500">No geographic data available</div>
        </div>
      </Card>
    );
  }

  const validLocations = locations.filter(
    (loc) => loc.country !== 'Unknown' && loc.country !== 'Private' && loc.country !== 'Private Network'
  );
  
  const totalRequests = validLocations.reduce((sum, loc) => sum + loc.count, 0);
  const maxCount = Math.max(...validLocations.map(loc => loc.count));

  const topLocations = validLocations.slice(0, 15);
  const selectedLocation = selectedCountry 
    ? validLocations.find(loc => loc.country === selectedCountry)
    : null;

  // ✅ Fixed: If country is already a 2-letter code, return it; otherwise try to map it
  const getCountryCode = (country: string): string => {
    // If already a 2-letter ISO code, return as-is
    if (country && country.length === 2) {
      return country.toUpperCase();
    }
    
    // Fallback mapping for full names (kept for backwards compatibility)
    const codes: { [key: string]: string } = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'Germany': 'DE',
      'France': 'FR',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR',
      'Canada': 'CA',
      'Australia': 'AU',
      'Russia': 'RU',
      'South Korea': 'KR',
      'Spain': 'ES',
      'Italy': 'IT',
      'Netherlands': 'NL',
      'Taiwan': 'TW',
      'Singapore': 'SG',
      'Hong Kong': 'HK',
    };
    return codes[country] || country.substring(0, 2).toUpperCase();
  };

  const getHeatColor = (count: number): string => {
    const intensity = (count / maxCount) * 100;
    if (intensity > 75) return 'bg-red-600 border-red-700';
    if (intensity > 50) return 'bg-red-500 border-red-600';
    if (intensity > 25) return 'bg-red-400 border-red-500';
    return 'bg-red-300 border-red-400';
  };

  const getTextColor = (count: number): string => {
    const intensity = (count / maxCount) * 100;
    if (intensity > 75) return 'text-red-600';
    if (intensity > 50) return 'text-red-500';
    if (intensity > 25) return 'text-red-400';
    return 'text-red-300';
  };

  return (
    <Card title="Interactive Geographic Map" icon={<Globe className="w-5 h-5 text-red-600" />}>
      <div className="space-y-4">
        {/* Globe Visualization */}
        <div className="w-full border rounded-lg overflow-hidden bg-neutral-50 mb-4">
          <GlobeToMapTransform locations={validLocations} />
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">Total Locations</div>
              <div className="text-3xl font-bold text-red-600">{validLocations.length}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Requests</div>
              <div className="text-3xl font-bold text-gray-900">{formatNumber(totalRequests)}</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {topLocations.map((location, idx) => {
              const percentage = (location.count / totalRequests) * 100;
              const isSelected = selectedCountry === location.country;
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCountry(isSelected ? null : location.country)}
                  className={`
                    relative group p-3 rounded-lg border-2 transition-all transform hover:scale-105
                    ${isSelected 
                      ? 'bg-red-600 border-red-700 shadow-lg scale-105' 
                      : `${getHeatColor(location.count)} hover:shadow-md`
                    }
                  `}
                  title={`${location.country}: ${formatNumber(location.count)} requests (${percentage.toFixed(1)}%)`}
                >
                  <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {getCountryCode(location.country)}
                  </div>
                  <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {(percentage).toFixed(0)}%
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-white opacity-90' : 'text-gray-600'}`}>
                    {formatNumber(location.count)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Heat: </span>
            <div className="flex-1 mx-3 h-2 rounded-full bg-gradient-to-r from-red-300 via-red-500 to-red-600"></div>
            <span>Low → High</span>
          </div>
        </div>

        {selectedLocation && (
          <div className="bg-white rounded-lg p-4 border-2 border-red-600 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-lg font-bold text-gray-900">{selectedLocation.country}</div>
                {selectedLocation.city && (
                  <div className="text-sm text-gray-600">{selectedLocation.city}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Requests</div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(selectedLocation.count)}</div>
              </div>
              <div>
                <div className="text-gray-600">Percentage</div>
                <div className="text-2xl font-bold text-red-600">
                  {((selectedLocation.count / totalRequests) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
            {selectedLocation.latitude && selectedLocation.longitude && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                📍 {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}°
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {topLocations.map((location, idx) => {
            const percentage = (location.count / totalRequests) * 100;
            const isSelected = selectedCountry === location.country;
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedCountry(isSelected ? null : location.country)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all
                  ${isSelected 
                    ? 'bg-red-100 border-red-600 shadow-md' 
                    : 'bg-white border-red-200 hover:bg-red-50 hover:border-red-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded ${
                      isSelected ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={`font-semibold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                      {location.country}
                    </span>
                    {location.city && (
                      <span className="text-sm text-gray-500">• {location.city}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">{formatNumber(location.count)}</span>
                    <span className={`font-bold ${getTextColor(location.count)}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isSelected ? 'bg-red-600' : 'bg-red-500'
                    }`}
                    style={{ width: `${(location.count / maxCount) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}