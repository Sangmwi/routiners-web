/**
 * 변화량 표시 컴포넌트
 *
 * 양수/음수 변화를 색상으로 구분하여 표시
 * - positiveIsGood=true: 양수 → 초록, 음수 → 빨강 (예: 3대 중량, 골격근량)
 * - positiveIsGood=false: 양수 → 빨강, 음수 → 초록 (예: 체중, 체지방률)
 */

interface ChangeIndicatorProps {
  /** 변화량 수치 */
  value: number;
  /** 양수가 긍정적인지 여부 */
  positiveIsGood: boolean;
}

export default function ChangeIndicator({ value, positiveIsGood }: ChangeIndicatorProps) {
  if (value === 0) return null;

  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  return (
    <span className={`text-[10px] font-medium ${isGood ? 'text-positive' : 'text-negative'}`}>
      {isPositive ? '+' : ''}{Number.isInteger(value) ? value : value.toFixed(1)}
    </span>
  );
}
