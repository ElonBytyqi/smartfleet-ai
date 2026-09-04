export type LatLng = [number, number];

/**
 * Kthen një varg pikash në kurbë të butë me Catmull-Rom.
 *
 * Kurba kalon nëpër të gjitha pikat origjinale, por mes tyre
 * ndjek një hark natyror në vend të vijës së drejtë — si fluturimi real,
 * ku droni s'kthehet me kënd të mprehtë.
 */
export function smoothPath(points: LatLng[], segments = 14): LatLng[] {
  if (points.length < 3) return points;

  const result: LatLng[] = [];

  // Dyfishojmë pikën e parë dhe të fundit që kurba të fillojë e mbarojë saktë
  const pts: LatLng[] = [points[0], ...points, points[points.length - 1]];

  for (let i = 0; i < pts.length - 3; i++) {
    const [p0, p1, p2, p3] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];

    for (let s = 0; s < segments; s++) {
      const t = s / segments;
      const t2 = t * t;
      const t3 = t2 * t;

      // Formula Catmull-Rom
      const lat =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);

      const lng =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

      result.push([lat, lng]);
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

/**
 * Ndan një varg pikash në segmente me opacitet në rritje.
 * Pjesa e vjetër zbehet, e freskëta shndrit.
 */
export function fadeSegments(
  points: LatLng[],
  count = 6
): { points: LatLng[]; opacity: number }[] {
  if (points.length < 2) return [];

  const segments: { points: LatLng[]; opacity: number }[] = [];
  const size = Math.ceil(points.length / count);

  for (let i = 0; i < count; i++) {
    const start = i * size;
    const end = Math.min(start + size + 1, points.length);   // +1 që të lidhen

    if (end - start < 2) continue;

    segments.push({
      points: points.slice(start, end),
      // Nga 0.15 te 0.95, në rritje drejt fundit
      opacity: 0.15 + (i / (count - 1)) * 0.8,
    });
  }

  return segments;
}
/**
 * Ndan rrugën e lakuar në dy pjesë: ajo që është kaluar dhe ajo që mbetet.
 *
 * `nextIndex` është indeksi i waypoint-it drejt të cilit po fluturon droni,
 * kështu që gjithçka para tij konsiderohet e kaluar.
 */
export function splitAtWaypoint(
  waypoints: LatLng[],
  nextIndex: number,
  segments = 14
): { passed: LatLng[]; remaining: LatLng[] } {
  const curved = smoothPath(waypoints, segments);

  if (waypoints.length < 2 || nextIndex <= 0) {
    return { passed: [], remaining: curved };
  }

  // Kurba ka afersisht `segments` pika per cdo segment origjinal
  const cut = Math.min(nextIndex * segments, curved.length - 1);

  return {
    passed: curved.slice(0, cut + 1),
    remaining: curved.slice(cut),
  };
}