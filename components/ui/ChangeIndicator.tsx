/**
 * 변화량 표시 컴포넌트
 *
 * 양수/음수 변화를 색상으로 구분하여 표시
 * - positiveIsGood=true: 양수 → 초록, 음수 → 빨강 (예: 3대 중량, 골격근량)
 * - positiveIsGood=false: 양수 → 빨강, 음수 → 초록 (예: 체중, 체지방률)
 */

/** 변화량 방향에 따른 CSS 변수 색상 반환 (스파크라인 등에서 재사용) */
export function getTrendColor(change: number | undefined | null, positiveIsGood: boolean): string {
  if (change == null || change === 0) return 'var(--primary)';
  const isGood = positiveIsGood ? change > 0 : change < 0;
  return isGood ? 'var(--positive)' : 'var(--negative)';
}

interface ChangeIndicatorProps {
  /** 변화량 수치 */
  value: number;
  /** 양수가 긍정적인지 여부 */
  positiveIsGood: boolean;
  /** 단위 (예: "kg", "%") */
  unit?: string;
}

export default function ChangeIndicator({ value, positiveIsGood, unit }: ChangeIndicatorProps) {
  if (value === 0) return null;

  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const formatted = Number.isInteger(value) ? value : value.toFixed(1);

  return (
    <span className={`text-[10px] font-medium ${isGood ? 'text-positive' : 'text-negative'}`}>
      {isPositive ? '+' : ''}{formatted}{unit ?? ''}
    </span>
  );
}
