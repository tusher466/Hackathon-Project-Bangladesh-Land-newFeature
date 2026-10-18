import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  ParcelRecord, 
  ParcelRelationship, 
  SurveyType,
  RelationshipType 
} from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Filter, 
  Split, 
  Merge, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Info, 
  ArrowRight,
  ShieldAlert,
  GitFork,
  FileText,
  Sliders,
  Search,
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  Compass,
  Eye,
  Check,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Clock,
  User,
  Hash,
  ChevronRight,
  BookOpen,
  Share2
} from 'lucide-react';

interface LineageGraphViewProps {
  parcels: ParcelRecord[];
  relationships: ParcelRelationship[];
  selectedParcel: ParcelRecord | null;
  onSelectParcel: (parcel: ParcelRecord) => void;
  onOpenReviewModal: (parcel: ParcelRecord, relationship?: ParcelRelationship) => void;
  onGenerateReport: (parcel: ParcelRecord) => void;
  onCompareRecords: (parcels: ParcelRecord[]) => void;
  language: 'en' | 'bn';
}

interface NodePosition {
  parcel: ParcelRecord;
  x: number;
  y: number;
  width: number;
  height: number;
  column: SurveyType;
}

const SURVEY_ORDER: SurveyType[] = ['CS', 'SA', 'RS', 'BS'];

const SURVEY_METADATA: Record<SurveyType, {
  name: string;
  nameBn: string;
  year: number;
  period: string;
  description: string;
  primaryColor: string;
  borderColor: string;
  bgLight: string;
  bgDark: string;
  badgeBg: string;
  badgeText: string;
}> = {
  CS: {
    name: 'Cadastral Survey',
    nameBn: 'সিএস জরিপ',
    year: 1912,
    period: '1888–1940',
    description: 'First scientific British Bengal survey with individual plot maps.',
    primaryColor: '#4f46e5', // indigo-600
    borderColor: '#6366f1',
    bgLight: '#eef2ff',
    bgDark: '#1e1b4b',
    badgeBg: '#312e81',
    badgeText: '#c7d2fe',
  },
  SA: {
    name: 'State Acquisition',
    nameBn: 'এসএ জরিপ',
    year: 1958,
    period: '1956–1963',
    description: 'Post-zamindari acquisition survey documenting land tenure shifts.',
    primaryColor: '#d97706', // amber-600
    borderColor: '#f59e0b',
    bgLight: '#fffbeb',
    bgDark: '#451a03',
    badgeBg: '#78350f',
    badgeText: '#fde68a',
  },
  RS: {
    name: 'Revisional Survey',
    nameBn: 'আরএস জরিপ',
    year: 1978,
    period: '1965–1990',
    description: 'Post-independence revision correcting inheritance subdivisions.',
    primaryColor: '#059669', // emerald-600
    borderColor: '#10b981',
    bgLight: '#ecfdf5',
    bgDark: '#022c22',
    badgeBg: '#064e3b',
    badgeText: '#a7f3d0',
  },
  BS: {
    name: 'City / Bangladesh Survey',
    nameBn: 'বিএস / সিটি জরিপ',
    year: 2004,
    period: '1998–Present',
    description: 'Modern urban cadastral survey with modernized plot boundaries.',
    primaryColor: '#0891b2', // cyan-600
    borderColor: '#06b6d4',
    bgLight: '#ecfeff',
    bgDark: '#083344',
    badgeBg: '#164e63',
    badgeText: '#a5f3fc',
  },
};

interface PredefinedStory {
  id: string;
  title: string;
  titleBn: string;
  subtitle: string;
  mouzaId: string;
  focalParcelId: string;
  type: 'subdivision' | 'consolidation' | 'continuity' | 'batta' | 'damaged';
  description: string;
}

