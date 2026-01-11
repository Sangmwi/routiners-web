'use client';

interface FormSliderProps {
  /** 슬라이더 라벨 */
  label: string;
  /** 현재 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChange: (value: string) => void;
  /** 최소값 */
  min: number;
  /** 최대값 */
  max: number;
  /** 단위 (예: cm, kg) */
  unit: string;
  /** 스텝 (기본값: 1) */
  step?: number;
  /** 기본값 (값이 없을 때 슬라이더 위치) */
  defaultValue?: number;
}

/**
 * 폼 슬라이더 컴포넌트
 *
 * 라벨, 현재 값, 범위 표시가 포함된 재사용 가능한 슬라이더
 *
 * @example
 * ```tsx
 * <FormSlider
 *   label="신장"
 *   value={height}
 *   onChange={setHeight}
 *   min={140}
 *   max={200}
 *   unit="cm"
 *   defaultValue={175}
 * />
 * ```
 */
export default function FormSlider({
  label,
  value,
  onChange,
  min,
  max,
  unit,
  step = 1,
  defaultValue,
}: FormSliderProps) {
  const numericValue = value ? Number(value) : (defaultValue ?? min);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">
          {value || '-'} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numericValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
