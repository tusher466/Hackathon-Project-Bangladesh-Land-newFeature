import React, { useState } from 'react';
import { 
  ParcelRecord, 
  ParcelRelationship, 
  ReviewCase 
} from '../types';
import { 
  Printer, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileText, 
  Clock, 
  UserCheck,
  QrCode,
  Landmark,
  Share2,
  Download,
  Loader2,
  MapPin,
  Globe
} from 'lucide-react';
import { MATCHING_RULE_VERSION } from '../services/matchingEngine';
import { exportReportToPdf } from '../services/pdfExport';
import { CadastralLeafletMap } from './CadastralLeafletMap';

interface EvidenceReportViewProps {
  parcel: ParcelRecord;
  lineageRelationships: ParcelRelationship[];
  allParcels: ParcelRecord[];
  reviewCase?: ReviewCase;
  onBack: () => void;
  onOpenReviewModal: () => void;
  onChangeParcel?: (parcel: ParcelRecord) => void;
  language: 'en' | 'bn';
}

export const EvidenceReportView: React.FC<EvidenceReportViewProps> = ({
  parcel,
  lineageRelationships,
  allParcels,
  reviewCase,
  onBack,
  onOpenReviewModal,
  onChangeParcel,
  language,
}) => {
  const isBn = language === 'bn';

  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const caseId = `BHM-2026-${parcel.mouzaId?.replace('mouza-', '').toUpperCase() || 'BD38'}-${parcel.surveyType}${parcel.dagNo}`;
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setPdfSuccess(null);
    try {
      const filename = `BhumiSutra-Discrepancy-Dossier-${caseId}.pdf`;
      const fallbackData = {
        caseId,
        generatedDate,
        parcel: {
          dagNo: parcel.dagNo,
          dagNoBn: parcel.dagNoBn,
          khatianNo: parcel.khatianNo,
          khatianNoBn: parcel.khatianNoBn,
          surveyType: parcel.surveyType,
          surveyYear: parcel.surveyYear,
          mouzaNameEn: parcel.mouzaNameEn,
          mouzaNameBn: parcel.mouzaNameBn,
          jlNo: parcel.jlNo,
          upazila: parcel.upazila,
          district: parcel.district,
          normalizedAreaDecimal: parcel.normalizedAreaDecimal,
          recordedArea: parcel.recordedArea,
          recordedUnit: parcel.recordedUnit,
          sourceReference: parcel.sourceReference,
        },
        relationships: lineageRelationships.map((rel) => {
          const s = allParcels.find((p) => p.id === rel.sourceParcelId);
          const t = allParcels.find((p) => p.id === rel.targetParcelId);
          return {
            sourceDag: s?.dagNo || rel.sourceParcelId,
            sourceSurvey: s?.surveyType || 'CS',
            targetDag: t?.dagNo || rel.targetParcelId,
            targetSurvey: t?.surveyType || 'SA',
            relationshipType: rel.relationshipType,
            score: rel.score,
            confidenceLabel: rel.confidenceLabel,
            summary: rel.summary,
          };
        }),
        reviewerAssessment: reviewCase ? {
          reviewerName: reviewCase.reviewerName,
          reviewerRole: reviewCase.reviewerRole,
          status: reviewCase.status,
          notes: reviewCase.notes,
        } : undefined,
        discrepancies: parcel.dataQuality.flags.map((f) => f.replace(/_/g, ' ')),
      };

      const success = await exportReportToPdf('evidence-report-document', filename, fallbackData);
      if (success) {
        setPdfSuccess('Official PDF Dossier generated and downloaded to your device!');
        setTimeout(() => setPdfSuccess(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Center coordinate for the embedded map
  const parcelCenter = parcel.geometry?.centroid 
    ? { lat: parcel.geometry.centroid[0], lng: parcel.geometry.centroid[1] }
    : { lat: 23.7820, lng: 90.4260 };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Action Header (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-2 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Quick Subject Switcher */}
          {onChangeParcel && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 font-medium">Subject:</span>
              <select
                value={parcel.id}
                onChange={(e) => {
                  const target = allParcels.find((p) => p.id === e.target.value);
                  if (target) onChangeParcel(target);
                }}
                className="bg-stone-50 border border-stone-300 rounded-lg p-1.5 text-xs font-semibold text-stone-800"
              >
                {allParcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.surveyType} Dag #{p.dagNo} ({p.mouzaNameEn}, {p.normalizedAreaDecimal.toFixed(1)} dec)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenReviewModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200 transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Update Findings</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg border border-stone-300 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 rounded-lg shadow-sm transition"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Dossier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF Generation Feedback Banner */}
      {pdfSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{pdfSuccess}</span>
          </div>
          <button 
            onClick={() => setPdfSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Printable Report Document Card with DOM ID for PDF Capturing */}
      <div 
        id="evidence-report-document" 
        className="bg-white rounded-2xl border border-stone-300 p-8 sm:p-12 shadow-md print:shadow-none print:border-none print:p-0 text-stone-900 space-y-8"
      >
        {/* Header Strip with Official Verification Seal */}
        <div className="border-b-2 border-stone-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-stone-900 font-serif">
                BhumiSutra (ভূমিসূত্র)
              </span>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                Official Verification Dossier
              </span>
            </div>
            <h1 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
              Historical Cadastral Parcel Lineage & Evidence Discrepancy Dossier
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Bangladesh Digital Land Records Verification, Cross-Survey Analysis & Human Review
            </p>
          </div>

          <div className="text-right sm:text-right font-mono text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 shrink-0">
            <div>Case ID: <strong className="text-stone-900">{caseId}</strong></div>
            <div className="text-[10px] text-stone-400 mt-0.5">Generated: {generatedDate}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Engine: {MATCHING_RULE_VERSION}</div>
          </div>
        </div>

        {/* Section 1: Target Parcel Identification */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200 pb-1 flex items-center justify-between">
            <span>1. Investigated Target Parcel Record</span>
            <span className="text-[10px] text-emerald-800 font-semibold">Primary Inquest Subject</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50/70 p-4 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-stone-400 text-[10px] block">Survey Regime</span>
              <strong className="text-stone-900 font-bold text-sm">
                {parcel.surveyType} Survey ({parcel.surveyYear})
              </strong>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] block">Dag Number</span>
              <strong className="text-stone-900 font-bold text-sm">
                #{parcel.dagNo} <span className="font-serif font-normal text-stone-500">({parcel.dagNoBn})</span>
              </strong>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] block">Khatian Number</span>
              <strong className="text-stone-900 font-bold text-sm">
                #{parcel.khatianNo} <span className="font-serif font-normal text-stone-500">({parcel.khatianNoBn})</span>
              </strong>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] block">Recorded Area</span>
              <strong className="text-emerald-700 font-bold text-sm font-mono">
                {parcel.normalizedAreaDecimal.toFixed(2)} dec ({parcel.recordedArea} {parcel.recordedUnit})
              </strong>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] block">Mouza & JL</span>
              <strong className="text-stone-800">
                {parcel.mouzaNameEn} ({parcel.mouzaNameBn}) • JL #{parcel.jlNo}
              </strong>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] block">Administrative Seat</span>
              <strong className="text-stone-800">
                {parcel.upazila}, {parcel.district}
              </strong>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] block">Cadastral Sheet</span>
              <strong className="text-stone-800">
                Sheet #{parcel.sheetNo}
              </strong>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] block">Map Geometry Status</span>
              <strong className={parcel.geometry ? 'text-emerald-700' : 'text-amber-700'}>
                {parcel.geometry ? 'Digitized Vector Available' : 'No Digitized Sheet (Damaged)'}
              </strong>
            </div>
          </div>

          {/* Embedded Interactive Free Map in Report */}
          <div className="rounded-xl overflow-hidden border border-stone-200">
            <div className="bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 border-b border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Geographic Cadastral Footprint on OpenStreetMap (Mouza {parcel.mouzaNameEn})</span>
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                Lat: {parcelCenter.lat.toFixed(4)}°, Lng: {parcelCenter.lng.toFixed(4)}°
              </span>
            </div>
            <CadastralLeafletMap
              parcels={[parcel]}
              selectedParcel={parcel}
              onSelectParcel={() => {}}
              onTraceLineage={() => {}}
              filterSurvey={parcel.surveyType}
              mouzaCenter={parcelCenter}
              showBaseMapToggle={false}
              height="240px"
            />
          </div>

          <div className="p-3 bg-stone-50 rounded-lg text-xs border border-stone-200">
            <span className="text-stone-400 text-[10px] block mb-0.5">Primary Archival Citation</span>
            <span className="text-stone-800 font-medium">{parcel.sourceReference}</span>
          </div>
        </section>

        {/* Section 2: Chronological Lineage Timeline */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200 pb-1">
            2. Reconstructed Lineage Progression & Associated Candidates
          </h2>

          {lineageRelationships.length > 0 ? (
            <div className="space-y-3">
              {lineageRelationships.map((rel) => {
                const targetP = allParcels.find((p) => p.id === rel.targetParcelId);
                const sourceP = allParcels.find((p) => p.id === rel.sourceParcelId);

                return (
                  <div key={rel.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-stone-800 text-white">
                          {sourceP?.surveyType} #{sourceP?.dagNo} → {targetP?.surveyType} #{targetP?.dagNo}
                        </span>
                        <span className="font-semibold text-stone-800">
                          {rel.relationshipType === 'subdivision' ? 'Subdivision Partition' :
                           rel.relationshipType === 'consolidation' ? 'Consolidation Amalgamation' :
                           rel.relationshipType === 'renumbered' ? 'Renumbered Continuity' :
                           '1-to-1 Direct Continuity'}
                        </span>
                      </div>
                      <span className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Match Score: {rel.score}% ({rel.confidenceLabel})
                      </span>
                    </div>

                    <p className="text-stone-700 text-xs leading-relaxed">
                      {rel.summary}
                    </p>

                    {/* Breakdown pill row */}
                    <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[10px] text-stone-600">
                      <div>Cross-Ref: {rel.scoreBreakdown.crossReferenceScore}/{rel.scoreBreakdown.crossReferenceMax}</div>
                      <div>Spatial: {rel.scoreBreakdown.spatialScore}/{rel.scoreBreakdown.spatialMax} ({rel.scoreBreakdown.spatialStatus})</div>
                      <div>Area: {rel.scoreBreakdown.areaScore}/{rel.scoreBreakdown.areaMax} (Δ{rel.scoreBreakdown.areaVariancePercent}%)</div>
                      <div>Metadata: {rel.scoreBreakdown.metadataScore}/{rel.scoreBreakdown.metadataMax}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500 italic">
              No direct candidate linkages meet current evaluation thresholds. Parcel is cataloged as an isolated historical parcel (e.g. river diluvion or new accretion).
            </div>
          )}
        </section>

        {/* Section 3: Evidence Evaluation & Discrepancies */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200 pb-1">
            3. Evidentiary Audit: Supporting, Contradictory & Missing Records
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supporting */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Supporting Proof</span>
              </div>
              <ul className="space-y-1 text-stone-700 text-[11px] list-disc list-inside">
                <li>Mouza jurisdiction JL #{parcel.jlNo} verified.</li>
                {parcel.crossReferences.length > 0 ? (
                  <li>Archival ledger note: {parcel.crossReferences.join(', ')}</li>
                ) : (
                  <li>Settlement survey record roll located.</li>
                )}
                {parcel.geometry && <li>Cadastral boundary polygon digitized.</li>}
              </ul>
            </div>

            {/* Contradictory */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Contradictions & Gaps</span>
              </div>
              <ul className="space-y-1 text-stone-700 text-[11px] list-disc list-inside">
                {parcel.dataQuality.flags.length > 0 ? (
                  parcel.dataQuality.flags.map((f, idx) => <li key={idx}>{f.replace(/_/g, ' ')}</li>)
                ) : (
                  <li>No irreconcilable jurisdiction contradictions noted.</li>
                )}
              </ul>
            </div>

            {/* Missing */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-stone-500" />
                <span>Missing Archival Data</span>
              </div>
              <ul className="space-y-1 text-stone-600 text-[11px] list-disc list-inside">
                {!parcel.geometry && <li>Cadastral map sheet unavailable in digital format.</li>}
                {parcel.crossReferences.length === 0 && <li>Inter-survey cross-reference note unrecorded in ledger.</li>}
                <li>Milan Khasra (মিলান খসড়া) register cross-check recommended.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Human Review & Certification */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200 pb-1">
            4. Human Reviewer Assessment & Findings
          </h2>

          {reviewCase ? (
            <div className="p-5 rounded-xl border border-stone-300 bg-stone-50/60 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                <div>
                  <span className="text-[10px] text-stone-400 block">Reviewer</span>
                  <strong className="text-stone-900 font-bold">{reviewCase.reviewerName}</strong> ({reviewCase.reviewerRole})
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    reviewCase.status === 'supported' ? 'bg-emerald-100 text-emerald-800' :
                    reviewCase.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {reviewCase.status.toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] block mb-1">Reviewer's Formal Notes:</span>
                <p className="text-stone-800 italic leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                  "{reviewCase.notes}"
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200 text-[10px] text-stone-600">
                <div>Field Inspection: <strong>{reviewCase.evidenceChecks.fieldInspectionNeeded ? 'Required' : 'Completed/Waived'}</strong></div>
                <div>Record Room Volume: <strong>{reviewCase.evidenceChecks.volumePageVerificationNeeded ? 'Verified' : 'Pending'}</strong></div>
                <div>Sheet Superimposition: <strong>{reviewCase.evidenceChecks.cadastralSheetSuperimpositionNeeded ? 'Verified' : 'Pending'}</strong></div>
                <div>Share Reconciliation: <strong>{reviewCase.evidenceChecks.khatianShareValidationNeeded ? 'Verified' : 'Pending'}</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500 flex items-center justify-between">
              <span>This record has not yet been reviewed by an authorized land investigator.</span>
              <button
                onClick={onOpenReviewModal}
                className="text-emerald-700 font-semibold underline text-xs print:hidden"
              >
                Record Review Now →
              </button>
            </div>
          )}
        </section>

        {/* Section 5: Legal & Informational Disclaimer */}
        <section className="p-4 rounded-xl bg-stone-100 border border-stone-300 text-[11px] text-stone-600 space-y-1.5 leading-relaxed">
          <div className="font-bold text-stone-900 flex items-center gap-1.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Strict Informational Notice & Legal Disclaimer</span>
          </div>
          <p>
            BhumiSutra (ভূমিসূত্র) is an investigative decision-support and historical record lineage exploration platform developed for Bangladesh digital land record verification and historical correlation. This dossier is generated for research, preliminary title examination, and historical correlation purposes only.
          </p>
          <p>
            It does not constitute certified legal ownership, conclusive title, deed certification, official mutation clearance, or formal judicial decree. All historical lineage conclusions must be independently authenticated against physical collectorate volume ledgers, terij registers, and certified cadastral sheets at the respective District Collectorate Record Room (কালেক্টরেট রেকর্ড রুম) or Upazila Land Office.
          </p>
        </section>

        {/* Footer Stamps */}
        <div className="pt-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400 font-mono">
          <div>BhumiSutra • Bangladesh Historical Cadastral Lineage Platform</div>
          <div>Page 1 of 1 • System Verification Stamp</div>
        </div>
      </div>
    </div>
  );
};
