'use client';

import { useState } from 'react';
import Big3RecordList from '@/components/big3/Big3RecordList';
import Big3DetailSheet from '@/components/big3/Big3DetailSheet';
import { useInfiniteBig3RecordsSuspense } from '@/hooks/big3';
import type { Big3Record, Big3LiftType } from '@/lib/types/big3';

interface Big3RecordSectionProps {
  selectedLiftType: Big3LiftType | undefined;
}

export default function Big3RecordSection({ selectedLiftType }: Big3RecordSectionProps) {
  const {
    data: recordsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteBig3RecordsSuspense(selectedLiftType);
  const records = recordsData.pages.flatMap((page) => page.records);

  const [selectedRecord, setSelectedRecord] = useState<Big3Record | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openDetailModal = (record: Big3Record) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <>
      <Big3RecordList
        records={records}
        onRecordClick={openDetailModal}
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
      {selectedRecord && (
        <Big3DetailSheet
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          record={selectedRecord}
        />
      )}
    </>
  );
}
