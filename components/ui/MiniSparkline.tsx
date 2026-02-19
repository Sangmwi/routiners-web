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
  /** 라인 아래 그라데이션 채우기 (기본: true) */
  gradientFill?: boolean;
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

export default function MiniSparkline({
  data,
  color = 'var(--primary)',
  height = 48,
  showEndDot = true,
  gradientFill = true,
  className = '',
}: MiniSparklineProps) {
  const gradientId = useId();

  // 빈 데이터: 높이만 유지
  if (data.length === 0) {
    return <div style={{ height }} className={className} />;
  }

  const viewWidth = 200;
  const viewHeight = height;
  const padX = 4;
  const padY = 6;
  const chartW = viewWidth - padX * 2;
  const chartH = viewHeight - padY * 2;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1; // 모든 값이 같으면 1로 처리

  // 데이터 → SVG 좌표
  const points: [number, number][] = data.map((val, i) => [
    padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    padY + chartH - ((val - minVal) / range) * chartH,
  ]);

  // 단일 데이터 포인트: 점만 표시
  if (data.length === 1) {
    return (
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className={`w-full ${className}`}
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="데이터 추이"
      >
        <circle cx={points[0][0]} cy={points[0][1]} r={4} fill={color} />
      </svg>
    );
  }

  const linePath = buildPath(points);
  const lastPoint = points[points.length - 1];

  // 채우기 경로: 라인 경로 + 하단으로 닫기
  const fillPath = `${linePath} L ${points[points.length - 1][0]},${viewHeight} L ${points[0][0]},${viewHeight} Z`;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className={`w-full ${className}`}
      style={{ height }}
      preserveAspectRatio="none"
      role="img"
      aria-label="데이터 추이"
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

      {/* 끝점 */}
      {showEndDot && (
        <>
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r={4} fill={color} />
          <circle
            cx={lastPoint[0]}
            cy={lastPoint[1]}
            r={3}
            fill={color}
            stroke="var(--card)"
            strokeWidth={1.5}
          />
        </>
      )}
    </svg>
  );
}
