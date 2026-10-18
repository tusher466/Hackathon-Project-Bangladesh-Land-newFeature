import {
  ParcelRecord,
  ParcelRelationship,
  ReviewCase,
  AuditEvent,
  DashboardMetrics,
  SearchQuery,
  SurveyType,
  ReviewStatus,
} from '../types';
import { SYNTHETIC_PARCELS, SYNTHETIC_LOCATIONS, LocationHierarchyItem } from '../data/syntheticDataset';
import { evaluateCandidateRelationship, DEFAULT_WEIGHTS } from './matchingEngine';
import { normalizeSearchTerm, normalizeRecordNumber } from './normalizer';

const STORAGE_KEYS = {
  PARCELS: 'bhumisutra_parcels_v1',
  RELATIONSHIPS: 'bhumisutra_relationships_v1',
  REVIEWS: 'bhumisutra_reviews_v1',
  AUDIT_EVENTS: 'bhumisutra_audit_events_v1',
};

class BhumiSutraStorage {
  private parcels: ParcelRecord[] = [];
  private relationships: ParcelRelationship[] = [];
  private reviews: ReviewCase[] = [];
  private auditEvents: AuditEvent[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // Load or seed Parcels
    const storedParcels = this.getLocalStorageItem<ParcelRecord[]>(STORAGE_KEYS.PARCELS);
    if (storedParcels && storedParcels.length > 0) {
      this.parcels = storedParcels;
    } else {
      this.parcels = [...SYNTHETIC_PARCELS];
      this.setLocalStorageItem(STORAGE_KEYS.PARCELS, this.parcels);
    }

    // Load or seed Relationships
    const storedRel = this.getLocalStorageItem<ParcelRelationship[]>(STORAGE_KEYS.RELATIONSHIPS);
    if (storedRel && storedRel.length > 0 && storedRel.length <= 50) {
      this.relationships = storedRel;
    } else {
      this.relationships = this.generateInitialRelationships();
      this.setLocalStorageItem(STORAGE_KEYS.RELATIONSHIPS, this.relationships);
    }

    // Load or seed Reviews
    const storedReviews = this.getLocalStorageItem<ReviewCase[]>(STORAGE_KEYS.REVIEWS);
    if (storedReviews && storedReviews.length > 0) {
      this.reviews = storedReviews;
    } else {
      this.reviews = [
        {
          id: 'REV-001',
          parcelId: 'CS-BD38-104',
          relationshipId: 'REL-CS-BD38-104-TO-SA-BD38-204',
          status: 'supported',
          reviewerName: 'Kazi M. Rahman, Senior Land Settlement Officer',
          reviewerRole: 'Assistant Settlement Officer (ASO)',
          notes: 'Archival collectorate volume register confirms continuous tenancy succession and uninterrupted boundary retention across 1912 CS to 1958 SA survey.',
          updatedAt: '2026-03-14T10:30:00Z',
          createdAt: '2026-03-12T08:15:00Z',
          evidenceChecks: {
            fieldInspectionNeeded: false,
            volumePageVerificationNeeded: true,
            cadastralSheetSuperimpositionNeeded: true,
            khatianShareValidationNeeded: true,
          },
        },
        {
          id: 'REV-002',
          parcelId: 'RS-BD38-720',
          relationshipId: 'REL-SA-BD38-340-TO-RS-BD38-720',
          status: 'needs_additional_evidence',
          reviewerName: 'Suraiya Parveen, Cadastral Legal Analyst',
          reviewerRole: 'Land Legal Researcher',
          notes: 'Discrepancy of 12.00 decimals between SA Dag 340 (60.00 dec) and RS Dag 720 (48.00 dec). Requires requisition of 1978 RS field-carpenters survey ledger and acquisition gazette.',
          updatedAt: '2026-04-02T14:45:00Z',
          createdAt: '2026-04-01T11:20:00Z',
          evidenceChecks: {
            fieldInspectionNeeded: true,
            volumePageVerificationNeeded: true,
            cadastralSheetSuperimpositionNeeded: true,
            khatianShareValidationNeeded: false,
          },
        },
      ];
      this.setLocalStorageItem(STORAGE_KEYS.REVIEWS, this.reviews);
    }

    // Load or seed Audit Events
    const storedAudits = this.getLocalStorageItem<AuditEvent[]>(STORAGE_KEYS.AUDIT_EVENTS);
    if (storedAudits && storedAudits.length > 0) {
      this.auditEvents = storedAudits;
    } else {
      this.auditEvents = [
        {
          id: 'AUD-001',
          timestamp: '2026-04-18T00:01:00Z',
          actor: 'System Bootstrapper',
          action: 'SEED_SYNTHETIC_DATASET',
          entityType: 'System',
          entityId: 'ROOT',
          details: `Hydrated ${this.parcels.length} demonstration cadastral parcel records across CS, SA, RS, and BS tiers.`,
        },
        {
          id: 'AUD-002',
          timestamp: '2026-04-18T00:02:15Z',
          actor: 'Cross-Survey Matching Engine',
          action: 'EVALUATE_INITIAL_GRAPH',
          entityType: 'ParcelRelationship',
          entityId: 'ALL',
          details: `Generated ${this.relationships.length} initial inter-survey relationship hypotheses using rule version ${this.relationships[0]?.matchingRuleVersion || 'v1.4'}.`,
        },
      ];
      this.setLocalStorageItem(STORAGE_KEYS.AUDIT_EVENTS, this.auditEvents);
    }

    this.initialized = true;
  }

