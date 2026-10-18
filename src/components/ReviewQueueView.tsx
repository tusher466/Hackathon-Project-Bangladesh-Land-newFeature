import React, { useState } from 'react';
import { ParcelRecord, ReviewCase, ReviewStatus } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Filter, 
  Search, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface ReviewQueueViewProps {
  parcels: ParcelRecord[];
  reviews: ReviewCase[];
  onSelectParcel: (parcel: ParcelRecord) => void;
  onOpenReviewModal: (parcel: ParcelRecord) => void;
  onGenerateReport: (parcel: ParcelRecord) => void;
  language: 'en' | 'bn';
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  parcels,
  reviews,
  onSelectParcel,
  onOpenReviewModal,
  onGenerateReport,
  language,
}) => {
  const isBn = language === 'bn';
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Combine parcels with their review status
  const queueItems = parcels.map((parcel) => {
    const review = reviews.find((r) => r.parcelId === parcel.id);
    return {
      parcel,
      review,
      status: review ? review.status : ('not_reviewed' as ReviewStatus),
    };
  });

  const filteredItems = queueItems.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDag = item.parcel.dagNo.includes(term) || item.parcel.dagNoBn.includes(term);
      const matchMouza = item.parcel.mouzaNameEn.toLowerCase().includes(term);
      const matchReviewer = item.review?.reviewerName.toLowerCase().includes(term);
      if (!matchDag && !matchMouza && !matchReviewer) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Settlement Officer Verification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            {isBn ? 'মানবীয় পর্যালোচনা ও সত্যায়ন কার্যতালিকা' : 'Human Review & Verification Queue'}
          </h1>
          <p className="text-xs text-stone-500">
            Track, examine, and sign formal review determinations across all cadastral inquests
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-semibold text-stone-800"
          >
            <option value="ALL">All Review Statuses ({parcels.length})</option>
            <option value="supported">Supported by Reviewer</option>
            <option value="needs_additional_evidence">Needs Additional Evidence</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
            <option value="not_reviewed">Pending Review (Not Reviewed)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search by Dag #, Mouza, or Reviewer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
          </div>
          <span className="text-xs text-stone-500 font-mono">
            Showing {filteredItems.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Parcel Details</th>
                <th className="py-3 px-4">Mouza & Area</th>
                <th className="py-3 px-4">Reviewer & Capacity</th>
                <th className="py-3 px-4">Findings Summary</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map(({ parcel, review, status }) => (
                <tr key={parcel.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      status === 'supported' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'needs_additional_evidence' ? 'bg-amber-100 text-amber-800' :
                      status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {status === 'supported' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {status === 'needs_additional_evidence' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {status === 'under_review' && <Clock className="w-3 h-3 text-blue-600" />}
                      {status === 'rejected' && <X className="w-3 h-3 text-rose-600" />}
                      <span>{status.toUpperCase().replace(/_/g, ' ')}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-stone-900">
                      {parcel.surveyType} Dag #{parcel.dagNo} <span className="text-stone-400 font-serif font-normal">({parcel.dagNoBn})</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      Kh #{parcel.khatianNo} • ID: {parcel.id}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-stone-700">
                    <div>{parcel.mouzaNameEn} (JL {parcel.jlNo})</div>
                    <div className="font-mono text-emerald-700 font-semibold text-[11px]">
                      {parcel.normalizedAreaDecimal.toFixed(2)} dec
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {review ? (
                      <div>
                        <div className="font-semibold text-stone-900">{review.reviewerName}</div>
                        <div className="text-[10px] text-stone-500">{review.reviewerRole}</div>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="py-3 px-4 max-w-xs text-stone-600 truncate">
                    {review ? (
                      <span title={review.notes}>{review.notes}</span>
                    ) : (
                      <span className="text-stone-400 italic">No notes recorded yet</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenReviewModal(parcel)}
                        className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition"
                      >
                        {review ? 'Edit Review' : 'Review Now'}
                      </button>
                      <button
                        onClick={() => onGenerateReport(parcel)}
                        title="Generate Report Dossier"
                        className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
