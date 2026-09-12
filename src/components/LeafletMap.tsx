import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SosSignal, HazardZone } from '../types';
import { Map, Layers, ExternalLink, Compass } from 'lucide-react';

interface LeafletMapProps {
  signals: SosSignal[];
  selectedSignalId?: number | null;
  onSelectSignal?: (signal: SosSignal) => void;
  hazardZones?: HazardZone[];
  showHazards?: boolean;
}

type MapLayerType = 'osm-standard' | 'osm-humanitarian' | 'osm-topo';

const MAP_LAYERS: Record<MapLayerType, { name: string; url: string; subdomains?: string[]; maxZoom: number; attribution: string }> = {
  'osm-standard': {
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
  'osm-humanitarian': {
    name: 'OpenStreetMap Humanitarian (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank" rel="noopener noreferrer">Humanitarian OpenStreetMap Team</a>',
  },
  'osm-topo': {
    name: 'OpenStreetMap Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>',
  },
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  signals,
  selectedSignalId,
  onSelectSignal,
  hazardZones = [],
  showHazards = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hazardsLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('osm-standard');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Initialize Map with OpenStreetMap
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

    // Pure OpenStreetMap Tile Layer
    const layerConfig = MAP_LAYERS['osm-standard'];
    const tileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
      subdomains: layerConfig.subdomains || ['a', 'b', 'c'],
    }).addTo(map);

    activeTileLayerRef.current = tileLayer;

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

  // Handle Layer Switching (Standard OSM vs Humanitarian OSM vs Topo OSM)
  const handleSwitchLayer = (type: MapLayerType) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const layerConfig = MAP_LAYERS[type];
    const newTileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
      subdomains: layerConfig.subdomains || ['a', 'b', 'c'],
    }).addTo(map);

    activeTileLayerRef.current = newTileLayer;
    setActiveLayer(type);
    setShowLayerMenu(false);
  };

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
            ? '#2563eb'
            : zone.type === 'fire'
            ? '#dc2626'
            : zone.type === 'landslide'
            ? '#d97706'
            : '#7c3aed';

        const circle = L.circle(zone.center, {
          radius: zone.radius,
          color: color,
          weight: 3,
          fillColor: color,
          fillOpacity: 0.28,
          dashArray: '6, 6',
        }).addTo(hazardsGroup);

        circle.bindTooltip(
          `<div style="font-family: sans-serif; font-size: 12px;"><strong>⚠️ ${zone.title}</strong><br><span style="color: #475569;">${zone.description}</span></div>`,
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

      const pinColor = isRescued ? '#10b981' : isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6';

      const customIcon = L.divIcon({
        className: 'custom-beacon-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            ${
              isCritical && !isRescued
                ? `<div style="
                    position: absolute;
                    width: 38px;
                    height: 38px;
                    border-radius: 9999px;
                    background-color: rgba(239, 68, 68, 0.4);
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>`
                : ''
            }
            <div style="
              position: relative;
              width: ${isSelected ? '30px' : '24px'};
              height: ${isSelected ? '30px' : '24px'};
              border-radius: 9999px;
              background-color: ${pinColor};
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              ${isRescued ? '✓' : Math.round(safePriority)}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker([safeLat, safeLng], { icon: customIcon }).addTo(markersGroup);

      marker.bindTooltip(`<b>${sig.name}</b><br><small style="color: #ef4444;">${sig.condition}</small>`, {
        permanent: false,
        direction: 'top',
        offset: [0, -12],
      });

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 14px; color: #fff;">${sig.name}</span>
            <span style="background: ${isCritical ? '#ef4444' : '#f59e0b'}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 800;">
              Score ${Math.round(safePriority)}
            </span>
          </div>
          <div style="color: #f87171; font-weight: 700; font-size: 12px; margin-bottom: 6px;">
            🚨 ${sig.condition}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
            🔋 Battery: <b>${safeBattery}%</b> | ⏱️ ${sig.time}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📍 Lat: ${safeLat.toFixed(5)}, Lng: ${safeLng.toFixed(5)}
          </div>
          ${sig.notes ? `<div style="font-size: 11px; color: #cbd5e1; background: #1e293b; border: 1px solid #334155; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px;">"${sig.notes}"</div>` : ''}
          <div style="font-size: 11px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
            <span>Status: <strong style="text-transform: uppercase; color: ${sig.status === 'rescued' ? '#10b981' : sig.status === 'assigned' ? '#38bdf8' : '#fbbf24'};">${sig.status || 'ACTIVE'}</strong></span>
            <a href="https://www.openstreetmap.org/?mlat=${safeLat}&mlon=${safeLng}#map=16/${safeLat}/${safeLng}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">OSM Link &rarr;</a>
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

    // Pan smoothly if selected
    if (selectedSignalId) {
      const selected = signals.find((s) => s.id === selectedSignalId);
      if (selected) {
        map.panTo([selected.lat, selected.lng], { animate: true, duration: 0.8 });
      }
    } else if (signals.length > 0) {
      map.panTo([signals[0].lat, signals[0].lng]);
    }
  }, [signals, selectedSignalId, onSelectSignal]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Top Left: OpenStreetMap Layer Switcher */}
      <div className="absolute top-3 left-14 z-20 pointer-events-auto">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-all"
            title="Switch OpenStreetMap Layer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{MAP_LAYERS[activeLayer].name}</span>
            <span className="sm:hidden">OSM Layer</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs text-slate-200 z-30">
              {(Object.keys(MAP_LAYERS) as MapLayerType[]).map((layerKey) => (
                <button
                  key={layerKey}
                  onClick={() => handleSwitchLayer(layerKey)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${
                    activeLayer === layerKey
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{MAP_LAYERS[layerKey].name}</span>
                  {activeLayer === layerKey && <span className="text-[10px]">✓</span>}
                </button>
              ))}
              <div className="pt-1 border-t border-slate-800 px-2 text-[10px] text-slate-400">
                Powered by OpenStreetMap.org
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Right: Situational HUD Overlay */}
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

      {/* Bottom Left: OpenStreetMap Official Attribution Badge */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto">
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white transition-colors shadow"
        >
          <Map className="w-3 h-3 text-emerald-400" />
          <span>Map: <strong>OpenStreetMap.org</strong></span>
          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
        </a>
      </div>
    </div>
  );
};
