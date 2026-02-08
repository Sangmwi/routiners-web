'use client';

import { SelectHTMLAttributes } from 'react';
import { ExpandIcon } from '@/components/ui/icons';

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

/**
 * 재사용 가능한 폼 셀렉트 컴포넌트
 * 일관된 스타일과 접근성을 제공합니다.
 */
export default function FormSelect({ label, error, options, ...props }: FormSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-card-foreground font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          className="w-full px-4 py-3 rounded-xl bg-muted/20 border border-border text-sm text-card-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ExpandIcon size="sm" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
