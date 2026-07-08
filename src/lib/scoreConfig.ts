export const SCORE_THRESHOLDS = [
  { min: 95, color: 'text-amber-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]', label: '完美' },
  { min: 80, color: 'text-yellow-400', label: '优秀' },
  { min: 65, color: 'text-purple-400', label: '良好' },
  { min: 40, color: 'text-blue-400', label: '及格' },
  { min: 0, color: 'text-green-400', label: '需提升' },
] as const;

export function getScoreColor(score: number): string {
  for (const t of SCORE_THRESHOLDS) {
    if (score >= t.min) return t.color;
  }
  return SCORE_THRESHOLDS[SCORE_THRESHOLDS.length - 1].color;
}

export function calcScore(attributes: { is_main?: boolean; rate?: number }[]): number {
  const recommended = attributes.filter(a => a.is_main);
  if (recommended.length > 0) {
    return Math.round(recommended.reduce((s, a) => s + (a.rate || 0), 0) / recommended.length);
  }
  return 0;
}
