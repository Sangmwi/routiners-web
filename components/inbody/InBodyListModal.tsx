'use client';

import { CalendarIcon } from '@phosphor-icons/react';
import { NextIcon, LoadingSpinner, AddIcon } from '@/components/ui/icons';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { InBodyRecord } from '@/lib/types/inbody';
import { useInBodyRecords } from '@/hooks/inbody';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

interface InBodyListModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 기록 선택 시 콜백 */
  onSelect?: (record: InBodyRecord) => void;
  /** 새로 추가 버튼 클릭 시 콜백 */
  onAddNew?: () => void;
}

export default function InBodyListModal({
  isOpen,
  onClose,
  onSelect,
  onAddNew,
}: InBodyListModalProps) {
  const { data: records = [], isPending: isLoading } = useInBodyRecords(50, 0, {
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="인바디 기록" size="lg" position="bottom" enableSwipe>
      <ModalBody className="min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="xl" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarIcon size={48} className="text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-card-foreground">
              아직 인바디 기록이 없어요
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              인바디 결과지를 스캔해서 기록을 추가해보세요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {records.map((record) => (
              <InBodyListItem
                key={record.id}
                record={record}
                onClick={() => onSelect?.(record)}
              />
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="flex-1">
          닫기
        </Button>
        {onAddNew && (
          <Button onClick={onAddNew} className="flex-1">
            <AddIcon size="sm" className="mr-2" />
            새 기록 추가
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// 개별 기록 아이템
function InBodyListItem({
  record,
  onClick,
}: {
  record: InBodyRecord;
  onClick: () => void;
}) {
  // 날짜 포맷
  const formattedDate = formatKoreanDate(record.measuredAt);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/20 transition-colors text-left"
    >
      <div className="flex-1">
        <p className="font-medium text-card-foreground">{formattedDate}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span>체중 {record.weight}kg</span>
          <span className="text-border">·</span>
          <span>골격근 {record.skeletalMuscleMass}kg</span>
          <span className="text-border">·</span>
          <span>체지방률 {record.bodyFatPercentage}%</span>
        </div>
        {record.inbodyScore && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              점수 {record.inbodyScore}점
            </span>
          </div>
        )}
      </div>
      <NextIcon size="md" className="text-muted-foreground shrink-0" />
    </button>
  );
}
