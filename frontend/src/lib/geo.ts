export interface Point {
  lat: number;
  lng: number;
}

const EARTH_RADIUS = 6371000;

/** Distanca në metra mes dy pikave */
export function distance(a: Point, b: Point): number {
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;

  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;

  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

/** Drejtimi në gradë nga a te b */
export function bearing(a: Point, b: Point): number {
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;

  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Pika e projektuar në distancë dhe drejtim të dhënë */
export function project(from: Point, meters: number, deg: number): Point {
  const d = meters / EARTH_RADIUS;
  const b = (deg * Math.PI) / 180;
  const p1 = (from.lat * Math.PI) / 180;
  const l1 = (from.lng * Math.PI) / 180;

  const p2 = Math.asin(
    Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b)
  );
  const l2 =
    l1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(p1),
      Math.cos(d) - Math.sin(p1) * Math.sin(p2)
    );

  return { lat: (p2 * 180) / Math.PI, lng: (l2 * 180) / Math.PI };
}

/** Formatim i lexueshëm i distancës */
export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${meters.toFixed(0)} m`
    : `${(meters / 1000).toFixed(2)} km`;
}

/** Formatim i kohës së mbetur */
export function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}