import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { ParcelRecord, SurveyType } from '../types';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  ArrowRight, 
  Satellite, 
  Map as MapIcon, 
  Compass,
  Search,
  Loader2,
  MapPin,
  CheckCircle2,
  Ruler,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { calculateDistanceMeters } from '../services/spatialEngine';

interface CadastralLeafletMapProps {
  parcels: ParcelRecord[];
  selectedParcel: ParcelRecord | null;
  onSelectParcel: (parcel: ParcelRecord) => void;
  onTraceLineage: (parcel: ParcelRecord) => void;
  filterSurvey: SurveyType | 'ALL';
  mouzaCenter: { lat: number; lng: number };
  showBaseMapToggle?: boolean;
  showOsmSearch?: boolean;
  height?: string;
}

type BaseMapType = 'osm' | 'osm_hot' | 'satellite' | 'carto';

const BASE_MAPS: Record<BaseMapType, { name: string; url: string; attribution: string; maxZoom: number }> = {
  osm: {
    name: 'OpenStreetMap (Standard)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  osm_hot: {
    name: 'OSM Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team',
    maxZoom: 19,
  },
  carto: {
    name: 'Carto Clean Street',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
    maxZoom: 20,
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
};

const SURVEY_COLORS: Record<SurveyType, { stroke: string; fill: string; fillSelected: string }> = {
  CS: { stroke: '#4f46e5', fill: '#818cf8', fillSelected: '#3730a3' }, // Indigo
  SA: { stroke: '#d97706', fill: '#fbbf24', fillSelected: '#92400e' }, // Amber
  RS: { stroke: '#059669', fill: '#34d399', fillSelected: '#065f46' }, // Emerald
  BS: { stroke: '#0891b2', fill: '#22d3ee', fillSelected: '#155e75' }, // Cyan
};

const OSM_QUICK_SEARCHES = [
  { label: 'Badda', query: 'Badda, Dhaka, Bangladesh' },
  { label: 'Tejgaon', query: 'Tejgaon, Dhaka, Bangladesh' },
  { label: 'Savar', query: 'Savar, Dhaka, Bangladesh' },
  { label: 'Gulshan', query: 'Gulshan, Dhaka, Bangladesh' },
  { label: 'Mirpur', query: 'Mirpur, Dhaka, Bangladesh' },
];

export const CadastralLeafletMap: React.FC<CadastralLeafletMapProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
  onTraceLineage,
  filterSurvey,
  mouzaCenter,
  showBaseMapToggle = true,
  showOsmSearch = true,
  height = '520px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const measurementGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<SurveyType | 'ALL'>(filterSurvey);
  // Default to OpenStreetMap Standard
  const [baseMap, setBaseMap] = useState<BaseMapType>('osm');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // OpenStreetMap Nominatim Geocoding API state
  const [osmSearchQuery, setOsmSearchQuery] = useState<string>('');
  const [isSearchingOsm, setIsSearchingOsm] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Interactive Measurement tool
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measureResult, setMeasureResult] = useState<{ meters: number; feet: number } | null>(null);

  // Reverse geocoded location toast
  const [reverseGeocodedPlace, setReverseGeocodedPlace] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  useEffect(() => {
    setActiveLayer(filterSurvey);
  }, [filterSurvey]);

  // Invalidate size helper
  const invalidateMapSize = useCallback(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, []);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [mouzaCenter.lat, mouzaCenter.lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: true,
    });

    // Metric scale bar (accurate surveying scale in meters)
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);

    // Initial base tile layer (OpenStreetMap default)
    const cfg = BASE_MAPS[baseMap];
    const tileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      subdomains: 'abc',
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Layer groups
    const polyGroup = L.layerGroup().addTo(map);
    polygonLayerGroupRef.current = polyGroup;

    const searchGroup = L.layerGroup().addTo(map);
    searchMarkerGroupRef.current = searchGroup;

    const measureGroup = L.layerGroup().addTo(map);
    measurementGroupRef.current = measureGroup;

    mapInstanceRef.current = map;

    // Track mouse coordinates for surveyor precision
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    });

    // Click handler for map to query OpenStreetMap reverse geocode or measure distance
    map.on('click', async (e) => {
      const clickLat = Number(e.latlng.lat.toFixed(6));
      const clickLng = Number(e.latlng.lng.toFixed(6));

      // Handle measurement tool if active
      if (measurementGroupRef.current && isMeasuring) {
        return; // Handled in measurement effect
      }

      // Reverse geocode via OpenStreetMap free API
      setIsReverseGeocoding(true);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLng}&zoom=18&addressdetails=1`;
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (resp.ok) {
          const data = await resp.json();
          const placeTitle = data.display_name?.split(',').slice(0, 3).join(', ') || 'Bangladesh Cadastral Coordinate';
          setReverseGeocodedPlace({
            name: placeTitle,
            lat: clickLat,
            lng: clickLng,
          });
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
      } finally {
        setIsReverseGeocoding(false);
      }
    });

    // Invalidate size after layout settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle base map change
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    const cfg = BASE_MAPS[baseMap];
    baseTileLayerRef.current.setUrl(cfg.url);
    invalidateMapSize();
  }, [baseMap, invalidateMapSize]);

  // Handle mouza center change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([mouzaCenter.lat, mouzaCenter.lng], 17, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
    invalidateMapSize();
  }, [mouzaCenter.lat, mouzaCenter.lng, invalidateMapSize]);

  // Handle Measurement tool clicks
  useEffect(() => {
    if (!mapInstanceRef.current || !measurementGroupRef.current) return;
    const map = mapInstanceRef.current;
    const group = measurementGroupRef.current;

    if (!isMeasuring) {
      group.clearLayers();
      setMeasurePoints([]);
      setMeasureResult(null);
      return;
    }

    const handleMeasureClick = (e: L.LeafletMouseEvent) => {
      const point: [number, number] = [e.latlng.lat, e.latlng.lng];
      
      setMeasurePoints((prev) => {
        const next = [...prev, point];
        group.clearLayers();

        // Draw markers
        next.forEach((pt, idx) => {
          L.circleMarker([pt[0], pt[1]], {
            radius: 5,
            color: '#ffffff',
            fillColor: idx === 0 ? '#10b981' : '#f59e0b',
            fillOpacity: 1,
            weight: 2,
          }).addTo(group);
        });

        // Draw line if 2 points
        if (next.length >= 2) {
          const pt1 = next[next.length - 2];
          const pt2 = next[next.length - 1];
          L.polyline([[pt1[0], pt1[1]], [pt2[0], pt2[1]]], {
            color: '#f59e0b',
            weight: 3,
            dashArray: '6, 6',
          }).addTo(group);

          const distM = calculateDistanceMeters(pt1, pt2);
          const distFt = distM * 3.28084;
          setMeasureResult({ meters: Math.round(distM * 10) / 10, feet: Math.round(distFt * 10) / 10 });
        }

        if (next.length > 2) {
          return [point];
        }
        return next;
      });
    };

    map.on('click', handleMeasureClick);
    return () => {
      map.off('click', handleMeasureClick);
    };
  }, [isMeasuring]);

  // Render Polygons, Corner Pillars, and Dimensions
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayerGroupRef.current) return;

    const group = polygonLayerGroupRef.current;
    group.clearLayers();

    const withGeometry = parcels.filter((p) => {
      if (!p.geometry) return false;
      if (activeLayer !== 'ALL' && p.surveyType !== activeLayer) return false;
      return true;
    });

    const bounds = L.latLngBounds([]);

    withGeometry.forEach((parcel) => {
      if (!parcel.geometry) return;

      const isSelected = selectedParcel?.id === parcel.id;
      const colors = SURVEY_COLORS[parcel.surveyType];

      // Convert [lat, lng] array
      const latLngs = parcel.geometry.coordinates.map(([lat, lng]) => [lat, lng] as [number, number]);

      const polygon = L.polygon(latLngs, {
        color: isSelected ? '#ffffff' : colors.stroke,
        weight: isSelected ? 3.5 : 2,
        fillColor: isSelected ? colors.fillSelected : colors.fill,
        fillOpacity: isSelected ? 0.85 : 0.45,
        dashArray: parcel.surveyType === 'RS' ? '4, 4' : undefined,
      });

      // Tooltip with Bengali & English details
      polygon.bindTooltip(
        `<strong>${parcel.surveyType} Dag #${parcel.dagNo} (${parcel.dagNoBn})</strong><br/>
         Area: ${parcel.normalizedAreaDecimal.toFixed(2)} dec • Khatian #${parcel.khatianNo}<br/>
         <span style="font-size:10px; opacity:0.85;">${parcel.mouzaNameEn} (JL #${parcel.jlNo})</span>`,
        {
          sticky: true,
          direction: 'top',
          className: 'cadastral-tooltip',
        }
      );

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectParcel(parcel);
      });

      polygon.addTo(group);
      bounds.extend(polygon.getBounds());

      // If selected, draw corner vertex boundary pillars
      if (isSelected) {
        latLngs.forEach(([vLat, vLng], idx) => {
          if (idx < latLngs.length - 1) {
            const pillar = L.circleMarker([vLat, vLng], {
              radius: 4.5,
              color: '#ffffff',
              fillColor: '#10b981',
              fillOpacity: 1,
              weight: 2,
            }).bindTooltip(`Pillar #${idx + 1}<br/>${vLat.toFixed(5)}°N, ${vLng.toFixed(5)}°E`, {
              direction: 'bottom',
              className: 'cadastral-tooltip',
            });
            pillar.addTo(group);
          }
        });
      }
    });

    // Auto-fit if parcels exist and no single parcel is focused
    if (withGeometry.length > 0 && bounds.isValid() && !selectedParcel) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    }
  }, [parcels, activeLayer, selectedParcel?.id]);

  // OpenStreetMap Nominatim Geocoding API Search Function
  const handleOsmSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || osmSearchQuery;
    if (!query.trim() || !mapInstanceRef.current) return;

    setIsSearchingOsm(true);
    setSearchFeedback(null);

    try {
      // Connect to OpenStreetMap free Nominatim search API
      const searchTarget = query.toLowerCase().includes('bangladesh') ? query : `${query}, Bangladesh`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchTarget
      )}&limit=1`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('OSM geocoding service unavailable');
      const results = await response.json();

      if (results && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        mapInstanceRef.current.flyTo([lat, lon], 17, { duration: 1.2 });

        // Place a pin on the searched location
        if (searchMarkerGroupRef.current) {
          searchMarkerGroupRef.current.clearLayers();
          const marker = L.circleMarker([lat, lon], {
            radius: 8,
            color: '#ffffff',
            fillColor: '#ef4444',
            fillOpacity: 0.9,
            weight: 2,
          }).bindPopup(`<strong>OpenStreetMap Location:</strong><br/>${item.display_name}`).openPopup();
          marker.addTo(searchMarkerGroupRef.current);
        }

        setSearchFeedback(`Located: ${item.display_name.split(',')[0]}`);
        setTimeout(() => setSearchFeedback(null), 5000);
      } else {
        setSearchFeedback('Location not found in OpenStreetMap Bangladesh');
        setTimeout(() => setSearchFeedback(null), 4000);
      }
    } catch (err) {
      console.warn('OSM search error:', err);
      setSearchFeedback('OSM Geocoding timed out; recentering to Mouza');
      setTimeout(() => setSearchFeedback(null), 4000);
    } finally {
      setIsSearchingOsm(false);
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([mouzaCenter.lat, mouzaCenter.lng], 17, { duration: 1 });
      if (searchMarkerGroupRef.current) {
        searchMarkerGroupRef.current.clearLayers();
      }
      if (measurementGroupRef.current) {
        measurementGroupRef.current.clearLayers();
        setMeasurePoints([]);
        setMeasureResult(null);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(invalidateMapSize, 150);
  };

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden border border-stone-800 shadow-lg transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-32px)]' : ''
      }`}
      style={{ height: isFullscreen ? 'calc(100vh - 32px)' : height }}
    >
      {/* Map Target Div */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-stone-100" />

      {/* Top Left Floating Bar: OpenStreetMap Geocoding Search & Quick Chips */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-full">
        {/* OpenStreetMap Nominatim Search Bar */}
        {showOsmSearch && (
          <div className="flex flex-col gap-1.5">
            <form 
              onSubmit={(e) => handleOsmSearch(e)}
              className="flex items-center gap-1.5 bg-stone-900/95 backdrop-blur-md p-1.5 rounded-xl border border-stone-700 text-xs shadow-xl text-white"
            >
              <div className="flex items-center gap-1.5 px-2">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-stone-200 hidden sm:inline">OSM Search:</span>
              </div>
              <input
                type="text"
                placeholder="Search any place in Bangladesh..."
                value={osmSearchQuery}
                onChange={(e) => setOsmSearchQuery(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-40 sm:w-56"
              />
              <button
                type="submit"
                disabled={isSearchingOsm}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition disabled:opacity-50"
              >
                {isSearchingOsm ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                <span className="hidden sm:inline">Locate</span>
              </button>
            </form>

            {/* Quick Location Chips */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] text-stone-400 bg-stone-900/80 px-1.5 py-0.5 rounded font-medium">Quick:</span>
              {OSM_QUICK_SEARCHES.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setOsmSearchQuery(chip.label);
                    handleOsmSearch(undefined, chip.query);
                  }}
                  className="px-2 py-0.5 bg-stone-900/90 hover:bg-emerald-800 text-stone-200 hover:text-white rounded-md text-[10px] border border-stone-700 transition shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Survey Generation Filter & Map Style Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Survey Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-900/90 backdrop-blur-xs p-1 rounded-xl border border-stone-700 text-xs shadow-lg text-white">
            <span className="text-stone-300 font-semibold px-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Survey:</span>
            </span>
            <button
              onClick={() => setActiveLayer('ALL')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                activeLayer === 'ALL' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveLayer('CS')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                activeLayer === 'CS' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'
              }`}
            >
              CS
            </button>
            <button
              onClick={() => setActiveLayer('SA')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                activeLayer === 'SA' ? 'bg-amber-600 text-white' : 'text-amber-300 hover:text-white'
              }`}
            >
              SA
            </button>
            <button
              onClick={() => setActiveLayer('RS')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                activeLayer === 'RS' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
              }`}
            >
              RS
            </button>
            <button
              onClick={() => setActiveLayer('BS')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                activeLayer === 'BS' ? 'bg-cyan-600 text-white' : 'text-cyan-300 hover:text-white'
              }`}
            >
              BS
            </button>
          </div>

          {/* OpenStreetMap / Humanitarian / Satellite Layer Toggle */}
          {showBaseMapToggle && (
            <div className="flex items-center gap-1 bg-stone-900/90 backdrop-blur-xs p-1 rounded-xl border border-stone-700 text-xs shadow-lg text-white">
              <button
                onClick={() => setBaseMap('osm')}
                title="OpenStreetMap Standard Global Tiles"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  baseMap === 'osm' ? 'bg-emerald-600 text-white font-semibold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 text-emerald-300" />
                <span>OSM Standard</span>
              </button>
              <button
                onClick={() => setBaseMap('osm_hot')}
                title="OpenStreetMap Humanitarian Contrast Cartography"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  baseMap === 'osm_hot' ? 'bg-emerald-600 text-white font-semibold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <MapPin className="w-3 h-3 text-amber-300" />
                <span>OSM Hot</span>
              </button>
              <button
                onClick={() => setBaseMap('satellite')}
                title="Esri World Satellite Imagery"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  baseMap === 'satellite' ? 'bg-emerald-600 text-white font-semibold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Satellite className="w-3 h-3 text-cyan-300" />
                <span>Satellite</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Right: Zoom / Measure / Fullscreen / Recenter Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-stone-900/90 backdrop-blur-xs p-1 rounded-lg border border-stone-700 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-stone-800 text-stone-200 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-stone-800 text-stone-200 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsMeasuring((m) => !m)}
          title={isMeasuring ? 'Exit Measuring Tool' : 'Measure Distance (Click 2 points)'}
          className={`p-1.5 rounded transition ${
            isMeasuring ? 'bg-amber-600 text-white' : 'hover:bg-stone-800 text-stone-200'
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset to Mouza Center"
          className="p-1.5 rounded hover:bg-stone-800 text-stone-200 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          className="p-1.5 rounded hover:bg-stone-800 text-stone-200 transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Measurement Tool Active Banner */}
      {isMeasuring && (
        <div className="absolute top-24 left-3 z-20 bg-amber-950/90 border border-amber-600 text-amber-200 px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-2">
          <Ruler className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {measureResult 
              ? `Distance: ${measureResult.meters} meters (${measureResult.feet} ft)`
              : 'Click 2 points on the map to measure cadastral distance'}
          </span>
          <button 
            onClick={() => setIsMeasuring(false)}
            className="text-amber-400 hover:text-white font-bold text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Reverse Geocoded Location Banner */}
      {reverseGeocodedPlace && !isMeasuring && (
        <div className="absolute top-24 left-3 z-20 bg-stone-900/95 border border-emerald-500/60 text-white px-3 py-1.5 rounded-lg text-xs shadow-xl flex items-center gap-2 max-w-md animate-in fade-in duration-150">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="font-semibold block truncate">{reverseGeocodedPlace.name}</span>
            <span className="text-[10px] text-stone-400 font-mono">
              OSM: {reverseGeocodedPlace.lat}° N, {reverseGeocodedPlace.lng}° E
            </span>
          </div>
          <button 
            onClick={() => setReverseGeocodedPlace(null)}
            className="text-stone-400 hover:text-white font-bold ml-2 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Feedback Toast on OSM Search */}
      {searchFeedback && (
        <div className="absolute top-36 left-3 z-20 bg-stone-900 text-white px-3 py-1.5 rounded-lg border border-emerald-500/50 text-xs shadow-lg animate-in fade-in duration-150 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{searchFeedback}</span>
        </div>
      )}

      {/* Bottom Right: Real-time Cursor Coordinates Readout */}
      {cursorCoords && (
        <div className="absolute bottom-3 right-3 z-10 bg-stone-900/90 backdrop-blur-xs text-stone-300 px-2.5 py-1 rounded-lg border border-stone-700 text-[10px] font-mono shadow-md hidden sm:block">
          OpenStreetMap WGS84: {cursorCoords.lat}° N, {cursorCoords.lng}° E
        </div>
      )}

      {/* Bottom Left: Selected Parcel Inspector Pill */}
      {selectedParcel && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 bg-stone-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-stone-700 shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom duration-150">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                selectedParcel.surveyType === 'CS' ? 'bg-indigo-600 text-white' :
                selectedParcel.surveyType === 'SA' ? 'bg-amber-600 text-white' :
                selectedParcel.surveyType === 'RS' ? 'bg-emerald-600 text-white' :
                'bg-cyan-600 text-white'
              }`}>
                {selectedParcel.surveyType} #{selectedParcel.dagNo}
              </span>
              <span className="font-bold text-white">
                {selectedParcel.normalizedAreaDecimal.toFixed(2)} dec
              </span>
              <span className="text-stone-400 font-mono text-[10px]">
                Kh #{selectedParcel.khatianNo}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 mt-0.5 truncate max-w-xs">
              {selectedParcel.mouzaNameEn} (JL {selectedParcel.jlNo}), {selectedParcel.upazila}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onTraceLineage(selectedParcel)}
              className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition"
            >
              <span>Lineage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
