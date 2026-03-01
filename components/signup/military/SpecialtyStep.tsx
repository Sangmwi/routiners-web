'use client';

import { useState } from 'react';
import { BriefcaseIcon, MagnifyingGlassIcon, CheckIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import SearchablePickerSheet from '@/components/ui/SearchablePickerSheet';
import { SPECIALTIES, SPECIALTY_LABELS, SPECIALTY_DESCRIPTIONS, type Specialty } from '@/lib/types/user';

interface SpecialtyStepProps {
  selectedSpecialty: Specialty | null;
  onNext: (specialty: Specialty) => void;
}

/**
 * SpecialtyStep
 *
 * 병과 선택 (토스식)
 * - 바텀시트에서 검색/선택
 * - 선택 후 카드로 표시
 */
export function SpecialtyStep({
  selectedSpecialty,
  onNext,
}: SpecialtyStepProps) {
  const [specialty, setSpecialty] = useState<Specialty | null>(selectedSpecialty);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isValid = specialty !== null;

  const handleNext = () => {
    if (isValid && specialty) {
      onNext(specialty);
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
                <BriefcaseIcon size={24} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              병과가 무엇인가요?
            </h2>
            <p className="text-muted-foreground">
              현재 근무 중인 병과를 선택해 주세요
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
                  specialty
                    ? 'border-primary bg-surface-accent'
                    : 'border-border bg-card hover:border-edge-subtle'
                }
              `}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <MagnifyingGlassIcon size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                {specialty ? (
                  <>
                    <span className="text-base font-medium text-foreground">
                      {SPECIALTY_LABELS[specialty]}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {SPECIALTY_DESCRIPTIONS[specialty]}
                    </p>
                  </>
                ) : (
                  <span className="text-base text-muted-foreground">
                    병과를 선택해 주세요
                  </span>
                )}
              </div>
              {specialty && (
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
        title="병과 선택"
        items={SPECIALTIES}
        filterFn={(s, q) =>
          SPECIALTY_LABELS[s].toLowerCase().includes(q) ||
          SPECIALTY_DESCRIPTIONS[s].toLowerCase().includes(q)
        }
        getKey={(s) => s}
        renderItem={(s) => (
          <button
            type="button"
            onClick={() => { setSpecialty(s); setIsSheetOpen(false); }}
            className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
              s === specialty
                ? 'bg-surface-accent border-2 border-primary'
                : 'bg-surface-secondary border-2 border-transparent hover:bg-surface-muted'
            }`}
          >
            <p className="font-medium text-foreground">{SPECIALTY_LABELS[s]}</p>
            <p className="text-sm text-muted-foreground">{SPECIALTY_DESCRIPTIONS[s]}</p>
          </button>
        )}
        placeholder="병과명으로 검색"
        height="half"
      />
    </div>
  );
}
