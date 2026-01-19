'use client';

import { useState } from 'react';
import { CalendarIcon } from '@phosphor-icons/react';
import { AddIcon, NextIcon, LoadingSpinner, DeleteIcon, ErrorIcon } from '@/components/ui/icons';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useShowError } from '@/lib/stores/errorStore';
import { InBodyRecord } from '@/lib/types/inbody';
import { useInBodyRecords, useDeleteInBody } from '@/hooks/inbody';
import InBodyScanModal from './InBodyScanModal';
import InBodyDetailModal from './InBodyDetailModal';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

interface InBodyManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ManageState = 'list' | 'confirm-delete';

export default function InBodyManageModal({
  isOpen,
  onClose,
}: InBodyManageModalProps) {
  const [state, setState] = useState<ManageState>('list');
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<InBodyRecord | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const showError = useShowError();

  const { data: records = [], isPending: isLoading } = useInBodyRecords(50, 0, {
    enabled: isOpen,
  });

  const deleteInBody = useDeleteInBody();

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setState('list');
    setSelectedRecord(null);
    setRecordToDelete(null);
    onClose();
  };

  // 기록 클릭 → 상세 보기
  const handleRecordClick = (record: InBodyRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = (e: React.MouseEvent, record: InBodyRecord) => {
    e.stopPropagation();
    setRecordToDelete(record);
    setState('confirm-delete');
  };

  // 삭제 확인
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;

    deleteInBody.mutate(recordToDelete.id, {
      onSuccess: () => {
        setState('list');
        setRecordToDelete(null);
      },
      onError: () => {
        showError('기록 삭제에 실패했습니다');
      },
    });
  };

  // 삭제 취소
  const handleCancelDelete = () => {
    setState('list');
    setRecordToDelete(null);
  };

  // 스캔 성공 시
  const handleScanSuccess = () => {
    setIsScanModalOpen(false);
  };


  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="인바디 관리"
        size="lg"
        closeOnBackdrop={state === 'list'}
      >
        <ModalBody className="min-h-[300px] p-0">
          {state === 'list' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="xl" />
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
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
                    <div
                      key={record.id}
                      className="flex items-center justify-between px-4 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleRecordClick(record)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">
                          {formatKoreanDate(record.measuredAt)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>체중 {record.weight}kg</span>
                          <span>-</span>
                          <span>골격근 {record.skeletalMuscleMass}kg</span>
                          <span>-</span>
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

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, record)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="삭제"
                        >
                          <DeleteIcon size="sm" />
                        </button>
                        <NextIcon size="md" className="text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {state === 'confirm-delete' && recordToDelete && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <ErrorIcon size="2xl" className="text-destructive mb-4" />
              <p className="text-lg font-medium text-card-foreground">
                이 기록을 삭제할까요?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {formatKoreanDate(recordToDelete.measuredAt)} 측정 기록
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                삭제된 기록은 복구할 수 없습니다
              </p>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {state === 'list' && (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                닫기
              </Button>
              <Button
                onClick={() => setIsScanModalOpen(true)}
                className="flex-1"
              >
                <AddIcon size="sm" className="mr-2" />
                새 기록 추가
              </Button>
            </>
          )}

          {state === 'confirm-delete' && (
            <>
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                className="flex-1"
                disabled={deleteInBody.isPending}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="flex-1"
                disabled={deleteInBody.isPending}
              >
                {deleteInBody.isPending ? (
                  <>
                    <LoadingSpinner size="sm" variant="current" className="mr-2" />
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>

      {/* 스캔 모달 */}
      <InBodyScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={handleScanSuccess}
      />

      {/* 상세 모달 */}
      {selectedRecord && (
        <InBodyDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
        />
      )}
    </>
  );
}
