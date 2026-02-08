'use client';

import { InputHTMLAttributes } from 'react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
}

/**
 * 재사용 가능한 폼 입력 컴포넌트
 * 일관된 스타일과 접근성을 제공합니다.
 */
export default function FormInput({ label, error, ...props }: FormInputProps) {
  // Ensure value is always defined to prevent controlled/uncontrolled switch
  const inputProps = {
    ...props,
    value: props.value ?? '',
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-card-foreground font-medium">
          {label}
        </label>
      )}
      <input
        {...inputProps}
        className="w-full px-4 py-3 rounded-xl bg-muted/20 border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
