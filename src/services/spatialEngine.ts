import { GeoPolygon } from '../types';

export interface SpatialOverlapResult {
  isEvaluated: boolean;
  overlapScore: number; // 0 to 1
  iou: number; // 0 to 1
  centroidDistanceMeters: number;
  reason: string;
}

/**
 * Calculates synthetic approximate spatial overlap between two parcel polygons.
 * If either polygon is null/missing, strictly flags as not evaluated.
 */
export function evaluateSpatialOverlap(
  polyA: GeoPolygon | null,
  polyB: GeoPolygon | null
): SpatialOverlapResult {
  if (!polyA || !polyB) {
    return {
      isEvaluated: false,
      overlapScore: 0,
      iou: 0,
      centroidDistanceMeters: 0,
      reason: 'Spatial evidence unavailable: one or both survey records lack digitized cadastral sheet geometry.',
    };
  }

  // Calculate bbox overlap (minLat, minLng, maxLat, maxLng)
  const [minLatA, minLngA, maxLatA, maxLngA] = polyA.bbox;
  const [minLatB, minLngB, maxLatB, maxLngB] = polyB.bbox;

  const overlapMinLat = Math.max(minLatA, minLatB);
  const overlapMaxLat = Math.min(maxLatA, maxLatB);
  const overlapMinLng = Math.max(minLngA, minLngB);
  const overlapMaxLng = Math.min(maxLngA, maxLngB);

  const hasIntersection =
    overlapMinLat < overlapMaxLat && overlapMinLng < overlapMaxLng;

  if (!hasIntersection) {
    const dist = calculateDistanceMeters(polyA.centroid, polyB.centroid);
    return {
      isEvaluated: true,
      overlapScore: 0,
      iou: 0,
      centroidDistanceMeters: dist,
      reason: `No bounding overlap. Centroid separation is ${dist.toFixed(1)} meters. Contradicts direct continuity.`,
    };
  }

  const interArea = (overlapMaxLat - overlapMinLat) * (overlapMaxLng - overlapMinLng);
  const areaA = (maxLatA - minLatA) * (maxLngA - minLngA);
  const areaB = (maxLatB - minLatB) * (maxLngB - minLngB);
  const unionArea = areaA + areaB - interArea;

  const iou = unionArea > 0 ? interArea / unionArea : 0;
  const dist = calculateDistanceMeters(polyA.centroid, polyB.centroid);

  // Score depends on IoU and centroid closeness
  let overlapScore = Math.min(1, Math.max(0, iou * 1.2));
  if (dist < 15) {
    overlapScore = Math.min(1, overlapScore + 0.15);
  }

  return {
    isEvaluated: true,
    overlapScore: Number(overlapScore.toFixed(3)),
    iou: Number(iou.toFixed(3)),
    centroidDistanceMeters: dist,
    reason: `Cadastral boundary superimposition confirms ${Math.round(iou * 100)}% spatial footprint intersection with centroid offset of ${dist.toFixed(1)}m.`,
  };
}

/**
 * Calculates approximate Euclidean distance in meters between two lat/lng coordinates in Dhaka region.
 * 1 degree latitude ~ 111,000 meters; 1 degree longitude ~ 104,000 meters at 23.8° N.
 */
export function calculateDistanceMeters(
  coordA: [number, number],
  coordB: [number, number]
): number {
  const [lat1, lng1] = coordA;
  const [lat2, lng2] = coordB;
  const dLat = (lat2 - lat1) * 111000;
  const dLng = (lng2 - lng1) * 104000;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Generates synthetic coordinates for demonstration parcels within a mouza anchor.
 */
export function generateSyntheticParcelPolygon(
  centerLat: number,
  centerLng: number,
  widthMeters: number,
  heightMeters: number,
  jitterSeed = 0
): GeoPolygon {
  const latDelta = (heightMeters / 111000) / 2;
  const lngDelta = (widthMeters / 104000) / 2;

  const minLat = centerLat - latDelta;
  const maxLat = centerLat + latDelta;
  const minLng = centerLng - lngDelta;
  const maxLng = centerLng + lngDelta;

  // Add realistic small polygon jitter
  const j = (jitterSeed % 5) * 0.00001;

  const coordinates: [number, number][] = [
    [minLat + j, minLng],
    [maxLat, minLng + j],
    [maxLat - j, maxLng],
    [minLat, maxLng - j],
    [minLat + j, minLng], // close ring
  ];

  return {
    type: 'Polygon',
    coordinates,
    centroid: [centerLat, centerLng],
    bbox: [minLat, minLng, maxLat, maxLng],
  };
}
