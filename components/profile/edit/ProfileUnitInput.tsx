'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import SearchablePickerSheet from '@/components/ui/SearchablePickerSheet';
import { UNITS } from '@/lib/constants/units';

interface ProfileUnitInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProfileUnitInput({ value, onChange }: ProfileUnitInputProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeUnits = UNITS.filter((u) => u.isActive);

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">부대</label>

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
        <span className={`flex-1 text-sm ${value ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {value || '부대를 검색해 주세요'}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange(''); } }}
            className="p-0.5 rounded-full hover:bg-muted cursor-pointer"
          >
            <XIcon size={14} className="text-muted-foreground" />
          </span>
        ) : null}
      </button>

      <SearchablePickerSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="소속 부대 검색"
        items={activeUnits}
        filterFn={(unit, q) =>
          unit.name.toLowerCase().includes(q) ||
          (unit.region?.toLowerCase().includes(q) ?? false)
        }
        getKey={(unit) => unit.id}
        renderItem={(unit) => (
          <button
            type="button"
            onClick={() => { onChange(unit.name); setIsSheetOpen(false); }}
            className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
              unit.name === value
                ? 'bg-surface-accent border-2 border-primary'
                : 'bg-surface-secondary border-2 border-transparent hover:bg-surface-muted'
            }`}
          >
            <p className="font-medium text-foreground">{unit.name}</p>
            {unit.region && (
              <p className="text-sm text-muted-foreground">{unit.region}</p>
            )}
          </button>
        )}
        placeholder="부대명 또는 지역으로 검색"
        maxResults={50}
        height="full"
      />
    </div>
  );
}
