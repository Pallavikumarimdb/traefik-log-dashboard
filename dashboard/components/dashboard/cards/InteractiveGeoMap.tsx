'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapPin, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GeoLocation } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { ResponsiveGeoMap } from '@nivo/geo';
import { useTheme } from 'next-themes';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

interface Props {
  locations: GeoLocation[];
}

// Country coordinates for marker placement
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'US': [-95.7129, 37.0902],
  'GB': [-3.4360, 55.3781],
  'DE': [10.4515, 51.1657],
  'FR': [2.2137, 46.2276],
  'ES': [-3.7492, 40.4637],
  'IT': [12.5674, 41.8719],
  'NL': [5.2913, 52.1326],
  'PL': [19.1451, 51.9194],
  'CN': [104.1954, 35.8617],
  'AU': [133.7751, -25.2744],
  'SG': [103.8198, 1.3521],
  'JP': [138.2529, 36.2048],
  'IN': [78.9629, 20.5937],
  'KR': [127.7669, 35.9078],
  'BR': [-51.9253, -14.2350],
  'ZA': [22.9375, -30.5595],
  'EG': [30.8025, 26.8206],
  'HK': [114.1694, 22.3193],
  'CA': [-106.3468, 56.1304],
  'MX': [-102.5528, 23.6345],
  'TR': [35.2433, 38.9637],
  'RU': [105.3188, 61.5240],
  'SE': [18.6435, 60.1282],
  'NO': [8.4689, 60.4720],
  'FI': [25.7482, 61.9241],
  'CH': [8.2275, 46.8182],
  'AT': [14.5501, 47.5162],
  'BE': [4.4699, 50.5039],
  'PT': [-8.2245, 39.3999],
  'IE': [-8.2439, 53.4129],
  'TW': [120.9605, 23.6978],
  'TH': [100.9925, 15.8700],
  'VN': [108.2772, 14.0583],
  'ID': [113.9213, -0.7893],
  'MY': [101.9758, 4.2105],
  'PH': [121.7740, 12.8797],
  'NZ': [174.8860, -40.9006],
};

