'use client';

import { useState } from 'react';
import { Building2, Search, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal, { ModalBody } from '@/components/ui/Modal';
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
  const [searchQuery, setSearchQuery] = useState('');

  const activeUnits = UNITS.filter((u) => u.isActive);

  const filteredUnits = searchQuery.trim()
    ? activeUnits.filter((unit) => {
        const query = searchQuery.toLowerCase();
        return (
          unit.name.toLowerCase().includes(query) ||
          unit.region?.toLowerCase().includes(query)
        );
      })
    : activeUnits;

  const handleSelect = (id: string, name: string) => {
    setUnitId(id);
    setUnitName(name);
    setIsSheetOpen(false);
    setSearchQuery('');
  };

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
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
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
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-muted-foreground" />
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
                  <Check className="w-4 h-4 text-primary-foreground" />
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

      {/* Bottom Sheet Modal */}
      <Modal
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setSearchQuery('');
        }}
        title="소속 부대 검색"
        position="bottom"
        enableSwipe
        height="full"
        size="lg"
      >
        <ModalBody className="p-0">
          {/* Search input */}
          <div className="sticky top-0 bg-card px-4 pb-4 pt-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="부대명 또는 지역으로 검색"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Unit list */}
          <div className="space-y-2 p-4">
            {filteredUnits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                검색 결과가 없습니다
              </div>
            ) : (
              filteredUnits.slice(0, 50).map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => handleSelect(unit.id, unit.name)}
                  className={`
                    w-full px-4 py-3 rounded-xl text-left transition-all
                    ${
                      unit.id === unitId
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                    }
                  `}
                >
                  <p className="font-medium text-foreground">{unit.name}</p>
                  {unit.region && (
                    <p className="text-sm text-muted-foreground">{unit.region}</p>
                  )}
                </button>
              ))
            )}

            {filteredUnits.length > 50 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                검색어를 더 입력해 주세요 ({filteredUnits.length - 50}개 더 있음)
              </p>
            )}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
