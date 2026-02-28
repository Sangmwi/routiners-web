/** 3대 영양소 공용 색상 토큰 */
export const MACRO_COLORS = {
  단백질: { bg: 'bg-sky-400', stroke: '#38bdf8' },
  탄수화물: { bg: 'bg-amber-400', stroke: '#fbbf24' },
  지방: { bg: 'bg-rose-400', stroke: '#fb7185' },
} as const satisfies Record<string, { bg: string; stroke: string }>;
