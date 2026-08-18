import { Point, distance, bearing } from "./geo";

export interface FlightProgress {
  currentLeg: number;        // segmenti aktual (1-based)
  totalLegs: number;
  nextWaypoint: Point | null;
  nextWaypointIndex: number;
  distanceToNext: number;    // metra
  distanceRemaining: number; // metra deri në fund
  totalDistance: number;
  percentComplete: number;
  bearingToNext: number;
  etaSeconds: number;
}

/**
 * Gjen se ku ndodhet droni përgjatë rrugës së planifikuar
 * dhe llogarit distancat e mbetura.
 */
export function computeProgress(
  position: Point,
  waypoints: Point[],
  groundSpeedMs: number
): FlightProgress | null {
  if (waypoints.length < 2) return null;

  // Gjatësia e çdo segmenti
  const legLengths: number[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    legLengths.push(distance(waypoints[i], waypoints[i + 1]));
  }
  const totalDistance = legLengths.reduce((s, d) => s + d, 0);

  // Waypoint-i më i afërt që s'e kemi kaluar ende:
  // zgjedhim atë ku shuma (distanca te pika + distanca deri në fund) është minimale
  let bestIndex = 1;
  let bestScore = Infinity;

  for (let i = 1; i < waypoints.length; i++) {
    const toWp = distance(position, waypoints[i]);
    const fromWpToEnd = legLengths.slice(i).reduce((s, d) => s + d, 0);
    const score = toWp + fromWpToEnd;

    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  const nextWaypoint = waypoints[bestIndex];
  const distanceToNext = distance(position, nextWaypoint);
  const remainingLegs = legLengths.slice(bestIndex).reduce((s, d) => s + d, 0);
  const distanceRemaining = distanceToNext + remainingLegs;

  const percentComplete =
    totalDistance > 0
      ? Math.min(100, Math.max(0, (1 - distanceRemaining / totalDistance) * 100))
      : 0;

  const etaSeconds =
    groundSpeedMs > 0.5 ? distanceRemaining / groundSpeedMs : Infinity;

  return {
    currentLeg: bestIndex,
    totalLegs: waypoints.length - 1,
    nextWaypoint,
    nextWaypointIndex: bestIndex,
    distanceToNext,
    distanceRemaining,
    totalDistance,
    percentComplete,
    bearingToNext: bearing(position, nextWaypoint),
    etaSeconds,
  };
}