'use client';

import { useState } from 'react';
import { BuildingsIcon, MagnifyingGlassIcon, CheckIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import SearchablePickerSheet from '@/components/ui/SearchablePickerSheet';
import { UNITS } from '@/lib/constants/units';

interface UnitStepProps {
  selectedUnitId: string;
  selectedUnitName: string;
  onNext: (unitId: string, unitName: string) => void;
}

/**
 * UnitStep
 *
 * 소속 부대 선택 (토스식)
 * - 바텀시트에서 검색/선택
 * - 선택 후 카드로 표시
 */
export function UnitStep({
  selectedUnitId,
  selectedUnitName,
  onNext,
}: UnitStepProps) {
  const [unitId, setUnitId] = useState(selectedUnitId);
  const [unitName, setUnitName] = useState(selectedUnitName);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const activeUnits = UNITS.filter((u) => u.isActive);

  const isValid = unitId && unitName;

  const handleNext = () => {
    if (isValid) {
      onNext(unitId, unitName);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-surface-accent flex items-center justify-center">
                <BuildingsIcon size={24} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              소속 부대가 어디인가요?
            </h2>
            <p className="text-muted-foreground">
              현재 복무 중인 부대를 선택해 주세요
            </p>
          </div>

          {/* Selection trigger */}
          <div>
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className={`
                w-full min-h-[72px] px-4 py-4
                flex items-center gap-4
                rounded-xl border-2 transition-all duration-200
                ${
                  unitName
                    ? 'border-primary bg-surface-accent'
                    : 'border-border bg-card hover:border-edge-subtle'
                }
              `}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <MagnifyingGlassIcon size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                {unitName ? (
                  <>
                    <span className="text-base font-medium text-foreground">
                      {unitName}
                    </span>
                  </>
                ) : (
                  <span className="text-base text-muted-foreground">
                    부대를 검색해 주세요
                  </span>
                )}
              </div>
              {unitName && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <CheckIcon size={16} className="text-primary-foreground" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 pt-6 pb-safe">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          disabled={!isValid}
        >
          다음
        </Button>
      </div>

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
            onClick={() => { setUnitId(unit.id); setUnitName(unit.name); setIsSheetOpen(false); }}
            className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
              unit.id === unitId
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
