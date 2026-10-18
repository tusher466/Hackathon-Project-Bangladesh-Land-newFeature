import React, { useState } from 'react';
import { ParcelRecord } from '../types';
import { 
  Columns, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Scale, 
  Plus, 
  X,
  Calculator,
  Compass,
  FileCheck2,
  FileText
} from 'lucide-react';
import { evaluateSpatialOverlap } from '../services/spatialEngine';

interface RecordComparisonViewProps {
  parcels: ParcelRecord[];
  allParcels: ParcelRecord[];
  onOpenReviewModal: (parcel: ParcelRecord) => void;
  onGenerateReport: (parcel: ParcelRecord) => void;
  language: 'en' | 'bn';
}

export const RecordComparisonView: React.FC<RecordComparisonViewProps> = ({
  parcels: initialSelectedParcels,
  allParcels,
  onOpenReviewModal,
  onGenerateReport,
  language,
}) => {
  const isBn = language === 'bn';

  // Selected comparison records (max 3)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedParcels.length >= 2 
      ? initialSelectedParcels.slice(0, 3).map((p) => p.id)
      : ['SA-BD38-340', 'RS-BD38-720'] // default interesting discrepancy comparison
  );

  React.useEffect(() => {
    if (initialSelectedParcels.length >= 2) {
      setSelectedIds(initialSelectedParcels.slice(0, 3).map((p) => p.id));
    }
  }, [initialSelectedParcels]);

  const selectedRecords = selectedIds
    .map((id) => allParcels.find((p) => p.id === id))
    .filter((p): p is ParcelRecord => p !== undefined);

  const recordA = selectedRecords[0];
  const recordB = selectedRecords[1];

  // Area discrepancy analysis between record A and record B
  const areaAnalysis = React.useMemo(() => {
    if (!recordA || !recordB) return null;

    const areaA = recordA.normalizedAreaDecimal;
    const areaB = recordB.normalizedAreaDecimal;
    const deltaDecimal = Number((areaB - areaA).toFixed(4));
    const absDelta = Math.abs(deltaDecimal);
    const percentageVariance = areaA > 0 ? Number(((absDelta / areaA) * 100).toFixed(2)) : 0;
    
    // In Kathas: 1 katha = 1.65 decimal
    const deltaKathas = Number((absDelta / 1.65).toFixed(2));
    const deltaSqm = Number((absDelta * 40.4686).toFixed(1));

    let interpretation = '';
    let alertLevel: 'normal' | 'discrepancy' | 'subdivision' = 'normal';

    if (percentageVariance <= 2.5) {
      interpretation = 'Variance within standard British colonial Gunter\'s chain surveying margin (<2.5%). Indicates strong geographic continuity without substantial physical parcel alteration.';
      alertLevel = 'normal';
    } else if (deltaDecimal < 0) {
      // Area decreased
      if (percentageVariance > 15) {
        interpretation = `Significant area contraction of ${absDelta} decimal (${percentageVariance}% reduction). Hypothesis 1: Undocumented subdivision or co-sharer partition. Hypothesis 2: Partial acquisition for public road, embankment or khal. Hypothesis 3: Encroachment dispute requiring field verification.`;
        alertLevel = 'discrepancy';
      } else {
        interpretation = `Moderate area difference of ${absDelta} decimal (${percentageVariance}%). Typical of resurvey boundary rectification or minor boundary adjustment.`;
        alertLevel = 'discrepancy';
      }
    } else {
      // Area increased
      interpretation = `Area expansion of ${absDelta} decimal (+${percentageVariance}%). Hypothesis: Consolidation with adjacent holding, alluvion / accretion (পয়স্তি), or boundary recording error in earlier ledger.`;
      alertLevel = 'discrepancy';
    }

    return {
      areaA,
      areaB,
      deltaDecimal,
      absDelta,
      percentageVariance,
      deltaKathas,
      deltaSqm,
      interpretation,
      alertLevel,
    };
  }, [recordA, recordB]);

  // Spatial evaluation between record A and record B
  const spatialAnalysis = React.useMemo(() => {
    if (!recordA || !recordB) return null;
    return evaluateSpatialOverlap(recordA.geometry, recordB.geometry);
  }, [recordA, recordB]);

  const handleAddRecord = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 3) return;
    setSelectedIds([...selectedIds, id]);
  };

  const handleRemoveRecord = (id: string) => {
    if (selectedIds.length <= 1) return;
    setSelectedIds(selectedIds.filter((item) => item !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Controls Bar */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <Columns className="w-4 h-4" />
            <span>Cross-Survey Attribute Comparator</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            {isBn ? 'পাশাপাশি রেকর্ড তুলনা ও অসঙ্গতি বিশ্লেষণ' : 'Side-by-Side Survey Record Comparison'}
          </h1>
          <p className="text-xs text-stone-500">
            Compare CS, SA, RS, and BS attributes, calculate exact area variances, and test lineage hypotheses
          </p>
        </div>

        {/* Quick Comparison Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-stone-400 font-semibold mr-1">Presets:</span>
            <button
              onClick={() => setSelectedIds(['SA-BD38-340', 'RS-BD38-720'])}
              className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold transition"
            >
              12 dec Discrepancy
            </button>
            <button
              onClick={() => setSelectedIds(['SA-BD38-204', 'RS-BD38-410'])}
              className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-semibold transition"
            >
              Subdivision Partition
            </button>
            <button
              onClick={() => setSelectedIds(['CS-BD38-108', 'CS-BD38-109', 'SA-BD38-250'])}
              className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-semibold transition"
            >
              Amalgamation (3-way)
            </button>
            <button
              onClick={() => setSelectedIds(['CS-BD38-104', 'SA-BD38-204', 'BS-BD38-1205'])}
              className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-semibold transition"
            >
              Multi-Gen CS → SA → BS
            </button>
          </div>

          {/* Record Selection Dropdown */}
          {selectedIds.length < 3 && (
            <select
              onChange={(e) => {
                if (e.target.value) handleAddRecord(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-medium text-stone-800"
            >
              <option value="" disabled>+ Add Record</option>
              {allParcels
                .filter((p) => !selectedIds.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.surveyType} #{p.dagNo} ({p.mouzaNameEn}, {p.normalizedAreaDecimal.toFixed(1)} dec)
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Side-by-Side Comparison Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-900 text-white divide-x divide-stone-800">
                <th className="py-3 px-4 w-1/4 font-semibold text-stone-400 uppercase text-[10px] tracking-wider">
                  Attribute / Dimension
                </th>
                {selectedRecords.map((parcel, idx) => (
                  <th key={parcel.id} className="py-3 px-4 w-1/3 relative">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        parcel.surveyType === 'CS' ? 'bg-indigo-600 text-white' :
                        parcel.surveyType === 'SA' ? 'bg-amber-600 text-white' :
                        parcel.surveyType === 'RS' ? 'bg-emerald-600 text-white' :
                        'bg-cyan-600 text-white'
                      }`}>
                        Record {String.fromCharCode(65 + idx)}: {parcel.surveyType} ({parcel.surveyYear})
                      </span>
                      {selectedRecords.length > 2 && (
                        <button
                          onClick={() => handleRemoveRecord(parcel.id)}
                          className="text-stone-400 hover:text-white"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-base font-bold text-white mt-1">
                      Dag #{parcel.dagNo} ({parcel.dagNoBn})
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-stone-700">
              {/* Internal Record ID */}
              <tr className="divide-x divide-stone-100 bg-stone-50/50">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Internal Record ID</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4 font-mono text-[11px] text-stone-600">
                    {p.id}
                  </td>
                ))}
              </tr>

              {/* Survey Type & Regime */}
              <tr className="divide-x divide-stone-100">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Survey Regime & Year</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4 font-semibold text-stone-900">
                    {p.surveyType === 'CS' && 'Cadastral Survey (~1912)'}
                    {p.surveyType === 'SA' && 'State Acquisition Survey (~1958)'}
                    {p.surveyType === 'RS' && 'Revisional Survey (~1978)'}
                    {p.surveyType === 'BS' && 'Bangladesh City Survey (~2004)'}
                  </td>
                ))}
              </tr>

              {/* Khatian Number */}
              <tr className="divide-x divide-stone-100 bg-stone-50/50">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Khatian Number (খতিয়ান নং)</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4 font-bold text-stone-800">
                    #{p.khatianNo} <span className="font-serif font-normal text-stone-500">({p.khatianNoBn})</span>
                  </td>
                ))}
              </tr>

              {/* Mouza Jurisdiction & JL */}
              <tr className="divide-x divide-stone-100">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Mouza & JL Number</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4">
                    <span className="font-semibold text-stone-900">{p.mouzaNameEn} ({p.mouzaNameBn})</span>
                    <span className="text-stone-500 ml-1">• JL No. {p.jlNo}</span>
                  </td>
                ))}
              </tr>

              {/* Cadastral Sheet Number */}
              <tr className="divide-x divide-stone-100 bg-stone-50/50">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Cadastral Sheet No. (নকশা শিট)</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4 font-mono font-medium text-stone-800">
                    Sheet #{p.sheetNo}
                  </td>
                ))}
              </tr>

              {/* Recorded Area (Original) */}
              <tr className="divide-x divide-stone-100">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Original Recorded Area</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4 font-mono text-stone-800">
                    {p.recordedArea} {p.recordedUnit} <span className="font-serif text-stone-500">({p.recordedAreaBn})</span>
                  </td>
                ))}
              </tr>

              {/* Normalized Standard Decimal */}
              <tr className="divide-x divide-stone-100 bg-emerald-50/30">
                <td className="py-3 px-4 font-bold text-emerald-900">Standardized Decimal (শতক)</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-emerald-800 text-sm">
                    {p.normalizedAreaDecimal.toFixed(2)} decimal
                  </td>
                ))}
              </tr>

              {/* Square Meters Area */}
              <tr className="divide-x divide-stone-100 bg-stone-50/50">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Calculated Square Meters</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4 font-mono text-stone-700">
                    {p.normalizedAreaSqm.toFixed(1)} m² ({((p.normalizedAreaSqm * 10.7639) / 1000).toFixed(2)}k sq ft)
                  </td>
                ))}
              </tr>

              {/* Archival Cross-References */}
              <tr className="divide-x divide-stone-100">
                <td className="py-3 px-4 font-semibold text-stone-500">Archival Cross-Reference Notes</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-3 px-4">
                    {p.crossReferences.length > 0 ? (
                      <span className="inline-block bg-emerald-100/80 text-emerald-900 font-medium px-2 py-1 rounded text-[11px]">
                        {p.crossReferences.join('; ')}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic">None recorded</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Cadastral Sheet Map Presence */}
              <tr className="divide-x divide-stone-100 bg-stone-50/50">
                <td className="py-2.5 px-4 font-semibold text-stone-500">Map Vector Footprint</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-2.5 px-4">
                    {p.geometry ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Digitized Polygon Available</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>No Digitized Polygon (Physical sheet damaged/missing)</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Official Source Reference */}
              <tr className="divide-x divide-stone-100">
                <td className="py-3 px-4 font-semibold text-stone-500">Archival Record Room Source</td>
                {selectedRecords.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-stone-600 text-[11px] leading-relaxed">
                    {p.sourceReference}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Area Discrepancy & Hypothesis Calculator */}
      {areaAnalysis && recordA && recordB && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-stone-900">
                Area Discrepancy Calculation: {recordA.surveyType} Dag #{recordA.dagNo} vs {recordB.surveyType} Dag #{recordB.dagNo}
              </h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              areaAnalysis.alertLevel === 'discrepancy'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {areaAnalysis.alertLevel === 'discrepancy' ? 'Discrepancy Detected' : 'Area Consistent'}
            </span>
          </div>

          {/* Mathematical Formula Display */}
          <div className="bg-stone-900 text-stone-200 p-4 rounded-xl font-mono text-xs space-y-2">
            <div className="text-stone-400 text-[11px]">Formula: ΔArea = |Area(B) - Area(A)| ; Variance% = (ΔArea / Area(A)) * 100%</div>
            <div className="text-white font-bold text-sm">
              | {areaAnalysis.areaB.toFixed(2)} dec - {areaAnalysis.areaA.toFixed(2)} dec | = {areaAnalysis.absDelta.toFixed(2)} decimal ({areaAnalysis.percentageVariance}% shift)
            </div>
            <div className="text-stone-400 text-xs">
              Equivalents: {areaAnalysis.absDelta.toFixed(2)} Decimal = ~{areaAnalysis.deltaKathas} Kathas (কাঠা) = ~{areaAnalysis.deltaSqm} m²
            </div>
          </div>

          {/* Plain Language Interpretation & Hypotheses */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-950 space-y-2">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Investigative Interpretation & Hypotheses (Non-Authoritative)</span>
            </div>
            <p className="leading-relaxed">
              {areaAnalysis.interpretation}
            </p>
            <p className="text-[11px] text-amber-800 italic">
              Legal Precaution: A mathematical area discrepancy does not legally establish encroachment, fraudulent mutation, or defective title. It specifies an evidentiary gap for human settlement officers to verify against terrestrial field measurement ledgers.
            </p>
          </div>

          {/* Spatial Overlap Overlay Status */}
          {spatialAnalysis && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Spatial Alignment Status</span>
              </div>
              <p>{spatialAnalysis.reason}</p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenReviewModal(recordA)}
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Officer Findings for {recordA.dagNo}</span>
            </button>
            <button
              onClick={() => onGenerateReport(recordA)}
              className="py-2 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Evidence Dossier</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
