/**
 * MiniSparkline - 순수 SVG 스파크라인 차트
 *
 * 외부 차트 라이브러리 없이 경량 SVG로 구현
 * 시계열 데이터의 추이를 한눈에 보여주는 미니 그래프
 */

import { useId } from 'react';

interface MiniSparklineProps {
  /** 데이터 포인트 (y값, 시간순) */
  data: number[];
  /** 라인/그라데이션 색상 (기본: var(--primary)) */
  color?: string;
  /** 차트 높이 px (기본: 48) */
  height?: number;
  /** 마지막 데이터 포인트에 점 표시 (기본: true) */
  showEndDot?: boolean;
  /** 모든 데이터 포인트에 점 표시 */
  showAllDots?: boolean;
  /** 라인 아래 그라데이션 채우기 (기본: true) */
  gradientFill?: boolean;
  /** 차트 양쪽에 최소/최대값 레이블 표시 */
  showMinMax?: boolean;
  /** 시작/끝 날짜 레이블 [시작, 끝] */
  dateRange?: [string, string];
  /** 값 포맷 함수 (기본: 소수 1자리) */
  formatValue?: (v: number) => string;
  /** 추가 className */
  className?: string;
}

/**
 * Monotone cubic interpolation으로 부드러운 SVG path 생성
 */
function buildPath(points: [number, number][]): string {
  if (points.length < 2) return '';

  const n = points.length;
  const d: string[] = [];

  d.push(`M ${points[0][0]},${points[0][1]}`);

  if (n === 2) {
    d.push(`L ${points[1][0]},${points[1][1]}`);
    return d.join(' ');
  }

  // Monotone cubic spline tangents
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1][0] - points[i][0]);
    dy.push(points[i + 1][1] - points[i][1]);
    m.push(dy[i] / dx[i]);
  }

  const tangents: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      tangents.push(0);
    } else {
      tangents.push((m[i - 1] + m[i]) / 2);
    }
  }
  tangents.push(m[n - 2]);

  // Fritsch-Carlson method for monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const a = tangents[i] / m[i];
      const b = tangents[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        tangents[i] = t * a * m[i];
        tangents[i + 1] = t * b * m[i];
      }
    }
  }

  // Build cubic bezier segments
  for (let i = 0; i < n - 1; i++) {
    const segLen = dx[i] / 3;
    const cp1x = points[i][0] + segLen;
    const cp1y = points[i][1] + tangents[i] * segLen;
    const cp2x = points[i + 1][0] - segLen;
    const cp2y = points[i + 1][1] - tangents[i + 1] * segLen;
    d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i + 1][0]},${points[i + 1][1]}`);
  }

  return d.join(' ');
}

const defaultFormat = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(1);

export default function MiniSparkline({
  data,
  color = 'var(--primary)',
  height = 48,
  showEndDot = true,
  showAllDots = false,
  gradientFill = true,
  showMinMax = false,
  dateRange,
  formatValue = defaultFormat,
  className = '',
}: MiniSparklineProps) {
  const gradientId = useId();

  const hasLabelsBelow = showMinMax || !!dateRange;

  // 빈 데이터: 높이만 유지
  if (data.length === 0) {
    return <div style={{ height: hasLabelsBelow ? height + 16 : height }} className={className} />;
  }

  const viewWidth = 200;
  const viewHeight = height;
  const padX = 4;
  const padY = 6;
  const chartW = viewWidth - padX * 2;
  const chartH = viewHeight - padY * 2;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  // 데이터 → SVG 좌표
  const points: [number, number][] = data.map((val, i) => [
    padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    padY + chartH - ((val - minVal) / range) * chartH,
  ]);

  // SVG 좌표 → 퍼센트 (HTML 오버레이용)
  const toPercent = (x: number, y: number) => ({
    left: `${(x / viewWidth) * 100}%`,
    top: `${(y / viewHeight) * 100}%`,
  });

  // 단일 데이터 포인트: 점만 표시
  if (data.length === 1) {
    const pos = toPercent(points[0][0], points[0][1]);
    return (
      <div className={`relative w-full ${className}`} style={{ height }}>
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: pos.left,
            top: pos.top,
            width: 8,
            height: 8,
            backgroundColor: color,
          }}
        />
      </div>
    );
  }

  const linePath = buildPath(points);
  const lastPoint = points[points.length - 1];

  // 채우기 경로: 라인 경로 + 하단으로 닫기
  const fillPath = `${linePath} L ${points[points.length - 1][0]},${viewHeight} L ${points[0][0]},${viewHeight} Z`;

  const lastPos = toPercent(lastPoint[0], lastPoint[1]);

  return (
    <div className={className} role="img" aria-label="데이터 추이">
      {/* 차트 영역 */}
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {gradientFill && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}

          {/* 그라데이션 채우기 */}
          {gradientFill && (
            <path d={fillPath} fill={`url(#${CSS.escape(gradientId)})`} />
          )}

          {/* 라인 */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* 모든 점 표시 - HTML 오버레이 */}
        {showAllDots && points.map((pt, i) => {
          const pos = toPercent(pt[0], pt[1]);
          const isLast = i === points.length - 1;
          return (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: pos.left,
                top: pos.top,
                width: isLast ? 7 : 5,
                height: isLast ? 7 : 5,
                backgroundColor: color,
                ...(isLast ? { boxShadow: '0 0 0 1.5px var(--card)' } : { opacity: 0.6 }),
              }}
            />
          );
        })}

        {/* 끝점 dot만 (showAllDots가 아닐 때) */}
        {showEndDot && !showAllDots && (
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-[1.5px] ring-card"
            style={{
              left: lastPos.left,
              top: lastPos.top,
              width: 7,
              height: 7,
              backgroundColor: color,
            }}
          />
        )}
      </div>

      {/* 차트 하단 레이블 영역 */}
      {hasLabelsBelow && (
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="text-[9px] leading-none text-muted-foreground/70">
            {showMinMax && minVal !== maxVal && (
              <span>최소 {formatValue(minVal)}</span>
            )}
            {dateRange && (
              <span className={showMinMax && minVal !== maxVal ? ' ml-1 text-muted-foreground/40' : ''}>
                {dateRange[0]}
              </span>
            )}
          </div>
          <div className="text-[9px] leading-none text-muted-foreground/70 text-right">
            {showMinMax && minVal !== maxVal && (
              <span>최대 {formatValue(maxVal)}</span>
            )}
            {dateRange && (
              <span className={showMinMax && minVal !== maxVal ? ' ml-1 text-muted-foreground/40' : ''}>
                {dateRange[1]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
