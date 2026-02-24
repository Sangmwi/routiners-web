'use client';

interface SegmentedControlProps<T extends string> {
  options: readonly { readonly key: T; readonly label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** sm: 섹션 레벨 (기본), md: 페이지 레벨, lg: 강조 배치 */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { button: 'px-2.5 py-1 text-xs', container: 'p-0.5' },
  md: { button: 'px-3 py-1.5 text-xs', container: 'p-0.5' },
  lg: { button: 'px-3.5 py-2 text-sm', container: 'p-1' },
} as const;

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
}: SegmentedControlProps<T>) {
  const { button, container } = SIZE_CONFIG[size];

  return (
    <div className={`flex items-center bg-surface-muted rounded-lg ${container}`}>
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`${button} font-medium rounded-md transition-all ${
            value === key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
