import React, { useState } from 'react';
import { 
  ParcelRecord, 
  ParcelRelationship, 
  ReviewCase, 
  ReviewStatus 
} from '../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  FileCheck2,
  FileText
} from 'lucide-react';

interface HumanReviewModalProps {
  parcel: ParcelRecord;
  relationship?: ParcelRelationship;
  existingReview?: ReviewCase;
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (reviewData: {
    parcelId: string;
    relationshipId?: string;
    status: ReviewStatus;
    reviewerName: string;
    reviewerRole: string;
    notes: string;
    evidenceChecks: {
      fieldInspectionNeeded: boolean;
      volumePageVerificationNeeded: boolean;
      cadastralSheetSuperimpositionNeeded: boolean;
      khatianShareValidationNeeded: boolean;
    };
  }) => void;
  language: 'en' | 'bn';
}

export const HumanReviewModal: React.FC<HumanReviewModalProps> = ({
  parcel,
  relationship,
  existingReview,
  isOpen,
  onClose,
  onSaveReview,
  language,
}) => {
  if (!isOpen) return null;

  const [status, setStatus] = useState<ReviewStatus>(existingReview?.status || 'supported');
  const [reviewerName, setReviewerName] = useState<string>(existingReview?.reviewerName || 'Kazi M. Rahman');
  const [reviewerRole, setReviewerRole] = useState<string>(
    existingReview?.reviewerRole || 'Assistant Settlement Officer (ASO)'
  );
  const [notes, setNotes] = useState<string>(
    existingReview?.notes ||
      'Verified continuous tenancy records and cross-referenced with Collectorate volume register. Lineage hypothesis verified.'
  );

  const [fieldInspection, setFieldInspection] = useState<boolean>(
    existingReview?.evidenceChecks.fieldInspectionNeeded ?? false
  );
  const [volumePage, setVolumePage] = useState<boolean>(
    existingReview?.evidenceChecks.volumePageVerificationNeeded ?? true
  );
  const [cadastralSheet, setCadastralSheet] = useState<boolean>(
    existingReview?.evidenceChecks.cadastralSheetSuperimpositionNeeded ?? true
  );
  const [khatianShare, setKhatianShare] = useState<boolean>(
    existingReview?.evidenceChecks.khatianShareValidationNeeded ?? true
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setValidationError('Please provide a substantive review note explaining the basis for the decision.');
      return;
    }
    setValidationError(null);

    onSaveReview({
      parcelId: parcel.id,
      relationshipId: relationship?.id,
      status,
      reviewerName,
      reviewerRole,
      notes,
      evidenceChecks: {
        fieldInspectionNeeded: fieldInspection,
        volumePageVerificationNeeded: volumePage,
        cadastralSheetSuperimpositionNeeded: cadastralSheet,
        khatianShareValidationNeeded: khatianShare,
      },
    });

    onClose();
  };

  const presetRoles = [
    'Assistant Settlement Officer (ASO)',
    'Kanungo (General Land Record Inquest)',
    'Cadastral Legal Researcher & Advocate',
    'District Record Room Archivist',
    'Citizen Land Rights Researcher',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Record Human Review Assessment
              </h2>
              <p className="text-xs text-stone-400">
                Evaluating {parcel.surveyType} Dag #{parcel.dagNo} (ID: {parcel.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Target Parcel & Relationship Context */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Target Inquest</span>
              <div className="font-bold text-stone-900 text-sm">
                {parcel.surveyType} Dag #{parcel.dagNo} ({parcel.normalizedAreaDecimal.toFixed(2)} dec)
              </div>
              <div className="text-stone-500 text-[11px]">
                Mouza {parcel.mouzaNameEn} (JL #{parcel.jlNo}), Upazila: {parcel.upazila}
              </div>
            </div>

            {relationship && (
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Proposed Link</span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {relationship.confidenceLabel} ({relationship.score}%)
                </span>
              </div>
            )}
          </div>

          {/* Review Decision Status */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">
              Review Decision (সিদ্ধান্ত নির্বাচন করুন)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('supported')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${
                  status === 'supported'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Supported by Reviewer</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('needs_additional_evidence')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${
                  status === 'needs_additional_evidence'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Needs Evidence</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('under_review')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${
                  status === 'under_review'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Under Inquest</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${
                  status === 'rejected'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Rejected / False Match</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('unresolved')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${
                  status === 'unresolved'
                    ? 'bg-stone-100 border-stone-400 text-stone-900 ring-1 ring-stone-400'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-stone-500 shrink-0" />
                <span>Unresolved / Disputed</span>
              </button>
            </div>
          </div>

          {/* Reviewer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Reviewer Full Name (পর্যালোচকের নাম)
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Designation / Capacity (পদবি)
              </label>
              <select
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {presetRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Verification Protocol Checkboxes */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
              Archival Verification Checklist (প্রামাণ্য যাচাইকরণ তালিকা)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={volumePage}
                  onChange={(e) => setVolumePage(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-stone-700">Record Room Volume & Page Verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cadastralSheet}
                  onChange={(e) => setCadastralSheet(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-stone-700">Cadastral Sheet Superimposition Checked</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={khatianShare}
                  onChange={(e) => setKhatianShare(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-stone-700">Co-sharer Khatian Shares Reconciled</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fieldInspection}
                  onChange={(e) => setFieldInspection(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-stone-700">Terrestrial Field Inspection Required</span>
              </label>
            </div>
          </div>

          {/* Review Notes & Rationale */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-stone-700">
                Investigative Findings & Rationale (পর্যালোচনার ভিত্তি ও মন্তব্য)
              </label>
              {validationError && (
                <span className="text-[11px] font-semibold text-rose-600 animate-pulse">
                  {validationError}
                </span>
              )}
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="State the archival evidence, cross-reference ledgers, or field discrepancy rationale that informed this review decision..."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              required
            />
          </div>

          {/* Important Principle Note */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
            System Integrity Policy: This human review decision is recorded as an independent evidentiary layer. It does not overwrite or mutate original historical survey ledgers.
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Sign Review Decision</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
