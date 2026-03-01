'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import SearchablePickerSheet from '@/components/ui/SearchablePickerSheet';
import { SPECIALTIES, SPECIALTY_LABELS, SPECIALTY_DESCRIPTIONS, type Specialty } from '@/lib/types/user';

interface ProfileSpecialtyInputProps {
  value: Specialty;
  onChange: (value: Specialty) => void;
}

export default function ProfileSpecialtyInput({ value, onChange }: ProfileSpecialtyInputProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">병과</label>

      {/* 트리거 카드 */}
      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        className={`w-full px-4 py-3 flex items-center gap-3 rounded-xl border-1 transition-all text-left ${
          value
            ? 'border-primary bg-surface-accent'
            : 'border-border bg-card hover:border-edge-subtle'
        }`}
      >
        <MagnifyingGlassIcon size={18} className="text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {value ? (
            <>
              <span className="text-sm font-medium text-foreground">{SPECIALTY_LABELS[value]}</span>
              <p className="text-xs text-muted-foreground">{SPECIALTY_DESCRIPTIONS[value]}</p>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">병과를 선택해 주세요</span>
          )}
        </div>
      </button>

      <SearchablePickerSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="병과 선택"
        items={SPECIALTIES}
        filterFn={(s, q) =>
          SPECIALTY_LABELS[s].toLowerCase().includes(q) ||
          SPECIALTY_DESCRIPTIONS[s].toLowerCase().includes(q)
        }
        getKey={(s) => s}
        renderItem={(specialty) => (
          <button
            type="button"
            onClick={() => { onChange(specialty); setIsSheetOpen(false); }}
            className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
              specialty === value
                ? 'bg-surface-accent border-2 border-primary'
                : 'bg-surface-secondary border-2 border-transparent hover:bg-surface-muted'
            }`}
          >
            <p className="font-medium text-foreground">{SPECIALTY_LABELS[specialty]}</p>
            <p className="text-sm text-muted-foreground">{SPECIALTY_DESCRIPTIONS[specialty]}</p>
          </button>
        )}
        placeholder="병과명으로 검색"
        height="half"
      />
    </div>
  );
}
