'use client';

interface SegmentedControlProps<T extends string> {
  options: readonly { readonly key: T; readonly label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** sm: 섹션 레벨 (기본), md: 페이지 레벨 */
  size?: 'sm' | 'md';
}

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-xs',
} as const;

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
}: SegmentedControlProps<T>) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`${sizeClass} font-medium rounded-md transition-all ${
            value === key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