const PREDEFINED_STORIES: PredefinedStory[] = [
  {
    id: 'badda-split-104',
    title: 'Badda 1-to-2 Partition (Dag 104 → 204 → 410 & 411)',
    titleBn: 'বাড্ডা ১-হতে-২ অংশীদারী বণ্টন (দাগ ১০৪ → ২০৪ → ৪১০ ও ৪১১)',
    subtitle: 'Classic inheritance split: 45.0 dec divides into 25.0 dec + 20.0 dec',
    mouzaId: 'mouza-badda-38',
    focalParcelId: 'SA-BD38-204',
    type: 'subdivision',
    description: 'CS Dag 104 retained full 45.0 dec in SA 204, then partitioned in RS survey into Dag 410 and 411, later mapped into BS 1205 and 1206 with perfect area balance.',
  },
  {
    id: 'badda-merge-250',
    title: 'Badda Consolidation (CS 108 + 109 → SA 250)',
    titleBn: 'বাড্ডা জোত একত্রীকরণ (সিএস ১০৮ + ১০৯ → এসএ ২৫০)',
    subtitle: 'Amalgamation of 2 ancestral holdings into 1 unified estate (40.0 dec)',
    mouzaId: 'mouza-badda-38',
    focalParcelId: 'SA-BD38-250',
    type: 'consolidation',
    description: 'Two adjacent British CS plots (Dag 108 of 18.0 dec and Dag 109 of 22.0 dec) were consolidated during SA survey into unified Dag 250 (40.0 dec).',
  },
  {
    id: 'badda-succession-340',
    title: 'Badda Succession (CS 130 → SA 340 → RS 720)',
    titleBn: 'বাড্ডা ঐতিহাসিক উত্তরাধিকার (সিএস ১৩০ → এসএ ৩৪০ → আরএস ৭২০)',
    subtitle: 'Century-long continuity with area verification',
    mouzaId: 'mouza-badda-38',
    focalParcelId: 'SA-BD38-340',
    type: 'continuity',
    description: 'Direct unbroken tenancy from CS Dag 130 through SA Dag 340 to RS 720 and modern BS 1950.',
  },
  {
    id: 'savar-batta-290',
    title: 'Savar Batta Dag Partition (SA 140 → RS 290 & 290/1)',
    titleBn: 'সাভার বাট্টা দাগ সৃষ্টি (এসএ ১৪০ → আরএস ২৯০ ও ২৯০/১)',
    subtitle: 'Fractional Batta indexation preserving parent lineage during subdivision',
    mouzaId: 'mouza-savar-45',
    focalParcelId: 'RS-SV45-290/1',
    type: 'batta',
    description: 'Demonstrates traditional cadastral batta (fractional) numbering where a plot partition created Dag 290/1 derived directly from parent Dag 140.',
  },
  {
    id: 'tejgaon-damaged-50',
    title: 'Tejgaon Damaged Sheet Reconstruction (CS 50 → SA 110)',
    titleBn: 'তেজগাঁও ক্ষতিগ্রস্ত ম্যাপ পুনর্নির্মাণ (সিএস ৫০ → এসএ ১১০)',
    subtitle: 'Resolving lineage when original CS map sheet was physically torn',
    mouzaId: 'mouza-tejgaon-12',
    focalParcelId: 'SA-TJ12-110',
    type: 'damaged',
    description: 'When physical CS sheet was damaged in the collectorate archive, AI Studio matches SA 110 and RS 320 via surviving Volume Register cross-references.',
  },
];

