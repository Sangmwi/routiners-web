'use client';

import { useState } from 'react';
import { CalendarIcon, PencilSimpleLineIcon, CameraIcon } from '@phosphor-icons/react';
import { AddIcon, NextIcon, LoadingSpinner, DeleteIcon, ErrorIcon } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import { useShowError } from '@/lib/stores/errorStore';
import { isApiError } from '@/lib/types';
import { InBodyRecord, InBodyCreateData, InBodyFormSchema, InBodyFormErrors } from '@/lib/types/inbody';
import { collectZodErrors } from '@/lib/utils/formValidation';
import { useInBodyRecords, useDeleteInBody, useCreateInBody } from '@/hooks/inbody';
import InBodyScanModal from './InBodyScanModal';
import InBodyDetailModal from './InBodyDetailModal';
import InBodyPreview from './InBodyPreview';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import type { BaseModalProps } from '@/lib/types/modal';

interface InBodyManageModalProps extends BaseModalProps {}

type ManageState = 'list' | 'choose-method' | 'manual-input' | 'confirm-delete';

export default function InBodyManageModal({
  isOpen,
  onClose,
}: InBodyManageModalProps) {
  const [state, setState] = useState<ManageState>('list');
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<InBodyRecord | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<InBodyFormErrors>({});
  const showError = useShowError();

  const { data: records = [], isPending: isLoading } = useInBodyRecords(50, 0, {
    enabled: isOpen,
  });

  const deleteInBody = useDeleteInBody();
  const createInBody = useCreateInBody();

  // 간편 입력 초기 데이터 (최신 기록에서 키 자동 채움)
  const getManualInputInitial = (): InBodyCreateData => {
    const latestHeight = records.length > 0 ? records[0].height : undefined;
    return {
      measuredAt: new Date().toISOString().split('T')[0],
      height: latestHeight,
      weight: 0,
    };
  };
  const [manualData, setManualData] = useState<InBodyCreateData>(getManualInputInitial());

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setState('list');
    setSelectedRecord(null);
    setRecordToDelete(null);
    setManualData(getManualInputInitial());
    setFormErrors({});
    onClose();
  };

  // 직접 입력 시작
  const handleStartManualInput = () => {
    setManualData(getManualInputInitial());
    setFormErrors({});
    setState('manual-input');
  };

  // 직접 입력 저장
  const handleSaveManualInput = () => {
    // Zod 클라이언트 검증
    const result = InBodyFormSchema.safeParse({
      measuredAt: manualData.measuredAt,
      weight: manualData.weight,
      height: manualData.height,
      skeletalMuscleMass: manualData.skeletalMuscleMass,
      bodyFatPercentage: manualData.bodyFatPercentage,
    });
    if (!result.success) {
      setFormErrors(collectZodErrors<keyof InBodyFormErrors>(result.error));
      return;
    }
    setFormErrors({});

    createInBody.mutate(manualData, {
      onSuccess: () => {
        setState('list');
        setManualData(getManualInputInitial());
      },
      onError: (err) => {
        if (isApiError(err) && err.code === 'CONFLICT') {
          setFormErrors({ measuredAt: '이 날짜에 이미 기록이 있어요' });
        } else {
          showError('기록 저장에 실패했어요');
        }
      },
    });
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
        showError('기록 삭제에 실패했어요');
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
    setState('list');
  };


  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="인바디 관리"
        size="lg"
        closeOnBackdrop={state === 'list' || state === 'choose-method'}
        stickyFooter={
          <GradientFooter variant="sheet" className="flex gap-3">
            {state === 'list' && (
              <Button
                onClick={() => setState('choose-method')}
                className="flex-1"
              >
                <AddIcon size="sm" className="mr-2" />
                새 기록 추가
              </Button>
            )}

            {state === 'choose-method' && (
              <Button
                variant="outline"
                onClick={() => setState('list')}
                className="flex-1"
              >
                뒤로
              </Button>
            )}

            {state === 'manual-input' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setState('list')}
                  className="flex-1"
                  disabled={createInBody.isPending}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveManualInput}
                  className="flex-1"
                  disabled={createInBody.isPending || !manualData.weight}
                >
                  {createInBody.isPending ? (
                    <>
                      <LoadingSpinner size="sm" variant="current" className="mr-2" />
                      저장 중...
                    </>
                  ) : (
                    '저장'
                  )}
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
          </GradientFooter>
        }
      >
        <ModalBody className="min-h-[300px]">
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
                      className="flex items-center justify-between px-4 py-4 hover:bg-surface-secondary transition-colors cursor-pointer"
                      onClick={() => handleRecordClick(record)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">
                          {formatKoreanDate(record.measuredAt)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>체중 {record.weight}kg</span>
                          {record.skeletalMuscleMass != null && (
                            <><span>-</span><span>골격근 {record.skeletalMuscleMass}kg</span></>
                          )}
                          {record.bodyFatPercentage != null && (
                            <><span>-</span><span>체지방률 {record.bodyFatPercentage}%</span></>
                          )}
                        </div>
                        {record.inbodyScore && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-accent text-primary">
                              점수 {record.inbodyScore}점
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, record)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-surface-danger rounded-lg transition-colors"
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

          {state === 'choose-method' && (
            <div className="px-4 py-6 space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">
                기록 추가 방법을 선택해주세요
              </p>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(true)}
                className="w-full flex items-center gap-4 p-4 bg-surface-secondary rounded-2xl hover:bg-surface-accent transition-colors text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-accent text-primary">
                  <CameraIcon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">결과지 스캔</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    인바디 결과지를 촬영하면 자동으로 데이터를 추출해요
                  </p>
                </div>
                <NextIcon size="md" className="text-muted-foreground shrink-0" />
              </button>
              <button
                type="button"
                onClick={handleStartManualInput}
                className="w-full flex items-center gap-4 p-4 bg-surface-secondary rounded-2xl hover:bg-surface-accent transition-colors text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-accent text-primary">
                  <PencilSimpleLineIcon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">직접 입력</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    체중, 골격근량 등을 직접 입력해요
                  </p>
                </div>
                <NextIcon size="md" className="text-muted-foreground shrink-0" />
              </button>
            </div>
          )}

          {state === 'manual-input' && (
            <div className="px-4 py-2">
              <InBodyPreview
                data={manualData}
                onChange={setManualData}
                initialEditing
                fieldErrors={formErrors}
              />
            </div>
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
                삭제된 기록은 복구할 수 없어요
              </p>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* 스캔 모달 */}
      <InBodyScanModal
        isOpen={isScanModalOpen}
        onClose={() => { setIsScanModalOpen(false); setState('list'); }}
        onSuccess={handleScanSuccess}
      />

      {/* 상세 모달 */}
      <InBodyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord!}
      />
    </>
  );
}