  private getLocalStorageItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private setLocalStorageItem<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }

  /**
   * Generates initial plausible relationships by running chronological matching across survey tiers:
   * CS -> SA, SA -> RS, RS -> BS
   */
  private generateInitialRelationships(): ParcelRelationship[] {
    const rels: ParcelRelationship[] = [];
    const surveyOrder: SurveyType[] = ['CS', 'SA', 'RS', 'BS'];

    for (let i = 0; i < surveyOrder.length - 1; i++) {
      const currentTier = surveyOrder[i];
      const nextTier = surveyOrder[i + 1];

      const currentParcels = this.parcels.filter((p) => p.surveyType === currentTier);
      const nextParcels = this.parcels.filter((p) => p.surveyType === nextTier);

      for (const src of currentParcels) {
        for (const target of nextParcels) {
          if (src.mouzaId !== target.mouzaId) continue;
          const normSrcDag = normalizeRecordNumber(src.dagNo);
          const normTgtDag = normalizeRecordNumber(target.dagNo);

          const mentionsSource = (target.crossReferences || []).some((r) =>
            r.toLowerCase().includes(normSrcDag.toLowerCase())
          );
          const mentionsTarget = (src.crossReferences || []).some((r) =>
            r.toLowerCase().includes(normTgtDag.toLowerCase())
          );
          const isSubDag = normTgtDag.startsWith(`${normSrcDag}/`) || 
                           normTgtDag.startsWith(`${normSrcDag}ক`) || 
                           normTgtDag.startsWith(`${normSrcDag}খ`);
          const isSameDag = normSrcDag === normTgtDag;

          const rel = evaluateCandidateRelationship(src, target, DEFAULT_WEIGHTS);
          const hasSpatialOverlap = rel.scoreBreakdown.spatialScore > 10;
          
          // Genuine historical relationship criteria:
          // 1. Explicit textual cross-reference in archival ledger
          // 2. Fractional/Batta sub-dag or preserved dag numbering
          // 3. Significant spatial polygon overlap (IoU)
          // 4. Strong composite confidence (>= 58) with cross-reference backing
          const isGenuine = mentionsSource || 
                            mentionsTarget || 
                            isSubDag || 
                            isSameDag ||
                            hasSpatialOverlap || 
                            (rel.score >= 58 && rel.scoreBreakdown.crossReferenceScore > 0);

          if (isGenuine) {
            rels.push(rel);
          }
        }
      }
    }

    return rels;
  }

  // --- QUERY METHODS ---

  public getAllParcels(): ParcelRecord[] {
    return [...this.parcels];
  }

  public getParcelById(id: string): ParcelRecord | undefined {
    return this.parcels.find((p) => p.id === id);
  }

  public searchParcels(query: SearchQuery): ParcelRecord[] {
    return this.parcels.filter((p) => {
      if (query.surveyType && query.surveyType !== 'ALL' && p.surveyType !== query.surveyType) {
        return false;
      }
      if (query.mouzaId && p.mouzaId !== query.mouzaId) {
        return false;
      }
      if (query.division && p.division.toLowerCase() !== query.division.toLowerCase()) {
        return false;
      }
      if (query.district && p.district.toLowerCase() !== query.district.toLowerCase()) {
        return false;
      }
      if (query.upazila && p.upazila.toLowerCase() !== query.upazila.toLowerCase()) {
        return false;
      }
      if (query.dagNo) {
        const qDag = normalizeRecordNumber(query.dagNo);
        const pDag = normalizeRecordNumber(p.dagNo);
        if (!pDag.includes(qDag)) return false;
      }
      if (query.khatianNo) {
        const qKhatian = normalizeRecordNumber(query.khatianNo);
        const pKhatian = normalizeRecordNumber(p.khatianNo);
        if (!pKhatian.includes(qKhatian)) return false;
      }
      if (query.minArea !== undefined && p.normalizedAreaDecimal < query.minArea) {
        return false;
      }
      if (query.maxArea !== undefined && p.normalizedAreaDecimal > query.maxArea) {
        return false;
      }
      return true;
    });
  }

  public getRelationshipsForParcel(parcelId: string): ParcelRelationship[] {
    return this.relationships.filter(
      (r) => r.sourceParcelId === parcelId || r.targetParcelId === parcelId
    );
  }

  public getAllRelationships(): ParcelRelationship[] {
    return [...this.relationships];
  }

  public runMatchingForParcel(sourceParcelId: string, targetSurvey?: SurveyType): ParcelRelationship[] {
    const source = this.getParcelById(sourceParcelId);
    if (!source) return [];

    const candidates = this.parcels.filter((p) => {
      if (p.id === source.id) return false;
      if (targetSurvey && p.surveyType !== targetSurvey) return false;
      // Match forward in chronological order unless explicitly comparing
      return p.surveyYear >= source.surveyYear;
    });

    const results: ParcelRelationship[] = [];
    for (const cand of candidates) {
      const rel = evaluateCandidateRelationship(source, cand, DEFAULT_WEIGHTS);
      results.push(rel);
      
      // Update in stored relationships if it meets threshold
      const existingIdx = this.relationships.findIndex(
        (r) => r.sourceParcelId === rel.sourceParcelId && r.targetParcelId === rel.targetParcelId
      );
      if (existingIdx >= 0) {
        this.relationships[existingIdx] = rel;
      } else if (rel.score >= 30) {
        this.relationships.push(rel);
      }
    }

    this.setLocalStorageItem(STORAGE_KEYS.RELATIONSHIPS, this.relationships);

    this.addAuditEvent({
      actor: 'Analyst User',
      action: 'RUN_CROSS_SURVEY_MATCHING',
      entityType: 'ParcelRecord',
      entityId: sourceParcelId,
      details: `Executed matching assessment for ${source.surveyType} Dag #${source.dagNo} against ${candidates.length} candidate records.`,
    });

    return results.sort((a, b) => b.score - a.score);
  }

  public getReviews(): ReviewCase[] {
    return [...this.reviews];
  }

  public getReviewForParcel(parcelId: string): ReviewCase | undefined {
    return this.reviews.find((r) => r.parcelId === parcelId);
  }

  public saveReview(review: Omit<ReviewCase, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ReviewCase {
    const now = new Date().toISOString();
    let saved: ReviewCase;

    const existingIdx = this.reviews.findIndex(
      (r) => (review.id && r.id === review.id) || r.parcelId === review.parcelId
    );

    if (existingIdx >= 0) {
      saved = {
        ...this.reviews[existingIdx],
        ...review,
        updatedAt: now,
      };
      this.reviews[existingIdx] = saved;
    } else {
      saved = {
        id: `REV-${Date.now().toString().slice(-4)}`,
        createdAt: now,
        updatedAt: now,
        ...review,
      };
      this.reviews.push(saved);
    }

    this.setLocalStorageItem(STORAGE_KEYS.REVIEWS, this.reviews);

    this.addAuditEvent({
      actor: review.reviewerName || 'Simulated Reviewer',
      action: 'SUBMIT_HUMAN_REVIEW',
      entityType: 'ReviewCase',
      entityId: saved.id,
      details: `Recorded review decision [${saved.status}] for parcel ${saved.parcelId}: "${saved.notes.slice(0, 60)}..."`,
    });

    return saved;
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.auditEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.auditEvents.unshift(fullEvent);
    if (this.auditEvents.length > 100) this.auditEvents.pop();
    this.setLocalStorageItem(STORAGE_KEYS.AUDIT_EVENTS, this.auditEvents);
    return fullEvent;
  }

  public getLocations(): LocationHierarchyItem[] {
    return SYNTHETIC_LOCATIONS;
  }

  /**
   * Calculates dynamic dashboard metrics directly from the live database.
   */
  public getDashboardMetrics(): DashboardMetrics {
    const bySurveyType: Record<SurveyType, number> = {
      CS: 0,
      SA: 0,
      RS: 0,
      BS: 0,
    };

    for (const p of this.parcels) {
      if (bySurveyType[p.surveyType] !== undefined) {
        bySurveyType[p.surveyType]++;
      }
    }

    let subdivisionCount = 0;
    let consolidationCount = 0;
    let continuityCount = 0;
    let discrepancyCount = 0;

    for (const r of this.relationships) {
      if (r.relationshipType === 'subdivision') subdivisionCount++;
      if (r.relationshipType === 'consolidation') consolidationCount++;
      if (r.relationshipType === '1_to_1_continuity') continuityCount++;
      if (r.scoreBreakdown.areaVariancePercent > 10 || r.contradictoryEvidence.length > 0) {
        discrepancyCount++;
      }
    }

    const reviewedParcelIds = new Set(this.reviews.map((rev) => rev.parcelId));
    const reviewedCount = this.reviews.filter((r) => r.status === 'supported' || r.status === 'rejected').length;
    const pendingReviewCount = this.parcels.filter(
      (p) => !reviewedParcelIds.has(p.id) && p.dataQuality.hasMissingAttributes
    ).length;

    return {
      totalParcels: this.parcels.length,
      bySurveyType,
      totalRelationships: this.relationships.length,
      subdivisionCount,
      consolidationCount,
      continuityCount,
      discrepancyCount,
      pendingReviewCount,
      reviewedCount,
    };
  }

  public resetToDefaultSeed() {
    this.parcels = [...SYNTHETIC_PARCELS];
    this.relationships = this.generateInitialRelationships();
    this.reviews = [];
    this.auditEvents = [];
    this.setLocalStorageItem(STORAGE_KEYS.PARCELS, this.parcels);
    this.setLocalStorageItem(STORAGE_KEYS.RELATIONSHIPS, this.relationships);
    this.setLocalStorageItem(STORAGE_KEYS.REVIEWS, this.reviews);
    this.setLocalStorageItem(STORAGE_KEYS.AUDIT_EVENTS, this.auditEvents);
    this.init();
  }
}

export const storage = new BhumiSutraStorage();
