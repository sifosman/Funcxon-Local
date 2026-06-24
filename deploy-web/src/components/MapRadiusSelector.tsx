// WEB ONLY — deploy-web/src/components/MapRadiusSelector.tsx
import { useState } from 'react';

interface MapRadiusSelectorProps {
  latitude: number;
  longitude: number;
  radiusKm: number;
  onRadiusChange?: (radiusKm: number) => void;
  className?: string;
}

export function MapRadiusSelector({
  latitude,
  longitude,
  radiusKm,
  onRadiusChange,
  className = '',
}: MapRadiusSelectorProps) {
  const [radius, setRadius] = useState(radiusKm);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handleRadiusChange = (value: number) => {
    setRadius(value);
    onRadiusChange?.(value);
  };

  // Google Maps Embed URL centred on the coordinates with a place marker.
  const mapSrc =
    `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}` +
    `&q=${encodeURIComponent(`${latitude},${longitude}`)}` +
    `&zoom=12`;

  return (
    <div className={className}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        {apiKey ? (
          <iframe
            title="Coverage map"
            src={mapSrc}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant">
            Map preview unavailable — no Google Maps API key configured
          </div>
        )}

        {/* Approximate radius overlay (very rough visual only) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-teal/70 bg-brand-teal/10"
          style={{
            width: `${Math.min(80, Math.max(10, radius * 2))}%`,
            height: `${Math.min(80, Math.max(10, radius * 2))}%`,
          }}
        />
      </div>

      <div className="mt-4 rounded-xl bg-surface-container-low p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface">Search radius</span>
          <span className="font-semibold text-brand-teal">{radius} km</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={radius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="mt-3 w-full accent-brand-teal"
        />
        <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>
    </div>
  );
}
