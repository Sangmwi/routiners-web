'use client';

import type { ReactNode } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { NextIcon } from '@/components/ui/icons';

// ============================================================================
// Types
// ============================================================================

export type OptionTone = 'default' | 'primary' | 'destructive';

export interface OptionItem<T extends string = string> {
  value: T;
  title: string;
  description?: string;
  icon: ReactNode;
  tone?: OptionTone;
}

interface OptionSheetBaseProps<T extends string> {
  isOpen: boolean;
  onClose: () => void;
  /** compact: Modal title bar에 표시. card/grouped: ModalBody 내 중앙 헤더에 표시. */
  title?: string;
  /** card/grouped variant에서만 렌더링되는 부제목 */
  description?: string;
  options: OptionItem<T>[];
  onSelect: (value: T) => void;
}

type CompactProps<T extends string> = OptionSheetBaseProps<T> & {
  variant?: 'compact';
};

type CardProps<T extends string> = OptionSheetBaseProps<T> & {
  variant: 'card';
};

type GroupedProps<T extends string> = OptionSheetBaseProps<T> & {
  variant: 'grouped';
};

export type OptionSheetProps<T extends string> =
  | CompactProps<T>
  | CardProps<T>
  | GroupedProps<T>;

// ============================================================================
// Variant Item Components
// ============================================================================

function CompactItems<T extends string>({
  options,
  onSelect,
}: Pick<OptionSheetBaseProps<T>, 'options' | 'onSelect'>) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const tone = option.tone ?? 'default';
        const buttonClass =
          tone === 'primary'
            ? 'bg-primary text-primary-foreground'
            : tone === 'destructive'
              ? 'bg-surface-danger text-destructive'
              : 'bg-surface-muted text-foreground';
        const iconClass =
          tone === 'primary'
            ? ''
            : tone === 'destructive'
              ? 'text-destructive shrink-0'
              : 'text-muted-foreground shrink-0';
        const descClass =
          tone === 'primary'
            ? 'text-primary-foreground/70'
            : 'text-muted-foreground';

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium ${buttonClass}`}
          >
            <span className={iconClass}>{option.icon}</span>
            <div className="text-left">
              <p className="text-sm font-medium">{option.title}</p>
              {option.description && (
                <p className={`text-xs mt-0.5 ${descClass}`}>
                  {option.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CardItems<T extends string>({
  options,
  onSelect,
}: Pick<OptionSheetBaseProps<T>, 'options' | 'onSelect'>) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const tone = option.tone ?? 'default';
        const iconBoxClass =
          tone === 'destructive'
            ? 'bg-surface-danger text-destructive'
            : 'bg-surface-accent text-primary';
        const titleClass =
          tone === 'destructive' ? 'text-destructive' : 'text-card-foreground';

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="w-full flex items-center gap-4 p-4 bg-surface-secondary rounded-2xl hover:bg-surface-accent transition-colors text-left"
          >
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${iconBoxClass}`}
            >
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${titleClass}`}>{option.title}</p>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
            <NextIcon size="md" className="text-muted-foreground shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

function GroupedItems<T extends string>({
  options,
  onSelect,
}: Pick<OptionSheetBaseProps<T>, 'options' | 'onSelect'>) {
  return (
    <div className="bg-surface-hover rounded-2xl overflow-hidden">
      {options.map((option, idx) => {
        const tone = option.tone ?? 'default';
        const colorClass =
          tone === 'destructive' ? 'text-destructive' : 'text-foreground';
        const iconColorClass =
          tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground';

        return (
          <div key={option.value}>
            {idx > 0 && <div className="mx-5 border-t border-edge-subtle" />}
            <button
              type="button"
              onClick={() => onSelect(option.value)}
              className="w-full flex items-center justify-center gap-3 py-4 px-5 hover:bg-surface-muted active:bg-surface-pressed transition-colors"
            >
              <span className={iconColorClass}>{option.icon}</span>
              <span className={`text-base font-medium ${colorClass}`}>
                {option.title}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// OptionSheet
// ============================================================================

export default function OptionSheet<T extends string>(
  props: OptionSheetProps<T>
) {
  const { isOpen, onClose, options, onSelect, title, description } = props;
  const variant = 'variant' in props && props.variant ? props.variant : 'compact';
  const isCompact = variant === 'compact';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="auto"
      title={isCompact ? title : undefined}
      showCloseButton={isCompact ? true : false}
    >
      <ModalBody className="p-4 pb-safe">
        {!isCompact && (title || description) && (
          <div className="text-center py-1 mb-3">
            {title && (
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        )}

        {isCompact && (
          <CompactItems options={options} onSelect={onSelect} />
        )}
        {variant === 'card' && (
          <CardItems options={options} onSelect={onSelect} />
        )}
        {variant === 'grouped' && (
          <GroupedItems options={options} onSelect={onSelect} />
        )}
      </ModalBody>
    </Modal>
  );
}
