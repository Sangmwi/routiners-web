'use client';

import { MACRO_COLORS } from '@/lib/config/theme';

interface MacroEntry {
  label: keyof typeof MACRO_COLORS;
  value: number;
  pct: number;
}

interface NutritionDonutChartProps {
  macros: MacroEntry[];
}

/**
 * 3대 영양소 비율을 SVG 도넛 차트 + 범례로 표시.
 * 식이 프로필 목표가 없을 때 NutritionStatsTab의 폴백 섹션으로 사용.
 */
export default function NutritionDonutChart({ macros }: NutritionDonutChartProps) {
  const size = 100;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const chartSegments = macros.map(({ label, pct }, index) => {
    const dashLength = (pct / 100) * circumference;
    const accumulatedLength = macros
      .slice(0, index)
      .reduce((sum, current) => sum + (current.pct / 100) * circumference, 0);
    return {
      label,
      dashLength,
      dashOffset: circumference * 0.25 - accumulatedLength,
      color: MACRO_COLORS[label]?.stroke ?? '#888',
    };
  });

  return (
    <div>
      <h3 className="text-base font-medium text-foreground mb-3">3대 영양소</h3>
      <div className="p-4">
        <div className="flex items-center gap-6">
          {/* SVG Donut */}
          <div className="shrink-0">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
              />
              {chartSegments.map(({ label, dashLength, dashOffset, color }) => (
                <circle
                  key={label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-500"
                />
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3.5">
            {macros.map(({ label, value, pct }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${MACRO_COLORS[label]?.bg ?? 'bg-muted'}`} />
                <span className="text-xs text-muted-foreground flex-1">{label}</span>
                <span className="text-xs font-bold text-foreground">{value}g</span>
                <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-hint-faint mt-6 text-center">
          일반 권장 비율: 탄 50 · 단 30 · 지 20
        </p>
      </div>
    </div>
  );
}
