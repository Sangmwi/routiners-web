'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';

export type DateRange = 'all' | 'today' | 'week' | 'month';

const DATE_RANGE_OPTIONS: { id: DateRange; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
];

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: DateRange;
  onApply: (dateRange: DateRange) => void;
}

export default function FilterModal({
  isOpen,
  onClose,
  dateRange,
  onApply,
}: FilterModalProps) {
  const handleSelect = (range: DateRange) => {
    onApply(range);
    onClose();
  };

  const handleReset = () => {
    onApply('all');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="bottom" enableSwipe>
      <ModalBody className="p-4 pb-safe">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">필터</h3>
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              초기화
            </button>
          </div>

          {/* 기간 필터 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">기간</span>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    dateRange === option.id
                      ? 'bg-primary text-white'
                      : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 (Phase 2에서 인기순 추가) */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">정렬</span>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full px-4 py-2 text-sm font-medium bg-primary text-white">
                최신순
              </button>
              <button
                className="rounded-full px-4 py-2 text-sm font-medium bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                disabled
              >
                인기순
              </button>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
