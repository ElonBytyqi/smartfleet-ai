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

/**
 * Sipërfaqja e një poligoni në metra katrorë.
 * Përdor formulën e shoelace mbi koordinata të projektuara afërsisht.
 */
export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;

  // Qendra si pikë referimi për projektim të sheshtë
  const lat0 = toRad(points.reduce((s, p) => s + p.lat, 0) / points.length);

  // Projektim ekuirektangular: x = R·λ·cos(φ₀), y = R·φ
  const xy = points.map((p) => ({
    x: R * toRad(p.lng) * Math.cos(lat0),
    y: R * toRad(p.lat),
  }));

  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    sum += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }

  return Math.abs(sum) / 2;
}

export function formatArea(sqMeters: number): string {
  if (sqMeters < 10000) return `${sqMeters.toFixed(0)} m²`;
  if (sqMeters < 1_000_000) return `${(sqMeters / 10000).toFixed(2)} ha`;
  return `${(sqMeters / 1_000_000).toFixed(2)} km²`;
}