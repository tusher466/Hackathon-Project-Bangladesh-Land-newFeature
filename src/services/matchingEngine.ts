import {
  ParcelRecord,
  ParcelRelationship,
  AssessmentLevel,
  RelationshipType,
  EvidenceWeights,
  ScoreBreakdown,
} from '../types';
import { normalizeRecordNumber } from './normalizer';
import { evaluateSpatialOverlap } from './spatialEngine';

export const DEFAULT_WEIGHTS: EvidenceWeights = {
  crossReference: 0.35,
  spatial: 0.30,
  area: 0.20,
  metadata: 0.15,
};

export const MATCHING_RULE_VERSION = 'v1.4-bd-historical-cadastral';

/**
 * Matches a source parcel against a candidate parcel from another survey period.
 * Evaluates available historical evidence and returns a transparent structured assessment.
 */
export function evaluateCandidateRelationship(
  source: ParcelRecord,
  candidate: ParcelRecord,
  weights: EvidenceWeights = DEFAULT_WEIGHTS
): ParcelRelationship {
  const positiveEvidence: string[] = [];
  const contradictoryEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const reviewChecklist: string[] = [];

  // 1. EVALUATE MOUZA & ADMINISTRATIVE LOCATION (Weight: 15%)
  let metadataScore = 0;
  const metadataMax = weights.metadata * 100;

  if (source.mouzaId === candidate.mouzaId) {
    metadataScore += metadataMax * 0.7;
    positiveEvidence.push(
      `Identical Mouza jurisdiction: ${source.mouzaNameEn} (JL No. ${source.jlNo}). Administrative coherence confirmed across survey periods.`
    );
  } else if (source.district === candidate.district && source.upazila === candidate.upazila) {
    metadataScore += metadataMax * 0.3;
    contradictoryEvidence.push(
      `Mouza mismatch: Source is in ${source.mouzaNameEn} (JL ${source.jlNo}), while candidate is in ${candidate.mouzaNameEn} (JL ${candidate.jlNo}) within same Upazila.`
    );
    reviewChecklist.push('Verify whether mouza boundaries underwent jurisdictional alteration or amalgamation between surveys.');
  } else {
    contradictoryEvidence.push(
      `Jurisdictional conflict: Source is in ${source.upazila}, ${source.district}; Candidate is in ${candidate.upazila}, ${candidate.district}. Highly improbable lineage.`
    );
  }

  // Check Sheet number
  if (source.sheetNo && candidate.sheetNo) {
    if (source.sheetNo === candidate.sheetNo) {
      metadataScore += metadataMax * 0.3;
      positiveEvidence.push(`Matching Cadastral Sheet number (#${source.sheetNo}) in survey records.`);
    } else {
      missingEvidence.push(`Cadastral Sheet numbers differ (Source: Sheet #${source.sheetNo}, Candidate: Sheet #${candidate.sheetNo}).`);
    }
  } else {
    missingEvidence.push('Cadastral sheet number missing on one or both records.');
  }

  // 2. EVALUATE EXPLICIT CROSS-REFERENCE (Weight: 35%)
  let crossRefScore = 0;
  const crossRefMax = weights.crossReference * 100;

  const normSourceDag = normalizeRecordNumber(source.dagNo);
  const normCandidateDag = normalizeRecordNumber(candidate.dagNo);

  const candidateReferences = (candidate.crossReferences || []).map((r) => r.toLowerCase());
  const sourceReferences = (source.crossReferences || []).map((r) => r.toLowerCase());

  const directMentionInCandidate = candidateReferences.some(
    (ref) =>
      ref.includes(normSourceDag) &&
      (ref.includes(source.surveyType.toLowerCase()) || ref.includes('dag') || ref.includes('দাগ'))
  );

  const directMentionInSource = sourceReferences.some(
    (ref) =>
      ref.includes(normCandidateDag) &&
      (ref.includes(candidate.surveyType.toLowerCase()) || ref.includes('dag') || ref.includes('দাগ'))
  );

  if (directMentionInCandidate || directMentionInSource) {
    crossRefScore = crossRefMax;
    positiveEvidence.push(
      `Explicit archival cross-reference found in survey ledger remarks linking ${source.surveyType} Dag #${source.dagNo} directly to ${candidate.surveyType} Dag #${candidate.dagNo}.`
    );
  } else if (normSourceDag === normCandidateDag) {
    // Same dag number across surveys
    crossRefScore = crossRefMax * 0.55;
    positiveEvidence.push(
      `Identical Dag number (#${source.dagNo}) retained across ${source.surveyType} and ${candidate.surveyType} surveys (suggests numbering continuity).`
    );
    reviewChecklist.push(`Confirm if dag numbering was preserved or re-assigned during the ${candidate.surveyType} settlement operations.`);
  } else if (
    normCandidateDag.startsWith(`${normSourceDag}/`) ||
    normCandidateDag.startsWith(`${normSourceDag}ক`) ||
    normCandidateDag.startsWith(`${normSourceDag}খ`)
  ) {
    crossRefScore = crossRefMax * 0.75;
    positiveEvidence.push(
      `Candidate Dag #${candidate.dagNo} bears fractional/batta sub-dag index derived from parent Dag #${source.dagNo}. Strong subdivision marker.`
    );
  }

  if (crossRefScore === 0) {
    if (candidate.crossReferences.length === 0 && source.crossReferences.length === 0) {
      missingEvidence.push(
        `No archival field cross-reference remarks recorded in either ${source.surveyType} or ${candidate.surveyType} khatian register.`
      );
      reviewChecklist.push('Inspect original Terij (তেহরিজ) or Milan Khasra (মিলান খসড়া) register at District Record Room.');
    } else {
      contradictoryEvidence.push(
        `Archival cross-reference notes exist in ${candidate.surveyType} ledger but reference a different predecessor parcel, not Dag #${source.dagNo}.`
      );
    }
  }

  // 3. EVALUATE RECORDED AREA CONSISTENCY (Weight: 20%)
  let areaScore = 0;
  const areaMax = weights.area * 100;
  const areaA = source.normalizedAreaDecimal;
  const areaB = candidate.normalizedAreaDecimal;

  let areaVariancePercent = 0;
  let inferredSubdivision = false;
  let inferredConsolidation = false;

  if (areaA > 0 && areaB > 0) {
    const diff = Math.abs(areaA - areaB);
    areaVariancePercent = Number(((diff / areaA) * 100).toFixed(1));

    if (areaVariancePercent <= 3.0) {
      // Near exact consistency (<3% normal surveying margin)
      areaScore = areaMax;
      positiveEvidence.push(
        `Area measurement is highly consistent: ${source.recordedArea} ${source.recordedUnit} (${areaA} dec) vs ${candidate.recordedArea} ${candidate.recordedUnit} (${areaB} dec). Variance: ${areaVariancePercent}%.`
      );
    } else if (areaVariancePercent <= 10.0) {
      areaScore = areaMax * 0.75;
      positiveEvidence.push(
        `Area measurement is reasonably consistent (${areaA} dec vs ${areaB} dec; variance ${areaVariancePercent}%). Consistent with historical chain/theodolite survey discrepancies.`
      );
    } else if (areaB < areaA) {
      // Candidate is smaller -> potential subdivision
      inferredSubdivision = true;
      areaScore = areaMax * 0.45;
      contradictoryEvidence.push(
        `Area reduction detected: Candidate area is ${areaB} dec compared to predecessor ${areaA} dec (${areaVariancePercent}% decrease). Suggests subdivision or partial acquisition.`
      );
      reviewChecklist.push(
        `Search for companion sub-parcels in ${candidate.surveyType} that together sum to ~${areaA} decimals to confirm complete subdivision.`
      );
    } else {
      // Candidate is larger -> potential consolidation or accretion
      inferredConsolidation = true;
      areaScore = areaMax * 0.35;
      contradictoryEvidence.push(
        `Area expansion detected: Candidate area (${areaB} dec) exceeds predecessor (${areaA} dec) by ${areaVariancePercent}%. Suggests consolidation with adjacent dags or boundary shift.`
      );
      reviewChecklist.push(
        `Verify whether adjacent ${source.surveyType} parcels were consolidated into ${candidate.surveyType} Dag #${candidate.dagNo}.`
      );
    }
  } else {
    missingEvidence.push('Recorded land area is missing or unverified on one or both records.');
  }

  // 4. EVALUATE SPATIAL OVERLAP (Weight: 30%)
  let spatialScore = 0;
  const spatialMax = weights.spatial * 100;
  let spatialStatus: 'evaluated' | 'unavailable' | 'contradictory' = 'unavailable';

  const spatialResult = evaluateSpatialOverlap(source.geometry, candidate.geometry);

  if (!spatialResult.isEvaluated) {
    spatialStatus = 'unavailable';
    missingEvidence.push(
      'Spatial evidence could not be evaluated: Cadastral map geometry is not digitized for one or both records. (Do not assume spatial alignment).'
    );
    reviewChecklist.push('Digitize or physically inspect mouza cadastral sheet overlay (নকশা ট্রেসিং).');
  } else {
    if (spatialResult.overlapScore > 0.6) {
      spatialStatus = 'evaluated';
      spatialScore = spatialMax * spatialResult.overlapScore;
      positiveEvidence.push(
        `${spatialResult.reason} Strong geometric continuity.`
      );
    } else if (spatialResult.overlapScore > 0.2) {
      spatialStatus = 'evaluated';
      spatialScore = spatialMax * spatialResult.overlapScore;
      positiveEvidence.push(
        `${spatialResult.reason} Moderate partial geometric overlap.`
      );
    } else {
      spatialStatus = 'contradictory';
      contradictoryEvidence.push(
        `${spatialResult.reason} Polygons exhibit disjoint or incompatible locations on the cadastral plane.`
      );
    }
  }

  // 5. CALCULATE TOTAL NORMALIZED SCORE TRANSPARENTLY
  // Rule: Do NOT reward missing evidence. If spatial evidence is missing, score only from available categories,
  // but cap maximum confidence level and flag requirement for manual review.
  const rawTotalScore = metadataScore + crossRefScore + areaScore + spatialScore;

  let effectiveMaxScore = 100;
  if (!spatialResult.isEvaluated) {
    // If spatial is unavailable, evaluate against the 70 points of available categories,
    // then normalize to 0-100 scale, but apply a conservative 0.85 dampener so unverified spatial cannot reach artificial 100%
    const availableMax = metadataMax + crossRefMax + areaMax;
    const availableScore = metadataScore + crossRefScore + areaScore;
    effectiveMaxScore = availableMax;
    var normalizedScore = Math.min(85, Math.round((availableScore / availableMax) * 85));
  } else {
    var normalizedScore = Math.min(100, Math.round(rawTotalScore));
  }

  // Determine Assessment Level
  let assessment: AssessmentLevel;
  let confidenceLabel = '';

  if (contradictoryEvidence.some(c => c.includes('Jurisdictional conflict'))) {
    assessment = 'unresolved';
    confidenceLabel = 'Jurisdictional Disconnect';
    normalizedScore = Math.min(normalizedScore, 15);
  } else if (normalizedScore >= 72 && (crossRefScore > 0 || spatialScore > 18)) {
    assessment = 'stronger_candidate';
    confidenceLabel = 'Strong Lineage Candidate';
  } else if (normalizedScore >= 42) {
    assessment = 'tentative_candidate';
    confidenceLabel = 'Tentative / Needs Corroboration';
  } else if (missingEvidence.length >= 3 && positiveEvidence.length <= 1) {
    assessment = 'insufficient_evidence';
    confidenceLabel = 'Insufficient Archival Data';
  } else {
    assessment = 'unresolved';
    confidenceLabel = 'Unresolved / Low Plausibility';
  }

  // Determine Relationship Type
  let relationshipType: RelationshipType = '1_to_1_continuity';
  if (inferredSubdivision || (areaA > 0 && areaB > 0 && areaB < areaA * 0.85)) {
    relationshipType = 'subdivision';
  } else if (inferredConsolidation || (areaA > 0 && areaB > 0 && areaB > areaA * 1.25)) {
    relationshipType = 'consolidation';
  } else if (normSourceDag !== normCandidateDag && crossRefScore > 0) {
    relationshipType = 'renumbered';
  } else if (contradictoryEvidence.length > 0 && assessment === 'unresolved') {
    relationshipType = 'conflicting';
  } else if (assessment === 'insufficient_evidence') {
    relationshipType = 'unresolved';
  }

  // Human Readable Summary
  let summary = '';
  if (assessment === 'stronger_candidate') {
    summary = `Plausible historical lineage established between ${source.surveyType} Dag #${source.dagNo} and ${candidate.surveyType} Dag #${candidate.dagNo} with ${positiveEvidence.length} documented corroborations.`;
  } else if (assessment === 'tentative_candidate') {
    summary = `Tentative correspondence between ${source.surveyType} Dag #${source.dagNo} and ${candidate.surveyType} Dag #${candidate.dagNo}. Key attributes match but manual archival verification is recommended.`;
  } else if (assessment === 'insufficient_evidence') {
    summary = `Insufficient evidentiary trail to link ${source.surveyType} Dag #${source.dagNo} with ${candidate.surveyType} Dag #${candidate.dagNo}. Cadastral geometry or cross-references are missing.`;
  } else {
    summary = `Unresolved or conflicting evidence between ${source.surveyType} Dag #${source.dagNo} and ${candidate.surveyType} Dag #${candidate.dagNo}. Critical discrepancies identified in area or jurisdiction.`;
  }

  const breakdown: ScoreBreakdown = {
    crossReferenceScore: Math.round(crossRefScore),
    crossReferenceMax: Math.round(crossRefMax),
    spatialScore: Math.round(spatialScore),
    spatialMax: Math.round(spatialMax),
    spatialStatus,
    areaScore: Math.round(areaScore),
    areaMax: Math.round(areaMax),
    areaVariancePercent,
    metadataScore: Math.round(metadataScore),
    metadataMax: Math.round(metadataMax),
    rawTotalScore: Math.round(rawTotalScore),
    normalizedTotalScore: normalizedScore,
  };

  const relationshipId = `REL-${source.id}-TO-${candidate.id}`;

  return {
    id: relationshipId,
    sourceParcelId: source.id,
    targetParcelId: candidate.id,
    relationshipType,
    assessment,
    score: normalizedScore,
    confidenceLabel,
    matchingRuleVersion: MATCHING_RULE_VERSION,
    evaluatedAt: new Date().toISOString(),
    summary,
    positiveEvidence,
    contradictoryEvidence,
    missingEvidence,
    scoreBreakdown: breakdown,
    humanReviewRequired: assessment !== 'stronger_candidate' || contradictoryEvidence.length > 0,
    reviewChecklist,
  };
}
