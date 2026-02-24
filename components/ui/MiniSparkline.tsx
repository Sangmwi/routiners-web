/**
 * MiniSparkline - 순수 SVG 스파크라인 차트
 *
 * 외부 차트 라이브러리 없이 경량 SVG로 구현
 * 시계열 데이터의 추이를 한눈에 보여주는 미니 그래프
 * interactive 모드: 터치/마우스 크로스헤어 + 툴팁
 */

'use client';

import { useId, useState, useRef } from 'react';

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
  /** 차트 하단에 최소/최대값 레이블 표시 */
  showMinMax?: boolean;
  /** 시작/끝 날짜 레이블 [시작, 끝] */
  dateRange?: [string, string];
  /** Y축 그리드 라인 + 수치 레이블 오버레이 */
  showYAxis?: boolean;
  /** 라인 투명도 (0-1, 기본: 1) - 점에는 영향 없음 */
  lineOpacity?: number;
  /** 값 포맷 함수 (기본: 소수 1자리) */
  formatValue?: (v: number) => string;
  /** 터치/마우스 크로스헤어 인터랙션 활성화 */
  interactive?: boolean;
  /** 각 데이터 포인트의 레이블 (날짜 등, interactive 모드 툴팁용) */
  pointLabels?: string[];
  /** X축 시간 값 (ms timestamp 등). 제공 시 시간 비례 간격 적용, 없으면 균등 배치 */
  xValues?: number[];
  /** 값 단위 (interactive 모드 툴팁용) */
  unit?: string;
  /** 추가 className */
  className?: string;
}

/**
 * 데이터 범위에 맞는 깔끔한 눈금 값 계산
 * Nice numbers algorithm: 1, 2, 5의 배수로 반올림
 */