export default function InteractiveGeoMap({ locations }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [worldFeatures, setWorldFeatures] = useState<GeoJSON.Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  // Load world map data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        const response = await fetch('/world-map.json');
        const topology = await response.json() as Topology<{ countries: GeometryCollection }>;
        const geojson = feature(topology, topology.objects.countries);
        if ('features' in geojson) {
          setWorldFeatures(geojson.features);
        }
      } catch (error) {
        console.error('Failed to load world map:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorldData();
  }, []);

  const validLocations = useMemo(() =>
    locations.filter(
      (loc) => loc.country !== 'Unknown' && loc.country !== 'Private' && loc.country !== 'Private Network'
    ),
    [locations]
  );

  const totalRequests = useMemo(() =>
    validLocations.reduce((sum, loc) => sum + loc.count, 0),
    [validLocations]
  );

  const maxCount = useMemo(() =>
    Math.max(...validLocations.map(loc => loc.count), 1),
    [validLocations]
  );

  const topLocations = useMemo(() =>
    validLocations.slice(0, 15),
    [validLocations]
  );

  const selectedLocation = useMemo(() =>
    selectedCountry ? validLocations.find(loc => loc.country === selectedCountry) : null,
    [selectedCountry, validLocations]
  );

  const getCountryCode = (country: string): string => {
    if (country && country.length === 2) {
      return country.toUpperCase();
    }
    const codes: Record<string, string> = {
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

  // Get marker size based on count
  const getMarkerRadius = (count: number): number => {
    const minRadius = 4;
    const maxRadius = 20;
    const ratio = count / maxCount;
    return minRadius + (maxRadius - minRadius) * Math.sqrt(ratio);
  };

  // Markers for locations with coordinates
  const markers = useMemo(() => {
    return validLocations
      .map(loc => {
        const code = getCountryCode(loc.country);
        const coords = loc.latitude && loc.longitude
          ? [loc.longitude, loc.latitude] as [number, number]
          : COUNTRY_COORDS[code];

        if (!coords) return null;

        return {
          id: loc.country,
          coordinates: coords,
          count: loc.count,
          city: loc.city,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [validLocations]);

  if (!locations || locations.length === 0) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Geographic Distribution</CardTitle>
          <div className="text-primary"><Globe className="w-5 h-5" /></div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px] border rounded-lg overflow-hidden bg-slate-50 dark:bg-neutral-900 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No geographic data available yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">Geographic Distribution</CardTitle>
        <div className="text-primary"><Globe className="w-5 h-5 text-red-600" /></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Visualization */}
          <div className="w-full h-[350px] border rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">Loading map...</span>
                </div>
              </div>
            ) : worldFeatures.length > 0 ? (
              <ResponsiveGeoMap
                features={worldFeatures}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                projectionType="mercator"
                projectionScale={120}
                projectionTranslation={[0.5, 0.65]}
                fillColor={isDark ? '#374151' : '#e5e7eb'}
                borderWidth={0.5}
                borderColor={isDark ? '#4b5563' : '#9ca3af'}
                enableGraticule={true}
                graticuleLineWidth={0.5}
                graticuleLineColor={isDark ? '#1f2937' : '#d1d5db'}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Failed to load map
              </div>
            )}

            {/* SVG Overlay for markers */}
            {!isLoading && worldFeatures.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                {markers.map((marker) => {
                  // Simple Mercator projection calculation
                  const [lon, lat] = marker.coordinates;
                  const x = ((lon + 180) / 360) * 100;
                  const latRad = (lat * Math.PI) / 180;
                  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
                  const y = 50 - (mercN / Math.PI) * 32.5;

                  const radius = getMarkerRadius(marker.count);
                  const isSelected = selectedCountry === marker.id;

                  return (
                    <g key={marker.id} style={{ pointerEvents: 'auto' }}>
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r={radius}
                        fill={isSelected ? '#dc2626' : '#ef4444'}
                        fillOpacity={0.7}
                        stroke="#fff"
                        strokeWidth={isSelected ? 2 : 1}
                        className="cursor-pointer transition-all hover:fill-opacity-100"
                        onClick={() => setSelectedCountry(isSelected ? null : marker.id)}
                      />
                      <title>{`${marker.id}${marker.city ? ` - ${marker.city}` : ''}: ${formatNumber(marker.count)} requests`}</title>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Stats Summary */}
          <div className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-neutral-900 rounded-lg p-6 border border-red-200 dark:border-red-900/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Locations</div>
                <div className="text-3xl font-bold text-red-600">{validLocations.length}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Requests</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(totalRequests)}</div>
              </div>
            </div>

            {/* Country Grid */}
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
                    <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                      {getCountryCode(location.country)}
                    </div>
                    <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {(percentage).toFixed(0)}%
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-white opacity-90' : 'text-gray-600 dark:text-gray-400'}`}>
                      {formatNumber(location.count)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Heat legend */}
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Heat: </span>
              <div className="flex-1 mx-3 h-2 rounded-full bg-gradient-to-r from-red-300 via-red-500 to-red-600"></div>
              <span>Low → High</span>
            </div>
          </div>

          {/* Selected Location Details */}
          {selectedLocation && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border-2 border-red-600 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedLocation.country}</div>
                  {selectedLocation.city && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{selectedLocation.city}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Requests</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(selectedLocation.count)}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Percentage</div>
                  <div className="text-2xl font-bold text-red-600">
                    {((selectedLocation.count / totalRequests) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              {selectedLocation.latitude && selectedLocation.longitude && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  📍 {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}°
                </div>
              )}
            </div>
          )}

          {/* Location List */}
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
                      ? 'bg-red-100 dark:bg-red-950/30 border-red-600 shadow-md'
                      : 'bg-white dark:bg-neutral-900 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-900/30 text-red-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`font-semibold ${isSelected ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                        {location.country}
                      </span>
                      {location.city && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">• {location.city}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{formatNumber(location.count)}</span>
                      <span className={`font-bold ${getTextColor(location.count)}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
      </CardContent>
    </Card>
  );
}
