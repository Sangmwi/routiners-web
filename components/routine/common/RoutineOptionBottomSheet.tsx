'use client';

import { XIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';

export interface RoutineOptionItem<TOption extends string> {
  value: TOption;
  title: string;
  description?: string;
  icon: ReactNode;
  primary?: boolean;
}

interface RoutineOptionBottomSheetProps<TOption extends string> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: RoutineOptionItem<TOption>[];
  onSelect: (option: TOption) => void;
}

export default function RoutineOptionBottomSheet<TOption extends string>({
  isOpen,
  onClose,
  title,
  options,
  onSelect,
}: RoutineOptionBottomSheetProps<TOption>) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="auto"
      showCloseButton={false}
    >
      <ModalBody className="p-4 pb-safe">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground"
            aria-label="닫기"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium ${
                option.primary
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-foreground'
              }`}
            >
              <span className={option.primary ? '' : 'text-muted-foreground shrink-0'}>
                {option.icon}
              </span>
              <div className="text-left">
                <p className="text-sm font-medium">{option.title}</p>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ModalBody>
    </Modal>
  );
}
