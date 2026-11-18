// Turns a perceptual colour difference (CIEDE2000 ΔE) into points.

export const MAX_POINTS = 1000;

// Shape of the scoring curve: points = MAX * exp(-(ΔE / K) ^ P)
//   ΔE 1 → ~975   ΔE 5 → ~810   ΔE 10 → ~600   ΔE 20 → ~285   ΔE 40 → ~45
const K = 16.75;
const P = 1.3;

export function pointsFor(deltaE) {
  if (!Number.isFinite(deltaE) || deltaE < 0) return 0;
  if (deltaE < 0.5) return MAX_POINTS; // imperceptible: treat as a bullseye
  return Math.round(MAX_POINTS * Math.exp(-((deltaE / K) ** P)));
}

const RATINGS = [
  [1, 'Perfect'],
  [2.5, 'Incredible'],
  [5, 'Excellent'],
  [10, 'Great'],
  [20, 'Good'],
  [35, 'Not bad'],
  [Infinity, 'Way off'],
];

export const ratingFor = (deltaE) => RATINGS.find(([max]) => deltaE < max)[1];

const TITLES = [
  [0.9, 'Color savant'],
  [0.75, 'Sharp eye'],
  [0.6, 'Hex fluent'],
  [0.4, 'Getting warmer'],
  [0, 'Keep practicing'],
];

/** Title for a finished game, given the fraction of the max score earned. */
export const titleFor = (fraction) => TITLES.find(([min]) => fraction >= min)[1];
