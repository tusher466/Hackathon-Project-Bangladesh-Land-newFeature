import React from 'react';
import { ParcelRecord, ParcelRelationship } from '../types';
import { 
  X, 
  FileText, 
  GitFork, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  MapPin, 
  Layers, 
  Scale, 
  ArrowRight,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

interface ParcelDetailModalProps {
  parcel: ParcelRecord | null;
  isOpen: boolean;
  onClose: () => void;
  relationships: ParcelRelationship[];
  allParcels: ParcelRecord[];
  onTraceLineage: (parcel: ParcelRecord) => void;
  onCompareParcel: (parcel: ParcelRecord) => void;
  onOpenReviewModal: (parcel: ParcelRecord) => void;
  onGenerateReport: (parcel: ParcelRecord) => void;
  language: 'en' | 'bn';
}

export const ParcelDetailModal: React.FC<ParcelDetailModalProps> = ({
  parcel,
  isOpen,
  onClose,
  relationships,
  allParcels,
  onTraceLineage,
  onCompareParcel,
  onOpenReviewModal,
  onGenerateReport,
  language,
}) => {
  if (!isOpen || !parcel) return null;

  const isBn = language === 'bn';

  // Candidate relationships for this parcel
  const relatedLinks = relationships.filter(
    (r) => r.sourceParcelId === parcel.id || r.targetParcelId === parcel.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
              parcel.surveyType === 'CS' ? 'bg-indigo-600 text-white' :
              parcel.surveyType === 'SA' ? 'bg-amber-600 text-white' :
              parcel.surveyType === 'RS' ? 'bg-emerald-600 text-white' :
              'bg-cyan-600 text-white'
            }`}>
              {parcel.surveyType} Survey ({parcel.surveyYear})
            </span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Dag #{parcel.dagNo} <span className="font-serif font-normal text-stone-300">({parcel.dagNoBn})</span>
              </h2>
              <p className="text-xs text-stone-400">
                Khatian #{parcel.khatianNo} • Mouza {parcel.mouzaNameEn} (JL #{parcel.jlNo}), {parcel.upazila}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-800">
          {/* Section: Original vs Normalized Comparison (Sec 6E Mandatory) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Attribute Separation: Original Ledger Values vs Normalized System Values
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original Source Attributes */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
                <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Original Survey Ledger Entry (As Recorded)</span>
                </div>
                <div className="space-y-1 text-[11px] text-stone-700">
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span>Recorded Dag (দাগ নং):</span>
                    <strong className="font-mono">{parcel.dagNo} ({parcel.dagNoBn})</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span>Recorded Khatian (খতিয়ান নং):</span>
                    <strong className="font-mono">#{parcel.khatianNo} ({parcel.khatianNoBn})</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span>Recorded Area & Unit:</span>
                    <strong className="font-mono">{parcel.recordedArea} {parcel.recordedUnit} ({parcel.recordedAreaBn})</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Cadastral Sheet Reference:</span>
                    <strong className="font-mono">Sheet #{parcel.sheetNo}</strong>
                  </div>
                </div>
              </div>

              {/* Normalized Standardized Attributes */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Normalized & Standardized System Values</span>
                </div>
                <div className="space-y-1 text-[11px] text-stone-700">
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span>Normalized Decimal (শতক):</span>
                    <strong className="font-mono text-emerald-800 font-bold">{parcel.normalizedAreaDecimal.toFixed(4)} decimal</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span>Converted Square Meters:</span>
                    <strong className="font-mono">{parcel.normalizedAreaSqm.toFixed(1)} m²</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span>Calculated Square Feet:</span>
                    <strong className="font-mono">{((parcel.normalizedAreaSqm * 10.7639)).toFixed(0)} sq ft</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Bengal Bigha Equivalent:</span>
                    <strong className="font-mono">{(parcel.normalizedAreaDecimal / 33).toFixed(2)} Bigha ({(parcel.normalizedAreaDecimal / 1.65).toFixed(1)} Katha)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Archival Citation & Record Room Origin */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Official Archive Registry Citation
            </span>
            <div className="text-stone-800 font-medium leading-relaxed">
              {parcel.sourceReference}
            </div>
            {parcel.remarks && (
              <div className="mt-2 text-stone-600 bg-white p-2.5 rounded-lg border border-stone-200 text-[11px] leading-relaxed">
                <strong>Recorded Note:</strong> {parcel.remarks}
              </div>
            )}
          </div>

          {/* Data Quality & Missing Attribute Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Data Quality & Archival Integrity Indicators
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                parcel.dataQuality.isGeometryAvailable 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {parcel.dataQuality.isGeometryAvailable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{parcel.dataQuality.isGeometryAvailable ? 'Vector Map Digitized' : 'Map Vector Missing'}</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                parcel.dataQuality.isCrossReferencePresent 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-stone-50 border-stone-200 text-stone-600'
              }`}>
                {parcel.dataQuality.isCrossReferencePresent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-stone-400 shrink-0" />
                )}
                <span>{parcel.dataQuality.isCrossReferencePresent ? 'Ledger Cross-Ref Found' : 'No Cross-Reference'}</span>
              </div>

              <div className="p-2.5 rounded-lg border bg-stone-50 border-stone-200 text-stone-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quality Score: {parcel.dataQuality.qualityScore}%</span>
              </div>
            </div>
          </div>

          {/* Candidate Cross-Survey Relationships */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Plausible Historical Relationships ({relatedLinks.length})
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onTraceLineage(parcel);
                }}
                className="text-emerald-700 hover:underline font-semibold flex items-center gap-1 text-[11px]"
              >
                <span>Open in Lineage Graph</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {relatedLinks.length > 0 ? (
              <div className="space-y-2">
                {relatedLinks.map((rel) => {
                  const otherId = rel.sourceParcelId === parcel.id ? rel.targetParcelId : rel.sourceParcelId;
                  const otherParcel = allParcels.find((p) => p.id === otherId);

                  return (
                    <div key={rel.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">
                            {otherParcel?.surveyType} Dag #{otherParcel?.dagNo} ({otherParcel?.normalizedAreaDecimal.toFixed(1)} dec)
                          </span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
                            {rel.relationshipType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-1">
                          {rel.summary}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-200 shrink-0">
                        {rel.score}% Match
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-500 text-center italic">
                No reliable historical linkages cataloged for this record.
              </div>
            )}
          </div>

          {/* Legal Disclaimer Box */}
          <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Disclaimer: BhumiSutra does not establish legal ownership or replace certified land mutation deeds.
            </span>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => {
                onClose();
                onCompareParcel(parcel);
              }}
              className="px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition"
            >
              Side-by-Side Compare
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenReviewModal(parcel);
              }}
              className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Submit Review</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onGenerateReport(parcel);
              }}
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Evidence Report Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
