'use client';

import { useState, type ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { CheckIcon, XIcon, PlusIcon } from '@phosphor-icons/react';

// ============================================================================
// ProfileFormSelectOption
// ============================================================================

interface ProfileFormSelectOptionProps<T extends string | number> {
  value?: T;
  label: string;
  description?: string;
  icon?: Icon;
  selected: boolean;
  onClick: () => void;
}

export function ProfileFormSelectOption<T extends string | number>({
  label,
  description,
  icon: IconComponent,
  selected,
  onClick,
}: ProfileFormSelectOptionProps<T>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.97] ${
        selected
          ? 'bg-surface-accent ring-1.5 ring-accent'
          : 'bg-surface-muted text-muted-foreground hover:bg-surface-pressed'
      }`}
    >
      {IconComponent && (
        <IconComponent
          size={18}
          className={selected ? 'text-primary' : 'text-muted-foreground'}
          weight={selected ? 'fill' : 'regular'}
        />
      )}
      <div className="min-w-0">
        <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>
          {label}
        </span>
        {description && (
          <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// ProfileFormNumberOption (원형 숫자 버튼)
// ============================================================================

interface ProfileFormNumberOptionProps {
  value: number;
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: 'circle' | 'pill';
}

export function ProfileFormNumberOption({
  label,
  selected,
  onClick,
  variant = 'circle',
}: ProfileFormNumberOptionProps) {
  const baseClass = variant === 'circle'
    ? 'flex-shrink-0 w-11 h-11 rounded-full'
    : 'flex-shrink-0 px-3 h-11 rounded-full';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${baseClass} text-sm font-semibold transition-all active:scale-95 ${
        selected
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
          : 'bg-surface-muted text-muted-foreground hover:bg-surface-pressed'
      }`}
    >
      {label}
    </button>
  );
}

// ============================================================================
// ProfileFormChipOption
// ============================================================================

interface ProfileFormChipOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function ProfileFormChipOption({
  label,
  selected,
  onClick,
}: ProfileFormChipOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
        selected
          ? 'bg-surface-accent-strong text-primary ring-1 ring-accent'
          : 'bg-surface-muted text-muted-foreground hover:bg-surface-pressed'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 transition-all ${
          selected
            ? 'bg-primary text-primary-foreground'
            : 'border-2 border-muted-foreground/40'
        }`}
      >
        {selected && <CheckIcon size={10} weight="bold" />}
      </span>
      {label}
    </button>
  );
}

// ============================================================================
// ProfileFormSection
// ============================================================================

interface ProfileFormSectionProps {
  title: string;
  description?: string;
  optional?: boolean;
  children: ReactNode;
}

export function ProfileFormSection({
  title,
  description,
  optional = false,
  children,
}: ProfileFormSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">{title}</label>
          {optional && (
            <span className="text-[10px] text-muted-foreground/70 bg-surface-hover px-1.5 py-0.5 rounded">
              선택
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// ProfileFormTagInput
// ============================================================================

interface ProfileFormTagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function ProfileFormTagInput({
  value,
  onChange,
  placeholder,
}: ProfileFormTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !inputValue.trim()) return;
    event.preventDefault();
    addTag();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-3 rounded-xl bg-surface-muted border border-edge-faint text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-accent focus:border-edge-faint outline-none transition-all"
        />
        {inputValue.trim() && (
          <button
            type="button"
            onClick={addTag}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-accent flex items-center justify-center transition-colors hover:bg-surface-accent-strong"
          >
            <PlusIcon size={14} className="text-primary" weight="bold" />
          </button>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-surface-muted text-sm text-foreground animate-tag-in"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="w-5 h-5 rounded-full bg-muted-foreground/15 flex items-center justify-center hover:bg-surface-danger transition-colors"
              >
                <XIcon size={10} className="text-muted-foreground" weight="bold" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
