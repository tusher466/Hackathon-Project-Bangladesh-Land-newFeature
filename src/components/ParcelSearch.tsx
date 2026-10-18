import React, { useState, useMemo } from 'react';
import { ParcelRecord, SurveyType, SearchQuery } from '../types';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  FileText, 
  ArrowRight, 
  Compass, 
  AlertCircle,
  Sparkles,
  GitFork,
  Scale
} from 'lucide-react';
import { normalizeRecordNumber, toBengaliDigits } from '../services/normalizer';

interface ParcelSearchProps {
  allParcels: ParcelRecord[];
  onSelectParcel: (parcel: ParcelRecord) => void;
  onTraceLineage: (parcel: ParcelRecord) => void;
  onCompareParcel: (parcel: ParcelRecord) => void;
  language: 'en' | 'bn';
}

export const ParcelSearch: React.FC<ParcelSearchProps> = ({
  allParcels,
  onSelectParcel,
  onTraceLineage,
  onCompareParcel,
  language,
}) => {
  const isBn = language === 'bn';

  // Search filter states
  const [dagInput, setDagInput] = useState<string>('');
  const [khatianInput, setKhatianInput] = useState<string>('');
  const [surveyType, setSurveyType] = useState<SurveyType | 'ALL'>('ALL');
  const [mouzaFilter, setMouzaFilter] = useState<string>('ALL');
  const [minArea, setMinArea] = useState<string>('');
  const [maxArea, setMaxArea] = useState<string>('');
  const [hasCrossReferenceOnly, setHasCrossReferenceOnly] = useState<boolean>(false);

  // Filter logic
  const searchResults = useMemo(() => {
    return allParcels.filter((p) => {
      // Survey filter
      if (surveyType !== 'ALL' && p.surveyType !== surveyType) {
        return false;
      }

      // Mouza filter
      if (mouzaFilter !== 'ALL' && p.mouzaId !== mouzaFilter) {
        return false;
      }

      // Dag number filter (supports Bengali & English numerals, prefixes like 'দাগ নং')
      if (dagInput.trim()) {
        const queryDag = normalizeRecordNumber(dagInput);
        const parcelDag = normalizeRecordNumber(p.dagNo);
        if (!parcelDag.includes(queryDag) && !p.dagNoBn.includes(dagInput.trim())) {
          return false;
        }
      }

      // Khatian number filter
      if (khatianInput.trim()) {
        const queryKhatian = normalizeRecordNumber(khatianInput);
        const parcelKhatian = normalizeRecordNumber(p.khatianNo);
        if (!parcelKhatian.includes(queryKhatian) && !p.khatianNoBn.includes(khatianInput.trim())) {
          return false;
        }
      }

      // Area filters
      if (minArea && !isNaN(Number(minArea))) {
        if (p.normalizedAreaDecimal < Number(minArea)) return false;
      }

      if (maxArea && !isNaN(Number(maxArea))) {
        if (p.normalizedAreaDecimal > Number(maxArea)) return false;
      }

      // Quality filter
      if (hasCrossReferenceOnly && p.crossReferences.length === 0) {
        return false;
      }

      return true;
    });
  }, [allParcels, surveyType, mouzaFilter, dagInput, khatianInput, minArea, maxArea, hasCrossReferenceOnly]);

  const handleReset = () => {
    setDagInput('');
    setKhatianInput('');
    setSurveyType('ALL');
    setMouzaFilter('ALL');
    setMinArea('');
    setMaxArea('');
    setHasCrossReferenceOnly(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
              <Search className="w-4 h-4" />
              <span>Multi-Survey Cadastral Query</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              {isBn ? 'দাগ ও খতিয়ান প্রামাণ্য অনুসন্ধান' : 'Historical Parcel Search & Investigation'}
            </h1>
            <p className="text-xs text-stone-500">
              Supports Bengali numerals (১০৪) or English (104), prefix normalization, and cross-survey filtering
            </p>
          </div>

          <button
            onClick={handleReset}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Quick Sample Search Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-2 text-[11px]">
          <span className="text-stone-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Try Sample:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setDagInput('104');
              setSurveyType('CS');
              setMouzaFilter('mouza-badda-38');
            }}
            className="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-700 border border-stone-200 transition"
          >
            CS Dag 104
          </button>
          <button
            type="button"
            onClick={() => {
              setDagInput('১০৪');
              setSurveyType('ALL');
              setMouzaFilter('ALL');
            }}
            className="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-700 border border-stone-200 transition font-serif"
          >
            ১০৪ (বাংলা সংখ্যা)
          </button>
          <button
            type="button"
            onClick={() => {
              setDagInput('410');
              setSurveyType('RS');
              setMouzaFilter('mouza-badda-38');
            }}
            className="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-700 border border-stone-200 transition"
          >
            RS 410 (Subdivision)
          </button>
          <button
            type="button"
            onClick={() => {
              setDagInput('250');
              setSurveyType('SA');
              setMouzaFilter('mouza-badda-38');
            }}
            className="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-700 border border-stone-200 transition"
          >
            SA 250 (Consolidated)
          </button>
          <button
            type="button"
            onClick={() => {
              setDagInput('720');
              setSurveyType('RS');
              setMouzaFilter('mouza-badda-38');
            }}
            className="px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
          >
            RS 720 (12 dec discrepancy)
          </button>
          <button
            type="button"
            onClick={() => {
              setDagInput('290/1');
              setSurveyType('RS');
              setMouzaFilter('mouza-savar-45');
            }}
            className="px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 transition"
          >
            RS 290/1 (Batta Dag)
          </button>
          <button
            type="button"
            onClick={() => {
              setDagInput('50');
              setSurveyType('CS');
              setMouzaFilter('mouza-tejgaon-12');
            }}
            className="px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition"
          >
            CS 50 (Tejgaon Damaged Map)
          </button>
        </div>

        {/* Search Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Dag Number (দাগ নং)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 104 or ১০৪ or 290/1"
                value={dagInput}
                onChange={(e) => setDagInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Khatian Number (খতিয়ান নং)
            </label>
            <input
              type="text"
              placeholder="e.g. 12 or ১২ or 48"
              value={khatianInput}
              onChange={(e) => setKhatianInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Survey Generation (জরিপ পর্যায়)
            </label>
            <select
              value={surveyType}
              onChange={(e) => setSurveyType(e.target.value as SurveyType | 'ALL')}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            >
              <option value="ALL">All Surveys (CS, SA, RS, BS)</option>
              <option value="CS">CS (Cadastral ~ 1912)</option>
              <option value="SA">SA (State Acquisition ~ 1958)</option>
              <option value="RS">RS (Revisional ~ 1978)</option>
              <option value="BS">BS / City Survey (2004)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Mouza Jurisdiction (মৌজা)
            </label>
            <select
              value={mouzaFilter}
              onChange={(e) => setMouzaFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            >
              <option value="ALL">All Mouzas (বাড্ডা, তেজগাঁও, সাভার)</option>
              <option value="mouza-badda-38">Badda (বাড্ডা, JL 38)</option>
              <option value="mouza-tejgaon-12">Tejgaon (তেজগাঁও, JL 12)</option>
              <option value="mouza-savar-45">Savar (সাভার, JL 45)</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Area Range & Checkbox */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-stone-100 items-end">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-stone-500 mb-1">Min Area (Decimal)</label>
              <input
                type="number"
                placeholder="Min dec"
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-md"
              />
            </div>
            <span className="text-stone-400 mt-4">-</span>
            <div className="flex-1">
              <label className="block text-[10px] text-stone-500 mb-1">Max Area (Decimal)</label>
              <input
                type="number"
                placeholder="Max dec"
                value={maxArea}
                onChange={(e) => setMaxArea(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="crossRefOnly"
              checked={hasCrossReferenceOnly}
              onChange={(e) => setHasCrossReferenceOnly(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
            />
            <label htmlFor="crossRefOnly" className="text-xs text-stone-700 cursor-pointer select-none">
              Records with explicit archival cross-references only
            </label>
          </div>

          <div className="text-right text-xs text-stone-500">
            Matching records found: <strong className="text-emerald-700 text-sm">{searchResults.length}</strong> of {allParcels.length}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {searchResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Survey</th>
                  <th className="py-3 px-4">Dag # (English / বাংলা)</th>
                  <th className="py-3 px-4">Khatian #</th>
                  <th className="py-3 px-4">Location (Mouza & JL)</th>
                  <th className="py-3 px-4">Recorded Area</th>
                  <th className="py-3 px-4">Archival Evidence Reference</th>
                  <th className="py-3 px-4 text-center">Data Quality</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {searchResults.map((parcel) => (
                  <tr 
                    key={parcel.id}
                    className="hover:bg-stone-50/80 transition cursor-pointer"
                    onClick={() => onSelectParcel(parcel)}
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        parcel.surveyType === 'CS' ? 'bg-indigo-100 text-indigo-800' :
                        parcel.surveyType === 'SA' ? 'bg-amber-100 text-amber-800' :
                        parcel.surveyType === 'RS' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-cyan-100 text-cyan-800'
                      }`}>
                        {parcel.surveyType} ({parcel.surveyYear})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {parcel.dagNo} <span className="text-stone-400 font-serif font-normal">({parcel.dagNoBn})</span>
                    </td>
                    <td className="py-3 px-4 text-stone-700 font-medium">
                      #{parcel.khatianNo} <span className="text-stone-400 font-serif">({parcel.khatianNoBn})</span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      <div>{parcel.mouzaNameEn} (JL #{parcel.jlNo})</div>
                      <div className="text-[10px] text-stone-400">{parcel.upazila}, Sheet #{parcel.sheetNo}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="text-stone-900 font-semibold">{parcel.normalizedAreaDecimal.toFixed(2)} dec</div>
                      <div className="text-[10px] text-stone-400">Orig: {parcel.recordedArea} {parcel.recordedUnit}</div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-xs">
                      <div className="truncate text-[11px] font-medium" title={parcel.sourceReference}>
                        {parcel.sourceReference}
                      </div>
                      {parcel.crossReferences.length > 0 && (
                        <div className="text-[10px] text-emerald-700 truncate font-semibold mt-0.5">
                          Cross-ref: {parcel.crossReferences.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        parcel.dataQuality.qualityScore >= 80 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {parcel.dataQuality.qualityScore}% Complete
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectParcel(parcel)}
                          title="Inspect record details"
                          className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onTraceLineage(parcel)}
                          title="View cross-survey lineage"
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] flex items-center gap-1 transition"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>Lineage</span>
                        </button>
                        <button
                          onClick={() => onCompareParcel(parcel)}
                          title="Select for side-by-side comparison"
                          className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600 transition"
                        >
                          <Scale className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-800 mb-1">
              No Matching Cadastral Records Found
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
              We could not find any parcel matching your criteria. Try adjusting the Dag number (e.g. 104 or ১০৪), expanding the area range, or switching the survey filter.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition"
            >
              Reset Search Parameters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
