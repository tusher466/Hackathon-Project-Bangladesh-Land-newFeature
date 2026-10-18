import React from 'react';
import { 
  DashboardMetrics, 
  ParcelRecord, 
  AuditEvent,
  SurveyType 
} from '../types';
import { 
  GitFork, 
  Layers, 
  Split, 
  Merge, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  History, 
  Clock, 
  FileCheck2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentParcels: ParcelRecord[];
  auditEvents: AuditEvent[];
  onSelectParcel: (parcel: ParcelRecord) => void;
  onNavigateTab: (tab: NavTab) => void;
  onLaunchDemoScenario: (scenarioId: string) => void;
  language: 'en' | 'bn';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  recentParcels,
  auditEvents,
  onSelectParcel,
  onNavigateTab,
  onLaunchDemoScenario,
  language,
}) => {
  const isBn = language === 'bn';

  const surveyTiers: { type: SurveyType; yearRange: string; nameEn: string; nameBn: string; count: number; color: string }[] = [
    { type: 'CS', yearRange: '1888–1940', nameEn: 'Cadastral Survey', nameBn: 'ক্যাডাস্ট্রাল সার্ভে (সিএস)', count: metrics.bySurveyType.CS, color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900' },
    { type: 'SA', yearRange: '1956–1962', nameEn: 'State Acquisition', nameBn: 'স্টেট অ্যাকুইজিশন (এসএ)', count: metrics.bySurveyType.SA, color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { type: 'RS', yearRange: '1965–1990', nameEn: 'Revisional Survey', nameBn: 'রিভিশনাল সার্ভে (আরএস)', count: metrics.bySurveyType.RS, color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900' },
    { type: 'BS', yearRange: '1998–Present', nameEn: 'Bangladesh / City Survey', nameBn: 'বাংলাদেশ/সিটি সার্ভে (বিএস)', count: metrics.bySurveyType.BS, color: 'border-l-cyan-500 bg-cyan-50/50 text-cyan-900' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Civic Presentation */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Land Records & Cadastral Lineage Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            {isBn 
              ? 'ঐতিহাসিক ভূমি রেকর্ড ধারাবাহিকতা ও প্রামাণ্য অনুসন্ধান প্ল্যাটফর্ম'
              : 'Investigate Historical Land Record Lineage in Bangladesh'}
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
            {isBn
              ? 'ভূমিসূত্র বিভিন্ন সার্ভে পর্যায়ের (CS, SA, RS, BS) খতিয়ান ও দাগের মধ্যে বিভাজন, একত্রীকরণ ও পরিবর্তন বিশ্লেষণ করে প্রামাণ্য তথ্যের ভিত্তিতে সংযোগ স্থাপন করে।'
              : 'BhumiSutra traces historical parcel relationships across CS, SA, RS, and BS survey generations. It analyzes subdivisions, consolidations, area shifts, and archival notes to present evidence-based lineage hypotheses with full transparency.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('lineage')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <GitFork className="w-4 h-4" />
              <span>{isBn ? 'ধারাবাহিকতা গ্রাফ উন্মোচন' : 'Explore Lineage Graph'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('search')}
              className="bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              <span>{isBn ? 'দাগ ও খতিয়ান অনুসন্ধান' : 'Search Synthetic Parcels'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('docs')}
              className="text-stone-300 hover:text-white px-3 py-2 text-sm flex items-center gap-1.5 transition underline-offset-4 hover:underline"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'প্রকল্প ধারণাপত্র (Concept Note)' : 'View Concept Note'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Step User Journey Guide (Making UI easy to understand and use) */}
      <section className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-stone-900">
              {isBn ? 'কীভাবে ভূমিসূত্র প্ল্যাটফর্ম ব্যবহার করবেন (৪টি সহজ ধাপ)' : 'How to Use BhumiSutra Platform (4-Step Guided Workflow)'}
            </h2>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">Workflow Overview</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Step 1 */}
          <div 
            onClick={() => onNavigateTab('locations')}
            className="p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-300 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                1
              </span>
              <span className="text-[10px] text-stone-400 font-medium group-hover:text-emerald-700">Explore Mouza →</span>
            </div>
            <strong className="text-stone-900 block font-semibold mb-0.5">
              Select Mouza & Map Plane
            </strong>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Open the interactive Leaflet map or schematic SVG sheet for Badda, Tejgaon, or Savar.
            </p>
          </div>

          {/* Step 2 */}
          <div 
            onClick={() => onNavigateTab('search')}
            className="p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-300 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                2
              </span>
              <span className="text-[10px] text-stone-400 font-medium group-hover:text-emerald-700">Search Records →</span>
            </div>
            <strong className="text-stone-900 block font-semibold mb-0.5">
              Search Dag or Khatian
            </strong>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Query using English (104) or Bengali (১০৪) digits, try sample chips, and inspect ledger citations.
            </p>
          </div>

          {/* Step 3 */}
          <div 
            onClick={() => onNavigateTab('lineage')}
            className="p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-300 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                3
              </span>
              <span className="text-[10px] text-stone-400 font-medium group-hover:text-emerald-700">View Lineage →</span>
            </div>
            <strong className="text-stone-900 block font-semibold mb-0.5">
              Trace Lineage Graph
            </strong>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Click any node to illuminate its full ancestral chain across CS, SA, RS, and BS survey tiers.
            </p>
          </div>

          {/* Step 4 */}
          <div 
            onClick={() => onNavigateTab('compare')}
            className="p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-300 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                4
              </span>
              <span className="text-[10px] text-stone-400 font-medium group-hover:text-emerald-700">Compare & Sign →</span>
            </div>
            <strong className="text-stone-900 block font-semibold mb-0.5">
              Evaluate Evidence & Sign
            </strong>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Calculate area deltas, view hypotheses, record review decisions, and export printable dossiers.
            </p>
          </div>
        </div>
      </section>

      {/* Live Calculated Database Metrics */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {isBn ? 'লাইভ ডেটাবেজ মেট্রিক্স' : 'Database Status & Lineage Metrics'}
            </h2>
            <p className="text-xs text-stone-500">
              {isBn ? 'বর্তমান কৃত্রিম ডেটাসেট থেকে সরাসরি গণনাকৃত' : 'Calculated dynamically from the stored synthetic land records'}
            </p>
          </div>
          <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md border border-stone-200">
            Storage Engine: Active (38 Parcels)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
              <span>{isBn ? 'মোট পার্সেল' : 'Total Parcels'}</span>
              <Layers className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-bold text-stone-900">{metrics.totalParcels}</div>
            <div className="text-[11px] text-stone-500 mt-1">CS, SA, RS, BS records</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
              <span>{isBn ? 'চিহ্নিত সম্পর্ক' : 'Lineage Links'}</span>
              <GitFork className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">{metrics.totalRelationships}</div>
            <div className="text-[11px] text-emerald-600 mt-1">Evaluated hypotheses</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
              <span>{isBn ? 'প্লট বিভাজন' : 'Subdivisions'}</span>
              <Split className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{metrics.subdivisionCount}</div>
            <div className="text-[11px] text-blue-600 mt-1">1-to-many partition cases</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
              <span>{isBn ? 'একত্রীকরণ' : 'Consolidations'}</span>
              <Merge className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{metrics.consolidationCount}</div>
            <div className="text-[11px] text-purple-600 mt-1">Many-to-1 amalgamations</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
              <span>{isBn ? 'অসঙ্গতি ও তফাত' : 'Discrepancies'}</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{metrics.discrepancyCount}</div>
            <div className="text-[11px] text-amber-600 mt-1">Area delta / missing maps</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
              <span>{isBn ? 'পর্যালোচনা সম্পন্ন' : 'Human Reviews'}</span>
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold text-teal-700">{metrics.reviewedCount}</div>
            <div className="text-[11px] text-teal-600 mt-1">Officer verified cases</div>
          </div>
        </div>
      </section>

      {/* Survey Periods Timeline Progression */}
      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-bold text-stone-900">
            {isBn ? 'বাংলাদেশের ভূমি জরিপের পর্যায়ক্রমিক ইতিহাস' : 'Chronological Land Survey Generations in Bangladesh'}
          </h2>
          <p className="text-xs text-stone-500">
            {isBn 
              ? 'সিএস থেকে শুরু করে বিএস পর্যন্ত জরিপ পর্যায়ের বৈশিষ্ট্য ও সংশ্লিষ্ট রেকর্ড সংখ্যা'
              : 'Sequential historical cadastral regimes and parcel counts in current synthetic database'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {surveyTiers.map((tier, idx) => (
            <div 
              key={tier.type}
              className={`p-4 rounded-xl border-l-4 border border-stone-200 ${tier.color} transition hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-lg">{tier.type}</span>
                <span className="text-xs font-mono font-medium opacity-80">{tier.yearRange}</span>
              </div>
              <div className="font-semibold text-sm mb-1">{tier.nameEn}</div>
              <div className="text-xs opacity-75 font-serif mb-3">{tier.nameBn}</div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-300/40 text-xs">
                <span className="opacity-80">Available Records</span>
                <span className="font-bold text-sm bg-white/70 px-2 py-0.5 rounded shadow-2xs">
                  {tier.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Lineage Demonstration Scenarios */}
      <section className="bg-stone-50 p-6 rounded-2xl border border-emerald-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-stone-900">
                {isBn ? 'ঐতিহাসিক ধারাবাহিকতা বিশ্লেষণ চিত্রপট (Key Lineage Scenarios)' : 'Curated Historical Lineage Scenarios'}
              </h2>
            </div>
            <p className="text-xs text-stone-600">
              Direct access to verified cadastral cases: subdivisions, consolidations, area discrepancies, and damaged map ledgers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Scenario 1 */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Scenario 1 • Multi-Gen Subdivision
                </span>
                <span className="text-xs text-stone-400 font-mono">CS 104</span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 mb-1">
                CS Dag 104 (50 dec) → RS 410 & 411
              </h3>
              <p className="text-xs text-stone-600 line-clamp-3 mb-3">
                Complete multi-generation lineage through SA 204, partition deed subdivision into two RS parcels (28.5 + 21.5 = 50.0 dec), followed by BS road widening deduction.
              </p>
            </div>
            <button
              onClick={() => onLaunchDemoScenario('subdivision-golden')}
              className="w-full mt-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Inspect CS-BD38-104 Lineage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario 2 */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-purple-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                  Scenario 2 • Consolidation
                </span>
                <span className="text-xs text-stone-400 font-mono">CS 108 + 109</span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 mb-1">
                CS Dags 108 (18 dec) & 109 (22 dec) → SA 250
              </h3>
              <p className="text-xs text-stone-600 line-clamp-3 mb-3">
                Amalgamation of two adjacent ancestral holdings into a single 40.0 decimal parcel in SA survey, continuing to RS 550 and BS 1420.
              </p>
            </div>
            <button
              onClick={() => onLaunchDemoScenario('consolidation-amalgamation')}
              className="w-full mt-2 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Inspect Consolidation Lineage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario 3 */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  Scenario 3 • Area Discrepancy (12 Dec)
                </span>
                <span className="text-xs text-stone-400 font-mono">SA 340 vs RS 720</span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 mb-1">
                SA Dag 340 (60 dec) vs RS Dag 720 (48 dec)
              </h3>
              <p className="text-xs text-stone-600 line-clamp-3 mb-3">
                Deliberately documented 20% area discrepancy (12.0 decimals missing), generating review flags, contradiction alerts, and comparison calculations.
              </p>
            </div>
            <button
              onClick={() => onLaunchDemoScenario('area-discrepancy')}
              className="w-full mt-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Compare Discrepancy & Evidence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario 4 */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  Scenario 4 • Damaged Map (No Geometry)
                </span>
                <span className="text-xs text-stone-400 font-mono">Tejgaon CS 50</span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 mb-1">
                Tejgaon CS 50 & SA 110 (Geometry Missing)
              </h3>
              <p className="text-xs text-stone-600 line-clamp-3 mb-3">
                Demonstrates matching when cadastral sheets are damaged. The engine explicitly refuses to hallucinate spatial overlap, scoring solely from ledger & area evidence.
              </p>
            </div>
            <button
              onClick={() => onLaunchDemoScenario('missing-geometry')}
              className="w-full mt-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Inspect Damaged Map Handling</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario 5 */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-rose-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                  Scenario 5 • Batta Sub-Dag (২৯০/১)
                </span>
                <span className="text-xs text-stone-400 font-mono">Savar RS 290/1</span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 mb-1">
                Savar CS 80 → RS 290 & 290/1 (Batta)
              </h3>
              <p className="text-xs text-stone-600 line-clamp-3 mb-3">
                Identifies fractional / batta dag numbering (বাট্টা দাগ) created during cadastral settlement partition, with bilingual numeral normalization.
              </p>
            </div>
            <button
              onClick={() => onLaunchDemoScenario('batta-subdag')}
              className="w-full mt-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Inspect Batta Sub-Dag Lineage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario 6 */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-200 text-stone-800">
                  Scenario 6 • Diluvion / Lost Plot
                </span>
                <span className="text-xs text-stone-400 font-mono">CS 199</span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 mb-1">
                Isolated CS Dag 199 (River Diluvion)
              </h3>
              <p className="text-xs text-stone-600 line-clamp-3 mb-3">
                A parcel lost to riverbank erosion (নদীভাঙন/শিকস্তি) with no reliable successor. Correctly identified as unresolved rather than forcing an artificial link.
              </p>
            </div>
            <button
              onClick={() => onLaunchDemoScenario('isolated-parcel')}
              className="w-full mt-2 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Inspect Isolated Diluvion Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Two Column Grid: Recent Parcels + System Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Parcels Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isBn ? 'সম্প্রতি নিরীক্ষিত পার্সেল রেকর্ড' : 'Survey Records in Active Memory'}
              </h2>
              <p className="text-xs text-stone-500">
                Quick inspection of land parcels across historical surveys
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('search')}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
            >
              <span>View All 38 Records</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 border-y border-stone-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Survey</th>
                  <th className="py-2.5 px-3">Dag #</th>
                  <th className="py-2.5 px-3">Khatian #</th>
                  <th className="py-2.5 px-3">Mouza & Upazila</th>
                  <th className="py-2.5 px-3">Recorded Area</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentParcels.slice(0, 8).map((parcel) => (
                  <tr 
                    key={parcel.id}
                    className="hover:bg-stone-50/80 transition cursor-pointer"
                    onClick={() => onSelectParcel(parcel)}
                  >
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                        parcel.surveyType === 'CS' ? 'bg-indigo-100 text-indigo-800' :
                        parcel.surveyType === 'SA' ? 'bg-amber-100 text-amber-800' :
                        parcel.surveyType === 'RS' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-cyan-100 text-cyan-800'
                      }`}>
                        {parcel.surveyType} ({parcel.surveyYear})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">
                      {parcel.dagNo} <span className="text-stone-400 font-serif">({parcel.dagNoBn})</span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      #{parcel.khatianNo}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {parcel.mouzaNameEn} (JL {parcel.jlNo}), {parcel.upazila}
                    </td>
                    <td className="py-2.5 px-3 text-stone-800 font-mono">
                      {parcel.normalizedAreaDecimal.toFixed(2)} dec
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-emerald-600 font-medium hover:underline inline-flex items-center gap-0.5">
                        Inspect
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-Time Audit Log (1 Col) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-stone-500" />
                <h2 className="text-base font-bold text-stone-900">
                  {isBn ? 'সিস্টেম অডিট ট্রেইল' : 'System Audit Trail'}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-stone-400">RFC 3161 Log</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Immutable record of seed operations, matching evaluations, and reviewer actions
            </p>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {auditEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-1">
                    <span>{event.actor}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="font-semibold text-stone-800 text-[11px] mb-0.5">
                    {event.action}
                  </div>
                  <div className="text-stone-600 text-[11px] leading-relaxed">
                    {event.details}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 mt-4 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Logged Events: {auditEvents.length}</span>
            <span className="text-emerald-700 font-medium">Audit Integrity: Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
