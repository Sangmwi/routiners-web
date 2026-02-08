'use client';

import { useState } from 'react';
import { BriefcaseIcon, MagnifyingGlassIcon, CheckIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Modal, { ModalBody } from '@/components/ui/Modal';
import type { Specialty } from '@/lib/types/user';

interface SpecialtyStepProps {
  selectedSpecialty: Specialty | null;
  onNext: (specialty: Specialty) => void;
}

const SPECIALTIES: { value: Specialty; label: string; description: string }[] = [
  { value: '보병', label: '보병', description: '지상 전투의 핵심 병과' },
  { value: '포병', label: '포병', description: '화력 지원 병과' },
  { value: '기갑', label: '기갑', description: '전차 및 장갑차 운용' },
  { value: '공병', label: '공병', description: '건설 및 장애물 처리' },
  { value: '정보통신', label: '정보통신', description: '통신 체계 운용' },
  { value: '항공', label: '항공', description: '항공기 운용 및 정비' },
  { value: '화생방', label: '화생방', description: '화학, 생물학, 방사능 방호' },
  { value: '병참', label: '병참', description: '보급 및 군수 지원' },
  { value: '의무', label: '의무', description: '의료 및 위생 지원' },
  { value: '법무', label: '법무', description: '군 법률 업무' },
  { value: '행정', label: '행정', description: '인사 및 행정 업무' },
  { value: '기타', label: '기타', description: '그 외 병과' },
];

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecialties = searchQuery.trim()
    ? SPECIALTIES.filter((s) => {
        const query = searchQuery.toLowerCase();
        return (
          s.label.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
        );
      })
    : SPECIALTIES;

  const handleSelect = (value: Specialty) => {
    setSpecialty(value);
    setIsSheetOpen(false);
    setSearchQuery('');
  };

  const selectedInfo = specialty
    ? SPECIALTIES.find((s) => s.value === specialty)
    : null;

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
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
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
                  selectedInfo
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <MagnifyingGlassIcon size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                {selectedInfo ? (
                  <>
                    <span className="text-base font-medium text-foreground">
                      {selectedInfo.label}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {selectedInfo.description}
                    </p>
                  </>
                ) : (
                  <span className="text-base text-muted-foreground">
                    병과를 선택해 주세요
                  </span>
                )}
              </div>
              {selectedInfo && (
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

      {/* Bottom Sheet Modal */}
      <Modal
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setSearchQuery('');
        }}
        title="병과 선택"
        position="bottom"
        enableSwipe
        height="half"
        size="lg"
      >
        <ModalBody>
          {/* Search input */}
          <div className="sticky top-0 bg-card px-4 pb-4 pt-2 border-b border-border">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="병과명으로 검색"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Specialty list */}
          <div className="space-y-2 p-4">
            {filteredSpecialties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                검색 결과가 없어요
              </div>
            ) : (
              filteredSpecialties.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelect(item.value)}
                  className={`
                    w-full px-4 py-3 rounded-xl text-left transition-all
                    ${
                      item.value === specialty
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-muted/20 border-2 border-transparent hover:bg-muted/50'
                    }
                  `}
                >
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </button>
              ))
            )}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
