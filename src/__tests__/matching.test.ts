import { describe, it, expect } from 'vitest';
import { evaluateCandidateRelationship, DEFAULT_WEIGHTS } from '../services/matchingEngine';
import { storage } from '../services/storage';

describe('Cross-Survey Matching Engine', () => {
  it('identifies exact cross-reference with consistent metadata as stronger candidate', () => {
    const csParcel = storage.getParcelById('CS-BD38-104')!;
    const saParcel = storage.getParcelById('SA-BD38-204')!;

    expect(csParcel).toBeDefined();
    expect(saParcel).toBeDefined();

    const rel = evaluateCandidateRelationship(csParcel, saParcel, DEFAULT_WEIGHTS);

    expect(rel.assessment).toBe('stronger_candidate');
    expect(rel.score).toBeGreaterThanOrEqual(72);
    expect(rel.positiveEvidence.some((e) => e.includes('cross-reference'))).toBe(true);
    expect(rel.positiveEvidence.some((e) => e.includes('Mouza jurisdiction'))).toBe(true);
  });

  it('correctly handles Dag renumbering when supported by archival cross-reference and geometry', () => {
    // CS 115 renumbered to SA 312
    const csParcel = storage.getParcelById('CS-BD38-115')!;
    const saParcel = storage.getParcelById('SA-BD38-312')!;

    const rel = evaluateCandidateRelationship(csParcel, saParcel, DEFAULT_WEIGHTS);

    expect(rel.relationshipType).toBe('renumbered');
    expect(rel.scoreBreakdown.areaVariancePercent).toBe(0); // 1 bigha = 33 dec!
    expect(rel.assessment).toBe('stronger_candidate');
  });

  it('detects one-to-many subdivision candidates correctly', () => {
    const saParcel = storage.getParcelById('SA-BD38-204')!; // 50 dec
    const rsPart1 = storage.getParcelById('RS-BD38-410')!;  // 28.5 dec
    const rsPart2 = storage.getParcelById('RS-BD38-411')!;  // 21.5 dec

    const rel1 = evaluateCandidateRelationship(saParcel, rsPart1, DEFAULT_WEIGHTS);
    const rel2 = evaluateCandidateRelationship(saParcel, rsPart2, DEFAULT_WEIGHTS);

    expect(rel1.relationshipType).toBe('subdivision');
    expect(rel2.relationshipType).toBe('subdivision');
    expect(rel1.scoreBreakdown.areaVariancePercent).toBeGreaterThan(15);
    // Combined parts equal 50 dec
    expect(rsPart1.normalizedAreaDecimal + rsPart2.normalizedAreaDecimal).toBe(saParcel.normalizedAreaDecimal);
  });

  it('detects many-to-one consolidation candidates correctly', () => {
    const csPart1 = storage.getParcelById('CS-BD38-108')!; // 18 dec
    const csPart2 = storage.getParcelById('CS-BD38-109')!; // 22 dec
    const saConsolidated = storage.getParcelById('SA-BD38-250')!; // 40 dec

    const rel1 = evaluateCandidateRelationship(csPart1, saConsolidated, DEFAULT_WEIGHTS);
    const rel2 = evaluateCandidateRelationship(csPart2, saConsolidated, DEFAULT_WEIGHTS);

    expect(rel1.relationshipType).toBe('consolidation');
    expect(rel2.relationshipType).toBe('consolidation');
    expect(csPart1.normalizedAreaDecimal + csPart2.normalizedAreaDecimal).toBe(saConsolidated.normalizedAreaDecimal);
  });

  it('flags area discrepancy when records diverge significantly', () => {
    const saParcel = storage.getParcelById('SA-BD38-340')!; // 60 dec
    const rsParcel = storage.getParcelById('RS-BD38-720')!; // 48 dec (12 dec missing)

    const rel = evaluateCandidateRelationship(saParcel, rsParcel, DEFAULT_WEIGHTS);

    expect(rel.scoreBreakdown.areaVariancePercent).toBe(20);
    expect(rel.contradictoryEvidence.some((e) => e.includes('Area reduction'))).toBe(true);
    expect(rel.humanReviewRequired).toBe(true);
  });

  it('does NOT fabricate positive spatial score when cadastral geometry is missing', () => {
    const csNoGeo = storage.getParcelById('CS-TJ12-050')!; // geometry is null
    const saNoGeo = storage.getParcelById('SA-TJ12-110')!; // geometry is null

    expect(csNoGeo.geometry).toBeNull();
    expect(saNoGeo.geometry).toBeNull();

    const rel = evaluateCandidateRelationship(csNoGeo, saNoGeo, DEFAULT_WEIGHTS);

    expect(rel.scoreBreakdown.spatialStatus).toBe('unavailable');
    expect(rel.scoreBreakdown.spatialScore).toBe(0);
    expect(
      rel.missingEvidence.some((e) => e.includes('Spatial evidence could not be evaluated'))
    ).toBe(true);
    // Score must be dampened and capped since spatial was not verified
    expect(rel.score).toBeLessThanOrEqual(85);
  });

  it('rejects candidates across mismatched administrative jurisdictions', () => {
    const csBadda = storage.getParcelById('CS-BD38-160')!; // Badda Mouza
    const saTejgaon = storage.getParcelById('SA-TJ12-160')!; // Tejgaon Mouza

    const rel = evaluateCandidateRelationship(csBadda, saTejgaon, DEFAULT_WEIGHTS);

    expect(rel.assessment).toBe('unresolved');
    expect(
      rel.contradictoryEvidence.some(
        (e) => e.includes('Jurisdictional conflict') || e.includes('Mouza mismatch')
      )
    ).toBe(true);
  });

  it('recognizes isolated parcel with no reliable later candidates', () => {
    const isolatedCs = storage.getParcelById('CS-BD38-199')!; // Lost to diluvion

    // Attempting to match against unrelated BS parcel
    const bsParcel = storage.getParcelById('BS-BD38-1800')!;
    const rel = evaluateCandidateRelationship(isolatedCs, bsParcel, DEFAULT_WEIGHTS);

    expect(rel.score).toBeLessThan(40);
    expect(rel.assessment === 'unresolved' || rel.assessment === 'insufficient_evidence').toBe(true);
  });

  it('persists human reviewer decisions and audit logs in storage', () => {
    const saved = storage.saveReview({
      parcelId: 'CS-BD38-115',
      relationshipId: 'REL-CS-BD38-115-TO-SA-BD38-312',
      status: 'supported',
      reviewerName: 'Testing Officer',
      reviewerRole: 'Land Record Specialist',
      notes: 'Verified 1 bigha = 33 decimal colonial settlement ledger.',
      evidenceChecks: {
        fieldInspectionNeeded: false,
        volumePageVerificationNeeded: true,
        cadastralSheetSuperimpositionNeeded: true,
        khatianShareValidationNeeded: true,
      },
    });

    expect(saved.id).toBeDefined();

    const retrieved = storage.getReviewForParcel('CS-BD38-115');
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe('supported');

    const audits = storage.getAuditEvents();
    expect(audits.some((a) => a.action === 'SUBMIT_HUMAN_REVIEW')).toBe(true);
  });
});
