/**
 * 레이블-값 표시 컴포넌트.
 * 세부 정보(기록 상세, InBody 결과 등)에서 반복되는
 * "작은 레이블 + 아래 값" 패턴을 단일 컴포넌트로 추출.
 *
 * @example
 * <LabelValue label="체중" value="70.5 kg" />
 */
export default function LabelValue({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
