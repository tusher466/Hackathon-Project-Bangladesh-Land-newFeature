export type SurveyType = 'CS' | 'SA' | 'RS' | 'BS';

export type AreaUnit = 'decimal' | 'acre' | 'bigha' | 'katha' | 'sqft' | 'sqm';

export type RelationshipType = 
  | '1_to_1_continuity' 
  | 'subdivision' 
  | 'consolidation' 
  | 'renumbered' 
  | 'unresolved' 
  | 'conflicting';

export type AssessmentLevel = 
  | 'stronger_candidate' 
  | 'tentative_candidate' 
  | 'unresolved' 
  | 'insufficient_evidence';

export type ReviewStatus = 
  | 'not_reviewed' 
  | 'needs_additional_evidence' 
  | 'under_review' 
  | 'supported' 
  | 'rejected' 
  | 'unresolved';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][]; // [lat, lng] or [x, y]
  centroid: [number, number];
  bbox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
}

export interface ParcelDataQuality {
  isGeometryAvailable: boolean;
  isCrossReferencePresent: boolean;
  isAreaVerified: boolean;
  hasMissingAttributes: boolean;
  qualityScore: number; // 0 - 100
  flags: string[];
}

export interface ParcelRecord {
  id: string;
  surveyType: SurveyType;
  surveyYear: number;
  dagNo: string;
  dagNoBn: string;
  khatianNo: string;
  khatianNoBn: string;
  mouzaId: string;
  mouzaNameEn: string;
  mouzaNameBn: string;
  jlNo: string;
  jlNoBn: string;
  sheetNo: string;
  division: string;
  district: string;
  upazila: string;
  recordedArea: number;
  recordedAreaBn: string;
  recordedUnit: AreaUnit;
  normalizedAreaDecimal: number;
  normalizedAreaSqm: number;
  sourceReference: string;
  khatianOwnerNames: string[];
  remarks: string;
  crossReferences: string[]; // documented cross references to earlier/later dags
  geometry: GeoPolygon | null;
  dataQuality: ParcelDataQuality;
  createdAt: string;
}

export interface EvidenceWeights {
  crossReference: number; // default 0.35
  spatial: number;        // default 0.30
  area: number;           // default 0.20
  metadata: number;       // default 0.15
}

export interface ScoreBreakdown {
  crossReferenceScore: number;
  crossReferenceMax: number;
  spatialScore: number;
  spatialMax: number;
  spatialStatus: 'evaluated' | 'unavailable' | 'contradictory';
  areaScore: number;
  areaMax: number;
  areaVariancePercent: number;
  metadataScore: number;
  metadataMax: number;
  rawTotalScore: number;
  normalizedTotalScore: number; // 0 to 100
}

export interface ParcelRelationship {
  id: string;
  sourceParcelId: string;
  targetParcelId: string;
  relationshipType: RelationshipType;
  assessment: AssessmentLevel;
  score: number; // 0 - 100
  confidenceLabel: string;
  matchingRuleVersion: string;
  evaluatedAt: string;
  summary: string;
  positiveEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
  scoreBreakdown: ScoreBreakdown;
  humanReviewRequired: boolean;
  reviewChecklist: string[];
}

export interface ReviewCase {
  id: string;
  parcelId: string;
  relationshipId?: string;
  status: ReviewStatus;
  reviewerName: string;
  reviewerRole: string;
  notes: string;
  updatedAt: string;
  createdAt: string;
  evidenceChecks: {
    fieldInspectionNeeded: boolean;
    volumePageVerificationNeeded: boolean;
    cadastralSheetSuperimpositionNeeded: boolean;
    khatianShareValidationNeeded: boolean;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: 'ParcelRecord' | 'ParcelRelationship' | 'ReviewCase' | 'System';
  entityId: string;
  details: string;
}

export interface DashboardMetrics {
  totalParcels: number;
  bySurveyType: Record<SurveyType, number>;
  totalRelationships: number;
  subdivisionCount: number;
  consolidationCount: number;
  continuityCount: number;
  discrepancyCount: number;
  pendingReviewCount: number;
  reviewedCount: number;
}

export interface SearchQuery {
  division?: string;
  district?: string;
  upazila?: string;
  mouzaId?: string;
  surveyType?: SurveyType | 'ALL';
  dagNo?: string;
  khatianNo?: string;
  minArea?: number;
  maxArea?: number;
}
