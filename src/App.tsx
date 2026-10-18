import React, { useState, useEffect } from 'react';
import { 
  ParcelRecord, 
  ParcelRelationship, 
  ReviewCase, 
  AuditEvent, 
  DashboardMetrics,
  ReviewStatus 
} from './types';
import { storage } from './services/storage';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LocationExplorer } from './components/LocationExplorer';
import { ParcelSearch } from './components/ParcelSearch';
import { LineageGraphView } from './components/LineageGraphView';
import { RecordComparisonView } from './components/RecordComparisonView';
import { EvidenceReportView } from './components/EvidenceReportView';
import { ReviewQueueView } from './components/ReviewQueueView';
import { DocumentationView } from './components/DocumentationView';
import { ParcelDetailModal } from './components/ParcelDetailModal';
import { HumanReviewModal } from './components/HumanReviewModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  // Live storage state
  const [parcels, setParcels] = useState<ParcelRecord[]>([]);
  const [relationships, setRelationships] = useState<ParcelRelationship[]>([]);
  const [reviews, setReviews] = useState<ReviewCase[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalParcels: 0,
    bySurveyType: { CS: 0, SA: 0, RS: 0, BS: 0 },
    totalRelationships: 0,
    subdivisionCount: 0,
    consolidationCount: 0,
    continuityCount: 0,
    discrepancyCount: 0,
    pendingReviewCount: 0,
    reviewedCount: 0,
  });

  // Modal & focus states
  const [selectedParcel, setSelectedParcel] = useState<ParcelRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [reviewTargetParcel, setReviewTargetParcel] = useState<ParcelRecord | null>(null);
  const [reviewTargetRel, setReviewTargetRel] = useState<ParcelRelationship | undefined>(undefined);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  const [comparisonParcels, setComparisonParcels] = useState<ParcelRecord[]>([]);
  const [reportParcel, setReportParcel] = useState<ParcelRecord | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshState = () => {
    const allP = storage.getAllParcels();
    const allR = storage.getAllRelationships();
    const allRev = storage.getReviews();
    const allAud = storage.getAuditEvents();
    const m = storage.getDashboardMetrics();

    setParcels(allP);
    setRelationships(allR);
    setReviews(allRev);
    setAuditEvents(allAud);
    setMetrics(m);
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleResetData = () => {
    storage.resetToDefaultSeed();
    refreshState();
    showToast('Database reset to initial demonstration seed.');
  };

  // Curated Historical Lineage Scenarios
  const handleLaunchDemoScenario = (scenarioId: string) => {
    if (scenarioId === 'subdivision-golden') {
      const p = parcels.find((item) => item.id === 'CS-BD38-104') || parcels[0];
      setSelectedParcel(p);
      setActiveTab('lineage');
      showToast('Opened Scenario 1: Multi-Gen Subdivision (CS 104 → RS 410 & 411).');
    } else if (scenarioId === 'consolidation-amalgamation') {
      const p = parcels.find((item) => item.id === 'SA-BD38-250') || parcels[0];
      setSelectedParcel(p);
      setActiveTab('lineage');
      showToast('Opened Scenario 2: Consolidation (CS 108 & 109 amalgamated into SA 250).');
    } else if (scenarioId === 'area-discrepancy') {
      const sa = parcels.find((item) => item.id === 'SA-BD38-340');
      const rs = parcels.find((item) => item.id === 'RS-BD38-720');
      if (sa && rs) {
        setComparisonParcels([sa, rs]);
      }
      setActiveTab('compare');
      showToast('Opened Scenario 3: 12-Decimal Missing Land Discrepancy analysis.');
    } else if (scenarioId === 'missing-geometry') {
      const p = parcels.find((item) => item.id === 'CS-TJ12-050');
      if (p) setSelectedParcel(p);
      setActiveTab('lineage');
      showToast('Opened Scenario 4: Damaged Cadastral Sheet (Tejgaon CS 50).');
    } else if (scenarioId === 'batta-subdag') {
      const p = parcels.find((item) => item.id === 'RS-SV45-290/1');
      if (p) setSelectedParcel(p);
      setActiveTab('lineage');
      showToast('Opened Scenario 5: Fractional Batta Dag (সাভার ২৯০/১).');
    } else if (scenarioId === 'isolated-parcel') {
      const p = parcels.find((item) => item.id === 'CS-BD38-199');
      if (p) setSelectedParcel(p);
      setActiveTab('lineage');
      showToast('Opened Scenario 6: Diluvion / Lost riverbed plot (CS 199).');
    }
  };

  const handleOpenDetailModal = (parcel: ParcelRecord) => {
    setSelectedParcel(parcel);
    setIsDetailModalOpen(true);
  };

  const handleTraceLineage = (parcel: ParcelRecord) => {
    setSelectedParcel(parcel);
    setActiveTab('lineage');
  };

  const handleCompareParcel = (parcel: ParcelRecord) => {
    setComparisonParcels((prev) => {
      if (prev.some((p) => p.id === parcel.id)) return prev;
      return [...prev.slice(-1), parcel]; // keep up to 2 or 3
    });
    setActiveTab('compare');
    showToast(`Added Dag #${parcel.dagNo} to comparison.`);
  };

  const handleOpenReviewModal = (parcel: ParcelRecord, relationship?: ParcelRelationship) => {
    setReviewTargetParcel(parcel);
    setReviewTargetRel(relationship);
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = (reviewData: {
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
  }) => {
    storage.saveReview(reviewData);
    refreshState();
    showToast(`Review decision [${reviewData.status.toUpperCase()}] saved for ${reviewData.parcelId}`);
  };

  const handleGenerateReport = (parcel: ParcelRecord) => {
    setReportParcel(parcel);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        language={language}
        setLanguage={setLanguage}
        pendingReviewCount={metrics.pendingReviewCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            recentParcels={parcels}
            auditEvents={auditEvents}
            onSelectParcel={handleOpenDetailModal}
            onNavigateTab={setActiveTab}
            onLaunchDemoScenario={handleLaunchDemoScenario}
            language={language}
          />
        )}

        {activeTab === 'locations' && (
          <LocationExplorer
            locations={storage.getLocations()}
            allParcels={parcels}
            onSelectParcel={handleOpenDetailModal}
            onTraceLineage={handleTraceLineage}
            language={language}
          />
        )}

        {activeTab === 'search' && (
          <ParcelSearch
            allParcels={parcels}
            onSelectParcel={handleOpenDetailModal}
            onTraceLineage={handleTraceLineage}
            onCompareParcel={handleCompareParcel}
            language={language}
          />
        )}

        {activeTab === 'lineage' && (
          <LineageGraphView
            parcels={parcels}
            relationships={relationships}
            selectedParcel={selectedParcel}
            onSelectParcel={(p) => setSelectedParcel(p)}
            onOpenReviewModal={handleOpenReviewModal}
            onGenerateReport={handleGenerateReport}
            onCompareRecords={(records) => {
              setComparisonParcels(records);
              setActiveTab('compare');
            }}
            language={language}
          />
        )}

        {activeTab === 'compare' && (
          <RecordComparisonView
            parcels={comparisonParcels.length >= 2 ? comparisonParcels : parcels.slice(0, 2)}
            allParcels={parcels}
            onOpenReviewModal={(p) => handleOpenReviewModal(p)}
            onGenerateReport={handleGenerateReport}
            language={language}
          />
        )}

        {activeTab === 'reports' && (
          <EvidenceReportView
            parcel={reportParcel || parcels[0] || ({} as ParcelRecord)}
            lineageRelationships={storage.getRelationshipsForParcel(
              (reportParcel || parcels[0])?.id || ''
            )}
            allParcels={parcels}
            reviewCase={storage.getReviewForParcel((reportParcel || parcels[0])?.id || '')}
            onBack={() => setActiveTab('lineage')}
            onOpenReviewModal={() => {
              if (reportParcel || parcels[0]) {
                handleOpenReviewModal(reportParcel || parcels[0]);
              }
            }}
            onChangeParcel={(p) => setReportParcel(p)}
            language={language}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewQueueView
            parcels={parcels}
            reviews={reviews}
            onSelectParcel={handleOpenDetailModal}
            onOpenReviewModal={(p) => handleOpenReviewModal(p)}
            onGenerateReport={handleGenerateReport}
            language={language}
          />
        )}

        {activeTab === 'docs' && (
          <DocumentationView language={language} />
        )}
      </main>

      {/* Parcel Detail Inspector Modal */}
      {selectedParcel && (
        <ParcelDetailModal
          parcel={selectedParcel}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          relationships={relationships}
          allParcels={parcels}
          onTraceLineage={handleTraceLineage}
          onCompareParcel={handleCompareParcel}
          onOpenReviewModal={(p) => handleOpenReviewModal(p)}
          onGenerateReport={handleGenerateReport}
          language={language}
        />
      )}

      {/* Human Review Modal */}
      {reviewTargetParcel && (
        <HumanReviewModal
          parcel={reviewTargetParcel}
          relationship={reviewTargetRel}
          existingReview={storage.getReviewForParcel(reviewTargetParcel.id)}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSaveReview={handleSaveReview}
          language={language}
        />
      )}

      {/* Civic Tech Footer */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 text-xs py-8 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
              ভূ
            </div>
            <div>
              <span className="font-bold text-white">BhumiSutra (ভূমিসূত্র)</span> • Bangladesh Historical Land Record Lineage Platform
              <p className="text-[11px] text-stone-500">
                Digital Land Records Verification, Cross-Survey Correlation & Cadastral Archiving
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-stone-400">
            <div>Informational Decision Support Prototype • Synthetic Demonstration Dataset</div>
            <div className="text-stone-500">Does not certify ownership or replace certified land survey authorities.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
