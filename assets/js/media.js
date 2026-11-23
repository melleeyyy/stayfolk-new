/**
 * StayFolk — generated imagery.
 * Every visual is an inline SVG data URI, so the site has zero external
 * image dependencies and stays fast and fully offline-capable.
 * Only the brand palette is used: blue #3A79F7, green #5CC43C, black, white.
 */

const PALETTES = [
  ['#3A79F7', '#0B2E7A', '#5CC43C'],
  ['#5CC43C', '#124A20', '#3A79F7'],
  ['#101215', '#1B3E8C', '#3A79F7'],
  ['#3A79F7', '#3F9B2A', '#0A0B0D'],
  ['#1B4FD1', '#0A0B0D', '#5CC43C'],
  ['#2E63E8', '#123B8A', '#8FE06E'],
  ['#0A0B0D', '#1F5B12', '#5CC43C'],
  ['#3A79F7', '#7FB3FF', '#0A0B0D'],
];

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Abstract cover art — deterministic per seed. */
export function cover(seed, w = 800, h = 600) {
  const s = hash(seed);
  const [a, b, c] = PALETTES[s % PALETTES.length];
  const cx1 = 18 + (s % 40);
  const cy1 = 20 + ((s >> 3) % 40);
  const cx2 = 55 + ((s >> 5) % 35);
  const cy2 = 55 + ((s >> 7) % 35);
  const r = 150 + (s % 90);
  const rot = s % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="g" gradientTransform="rotate(${rot} .5 .5)">
<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
</linearGradient>
<radialGradient id="r"><stop offset="0" stop-color="${c}" stop-opacity=".85"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
<radialGradient id="r2"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${Math.round(w / 18)}"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<g filter="url(#blur)">
<circle cx="${(cx1 / 100) * w}" cy="${(cy1 / 100) * h}" r="${r}" fill="url(#r)"/>
<circle cx="${(cx2 / 100) * w}" cy="${(cy2 / 100) * h}" r="${r * 0.72}" fill="url(#r2)"/>
</g>
<g opacity=".14" fill="#fff">
${Array.from({ length: 7 }, (_, i) =>
    Array.from({ length: 9 }, (_, j) =>
      `<circle cx="${40 + j * ((w - 80) / 8)}" cy="${40 + i * ((h - 80) / 6)}" r="1.7"/>`
    ).join('')
  ).join('')}
</g>
</svg>`;
  return svgUrl(svg);
}

/** Initials avatar with a palette gradient. */
export function avatar(name, seed, size = 96) {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase();
  const s = hash(seed || name);
  const [a, b] = PALETTES[s % PALETTES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
</linearGradient></defs>
<rect width="${size}" height="${size}" fill="url(#a)"/>
<text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#fff"
 font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="${size * 0.36}"
 font-weight="700" letter-spacing="1">${initials}</text>
</svg>`;
  return svgUrl(svg);
}

/** Small brand mark used in the header/footer. */
export const BRAND_MARK = `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
<rect width="32" height="32" rx="8" fill="currentColor"/>
<path d="M16 5.5 6.8 12.4V24.6a1 1 0 0 0 1 1h5.6v-6.2a2.6 2.6 0 0 1 5.2 0v6.2h5.6a1 1 0 0 0 1-1V12.4L16 5.5Z" fill="#3A79F7"/>
<circle cx="23" cy="9.6" r="3.4" fill="#5CC43C"/>
</svg>`;
