// Ngjyra te dallueshme per dronet ne harte — te ndritshme qe te dallohen mbi satelit
const PALETTE = [
  "#4da3ff", // blu
  "#ff5c5c", // e kuqe
  "#4fdb9a", // jeshile
  "#ffc94d", // e verdhe
  "#c47fff", // vjollce
  "#ff8f4d", // portokalli
  "#4fe0e0", // turkez
  "#ff4fb0", // magenta
  "#a3d94d", // limon
  "#ff9ec4", // rozë
];

// I njejti dron merr gjithmone te njejten ngjyre
const assigned = new Map<string, string>();

export function droneColor(droneId: string): string {
  const existing = assigned.get(droneId);
  if (existing) return existing;

  // Hash i qendrueshem nga GUID-i
  let hash = 0;
  for (let i = 0; i < droneId.length; i++) {
    hash = (hash * 31 + droneId.charCodeAt(i)) | 0;
  }

  const color = PALETTE[Math.abs(hash) % PALETTE.length];
  assigned.set(droneId, color);
  return color;
}