import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ParcelRecord, SurveyType } from '../types';
import { LocationHierarchyItem } from '../data/syntheticDataset';
import { CadastralLeafletMap } from './CadastralLeafletMap';
import { 
  MapPin, 
  Layers, 
  Map as MapIcon, 
  List, 
  Compass, 
  Info, 
  ArrowRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Globe,
  Eye,
  GitFork,
  Ruler,
  FileCheck2,
  Landmark
} from 'lucide-react';
import { calculateDistanceMeters } from '../services/spatialEngine';

interface LocationExplorerProps {
  locations: LocationHierarchyItem[];
  allParcels: ParcelRecord[];
  onSelectParcel: (parcel: ParcelRecord) => void;
  onTraceLineage: (parcel: ParcelRecord) => void;
  language: 'en' | 'bn';
}

type MapMode = 'leaflet' | 'schematic' | 'list';

export const LocationExplorer: React.FC<LocationExplorerProps> = ({
  locations,
  allParcels,
  onSelectParcel,
  onTraceLineage,
  language,
}) => {
  const isBn = language === 'bn';

  // Navigation hierarchy state
  const [selectedDivision, setSelectedDivision] = useState<string>('Dhaka');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Dhaka');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('Gulshan / Badda');
  const [selectedMouzaId, setSelectedMouzaId] = useState<string>('mouza-badda-38');
  
  // View Modes: Leaflet real map vs Schematic SVG vs List
  const [mapMode, setMapMode] = useState<MapMode>('leaflet');
  const [filterSurvey, setFilterSurvey] = useState<SurveyType | 'ALL'>('ALL');
  const [hoveredParcel, setHoveredParcel] = useState<ParcelRecord | null>(null);
  const [activeSelectedParcel, setActiveSelectedParcel] = useState<ParcelRecord | null>(null);

  // Schematic SVG canvas pan and zoom state
  const [svgZoom, setSvgZoom] = useState<number>(1);
  const [svgPan, setSvgPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSvgDragging, setIsSvgDragging] = useState<boolean>(false);
  const [svgDragStart, setSvgDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState<boolean>(false);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.65);
  const [showGhostAncestor, setShowGhostAncestor] = useState<boolean>(true);
  const [showPillars, setShowPillars] = useState<boolean>(true);

  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Filtered parcels for current mouza
  const mouzaParcels = useMemo(() => {
    return allParcels.filter((p) => p.mouzaId === selectedMouzaId);
  }, [allParcels, selectedMouzaId]);

  const displayedParcels = useMemo(() => {
    if (filterSurvey === 'ALL') return mouzaParcels;
    return mouzaParcels.filter((p) => p.surveyType === filterSurvey);
  }, [mouzaParcels, filterSurvey]);

  const currentMouzaInfo = useMemo(() => {
    const first = mouzaParcels[0];
    if (!first) {
      return {
        nameEn: 'Badda',
        nameBn: 'বাড্ডা',
        jlNo: '38',
        upazila: selectedUpazila,
      };
    }
    return {
      nameEn: first.mouzaNameEn,
      nameBn: first.mouzaNameBn,
      jlNo: first.jlNo,
      upazila: first.upazila,
    };
  }, [mouzaParcels, selectedUpazila]);

  // Mouza geographic center for Leaflet & Cadastral calculation
  const mouzaCenter = useMemo(() => {
    if (selectedMouzaId.includes('tejgaon')) return { lat: 23.7590, lng: 90.3920 };
    if (selectedMouzaId.includes('savar')) return { lat: 23.8480, lng: 90.2600 };
    return { lat: 23.7820, lng: 90.4260 }; // Badda
  }, [selectedMouzaId]);

  // Survey distribution in this mouza
  const surveyCounts = useMemo(() => {
    const counts: Record<SurveyType, number> = { CS: 0, SA: 0, RS: 0, BS: 0 };
    for (const p of mouzaParcels) {
      if (counts[p.surveyType] !== undefined) counts[p.surveyType]++;
    }
    return counts;
  }, [mouzaParcels]);

  // Reset zoom and pan when changing mouza or survey filter
  useEffect(() => {
    setSvgZoom(1);
    setSvgPan({ x: 0, y: 0 });
    setActiveSelectedParcel(null);
  }, [selectedMouzaId]);

  // Accurate Geodetic Projection with UNIFORM Aspect Ratio (1m North == 1m East)
  const projection = useMemo(() => {
    const withGeo = displayedParcels.filter((p) => p.geometry !== null);
    if (withGeo.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const p of withGeo) {
      if (!p.geometry) continue;
      const [bMinLat, bMinLng, bMaxLat, bMaxLng] = p.geometry.bbox;
      if (bMinLat < minLat) minLat = bMinLat;
      if (bMaxLat > maxLat) maxLat = bMaxLat;
      if (bMinLng < minLng) minLng = bMinLng;
      if (bMaxLng > maxLng) maxLng = bMaxLng;
    }

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Convert degrees to meters from center (1 deg lat = 111,000m, 1 deg lng = 104,000m at 23.8°N)
    const spanMetersNorth = Math.max((maxLat - minLat) * 111000, 40);
    const spanMetersEast = Math.max((maxLng - minLng) * 104000, 40);

    // Fit within 1000x650 SVG viewBox with 90px margin
    const drawWidth = 820;
    const drawHeight = 470;
    const uniformScale = Math.min(drawWidth / spanMetersEast, drawHeight / spanMetersNorth);

    const projectToSvg = (lat: number, lng: number): [number, number] => {
      const eastMeters = (lng - centerLng) * 104000;
      const northMeters = (lat - centerLat) * 111000;
      const svgX = 500 + eastMeters * uniformScale;
      const svgY = 325 - northMeters * uniformScale; // SVG y increases downwards
      return [Number(svgX.toFixed(1)), Number(svgY.toFixed(1))];
    };

    return {
      centerLat,
      centerLng,
      uniformScale,
      projectToSvg,
      spanMetersEast,
      spanMetersNorth,
    };
  }, [displayedParcels]);

  // Mouse drag handlers with drag-distance threshold to prevent accidental parcel clicks
  const handleSvgMouseDown = (e: React.MouseEvent) => {
    setIsSvgDragging(true);
    setHasMovedDuringDrag(false);
    setSvgDragStart({ x: e.clientX - svgPan.x, y: e.clientY - svgPan.y });
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!isSvgDragging) return;
    const dx = e.clientX - svgDragStart.x - svgPan.x;
    const dy = e.clientY - svgDragStart.y - svgPan.y;
    if (Math.hypot(dx, dy) > 4) {
      setHasMovedDuringDrag(true);
    }
    setSvgPan({
      x: e.clientX - svgDragStart.x,
      y: e.clientY - svgDragStart.y,
    });
  };

  const handleSvgMouseUp = () => {
    setIsSvgDragging(false);
  };

  // Mouse wheel zoom handler
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setSvgZoom((prev) => Math.min(3.5, Math.max(0.4, Number((prev * zoomFactor).toFixed(2)))));
  };

  const resetSvgView = () => {
    setSvgZoom(1);
    setSvgPan({ x: 0, y: 0 });
  };

  // Ancestral parcels for "Ghost Base Layer" (CS/SA ancestral shapes)
  const ancestorParcels = useMemo(() => {
    if (!showGhostAncestor || filterSurvey === 'CS' || filterSurvey === 'ALL') return [];
    // If viewing RS or BS, get CS parcels in same mouza that have geometry
    return mouzaParcels.filter((p) => p.surveyType === 'CS' && p.geometry !== null);
  }, [showGhostAncestor, filterSurvey, mouzaParcels]);

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Hierarchy Breadcrumb */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Location-Based Cadastral Exploration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              {isBn ? 'বাংলাদেশ প্রশাসনিক অবস্থান ও মৌজা নকশা' : 'Cadastral Location Hierarchy & Map Plane'}
            </h1>
            <p className="text-xs text-stone-500">
              Division → District → Upazila → Mouza → Cadastral Parcel
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => setMapMode('leaflet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                mapMode === 'leaflet'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Geospatial Map (Leaflet)</span>
            </button>

            <button
              onClick={() => setMapMode('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                mapMode === 'schematic'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Cadastral Sheet Canvas</span>
            </button>

            <button
              onClick={() => setMapMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                mapMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Register List</span>
            </button>
          </div>
        </div>

        {/* Hierarchy Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Division (বিভাগ)
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-medium text-stone-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Dhaka">Dhaka (ঢাকা)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              District (জেলা)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-medium text-stone-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Dhaka">Dhaka (ঢাকা)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Upazila / Circle (উপজেলা/সার্কেল)
            </label>
            <select
              value={selectedUpazila}
              onChange={(e) => {
                const upz = e.target.value;
                setSelectedUpazila(upz);
                if (upz === 'Gulshan / Badda') setSelectedMouzaId('mouza-badda-38');
                else if (upz === 'Tejgaon') setSelectedMouzaId('mouza-tejgaon-12');
                else if (upz === 'Savar') setSelectedMouzaId('mouza-savar-45');
              }}
              className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-medium text-stone-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Gulshan / Badda">Gulshan / Badda (গুলশান / বাড্ডা)</option>
              <option value="Tejgaon">Tejgaon (তেজগাঁও)</option>
              <option value="Savar">Savar (সাভার)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Mouza & JL No. (মৌজা ও জেএল)
            </label>
            <select
              value={selectedMouzaId}
              onChange={(e) => setSelectedMouzaId(e.target.value)}
              className="w-full text-xs bg-emerald-50/70 border border-emerald-300 rounded-lg p-2 font-semibold text-emerald-950 focus:ring-1 focus:ring-emerald-500"
            >
              {selectedUpazila === 'Gulshan / Badda' && (
                <option value="mouza-badda-38">Mouza Badda (JL No. 38) — বাড্ডা</option>
              )}
              {selectedUpazila === 'Tejgaon' && (
                <option value="mouza-tejgaon-12">Mouza Tejgaon (JL No. 12) — তেজগাঁও</option>
              )}
              {selectedUpazila === 'Savar' && (
                <option value="mouza-savar-45">Mouza Savar (JL No. 45) — সাভার</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Mouza Card & Survey Filter Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Jurisdiction Details */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm md:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Active Jurisdiction
              </span>
              <span className="text-xs font-mono text-stone-400">JL No. {currentMouzaInfo.jlNo}</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Mouza {currentMouzaInfo.nameEn} ({currentMouzaInfo.nameBn})
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Upazila: {currentMouzaInfo.upazila}, District: Dhaka
            </p>

            <div className="space-y-1.5 text-xs text-stone-600 mb-4">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span>Total Recorded Parcels:</span>
                <strong className="text-stone-900 font-bold">{mouzaParcels.length}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span>Cadastral Sheet Coverage:</span>
                <strong className="text-stone-900">Sheet #01, Sheet #02, Sheet #03</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Digitized Geometry Status:</span>
                <strong className="text-emerald-700 font-bold">
                  {mouzaParcels.filter((p) => p.geometry !== null).length} of {mouzaParcels.length} Vectorized
                </strong>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Real-world OpenStreetMap coordinates centered in Dhaka metropolitan and regional settlement survey sectors.
            </span>
          </div>
        </div>

        {/* Survey Breakdown Filter Tabs */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Filter Cadastral Plane by Survey Generation
              </h3>
              <span className="text-xs text-stone-400">Select era to view or overlay</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <button
                onClick={() => setFilterSurvey('ALL')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition ${
                  filterSurvey === 'ALL'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>All Surveys</span>
                <span className="text-[11px] opacity-80 font-mono mt-0.5">{mouzaParcels.length} dags</span>
              </button>

              <button
                onClick={() => setFilterSurvey('CS')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition ${
                  filterSurvey === 'CS'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-indigo-50/60 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <span>CS (1912)</span>
                <span className="text-[11px] opacity-80 font-mono mt-0.5">{surveyCounts.CS} dags</span>
              </button>

              <button
                onClick={() => setFilterSurvey('SA')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition ${
                  filterSurvey === 'SA'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>SA (1958)</span>
                <span className="text-[11px] opacity-80 font-mono mt-0.5">{surveyCounts.SA} dags</span>
              </button>

              <button
                onClick={() => setFilterSurvey('RS')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition ${
                  filterSurvey === 'RS'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span>RS (1978)</span>
                <span className="text-[11px] opacity-80 font-mono mt-0.5">{surveyCounts.RS} dags</span>
              </button>

              <button
                onClick={() => setFilterSurvey('BS')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition ${
                  filterSurvey === 'BS'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-cyan-50/60 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
                }`}
              >
                <span>BS (2004)</span>
                <span className="text-[11px] opacity-80 font-mono mt-0.5">{surveyCounts.BS} dags</span>
              </button>
            </div>
          </div>

          {/* Quick Inspector Bar */}
          {activeSelectedParcel || hoveredParcel ? (
            <div className="p-3 bg-stone-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  (activeSelectedParcel || hoveredParcel)!.surveyType === 'CS' ? 'bg-indigo-600 text-white' :
                  (activeSelectedParcel || hoveredParcel)!.surveyType === 'SA' ? 'bg-amber-600 text-white' :
                  (activeSelectedParcel || hoveredParcel)!.surveyType === 'RS' ? 'bg-emerald-600 text-white' :
                  'bg-cyan-600 text-white'
                }`}>
                  {(activeSelectedParcel || hoveredParcel)!.surveyType} Dag #{(activeSelectedParcel || hoveredParcel)!.dagNo} ({(activeSelectedParcel || hoveredParcel)!.dagNoBn})
                </span>
                <span className="text-stone-300">
                  Area: <strong className="text-white">{(activeSelectedParcel || hoveredParcel)!.normalizedAreaDecimal.toFixed(2)} dec</strong>
                </span>
                <span className="text-stone-300">
                  Khatian: <strong className="text-white">#{(activeSelectedParcel || hoveredParcel)!.khatianNo}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectParcel((activeSelectedParcel || hoveredParcel)!)}
                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-medium transition"
                >
                  View Attributes
                </button>
                <button
                  onClick={() => onTraceLineage((activeSelectedParcel || hoveredParcel)!)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                >
                  <span>Trace Lineage</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-stone-50 rounded-lg text-xs text-stone-500 text-center border border-stone-200">
              Click on any parcel on the map plane to inspect corner boundary pillars and trace cross-survey lineage.
            </div>
          )}
        </div>
      </div>

      {/* Missing Geometry Alert Banner (e.g. Tejgaon CS/SA damaged map sheets) */}
      {displayedParcels.some((p) => !p.geometry) && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-900 block">
                Archival Alert: Physical Cadastral Map Sheet Decay (নকশা বিনষ্ট)
              </strong>
              <span>
                Certain earlier records in this mouza (e.g., Tejgaon CS Dag 50 & SA Dag 110) suffered biological decay in the historical record room. While handwritten ledger volumes remain intact, digitized vector polygons are not available. The matching engine evaluates these records transparently without fabricating false spatial coordinates.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const p = displayedParcels.find((item) => !item.geometry);
              if (p) onSelectParcel(p);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold text-xs shrink-0 self-start sm:self-auto transition"
          >
            Inspect Ledger Entry
          </button>
        </div>
      )}

      {/* Main Map Viewport */}
      {mapMode === 'leaflet' ? (
        /* Real Leaflet Map with OpenStreetMap Cadastral Polygons */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Geographic Cadastral Leaflet Map (Mouza {currentMouzaInfo.nameEn})</span>
              </h2>
              <p className="text-xs text-stone-500">
                Connected to OpenStreetMap API with real-time Nominatim search, reverse geocoding, and distance measuring
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500" /> CS</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> SA</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> RS</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-500" /> BS</span>
            </div>
          </div>

          <CadastralLeafletMap
            parcels={mouzaParcels}
            selectedParcel={activeSelectedParcel}
            onSelectParcel={(p) => {
              setActiveSelectedParcel(p);
              onSelectParcel(p);
            }}
            onTraceLineage={onTraceLineage}
            filterSurvey={filterSurvey}
            mouzaCenter={mouzaCenter}
          />
        </div>
      ) : mapMode === 'schematic' ? (
        /* SVG Cadastral Sheet Canvas with Accurate Aspect Ratio & Smooth Controls */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-emerald-600" />
                <span>Interactive Schematic Cadastral Plane (মৌজা নকশা ট্রেসিং প্লেন)</span>
              </h2>
              <p className="text-xs text-stone-500">
                True 1:1 aspect ratio • Scroll wheel to zoom • Drag to pan • Click plot for boundary pillars & dossier
              </p>
            </div>

            {/* Canvas Toolbar Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Ghost Ancestor Overlay Toggle */}
              {filterSurvey !== 'CS' && filterSurvey !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setShowGhostAncestor((g) => !g)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition ${
                    showGhostAncestor 
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' 
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                  title="Superimpose original CS/SA boundary outline to visualize how this parcel subdivided"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ghost Ancestor ({showGhostAncestor ? 'On' : 'Off'})</span>
                </button>
              )}

              {/* Boundary Pillars Toggle */}
              <button
                type="button"
                onClick={() => setShowPillars((p) => !p)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition ${
                  showPillars 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold' 
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Pillars ({showPillars ? 'On' : 'Off'})</span>
              </button>

              {/* Opacity slider */}
              <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
                <Sliders className="w-3 h-3 text-stone-400" />
                <span className="hidden sm:inline">Opacity:</span>
                <input
                  type="range"
                  min="0.25"
                  max="1"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-16 h-1.5 accent-emerald-600"
                />
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
                <button
                  onClick={() => setSvgZoom((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
                  title="Zoom In"
                  className="p-1 rounded hover:bg-white text-stone-700 transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-stone-700 font-bold">
                  {Math.round(svgZoom * 100)}%
                </span>
                <button
                  onClick={() => setSvgZoom((z) => Math.max(0.4, Number((z - 0.25).toFixed(2))))}
                  title="Zoom Out"
                  className="p-1 rounded hover:bg-white text-stone-700 transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetSvgView}
                  title="Reset Canvas View"
                  className="p-1 rounded hover:bg-white text-stone-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div 
            ref={svgContainerRef}
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
            onWheel={handleWheelZoom}
            className="relative w-full h-[540px] bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          >
            {/* Background Grid Mesh */}
            <div className="absolute inset-0 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

            {/* Official Cadastral Sheet Header Block */}
            <div className="absolute top-4 left-4 z-10 bg-stone-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-700 text-stone-200 text-xs shadow-xl pointer-events-none">
              <div className="flex items-center gap-2 mb-0.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white tracking-wide uppercase text-[11px]">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • Cadastral Sheet #02
                </span>
              </div>
              <div className="text-[10px] text-stone-400 font-serif">
                জেলা: ঢাকা • থানা: {currentMouzaInfo.upazila} • মৌজা: {currentMouzaInfo.nameBn} (JL #{currentMouzaInfo.jlNo})
              </div>
            </div>

            {/* Cadastral Compass & Scale Bar */}
            <div className="absolute top-4 right-4 z-10 bg-stone-950/85 backdrop-blur-md p-2.5 rounded-xl border border-stone-700 text-center text-[10px] font-mono text-stone-300 pointer-events-none shadow-xl">
              <div className="text-rose-400 font-bold text-xs">▲ NORTH (উত্তর)</div>
              <div className="text-[9px] text-stone-400 mt-0.5">Scale: 16" = 1 Mile</div>
              <div className="w-16 h-1 bg-emerald-500 mx-auto mt-1 rounded-full opacity-80" />
            </div>

            {/* Bottom Scale & Coordinate HUD */}
            <div className="absolute bottom-4 left-4 z-10 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-700 text-[10px] font-mono text-stone-300 pointer-events-none flex items-center gap-3">
              <span>Projection: Dhaka BTM Metric</span>
              <span>•</span>
              <span>1 Grid = 10 Meters</span>
            </div>

            {projection ? (
              <svg 
                viewBox="0 0 1000 650" 
                className="w-full h-full"
                style={{
                  transform: `translate(${svgPan.x}px, ${svgPan.y}px) scale(${svgZoom})`,
                  transformOrigin: 'center center',
                  transition: isSvgDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                {/* Cadastral Sheet Border Frame */}
                <rect x="25" y="25" width="950" height="600" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="8 4" opacity="0.4" />

                {/* Natural Boundary: Drainage Canal / Khal */}
                <path 
                  d="M 30,120 Q 300,90 500,130 T 970,110" 
                  fill="none" 
                  stroke="#0284c7" 
                  strokeWidth="7" 
                  strokeDasharray="14 4" 
                  opacity="0.35" 
                />
                <text x="500" y="105" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.75" className="font-serif">
                  ~ পূর্ব নিকাশী খাল ও সরকারি জলমহাল সীমানা (Eastern Drainage Canal) ~
                </text>

                {/* Settlement Road Boundary */}
                <line x1="30" y1="580" x2="970" y2="580" stroke="#78716c" strokeWidth="5" strokeDasharray="10 5" opacity="0.3" />
                <text x="500" y="598" fill="#a8a29e" fontSize="10" fontWeight="bold" textAnchor="middle" opacity="0.6">
                  ~ মৌজা সংযোগ মেঠোপথ ও হালট সীমানা (Mouza Public Access Halot) ~
                </text>

                {/* GHOST ANCESTOR OVERLAY (shows original CS/SA large plot outline faintly) */}
                {ancestorParcels.map((ancestor) => {
                  if (!ancestor.geometry) return null;
                  const pts = ancestor.geometry.coordinates
                    .map(([lat, lng]) => projection.projectToSvg(lat, lng).join(','))
                    .join(' ');
                  return (
                    <polygon
                      key={`ghost-${ancestor.id}`}
                      points={pts}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      opacity="0.6"
                      className="pointer-events-none"
                    />
                  );
                })}

                {/* RENDER ACTUAL DISPLAYED PARCELS */}
                {displayedParcels.map((parcel) => {
                  if (!parcel.geometry) return null;

                  const pointsArr = parcel.geometry.coordinates.map(([lat, lng]) => projection.projectToSvg(lat, lng));
                  const pointsStr = pointsArr.map(([x, y]) => `${x},${y}`).join(' ');

                  const [centroidX, centroidY] = projection.projectToSvg(
                    parcel.geometry.centroid[0],
                    parcel.geometry.centroid[1]
                  );

                  const isHovered = hoveredParcel?.id === parcel.id;
                  const isSelected = activeSelectedParcel?.id === parcel.id;

                  // Dynamic color styling based on Survey era
                  let fillColor = `rgba(99, 102, 241, ${overlayOpacity})`; // CS Indigo
                  let strokeColor = '#818cf8';
                  if (parcel.surveyType === 'SA') {
                    fillColor = `rgba(245, 158, 11, ${overlayOpacity})`; // SA Amber
                    strokeColor = '#fbbf24';
                  } else if (parcel.surveyType === 'RS') {
                    fillColor = `rgba(16, 185, 129, ${overlayOpacity})`; // RS Emerald
                    strokeColor = '#34d399';
                  } else if (parcel.surveyType === 'BS') {
                    fillColor = `rgba(6, 182, 212, ${overlayOpacity})`; // BS Cyan
                    strokeColor = '#22d3ee';
                  }

                  if (isSelected) {
                    fillColor = 'rgba(255, 255, 255, 0.75)';
                    strokeColor = '#ffffff';
                  } else if (isHovered) {
                    fillColor = 'rgba(255, 255, 255, 0.5)';
                    strokeColor = '#38bdf8';
                  }

                  return (
                    <g 
                      key={parcel.id}
                      onMouseEnter={() => setHoveredParcel(parcel)}
                      onMouseLeave={() => setHoveredParcel(null)}
                      onClick={(e) => {
                        // Only trigger click if user didn't pan-drag
                        if (!hasMovedDuringDrag) {
                          setActiveSelectedParcel(parcel);
                          onSelectParcel(parcel);
                        }
                      }}
                      className="cursor-pointer transition-all duration-150"
                    >
                      {/* Parcel Polygon */}
                      <polygon
                        points={pointsStr}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? '4' : isHovered ? '3' : '2'}
                        strokeDasharray={parcel.surveyType === 'RS' ? '5 2' : 'none'}
                        className="transition-colors duration-150"
                      />

                      {/* Boundary Corner Pillars (Pillar 1, 2, 3, 4) */}
                      {showPillars && pointsArr.slice(0, -1).map(([px, py], pIdx) => (
                        <g key={pIdx}>
                          <circle
                            cx={px}
                            cy={py}
                            r={isSelected ? 5 : 3.5}
                            fill="#ffffff"
                            stroke="#059669"
                            strokeWidth="1.5"
                          />
                        </g>
                      ))}

                      {/* Centroid Pin */}
                      <circle 
                        cx={centroidX} 
                        cy={centroidY} 
                        r={isSelected ? '5' : '3'} 
                        fill={isSelected ? '#10b981' : '#ffffff'} 
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />

                      {/* Label Badge Background */}
                      <rect
                        x={centroidX - 44}
                        y={centroidY - 22}
                        width="88"
                        height="38"
                        rx="6"
                        fill="rgba(15, 23, 42, 0.88)"
                        stroke={isSelected ? '#ffffff' : strokeColor}
                        strokeWidth={isSelected ? '2' : '1'}
                        className="pointer-events-none drop-shadow-lg"
                      />

                      {/* Dag Number */}
                      <text
                        x={centroidX}
                        y={centroidY - 9}
                        fill="#f8fafc"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="pointer-events-none font-mono"
                      >
                        {parcel.surveyType} #{parcel.dagNo}
                      </text>

                      {/* Area & Bengali */}
                      <text
                        x={centroidX}
                        y={centroidY + 7}
                        fill="#34d399"
                        fontSize="9.5"
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="pointer-events-none font-mono"
                      >
                        {parcel.normalizedAreaDecimal.toFixed(1)} dec
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              /* Archival Ledger View for Records without Digitized Sheet Geometry (Tejgaon CS/SA) */
              <div className="text-center p-8 text-stone-300 max-w-lg mx-auto bg-stone-950/80 rounded-2xl border border-stone-700 shadow-2xl">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">
                  Cadastral Map Sheet Biological Decay (নকশা বিনষ্ট)
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed mb-4">
                  Original colonial CS/SA map sheets for this selection suffered paper decay in the historic collectorate record room. Handwritten ledger entries remain 100% verified. The matching engine evaluates these records by ledger and area evidence without hallucinating false spatial vectors.
                </p>

                {surveyCounts.RS > 0 && (
                  <button
                    onClick={() => setFilterSurvey('RS')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1.5"
                  >
                    <span>Switch to Recovered RS (1978) Vector Sheet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Selected Plot Floating Dossier Card */}
            {activeSelectedParcel && (
              <div className="absolute bottom-4 right-4 z-20 bg-stone-950/95 backdrop-blur-md text-white p-4 rounded-2xl border border-emerald-500/60 shadow-2xl max-w-sm text-xs animate-in slide-in-from-bottom duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    activeSelectedParcel.surveyType === 'CS' ? 'bg-indigo-600 text-white' :
                    activeSelectedParcel.surveyType === 'SA' ? 'bg-amber-600 text-white' :
                    activeSelectedParcel.surveyType === 'RS' ? 'bg-emerald-600 text-white' :
                    'bg-cyan-600 text-white'
                  }`}>
                    {activeSelectedParcel.surveyType} Dag #{activeSelectedParcel.dagNo} ({activeSelectedParcel.dagNoBn})
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {activeSelectedParcel.normalizedAreaDecimal.toFixed(2)} decimal
                  </span>
                </div>

                <div className="space-y-1 text-stone-300 text-[11px] mb-3">
                  <div>Khatian: <strong className="text-white">#{activeSelectedParcel.khatianNo}</strong> ({activeSelectedParcel.khatianNoBn})</div>
                  <div>Holding: <span className="text-stone-200">{activeSelectedParcel.khatianOwnerNames.join(', ')}</span></div>
                  <div>Mouza: <span className="text-stone-200">{activeSelectedParcel.mouzaNameEn} (JL #{activeSelectedParcel.jlNo})</span></div>
                  {activeSelectedParcel.crossReferences.length > 0 && (
                    <div className="text-amber-300 font-medium pt-1">
                      Note: {activeSelectedParcel.crossReferences[0]}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => onSelectParcel(activeSelectedParcel)}
                    className="flex-1 py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold text-center transition"
                  >
                    Attributes
                  </button>
                  <button
                    onClick={() => onTraceLineage(activeSelectedParcel)}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Trace Lineage</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tabular Record Register View */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Mouza {currentMouzaInfo.nameEn} Cadastral Ledger Register ({displayedParcels.length} records)
              </h2>
              <p className="text-xs text-stone-500">
                Chronological ledger rolls and verified area entries
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 border-y border-stone-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Survey</th>
                  <th className="py-3 px-3">Dag #</th>
                  <th className="py-3 px-3">Khatian #</th>
                  <th className="py-3 px-3">Recorded Area</th>
                  <th className="py-3 px-3">Standard Decimal</th>
                  <th className="py-3 px-3">Map Vector</th>
                  <th className="py-3 px-3">Cross-Reference Remarks</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {displayedParcels.map((parcel) => (
                  <tr 
                    key={parcel.id}
                    className="hover:bg-stone-50 transition cursor-pointer"
                    onClick={() => {
                      setActiveSelectedParcel(parcel);
                      onSelectParcel(parcel);
                    }}
                  >
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                        parcel.surveyType === 'CS' ? 'bg-indigo-100 text-indigo-800' :
                        parcel.surveyType === 'SA' ? 'bg-amber-100 text-amber-800' :
                        parcel.surveyType === 'RS' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-cyan-100 text-cyan-800'
                      }`}>
                        {parcel.surveyType} ({parcel.surveyYear})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-900">
                      {parcel.dagNo} <span className="text-stone-400 font-serif">({parcel.dagNoBn})</span>
                    </td>
                    <td className="py-3 px-3 text-stone-700">
                      #{parcel.khatianNo}
                    </td>
                    <td className="py-3 px-3 text-stone-600">
                      {parcel.recordedArea} {parcel.recordedUnit}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {parcel.normalizedAreaDecimal.toFixed(2)} dec
                    </td>
                    <td className="py-3 px-3">
                      {parcel.geometry ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Vectorized</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Sheet Missing</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-stone-500 max-w-xs truncate">
                      {parcel.crossReferences.length > 0 ? parcel.crossReferences.join(', ') : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceLineage(parcel);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Lineage</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
