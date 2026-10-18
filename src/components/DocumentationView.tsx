import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Cpu, 
  Database, 
  ShieldAlert, 
  ExternalLink,
  Code2,
  CheckCircle2,
  History,
  Layers,
  Sparkles
} from 'lucide-react';
import { MATCHING_RULE_VERSION } from '../services/matchingEngine';

interface DocumentationViewProps {
  language: 'en' | 'bn';
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({ language }) => {
  const isBn = language === 'bn';
  const [activeDocTab, setActiveDocTab] = useState<'concept' | 'surveys' | 'algorithm' | 'dictionary' | 'architecture'>('concept');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Platform Documentation & Technical Reference</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
          BhumiSutra Technical Documentation & System Specifications
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Bangladesh Historical Land Records Verification, Cross-Survey Correlation & Cadastral Archiving
        </p>

        {/* Tab Strip */}
        <div className="flex overflow-x-auto gap-2 pt-4 mt-3 border-t border-stone-100">
          <button
            onClick={() => setActiveDocTab('concept')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeDocTab === 'concept'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            1. System Concept Note
          </button>
          <button
            onClick={() => setActiveDocTab('surveys')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeDocTab === 'surveys'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            2. Bangladesh Land Surveys Primer
          </button>
          <button
            onClick={() => setActiveDocTab('algorithm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeDocTab === 'algorithm'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            3. Matching Algorithm & Weights
          </button>
          <button
            onClick={() => setActiveDocTab('dictionary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeDocTab === 'dictionary'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            4. Synthetic Data Dictionary
          </button>
          <button
            onClick={() => setActiveDocTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeDocTab === 'architecture'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            5. Architecture & Governance
          </button>
        </div>
      </div>

      {/* TAB 1: CONCEPT NOTE */}
      {activeDocTab === 'concept' && (
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 text-stone-800 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Concept Note</span>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              BhumiSutra (ভূমিসূত্র): Reconstructing Historical Land Record Lineage across Survey Generations in Bangladesh
            </h2>
            <div className="text-stone-500 text-[11px] mt-1">
              Scope: Digital Land Records, Historical Parcel Verification & Lineage Reconstruction
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-stone-900">1. Executive Summary & Problem Context</h3>
            <p>
              In Bangladesh, land parcel records are scattered across more than a century of survey operations: Cadastral Survey (CS, 1888–1940), State Acquisition Survey (SA, 1956–1962), Revisional Survey (RS, 1965–1990), and Bangladesh/City Survey (BS/BRS, 1998–present). Over these survey transitions, land parcels underwent continuous mutation, partition among co-sharers (faraiz), voluntary alienations, administrative renumbering, and measurement changes between colonial Gunter's chains and modern theodolites.
            </p>
            <p>
              When citizens, title researchers, or settlement officers attempt to trace ownership continuity, they encounter a critical gap: <strong>no automated platform establishes and explains the evidentiary lineage connecting a modern BS or RS dag with its original CS/SA predecessor</strong>. As a result, title disputes, dual registrations, and fraudulent transfers proliferate, burdening civil courts with over 3.2 million pending land litigation suits.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-stone-900">2. The BhumiSutra Solution</h3>
            <p>
              BhumiSutra introduces an explainable, rule-based cross-survey matching engine that reconstructs chronological parcel lineages (CS → SA → RS → BS). Rather than acting as a black-box AI classifier or claiming automated legal certification, BhumiSutra functions as an <strong>investigative decision-support workbench</strong>. It evaluates four core categories of archival evidence:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-700 pl-2">
              <li><strong>Archival Cross-References:</strong> Remarks in settlement rolls, Terij (তেহরিজ), and Milan Khasra registers mentioning predecessor dags.</li>
              <li><strong>Cadastral Vector Superimposition:</strong> Intersection-over-Union (IoU) and centroid proximity on digitized mouza sheets.</li>
              <li><strong>Standardized Area Consistency:</strong> Multi-unit conversion (Acre, Bigha, Katha, Decimal, Sqm) with exact percentage shift detection.</li>
              <li><strong>Administrative Jurisdiction:</strong> Mouza JL number, circle, and cadastral sheet consistency.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-stone-900">3. Demonstration Scope & Key Scenarios</h3>
            <p>
              In the current platform release, BhumiSutra includes 38 synthetic records demonstrating realistic historical phenomena:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>Subdivision Partitions:</strong> Tracing CS Dag 104 (50 dec) into RS Dags 410 (28.5 dec) and 411 (21.5 dec).
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>Amalgamation / Consolidation:</strong> CS Dags 108 (18 dec) & 109 (22 dec) consolidating into SA Dag 250 (40 dec).
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>Documented Area Discrepancy:</strong> 12.00 decimal unrecorded delta between SA Dag 340 and RS Dag 720.
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>Damaged Cadastral Maps:</strong> Scoring without hallucinating spatial match when sheets are physically decayed.
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: LAND SURVEYS PRIMER */}
      {activeDocTab === 'surveys' && (
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 text-stone-800 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Historical Context</span>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              The Four Generations of Land Surveys in Bangladesh
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border-l-4 border-l-indigo-600 bg-indigo-50/40 border border-stone-200">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-indigo-950">1. Cadastral Survey (CS) • ১৮৮৮–১৯৪০</h3>
                <span className="text-[11px] font-mono text-indigo-800 font-semibold">Bengal Tenancy Act, 1885</span>
              </div>
              <p className="text-stone-700">
                The benchmark foundational survey conducted under British administration. Established the permanent Mouza boundaries, JL numbers, and original 16-inch-to-the-mile cadastral sheets (নকশা). Parcels were measured using Gunter's chains. Recorded in bigha-katha-chhatak and acres.
              </p>
            </div>

            <div className="p-4 rounded-xl border-l-4 border-l-amber-600 bg-amber-50/40 border border-stone-200">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-amber-950">2. State Acquisition Survey (SA) • ১৯৫৬–১৯৬২</h3>
                <span className="text-[11px] font-mono text-amber-800 font-semibold">East Bengal State Acquisition Act, 1950</span>
              </div>
              <p className="text-stone-700">
                Conducted after the abolition of the Zamindari rent-receiving system. Because it was carried out hurriedly in the post-partition period, new field maps were rarely drawn; instead, CS map sheets were reused with ledger annotations, creating numerous unindexed references and batta dags.
              </p>
            </div>

            <div className="p-4 rounded-xl border-l-4 border-l-emerald-600 bg-emerald-50/40 border border-stone-200">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-emerald-950">3. Revisional Survey (RS) • ১৯৬৫–১৯৯০</h3>
                <span className="text-[11px] font-mono text-emerald-800 font-semibold">Cadastral Correction Operations</span>
              </div>
              <p className="text-stone-700">
                Undertaken to rectify the inaccuracies of the hasty SA survey. Re-measured boundaries, assigned new modernized Dag numbers, and created official Terij registers cross-referencing predecessor SA khatians. Regarded by Bangladesh courts as highly authoritative.
              </p>
            </div>

            <div className="p-4 rounded-xl border-l-4 border-l-cyan-600 bg-cyan-50/40 border border-stone-200">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-cyan-950">4. Bangladesh Survey / City Survey (BS/BRS) • ১৯৯৮–বর্তমান</h3>
                <span className="text-[11px] font-mono text-cyan-800 font-semibold">Modern Urban & Zonal Settlement</span>
              </div>
              <p className="text-stone-700">
                Ongoing modern survey in major metropolitan and rural upazilas. In Dhaka, known as Dhaka City Survey (সিটি জরিপ). Utilizes modern electronic distance meters (EDM) and GPS, establishing decimal area standards down to the second decimal place.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALGORITHM & FORMULAS */}
      {activeDocTab === 'algorithm' && (
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 text-stone-800 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Matching Methodology</span>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              Cross-Survey Evidentiary Scoring Algorithm ({MATCHING_RULE_VERSION})
            </h2>
          </div>

          <section className="space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Configurable Weight Model</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-2xl font-bold text-emerald-700">35%</div>
                <div className="font-semibold text-stone-800 mt-0.5">Cross-Reference</div>
                <div className="text-[10px] text-stone-500">Archival remark citation</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-2xl font-bold text-blue-700">30%</div>
                <div className="font-semibold text-stone-800 mt-0.5">Spatial Overlap</div>
                <div className="text-[10px] text-stone-500">IoU & Centroid offset</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-2xl font-bold text-amber-700">20%</div>
                <div className="font-semibold text-stone-800 mt-0.5">Area Consistency</div>
                <div className="text-[10px] text-stone-500">Tolerance &lt;5% variance</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-2xl font-bold text-purple-700">15%</div>
                <div className="font-semibold text-stone-800 mt-0.5">Metadata & Mouza</div>
                <div className="text-[10px] text-stone-500">JL No. & Sheet Match</div>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-stone-900">Handling Missing vs Contradictory Evidence (Anti-Hallucination Guardrail)</h3>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-stone-800 space-y-2">
              <p>
                <strong>Fundamental Rule:</strong> <em>Missing evidence is never treated as positive evidence.</em>
              </p>
              <p>
                If a cadastral map sheet is damaged or unindexed in the record room, the engine marks:
                <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded ml-1 font-mono text-[11px]">
                  Spatial evidence unavailable: sheet missing
                </code>.
                The algorithm recalculates confidence strictly against the 70 available points, applies an unverified dampener (capped at 85%), and mandates human physical inspection.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: DATA DICTIONARY */}
      {activeDocTab === 'dictionary' && (
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 text-stone-800 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Schema Specification</span>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              Synthetic Cadastral Data Dictionary
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-700 border-b border-stone-200 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Field Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Origin</th>
                  <th className="py-2.5 px-3">Description & Standard Formatting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">id</td>
                  <td className="py-2.5 px-3 text-stone-500">string</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700">Normalized</td>
                  <td className="py-2.5 px-3">Unique identifier formatted as `[Survey]-[MouzaJL]-[DagNo]` (e.g. `CS-BD38-104`).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">surveyType</td>
                  <td className="py-2.5 px-3 text-stone-500">enum</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-700">Source Value</td>
                  <td className="py-2.5 px-3">One of `CS`, `SA`, `RS`, `BS`.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">dagNo / dagNoBn</td>
                  <td className="py-2.5 px-3 text-stone-500">string</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-700">Source Value</td>
                  <td className="py-2.5 px-3">Cadastral plot index in English digits and Bengali digits (e.g. `104` / `১০৪`, `290/1` / `২৯০/১`).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">khatianNo</td>
                  <td className="py-2.5 px-3 text-stone-500">string</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-700">Source Value</td>
                  <td className="py-2.5 px-3">Tenancy holding register number in the respective survey volume.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">recordedArea</td>
                  <td className="py-2.5 px-3 text-stone-500">number</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-700">Source Value</td>
                  <td className="py-2.5 px-3">Original area value as written in the handwritten survey volume.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">normalizedAreaDecimal</td>
                  <td className="py-2.5 px-3 text-stone-500">number</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700">Normalized</td>
                  <td className="py-2.5 px-3">Calculated standard area in Decimal (শতক), converting acres (1=100) or bighas (1=33).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">geometry</td>
                  <td className="py-2.5 px-3 text-stone-500">Polygon | null</td>
                  <td className="py-2.5 px-3 font-semibold text-purple-700">Spatial Layer</td>
                  <td className="py-2.5 px-3">Cadastral vector polygon coordinates with centroid and bounding box. Null if sheet unvectorized.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ARCHITECTURE & GOVERNANCE */}
      {activeDocTab === 'architecture' && (
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 text-stone-800 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">System Architecture</span>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              Component Architecture & Responsible AI Governance
            </h2>
          </div>

          <div className="p-4 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
            <pre>{`[ Client Layer: React 19 + Tailwind v4 + Lucide Icons ]
       │
       ▼
[ Application Services ]
  ├─ normalizer.ts (Bengali digits, punctuation, Land unit conversions)
  ├─ spatialEngine.ts (Cadastral polygon IoU & Centroid offset)
  ├─ matchingEngine.ts (4-Tier rule-based hypothesis scoring & contradiction audit)
  └─ storage.ts (Persistent storage, audit log, review cases)
       │
       ▼
[ Synthetic Archival Dataset: 38 Parcels across CS, SA, RS, BS ]
  ├─ Mouza Badda JL-38 (Subdivisions, Consolidations, Area Shifts)
  ├─ Mouza Tejgaon JL-12 (Physical Map Decay / Missing Geometry)
  └─ Mouza Savar JL-45 (Batta Fractional Sub-Dags)`}</pre>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <h3 className="font-bold text-sm text-stone-900">Responsible Civic Data Governance</h3>
            <p>
              1. <strong>Synthetic Data Privacy:</strong> No personal NID numbers, identifiable private land holdings, or classified government surveys are contained in the dataset. All names and coordinates are fictionalized.
            </p>
            <p>
              2. <strong>No Unwarranted Legal Authority Claims:</strong> The platform prominently displays informational notices on every view and generated report.
            </p>
            <p>
              3. <strong>Human-in-the-Loop Supremacy:</strong> Automated algorithms propose hypotheses with transparent breakdown. The human settlement officer's review decision is recorded as a separate authoritative layer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