function niceScale(dataMin: number, dataMax: number, maxTicks = 5): number[] {
  if (dataMin === dataMax) {
    const v = dataMin;
    const offset = v === 0 ? 1 : Math.pow(10, Math.floor(Math.log10(Math.abs(v))));
    return [v - offset, v, v + offset];
  }

  const range = dataMax - dataMin;
  const roughStep = range / (maxTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep: number;
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3) niceStep = 2 * magnitude;
  else if (residual <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(dataMin / niceStep) * niceStep;
  const niceMax = Math.ceil(dataMax / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.001; v += niceStep) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
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
  showYAxis = false,
  lineOpacity = 1,
  formatValue = defaultFormat,
  interactive = false,
  pointLabels,
  xValues,
  unit = '',
  className = '',
}: MiniSparklineProps) {
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 하단에 레이블이 필요한지
  const hasLabelsBelow = (showMinMax && !showYAxis) || !!dateRange;

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

  // showYAxis일 때 niceScale로 확장된 범위 사용
  const ticks = showYAxis && minVal !== maxVal ? niceScale(minVal, maxVal) : [];
  const scaleMin = ticks.length > 0 ? ticks[0] : minVal;
  const scaleMax = ticks.length > 0 ? ticks[ticks.length - 1] : maxVal;
  const scaleRange = scaleMax - scaleMin || 1;

  // X축: xValues 제공 시 시간 비례 배치, 아니면 균등 배치
  const xMin = xValues ? xValues[0] : 0;
  const xMax = xValues ? xValues[xValues.length - 1] : data.length - 1;
  const xRange = xMax - xMin || 1;

  // 데이터 → SVG 좌표
  const points: [number, number][] = data.map((val, i) => [
    padX + (data.length === 1 ? chartW / 2 : ((xValues ? xValues[i] : i) - xMin) / xRange * chartW),
    padY + chartH - ((val - scaleMin) / scaleRange) * chartH,
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

  // --- Interactive 핸들러 ---
  const getIndexFromX = (clientX: number): number | null => {
    const el = containerRef.current;
    if (!el || data.length < 2) return null;
    const rect = el.getBoundingClientRect();
    const relX = clientX - rect.left;
    const pct = relX / rect.width;
    const idx = Math.round(pct * (data.length - 1));
    return Math.max(0, Math.min(data.length - 1, idx));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setActiveIndex(getIndexFromX(e.touches[0].clientX));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setActiveIndex(getIndexFromX(e.touches[0].clientX));
  };

  const handleTouchEnd = () => {
    setActiveIndex(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setActiveIndex(getIndexFromX(e.clientX));
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className={className} role="img" aria-label="데이터 추이">
      {/* 차트 영역 */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{
          height,
          touchAction: interactive ? 'pan-y' : undefined,
        }}
        onTouchStart={interactive ? handleTouchStart : undefined}
        onTouchMove={interactive ? handleTouchMove : undefined}
        onTouchEnd={interactive ? handleTouchEnd : undefined}
        onMouseMove={interactive ? handleMouseMove : undefined}
        onMouseLeave={interactive ? handleMouseLeave : undefined}
      >
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {gradientFill && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15 * lineOpacity} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}

          {/* 그리드 라인 */}
          {ticks.map((tick) => {
            const y = padY + chartH - ((tick - scaleMin) / scaleRange) * chartH;
            return (
              <line
                key={tick}
                x1={0}
                y1={y}
                x2={viewWidth}
                y2={y}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.1}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

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
            strokeOpacity={lineOpacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Y축 레이블 (오버레이) */}
        {ticks.map((tick) => {
          const yPct = ((padY + chartH - ((tick - scaleMin) / scaleRange) * chartH) / viewHeight) * 100;
          return (
            <span
              key={tick}
              className="absolute left-1 -translate-y-1/2 text-[9px] leading-none text-hint-faint pointer-events-none"
              style={{ top: `${yPct}%` }}
            >
              {formatValue(tick)}
            </span>
          );
        })}

        {/* 모든 점 표시 - HTML 오버레이 */}
        {showAllDots && points.map((pt, i) => {
          const pos = toPercent(pt[0], pt[1]);
          const isLast = i === points.length - 1;
          const isCompact = height <= 32;
          const dotSize = isLast ? (isCompact ? 5 : 7) : (isCompact ? 3.5 : 5);
          const ringWidth = isCompact ? 1 : 1.5;
          // interactive 모드에서 활성 포인트가 아닌 점은 더 투명하게
          const isActive = activeIndex === i;
          const dotOpacity = interactive && activeIndex !== null && !isActive && !isLast ? 0.3 : (isLast ? 1 : 0.6);
          return (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                left: pos.left,
                top: pos.top,
                width: dotSize,
                height: dotSize,
                backgroundColor: color,
                opacity: dotOpacity,
                ...(isLast ? { boxShadow: `0 0 0 ${ringWidth}px var(--card)` } : {}),
              }}
            />
          );
        })}

        {/* 끝점 dot만 (showAllDots가 아닐 때) */}
        {showEndDot && !showAllDots && (() => {
          const isCompact = height <= 32;
          const dotSize = isCompact ? 3.5 : 7;
          return (
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                left: lastPos.left,
                top: lastPos.top,
                width: dotSize,
                height: dotSize,
                backgroundColor: color,
                boxShadow: `0 0 0 ${isCompact ? 1 : 1.5}px var(--card)`,
              }}
            />
          );
        })()}

        {/* 크로스헤어 라인 */}
        {interactive && activeIndex !== null && (() => {
          const pt = points[activeIndex];
          const leftPct = (pt[0] / viewWidth) * 100;
          return (
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none"
              style={{
                left: `${leftPct}%`,
                backgroundColor: 'var(--muted-foreground)',
                opacity: 0.3,
              }}
            />
          );
        })()}

        {/* 활성 점 하이라이트 */}
        {interactive && activeIndex !== null && (() => {
          const pt = points[activeIndex];
          const pos = toPercent(pt[0], pt[1]);
          return (
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                left: pos.left,
                top: pos.top,
                width: 9,
                height: 9,
                backgroundColor: color,
                boxShadow: `0 0 0 2px var(--card), 0 0 0 3px ${color}`,
              }}
            />
          );
        })()}

        {/* 툴팁 */}
        {interactive && activeIndex !== null && (() => {
          const pt = points[activeIndex];
          const leftPct = (pt[0] / viewWidth) * 100;
          const topPct = (pt[1] / viewHeight) * 100;

          // 좌우 가장자리 클램핑
          let translateX = '-50%';
          if (leftPct < 15) translateX = '0%';
          else if (leftPct > 85) translateX = '-100%';

          // 상단에 공간이 부족하면 아래에 표시
          const showBelow = topPct < 25;
          const offsetPx = 14;

          return (
            <div
              className="absolute pointer-events-none z-10 px-2 py-1 rounded-lg bg-foreground/90 text-[10px] leading-tight whitespace-nowrap"
              style={{
                left: `${leftPct}%`,
                ...(showBelow
                  ? { top: `calc(${topPct}% + ${offsetPx}px)`, transform: `translateX(${translateX})` }
                  : { top: `calc(${topPct}% - ${offsetPx}px)`, transform: `translateX(${translateX}) translateY(-100%)` }
                ),
                color: 'var(--card)',
              }}
            >
              <span className="font-medium">{formatValue(data[activeIndex])}</span>
              {unit && <span className="ml-0.5 opacity-70">{unit}</span>}
              {pointLabels?.[activeIndex] && (
                <span className="ml-1.5 opacity-50">{pointLabels[activeIndex]}</span>
              )}
            </div>
          );
        })()}
      </div>

      {/* 차트 하단 레이블 영역 */}
      {hasLabelsBelow && (
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="text-[9px] leading-none text-hint-strong">
            {showMinMax && !showYAxis && minVal !== maxVal && (
              <span>최소 {formatValue(minVal)}</span>
            )}
            {dateRange && (
              <span className={showMinMax && !showYAxis && minVal !== maxVal ? ' ml-1 text-hint-faint' : ''}>
                {dateRange[0]}
              </span>
            )}
          </div>
          <div className="text-[9px] leading-none text-hint-strong text-right">
            {showMinMax && !showYAxis && minVal !== maxVal && (
              <span>최대 {formatValue(maxVal)}</span>
            )}
            {dateRange && (
              <span className={showMinMax && !showYAxis && minVal !== maxVal ? ' ml-1 text-hint-faint' : ''}>
                {dateRange[1]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
