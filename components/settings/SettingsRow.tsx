'use client';

import type { ReactNode } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

interface SettingsRowProps {
  icon?: Icon;
  label: string;
  description?: string;
  accessory?: 'chevron' | 'toggle' | ReactNode;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
  destructive?: boolean;
}

export default function SettingsRow({
  icon: IconComponent,
  label,
  description,
  accessory = 'chevron',
  toggleValue,
  onToggle,
  onClick,
  destructive,
}: SettingsRowProps) {
  const isToggle = accessory === 'toggle';
  const isChevron = accessory === 'chevron';
  const isCustom = !isToggle && !isChevron;

  const handleClick = () => {
    if (isToggle && onToggle !== undefined && toggleValue !== undefined) {
      onToggle(!toggleValue);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
    >
      {IconComponent && (
        <IconComponent
          size={20}
          weight="regular"
          className={destructive ? 'text-destructive' : 'text-muted-foreground'}
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            destructive ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {isChevron && (
        <CaretRightIcon size={16} className="text-muted-foreground/50 flex-shrink-0" />
      )}
      {isToggle && (
        <div
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            toggleValue ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              toggleValue ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </div>
      )}
      {isCustom && accessory}
    </button>
  );
}
