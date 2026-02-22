'use client';

import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';

interface ProfileFormSelectOptionProps<T extends string | number> {
  value?: T;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function ProfileFormSelectOption<T extends string | number>({
  label,
  selected,
  onClick,
}: ProfileFormSelectOptionProps<T>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        selected
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );
}

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
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {selected && <CheckIcon size={12} />}
      {label}
    </button>
  );
}

interface ProfileFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ProfileFormSection({
  title,
  description,
  children,
}: ProfileFormSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !inputValue.trim()) return;

    event.preventDefault();
    const nextValue = inputValue.trim();
    if (!value.includes(nextValue)) {
      onChange([...value, nextValue]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-muted border-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

