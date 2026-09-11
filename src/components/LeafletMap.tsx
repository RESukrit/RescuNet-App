import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SosSignal, HazardZone } from '../types';

interface LeafletMapProps {
  signals: SosSignal[];
  selectedSignalId?: number | null;
  onSelectSignal?: (signal: SosSignal) => void;
  hazardZones?: HazardZone[];
  showHazards?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  signals,
  selectedSignalId,
  onSelectSignal,
  hazardZones = [],
  showHazards = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hazardsLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center from RescuNet app.py: 10.053, 76.627
    const initialLat = 10.053;
    const initialLng = 76.627;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
    });

 // Dark-themed tiles for emergency command center look
    const cartoKey = import.meta.env.VITE_CARTO_API_KEY;
    const tileUrl = cartoKey
      ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  className: 'dark-tiles',
  maxZoom: 19,
   }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const hazardsGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    hazardsLayerRef.current = hazardsGroup;

    // Resize observer to handle container size changes smoothly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Hazard Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    const hazardsGroup = hazardsLayerRef.current;
    if (!map || !hazardsGroup) return;

    hazardsGroup.clearLayers();

    if (showHazards && hazardZones.length > 0) {
      hazardZones.forEach((zone) => {
        if (!zone.active) return;
        const color =
          zone.type === 'flood'
            ? '#3b82f6'
            : zone.type === 'fire'
            ? '#ef4444'
            : zone.type === 'landslide'
            ? '#f59e0b'
            : '#8b5cf6';

        const circle = L.circle(zone.center, {
          radius: zone.radius,
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.22,
          dashArray: '5, 5',
        }).addTo(hazardsGroup);

        circle.bindTooltip(
          `<strong>⚠️ ${zone.title}</strong><br><span style="font-size: 11px;">${zone.description}</span>`,
          {
            direction: 'center',
            permanent: false,
            className: 'custom-hazard-tooltip',
          }
        );
      });
    }
  }, [hazardZones, showHazards]);

  // Update Signal Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (signals.length === 0) return;

    signals.forEach((sig) => {
      const safeLat = typeof sig.lat === 'number' && !Number.isNaN(sig.lat) ? sig.lat : 10.0534;
      const safeLng = typeof sig.lng === 'number' && !Number.isNaN(sig.lng) ? sig.lng : 76.6272;
      const safePriority = typeof sig.priority === 'number' && !Number.isNaN(sig.priority) ? sig.priority : 50;
      const safeBattery = typeof sig.battery === 'number' && !Number.isNaN(sig.battery) ? sig.battery : 50;

      const isSelected = sig.id === selectedSignalId;
      const isCritical = safePriority >= 60;
      const isHigh = safePriority >= 40 && safePriority < 60;
      const isRescued = sig.status === 'rescued';

      const colorClass = isRescued
        ? 'bg-emerald-500 border-emerald-300'
        : isCritical
        ? 'bg-red-500 border-red-300 ring-4 ring-red-500/40 animate-pulse'
        : isHigh
        ? 'bg-amber-500 border-amber-300 ring-2 ring-amber-500/30'
        : 'bg-blue-500 border-blue-300';

      const customIcon = L.divIcon({
        className: 'custom-beacon-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: ${isSelected ? '28px' : '20px'};
              height: ${isSelected ? '28px' : '20px'};
              border-radius: 9999px;
              background-color: ${isRescued ? '#10b981' : isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6'};
              border: 2px solid #ffffff;
              box-shadow: 0 0 14px ${isCritical ? 'rgba(239,68,68,0.8)' : 'rgba(0,0,0,0.5)'};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
              cursor: pointer;
            ">
              ${isRescued ? '✓' : Math.round(safePriority)}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([safeLat, safeLng], { icon: customIcon }).addTo(markersGroup);

      marker.bindTooltip(`<b>${sig.name}</b><br><small style="color: #f87171;">${sig.condition}</small>`, {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
      });

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 200px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 14px; color: #fff;">${sig.name}</span>
            <span style="background: ${isCritical ? '#ef4444' : '#f59e0b'}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">
              Score ${safePriority}
            </span>
          </div>
          <div style="color: #f87171; font-weight: 600; font-size: 12px; margin-bottom: 6px;">
            🚨 ${sig.condition}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
            🔋 Battery: <b>${safeBattery}%</b> | ⏱️ ${sig.time}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📍 Lat: ${safeLat.toFixed(4)}, Lng: ${safeLng.toFixed(4)}
          </div>
          ${sig.notes ? `<div style="font-size: 11px; color: #cbd5e1; background: #334155; padding: 4px 6px; border-radius: 4px; margin-bottom: 8px;">"${sig.notes}"</div>` : ''}
          <div style="font-size: 10px; color: #64748b;">
            Status: <span style="text-transform: uppercase; font-weight: bold; color: ${sig.status === 'rescued' ? '#10b981' : sig.status === 'assigned' ? '#38bdf8' : '#fbbf24'};">${sig.status || 'ACTIVE'}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectSignal) {
          onSelectSignal(sig);
        }
      });
    });

    // If a specific signal is selected, pan to it smoothly
    if (selectedSignalId) {
      const selected = signals.find((s) => s.id === selectedSignalId);
      if (selected) {
        map.panTo([selected.lat, selected.lng], { animate: true, duration: 0.8 });
      }
    } else if (signals.length > 0) {
      // Pan to highest priority signal as done in dashboard.html
      map.panTo([signals[0].lat, signals[0].lng]);
    }
  }, [signals, selectedSignalId, onSelectSignal]);

  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-900 overflow-hidden rounded-xl border border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map HUD Overlay */}
      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center gap-3 pointer-events-auto shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block"></span>
          <span>Critical ({signals.filter(s => s.priority >= 60 && s.status !== 'rescued').length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>High ({signals.filter(s => s.priority >= 40 && s.priority < 60 && s.status !== 'rescued').length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Rescued ({signals.filter(s => s.status === 'rescued').length})</span>
        </div>
      </div>
    </div>
  );
};