export const LineageGraphView: React.FC<LineageGraphViewProps> = ({
  parcels,
  relationships,
  selectedParcel,
  onSelectParcel,
  onOpenReviewModal,
  onGenerateReport,
  onCompareRecords,
  language,
}) => {
  const isBn = language === 'bn';

  // Canvas pan & zoom state
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 15 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter state
  const [selectedMouza, setSelectedMouza] = useState<string>('mouza-badda-38');
  const [viewScope, setViewScope] = useState<'focused' | 'all'>('focused'); // 'focused' = single tree (easy to understand!), 'all' = full mouza
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedEdge, setSelectedEdge] = useState<ParcelRelationship | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync selectedMouza if incoming selectedParcel is in a different mouza
  useEffect(() => {
    if (selectedParcel && selectedParcel.mouzaId !== selectedMouza) {
      setSelectedMouza(selectedParcel.mouzaId);
    }
  }, [selectedParcel, selectedMouza]);

  // Set default selected parcel on first load if none selected
  useEffect(() => {
    if (!selectedParcel && parcels.length > 0) {
      const defaultP = parcels.find((p) => p.id === 'SA-BD38-204') || parcels[0];
      if (defaultP) onSelectParcel(defaultP);
    }
  }, [parcels, selectedParcel, onSelectParcel]);

  // Filter parcels for the selected mouza
  const activeParcels = useMemo(() => {
    return parcels.filter((p) => p.mouzaId === selectedMouza);
  }, [parcels, selectedMouza]);

  // Clean relationships inside this mouza
  const activeRelationships = useMemo(() => {
    const parcelIdSet = new Set(activeParcels.map((p) => p.id));
    return relationships.filter(
      (r) => parcelIdSet.has(r.sourceParcelId) && parcelIdSet.has(r.targetParcelId)
    );
  }, [relationships, activeParcels]);

  // Transitive lineage path highlight: find all ancestors & descendants of selected parcel
  const lineageConnectedIds = useMemo(() => {
    if (!selectedParcel) return new Set<string>();
    const connected = new Set<string>([selectedParcel.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const r of activeRelationships) {
        if (connected.has(r.sourceParcelId) && !connected.has(r.targetParcelId)) {
          connected.add(r.targetParcelId);
          changed = true;
        }
        if (connected.has(r.targetParcelId) && !connected.has(r.sourceParcelId)) {
          connected.add(r.sourceParcelId);
          changed = true;
        }
      }
    }
    return connected;
  }, [selectedParcel, activeRelationships]);

  // Chronological Ancestry Chain for the selected parcel (from CS down to BS)
  const chronologicalChain = useMemo(() => {
    if (!selectedParcel || lineageConnectedIds.size === 0) return [];
    const chainParcels = activeParcels.filter((p) => lineageConnectedIds.has(p.id));
    return chainParcels.sort((a, b) => a.surveyYear - b.surveyYear);
  }, [selectedParcel, lineageConnectedIds, activeParcels]);

  // Filtered parcels based on search query and viewScope
  const visibleParcels = useMemo(() => {
    let result = activeParcels;

    // View scope: if focused, only show parcels connected to selectedParcel
    if (viewScope === 'focused' && lineageConnectedIds.size > 0) {
      result = result.filter((p) => lineageConnectedIds.has(p.id));
    }

    // Search query filter (matches Dag, Bengali Dag, Khatian, Owner)
    if (filterQuery.trim()) {
      const q = filterQuery.trim().toLowerCase();
      result = result.filter((p) => 
        p.dagNo.toLowerCase().includes(q) ||
        p.dagNoBn.includes(q) ||
        p.khatianNo.toLowerCase().includes(q) ||
        p.khatianOwnerNames.some((o) => o.toLowerCase().includes(q)) ||
        p.remarks?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeParcels, viewScope, lineageConnectedIds, filterQuery]);

  // Filtered edges based on visible parcels
  const visibleRelationships = useMemo(() => {
    const validParcelIds = new Set(visibleParcels.map((p) => p.id));
    return activeRelationships.filter(
      (r) => validParcelIds.has(r.sourceParcelId) && validParcelIds.has(r.targetParcelId)
    );
  }, [activeRelationships, visibleParcels]);

  // ===============================================================
  // HIERARCHICAL TREE LAYOUT ENGINE (Crystal Clear Left-to-Right)
  // ===============================================================
  const nodePositions = useMemo(() => {
    const positions: Record<string, NodePosition> = {};
    const columns: Record<SurveyType, ParcelRecord[]> = {
      CS: [],
      SA: [],
      RS: [],
      BS: [],
    };

    visibleParcels.forEach((p) => {
      columns[p.surveyType].push(p);
    });

    // Column X positions with generous horizontal spacing
    const colX: Record<SurveyType, number> = {
      CS: 70,
      SA: 380,
      RS: 690,
      BS: 1000,
    };

    const nodeWidth = 236;
    const nodeHeight = 88;
    const minVerticalGap = 24;

    // Map parent and children
    const childrenMap: Record<string, string[]> = {};
    const parentMap: Record<string, string> = {};
    
    visibleRelationships.forEach((r) => {
      if (!childrenMap[r.sourceParcelId]) childrenMap[r.sourceParcelId] = [];
      childrenMap[r.sourceParcelId].push(r.targetParcelId);
      parentMap[r.targetParcelId] = r.sourceParcelId;
    });

    const assignedY: Record<string, number> = {};

    // 1. Initial Pass: Layout CS (Root) nodes
    let currentY = 110;
    columns.CS.forEach((root) => {
      assignedY[root.id] = currentY;
      const children = childrenMap[root.id] || [];
      const subtreeSpan = Math.max(1, children.length) * (nodeHeight + minVerticalGap);
      currentY += Math.max(subtreeSpan, nodeHeight + minVerticalGap * 1.5);
    });

    // 2. Successive Passes: SA, RS, BS
    const surveySequence: SurveyType[] = ['SA', 'RS', 'BS'];
    surveySequence.forEach((tier) => {
      const tierParcels = columns[tier];

      // Sort parcels so siblings stay together
      tierParcels.sort((a, b) => {
        const parentA = parentMap[a.id];
        const parentB = parentMap[b.id];
        const parentAY = parentA && assignedY[parentA] !== undefined ? assignedY[parentA] : 9999;
        const parentBY = parentB && assignedY[parentB] !== undefined ? assignedY[parentB] : 9999;
        if (parentAY !== parentBY) return parentAY - parentBY;
        return a.dagNo.localeCompare(b.dagNo, undefined, { numeric: true });
      });

      tierParcels.forEach((parcel) => {
        const parentId = parentMap[parcel.id];
        if (parentId && assignedY[parentId] !== undefined) {
          const siblings = childrenMap[parentId] || [parcel.id];
          const siblingIndex = siblings.indexOf(parcel.id);
          const totalSiblings = siblings.length;
          
          if (totalSiblings > 1) {
            // Symmetrical vertical distribution around parent
            const offset = (siblingIndex - (totalSiblings - 1) / 2) * (nodeHeight + minVerticalGap);
            assignedY[parcel.id] = assignedY[parentId] + offset;
          } else {
            // Direct alignment
            assignedY[parcel.id] = assignedY[parentId];
          }
        } else {
          // Unparented node placed below
          const maxYInTier = Object.entries(assignedY)
            .filter(([id]) => columns[tier].some((p) => p.id === id))
            .reduce((max, [_, y]) => Math.max(max, y), 80);
          assignedY[parcel.id] = maxYInTier + (nodeHeight + minVerticalGap);
        }
      });

      // Prevent any collision in this column
      for (let i = 1; i < tierParcels.length; i++) {
        const prevId = tierParcels[i - 1].id;
        const currId = tierParcels[i].id;
        if (assignedY[currId] < assignedY[prevId] + nodeHeight + minVerticalGap) {
          assignedY[currId] = assignedY[prevId] + nodeHeight + minVerticalGap;
        }
      }
    });

    // Populate final positions
    SURVEY_ORDER.forEach((tier) => {
      const tierParcels = columns[tier];
      const startX = colX[tier];

      tierParcels.forEach((parcel) => {
        const y = assignedY[parcel.id] ?? 110;
        positions[parcel.id] = {
          parcel,
          x: startX,
          y,
          width: nodeWidth,
          height: nodeHeight,
          column: tier,
        };
      });
    });

    return positions;
  }, [visibleParcels, visibleRelationships]);

  // Fit to screen helper
  const fitViewToScreen = useCallback(() => {
    const posList = Object.values(nodePositions);
    if (posList.length === 0) {
      setZoom(1);
      setPan({ x: 20, y: 20 });
      return;
    }

    const minX = Math.min(...posList.map((p) => p.x));
    const maxX = Math.max(...posList.map((p) => p.x + p.width));
    const minY = Math.min(...posList.map((p) => p.y));
    const maxY = Math.max(...posList.map((p) => p.y + p.height));

    const contentWidth = maxX - minX + 80;
    const contentHeight = maxY - minY + 140;

    const containerWidth = containerRef.current?.clientWidth || 900;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const scaleX = (containerWidth - 60) / contentWidth;
    const scaleY = (containerHeight - 80) / contentHeight;
    const newZoom = Math.min(1.2, Math.max(0.45, Math.min(scaleX, scaleY)));

    setZoom(Number(newZoom.toFixed(2)));
    setPan({
      x: Math.round((containerWidth - contentWidth * newZoom) / 2 - minX * newZoom + 30),
      y: Math.round(50 - minY * newZoom + 40),
    });
  }, [nodePositions]);

  // Handle Drag to Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if clicked directly on canvas background or SVG
    if (e.target !== containerRef.current && (e.target as HTMLElement).tagName !== 'svg') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(2.2, Math.max(0.4, Number((z * factor).toFixed(2)))));
  };

  // Launch a curated story
  const handleSelectStory = (story: PredefinedStory) => {
    setSelectedMouza(story.mouzaId);
    const target = parcels.find((p) => p.id === story.focalParcelId);
    if (target) {
      onSelectParcel(target);
    }
    setSelectedEdge(null);
    setViewScope('focused');
    // Smooth reset
    setTimeout(() => {
      setZoom(1.0);
      setPan({ x: 30, y: 30 });
    }, 50);
  };

  // Inspect source/target parcels when edge is selected
  const edgeSourceParcel = selectedEdge ? parcels.find((p) => p.id === selectedEdge.sourceParcelId) : null;
  const edgeTargetParcel = selectedEdge ? parcels.find((p) => p.id === selectedEdge.targetParcelId) : null;

  return (
    <div className="space-y-4 pb-12">
      {/* ============================================================ */}
      {/* 1. Header & Primary View Navigation Toolbar */}
      {/* ============================================================ */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <GitFork className="w-4 h-4 text-emerald-600" />
            <span>Interactive Cadastral Lineage Engine</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              4-Survey Century Trail
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <span>{isBn ? 'ঐতিহাসিক খতিয়ান ও দাগের ধারাবাহিকতা গ্রাফ' : 'Historical Parcel Lineage & Mutation Graph'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Traces century-long land ownership transitions across CS (1912) → SA (1958) → RS (1978) → BS (2004).
          </p>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mouza Selector */}
          <select
            value={selectedMouza}
            onChange={(e) => {
              setSelectedMouza(e.target.value);
              setSelectedEdge(null);
              // Select first parcel of that mouza
              const firstInMouza = parcels.find((p) => p.mouzaId === e.target.value);
              if (firstInMouza) onSelectParcel(firstInMouza);
            }}
            className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
          >
            <option value="mouza-badda-38">Mouza Badda (বাড্ডা, JL 38) — Multi-Gen Cases</option>
            <option value="mouza-tejgaon-12">Mouza Tejgaon (তেজগাঁও, JL 12) — Damaged Map</option>
            <option value="mouza-savar-45">Mouza Savar (সাভার, JL 45) — Batta Dag (২৯০/১)</option>
          </select>

          {/* View Mode: Focal Tree (Easy) vs Full Mouza */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => setViewScope('focused')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewScope === 'focused' 
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Shows only the selected plot's family tree (recommended for clarity)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Focal Tree View</span>
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewScope === 'all' 
                  ? 'bg-white text-stone-900 shadow-xs font-semibold' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Shows all parcels in this Mouza"
            >
              Full Mouza Network
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium px-1 text-stone-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={fitViewToScreen}
              title="Fit to Screen"
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(0.95);
                setPan({ x: 20, y: 15 });
              }}
              title="Reset View"
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Help Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 border border-stone-200 transition"
            title="How to Understand Lineage Graph"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Quick Story Selector (Makes it 10x easier to understand!) */}
      {/* ============================================================ */}
      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Select a Pre-Configured Lineage Case to Explore:</span>
          </div>
          <span className="text-[11px] text-stone-500 hidden sm:inline">
            Click any case below to automatically center on its historical progression
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {PREDEFINED_STORIES.map((story) => {
            const isCurrent = selectedMouza === story.mouzaId && selectedParcel?.id === story.focalParcelId;
            return (
              <button
                key={story.id}
                onClick={() => handleSelectStory(story)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      story.type === 'subdivision' ? 'bg-sky-100 text-sky-800' :
                      story.type === 'consolidation' ? 'bg-purple-100 text-purple-800' :
                      story.type === 'batta' ? 'bg-amber-100 text-amber-800' :
                      story.type === 'damaged' ? 'bg-rose-100 text-rose-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {story.type}
                    </span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="font-bold text-[11px] text-stone-900 line-clamp-1">
                    {story.title}
                  </div>
                  <div className="text-[10px] text-stone-500 line-clamp-2 mt-0.5">
                    {story.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Selected Parcel Chronological Stepper Trail */}
      {/* ============================================================ */}
      {selectedParcel && (
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-emerald-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <Compass className="w-4 h-4 text-emerald-400" />
                Lineage Journey for Dag #{selectedParcel.dagNo} ({selectedParcel.surveyType}):
              </span>
              <span className="text-[11px] text-slate-300">
                {chronologicalChain.length} generational record(s) linked
              </span>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {chronologicalChain.map((p, idx) => {
                const isCurrent = p.id === selectedParcel.id;
                const meta = SURVEY_METADATA[p.surveyType];
                return (
                  <React.Fragment key={p.id}>
                    {idx > 0 && (
                      <div className="flex items-center text-slate-400 shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        onSelectParcel(p);
                        setSelectedEdge(null);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-500 text-white ring-2 ring-white shadow-md'
                          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: meta.primaryColor }}
                      />
                      <span>{p.surveyType} Dag #{p.dagNo}</span>
                      <span className="font-mono text-[10px] text-slate-300 font-normal">
                        ({p.normalizedAreaDecimal.toFixed(1)} dec)
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onGenerateReport(selectedParcel)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Evidence Report</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. Main SVG Canvas & Side Inspector Grid */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Interactive SVG Canvas */}
        <div 
          className={`${selectedEdge || selectedParcel ? 'lg:col-span-3' : 'lg:col-span-4'} bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative min-h-[600px] h-[680px] cursor-grab active:cursor-grabbing select-none`}
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Subtle Blueprint Mesh Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {/* SVG Rendering: Columns, Lines, and Nodes unified in one coordinate space! */}
          <svg className="w-full h-full">
            <defs>
              {/* Arrow Markers */}
              <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
              </marker>

              {/* Node Shadows */}
              <filter id="node-shadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.6" />
              </filter>
              <filter id="node-active-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#38bdf8" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Canvas Transformation Group */}
            <g 
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
              style={{ transition: isDragging ? 'none' : 'transform 0.12s ease-out' }}
            >
              {/* ============================================================ */}
              {/* Survey Column Headers & Vertical Lane Guides */}
              {/* ============================================================ */}
              {SURVEY_ORDER.map((tier, colIdx) => {
                const meta = SURVEY_METADATA[tier];
                const colX = 70 + colIdx * 310;
                const parcelsInTier = visibleParcels.filter((p) => p.surveyType === tier);

                return (
                  <g key={tier} className="column-guide">
                    {/* Vertical background lane */}
                    <rect
                      x={colX - 10}
                      y="10"
                      width="256"
                      height="1200"
                      rx="16"
                      fill="#0f172a"
                      fillOpacity="0.4"
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />

                    {/* Column Header Card */}
                    <rect
                      x={colX}
                      y="20"
                      width="236"
                      height="58"
                      rx="12"
                      fill="#1e293b"
                      stroke={meta.borderColor}
                      strokeWidth="1.5"
                    />

                    {/* Header Strip */}
                    <path
                      d={`M ${colX} 32 Q ${colX} 20 ${colX + 12} 20 L ${colX + 224} 20 Q ${colX + 236} 20 ${colX + 236} 32 L ${colX + 236} 44 L ${colX} 44 Z`}
                      fill={meta.bgDark}
                    />

                    {/* Era Pill */}
                    <rect
                      x={colX + 8}
                      y="24"
                      width="54"
                      height="16"
                      rx="4"
                      fill={meta.primaryColor}
                    />
                    <text
                      x={colX + 35}
                      y="33"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {tier} ({meta.year})
                    </text>

                    {/* Era Name */}
                    <text
                      x={colX + 68}
                      y="32"
                      fill="#e2e8f0"
                      fontSize="11"
                      fontWeight="bold"
                      dominantBaseline="central"
                    >
                      {meta.name}
                    </text>

                    {/* Subtitle */}
                    <text
                      x={colX + 10}
                      y="58"
                      fill="#94a3b8"
                      fontSize="10"
                      dominantBaseline="central"
                    >
                      {meta.period} • <tspan fill="#38bdf8" fontWeight="bold">{parcelsInTier.length} Plots</tspan>
                    </text>
                  </g>
                );
              })}

              {/* ============================================================ */}
              {/* Connecting Edges (Lineage Transitions) */}
              {/* ============================================================ */}
              <g className="edges-layer">
                {visibleRelationships.map((rel) => {
                  const srcPos = nodePositions[rel.sourceParcelId];
                  const tgtPos = nodePositions[rel.targetParcelId];
                  if (!srcPos || !tgtPos) return null;

                  const startX = srcPos.x + srcPos.width;
                  const startY = srcPos.y + srcPos.height / 2;
                  const endX = tgtPos.x;
                  const endY = tgtPos.y + tgtPos.height / 2;

                  const deltaX = endX - startX;
                  const cp1X = startX + deltaX * 0.55;
                  const cp1Y = startY;
                  const cp2X = endX - deltaX * 0.55;
                  const cp2Y = endY;

                  const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;

                  const isSelected = selectedEdge?.id === rel.id;
                  const isEdgeInPath = lineageConnectedIds.has(rel.sourceParcelId) && lineageConnectedIds.has(rel.targetParcelId);

                  // Colors and styles based on relationship
                  let strokeColor = '#10b981'; // Green
                  let strokeDash = 'none';
                  let markerId = 'arrow-green';
                  let typeLabel = '⇄ 1:1';
                  let badgeBg = '#064e3b';
                  let badgeBorder = '#059669';
                  let badgeText = '#a7f3d0';

                  if (rel.relationshipType === 'subdivision') {
                    strokeColor = '#38bdf8'; // Blue
                    strokeDash = '6 4';
                    markerId = 'arrow-blue';
                    typeLabel = '⑂ Split';
                    badgeBg = '#0c4a6e';
                    badgeBorder = '#0284c7';
                    badgeText = '#bae6fd';
                  } else if (rel.relationshipType === 'consolidation') {
                    strokeColor = '#c084fc'; // Purple
                    strokeDash = '6 4';
                    markerId = 'arrow-purple';
                    typeLabel = '⑃ Merge';
                    badgeBg = '#581c87';
                    badgeBorder = '#9333ea';
                    badgeText = '#f3e8ff';
                  } else if (rel.scoreBreakdown.areaVariancePercent > 10) {
                    strokeColor = '#fbbf24'; // Amber
                    strokeDash = '5 3';
                    markerId = 'arrow-amber';
                    typeLabel = '⚠ Shift';
                    badgeBg = '#78350f';
                    badgeBorder = '#d97706';
                    badgeText = '#fef3c7';
                  }

                  return (
                    <g 
                      key={rel.id} 
                      opacity={isEdgeInPath ? 1 : 0.2}
                      className="cursor-pointer group"
                      onClick={() => {
                        setSelectedEdge(rel);
                        const targetParcel = parcels.find((p) => p.id === rel.targetParcelId);
                        if (targetParcel) onSelectParcel(targetParcel);
                      }}
                    >
                      {/* Generous invisible stroke for easy clicking */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="28"
                      />

                      {/* Path glow when active or selected */}
                      {(isSelected || isEdgeInPath) && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="8"
                          strokeOpacity="0.35"
                        />
                      )}

                      {/* Visible Edge */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={isSelected ? '#ffffff' : strokeColor}
                        strokeWidth={isSelected ? '3.5' : isEdgeInPath ? '2.8' : '2'}
                        strokeDasharray={strokeDash}
                        markerEnd={`url(#${markerId})`}
                        className="transition-all duration-150 group-hover:stroke-white"
                      />

                      {/* Edge Interactive Badge */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-35"
                          y="-11"
                          width="70"
                          height="22"
                          rx="11"
                          fill={badgeBg}
                          stroke={isSelected ? '#ffffff' : badgeBorder}
                          strokeWidth={isSelected ? '2' : '1.2'}
                        />
                        <text
                          x="0"
                          y="1"
                          fill={badgeText}
                          fontSize="9.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none select-none font-mono"
                        >
                          {typeLabel} {rel.score}%
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* ============================================================ */}
              {/* Parcel Nodes */}
              {/* ============================================================ */}
              <g className="nodes-layer">
                {Object.values(nodePositions).map((pos) => {
                  const p = pos.parcel;
                  const isSelected = selectedParcel?.id === p.id;
                  const isNodeInPath = lineageConnectedIds.has(p.id);
                  const meta = SURVEY_METADATA[p.surveyType];

                  return (
                    <g
                      key={p.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      opacity={isNodeInPath ? 1 : 0.25}
                      className="cursor-pointer group"
                      onClick={() => {
                        onSelectParcel(p);
                        setSelectedEdge(null);
                      }}
                    >
                      {/* Active Node Outer Glow */}
                      {isSelected && (
                        <rect
                          x="-4"
                          y="-4"
                          width={pos.width + 8}
                          height={pos.height + 8}
                          rx="14"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          filter="url(#node-active-glow)"
                        />
                      )}

                      {/* Main Node Card */}
                      <rect
                        x="0"
                        y="0"
                        width={pos.width}
                        height={pos.height}
                        rx="12"
                        fill="#1e293b"
                        stroke={isSelected ? '#38bdf8' : '#334155'}
                        strokeWidth={isSelected ? '2' : '1'}
                        className="group-hover:stroke-slate-300 transition"
                        filter="url(#node-shadow)"
                      />

                      {/* Card Header Strip */}
                      <path
                        d="M 0 12 Q 0 0 12 0 L 224 0 Q 236 0 236 12 L 236 28 L 0 28 Z"
                        fill={meta.bgDark}
                      />

                      {/* Survey Tag */}
                      <rect
                        x="8"
                        y="5"
                        width="54"
                        height="18"
                        rx="4"
                        fill={meta.primaryColor}
                      />
                      <text
                        x="35"
                        y="14"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {p.surveyType} {p.surveyYear}
                      </text>

                      {/* Sheet or Status indicator */}
                      {!p.dataQuality.isGeometryAvailable ? (
                        <g transform="translate(164, 6)">
                          <rect x="0" y="0" width="64" height="16" rx="4" fill="#78350f" />
                          <text x="32" y="8" fill="#fde68a" fontSize="8.5" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                            No Map Sheet
                          </text>
                        </g>
                      ) : (
                        <text
                          x="226"
                          y="14"
                          fill="#94a3b8"
                          fontSize="9.5"
                          textAnchor="end"
                          dominantBaseline="central"
                        >
                          Sheet #{p.sheetNo}
                        </text>
                      )}

                      {/* Dag Number */}
                      <text
                        x="12"
                        y="48"
                        fill="#f8fafc"
                        fontSize="14.5"
                        fontWeight="bold"
                        dominantBaseline="central"
                      >
                        Dag #{p.dagNo} <tspan fill="#38bdf8" fontSize="11" fontWeight="normal">({p.dagNoBn})</tspan>
                      </text>

                      {/* Area & Khatian */}
                      <text
                        x="12"
                        y="70"
                        fill="#94a3b8"
                        fontSize="11"
                        dominantBaseline="central"
                      >
                        Area: <tspan fill="#34d399" fontWeight="bold">{p.normalizedAreaDecimal.toFixed(1)} dec</tspan>
                        <tspan fill="#64748b"> • </tspan>
                        Kh #{p.khatianNo}
                      </text>

                      {/* Owner preview */}
                      {p.khatianOwnerNames.length > 0 && (
                        <text
                          x="224"
                          y="70"
                          fill="#64748b"
                          fontSize="9"
                          textAnchor="end"
                          dominantBaseline="central"
                        >
                          {p.khatianOwnerNames[0].split(' ')[0]}...
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* Floating Canvas Legend Bar */}
          <div className="absolute bottom-3 left-4 right-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-auto">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-400" />
                Lineage Guide:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" />
                <span>1-to-1 Succession (⇄)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 border-t-2 border-dashed border-sky-400 inline-block" />
                <span>Subdivision Partition (⑂)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 border-t-2 border-dashed border-purple-400 inline-block" />
                <span>Consolidation Amalgamation (⑃)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 border-t-2 border-dotted border-amber-400 inline-block" />
                <span>Area Discrepancy (⚠)</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Click any <strong>Plot Card</strong> or <strong>Edge Badge</strong> to inspect archival evidence.
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. Right Inspector Drawer: Plain-English Story & Legal Proof */}
        {/* ============================================================ */}
        {(selectedEdge || selectedParcel) && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-5 overflow-y-auto max-h-[680px] space-y-5 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedEdge ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <h3 className="font-bold text-sm text-stone-900">
                  {selectedEdge ? 'Historical Mutation Evidence' : 'Cadastral Parcel Story'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedEdge(null);
                }}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* EDGE INSPECTOR VIEW */}
            {selectedEdge ? (
              <div className="space-y-4">
                {/* Confidence & Assessment Box */}
                <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Matching Rule {selectedEdge.matchingRuleVersion}
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {selectedEdge.score}% Match Confidence
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    {selectedEdge.relationshipType === 'subdivision' && <Split className="w-4 h-4 text-sky-400" />}
                    {selectedEdge.relationshipType === 'consolidation' && <Merge className="w-4 h-4 text-purple-400" />}
                    {selectedEdge.relationshipType === '1_to_1_continuity' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    <span>{selectedEdge.confidenceLabel}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-2 leading-relaxed bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    {selectedEdge.summary}
                  </div>
                </div>

                {/* Predecessor vs Successor Box */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase">Predecessor Record:</span>
                      <div className="font-bold text-stone-900">
                        {edgeSourceParcel?.surveyType} Dag #{edgeSourceParcel?.dagNo}
                      </div>
                      <div className="text-[11px] text-stone-600 font-mono">
                        {edgeSourceParcel?.normalizedAreaDecimal.toFixed(1)} decimal
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase">Successor Record:</span>
                      <div className="font-bold text-stone-900">
                        {edgeTargetParcel?.surveyType} Dag #{edgeTargetParcel?.dagNo}
                      </div>
                      <div className="text-[11px] text-stone-600 font-mono">
                        {edgeTargetParcel?.normalizedAreaDecimal.toFixed(1)} decimal
                      </div>
                    </div>
                  </div>

                  {/* Area Delta Math */}
                  {edgeSourceParcel && edgeTargetParcel && (
                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500 font-medium">Area Transition Delta:</span>
                      {Math.abs(edgeTargetParcel.normalizedAreaDecimal - edgeSourceParcel.normalizedAreaDecimal) < 0.1 ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Exact Match (±0.0 dec)
                        </span>
                      ) : edgeTargetParcel.normalizedAreaDecimal < edgeSourceParcel.normalizedAreaDecimal ? (
                        <span className="font-bold text-sky-700 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" /> 
                          -{(edgeSourceParcel.normalizedAreaDecimal - edgeTargetParcel.normalizedAreaDecimal).toFixed(1)} dec (Partitioned)
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> 
                          +{(edgeTargetParcel.normalizedAreaDecimal - edgeSourceParcel.normalizedAreaDecimal).toFixed(1)} dec (Consolidated)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Score Breakdown Bars */}
                <div>
                  <h4 className="text-xs font-bold text-stone-800 mb-2 flex items-center justify-between">
                    <span>Evidence Pillars</span>
                    <span className="text-[10px] font-normal text-stone-500">Government Standard</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-stone-600">Cross-Reference Ledger Citations (35%)</span>
                        <span className="font-mono font-bold text-stone-800">
                          {selectedEdge.scoreBreakdown.crossReferenceScore} / {selectedEdge.scoreBreakdown.crossReferenceMax}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${(selectedEdge.scoreBreakdown.crossReferenceScore / selectedEdge.scoreBreakdown.crossReferenceMax) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-stone-600">Spatial Map Boundary Overlap (30%)</span>
                        <span className="font-mono font-bold text-stone-800">
                          {selectedEdge.scoreBreakdown.spatialScore} / {selectedEdge.scoreBreakdown.spatialMax}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${selectedEdge.scoreBreakdown.spatialStatus === 'unavailable' ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${(selectedEdge.scoreBreakdown.spatialScore / selectedEdge.scoreBreakdown.spatialMax) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-stone-600">Area Continuity (20%)</span>
                        <span className="font-mono font-bold text-stone-800">
                          {selectedEdge.scoreBreakdown.areaScore} / {selectedEdge.scoreBreakdown.areaMax}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${(selectedEdge.scoreBreakdown.areaScore / selectedEdge.scoreBreakdown.areaMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supporting Evidence */}
                {selectedEdge.positiveEvidence.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Supporting Evidence ({selectedEdge.positiveEvidence.length})</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedEdge.positiveEvidence.map((ev, i) => (
                        <li key={i} className="text-[11px] text-stone-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 leading-relaxed">
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reviewer Action Buttons */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <button
                    onClick={() => {
                      if (edgeSourceParcel) onOpenReviewModal(edgeSourceParcel, selectedEdge);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Record Human Review Decision</span>
                  </button>

                  {edgeSourceParcel && edgeTargetParcel && (
                    <button
                      onClick={() => onCompareRecords([edgeSourceParcel, edgeTargetParcel])}
                      className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Side-by-Side Comparison</span>
                    </button>
                  )}
                </div>
              </div>
            ) : selectedParcel ? (
              /* NODE INSPECTOR VIEW */
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span 
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: SURVEY_METADATA[selectedParcel.surveyType].primaryColor }}
                    >
                      {selectedParcel.surveyType} Survey ({selectedParcel.surveyYear})
                    </span>
                    <span className="text-stone-400 font-mono text-[10px]">ID: {selectedParcel.id}</span>
                  </div>
                  <h4 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span>Dag #{selectedParcel.dagNo}</span>
                    <span className="text-xs font-normal text-stone-500">({selectedParcel.dagNoBn})</span>
                  </h4>
                  <p className="text-stone-500 text-[11px]">
                    Khatian #{selectedParcel.khatianNo} • Mouza {selectedParcel.mouzaNameEn} ({selectedParcel.mouzaNameBn}, JL #{selectedParcel.jlNo})
                  </p>
                </div>

                {/* Primary Metrics Grid */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Standardized Decimal Area:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {selectedParcel.normalizedAreaDecimal.toFixed(2)} decimal
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Recorded Archival Area:</span>
                    <span className="font-semibold text-stone-800">{selectedParcel.recordedArea} {selectedParcel.recordedUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Square Meters:</span>
                    <span className="font-mono text-stone-800">{selectedParcel.normalizedAreaSqm.toFixed(1)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Cadastral Sheet:</span>
                    <span className="font-semibold text-stone-800">Sheet #{selectedParcel.sheetNo}</span>
                  </div>
                </div>

                {/* Recorded Owners */}
                {selectedParcel.khatianOwnerNames.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span>Recorded Land Owners ({selectedParcel.khatianOwnerNames.length})</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 text-[11px] font-medium leading-relaxed">
                      {selectedParcel.khatianOwnerNames.join('; ')}
                    </div>
                  </div>
                )}

                {/* Cross References */}
                {selectedParcel.crossReferences.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                      Documented Cross-References
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] font-medium leading-relaxed">
                      {selectedParcel.crossReferences.join('; ')}
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {selectedParcel.remarks && (
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                      Settlement Officer Field Remarks
                    </div>
                    <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                      {selectedParcel.remarks}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <button
                    onClick={() => onGenerateReport(selectedParcel)}
                    className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Evidence Dossier Report</span>
                  </button>

                  <button
                    onClick={() => onOpenReviewModal(selectedParcel)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit for Human Review</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 6. Educational Guide Modal (How to Understand Lineage Graph) */}
      {/* ============================================================ */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-stone-900">
                  Understanding Bangladesh Cadastral Lineage
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">
                  1. Left-to-Right Historical Timeline (1912 → 2004)
                </span>
                <p className="text-emerald-800">
                  Plots progress chronologically from British Cadastral Survey (CS, 1912) on the left, to East Pakistan State Acquisition (SA, 1958), Revisional Survey (RS, 1978), and modern City Survey (BS, 2004) on the right.
                </p>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                <span className="font-bold text-sky-900 block mb-1">
                  2. Subdivisions (Partitions / বাটোয়ারা)
                </span>
                <p className="text-sky-800">
                  When heirs inherited land or sold portions, a single parent plot branched into multiple child plots (<span className="font-bold">⑂ Split</span>). The sum of child areas matches the parent area.
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-bold text-purple-900 block mb-1">
                  3. Consolidations (Amalgamations / জোত একত্রীকরণ)
                </span>
                <p className="text-purple-800">
                  When a landholder bought adjacent parcels, multiple lines converge into a single unified plot (<span className="font-bold">⑃ Merge</span>).
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">
                  4. Batta Fractional Dags (বাট্টা দাগ)
                </span>
                <p className="text-amber-800">
                  In rural surveys (e.g., Savar), when a plot was split mid-settlement, surveyors added a slash like <span className="font-mono font-bold">Dag #290/1</span> to denote its parent origin.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                Got It, Explore Lineage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
