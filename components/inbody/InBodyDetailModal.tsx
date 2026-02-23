'use client';

import { useState } from 'react';
import { PencilSimpleIcon } from '@phosphor-icons/react';
import { DeleteIcon, ErrorIcon } from '@/components/ui/icons';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { InBodyRecord, InBodyUpdateData } from '@/lib/types/inbody';
import { useUpdateInBody, useDeleteInBody } from '@/hooks/inbody';
import InBodyPreview from './InBodyPreview';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

interface InBodyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InBodyRecord;
}

type ModalState = 'view' | 'edit' | 'confirmDelete';

export default function InBodyDetailModal({
  isOpen,
  onClose,
  record,
}: InBodyDetailModalProps) {
  const [state, setState] = useState<ModalState>('view');
  const [editData, setEditData] = useState<InBodyUpdateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateInBody = useUpdateInBody();
  const deleteInBody = useDeleteInBody();

  // mutation 상태로 오버레이 판단
  const isSaving = updateInBody.isPending;
  const isDeleting = deleteInBody.isPending;
  const isProcessing = isSaving || isDeleting;

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    if (isProcessing) return;
    setState('view');
    setEditData(null);
    setError(null);
    onClose();
  };

  // 수정 모드 진입
  const handleEdit = () => {
    setEditData({
      measuredAt: record.measuredAt,
      weight: record.weight,
      skeletalMuscleMass: record.skeletalMuscleMass,
      bodyFatPercentage: record.bodyFatPercentage,
      bmi: record.bmi,
      inbodyScore: record.inbodyScore,
      totalBodyWater: record.totalBodyWater,
      protein: record.protein,
      minerals: record.minerals,
      bodyFatMass: record.bodyFatMass,
      rightArmMuscle: record.rightArmMuscle,
      leftArmMuscle: record.leftArmMuscle,
      trunkMuscle: record.trunkMuscle,
      rightLegMuscle: record.rightLegMuscle,
      leftLegMuscle: record.leftLegMuscle,
      rightArmFat: record.rightArmFat,
      leftArmFat: record.leftArmFat,
      trunkFat: record.trunkFat,
      rightLegFat: record.rightLegFat,
      leftLegFat: record.leftLegFat,
    });
    setState('edit');
  };

  // 수정 저장
  const handleSave = () => {
    if (!editData) return;

    setError(null);
    updateInBody.mutate(
      { id: record.id, data: editData },
      {
        onSuccess: () => handleClose(),
        onError: (err) => {
          setError(err instanceof Error ? err.message : '수정에 실패했어요.');
        },
      }
    );
  };

  // 삭제 확인
  const handleConfirmDelete = () => {
    setState('confirmDelete');
  };

  // 삭제 실행
  const handleDelete = () => {
    setError(null);
    deleteInBody.mutate(record.id, {
      onSuccess: () => handleClose(),
      onError: (err) => {
        setError(err instanceof Error ? err.message : '삭제에 실패했어요.');
        setState('view');
      },
    });
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditData(null);
    setState('view');
  };

  // 날짜 포맷
  const formattedDate = formatKoreanDate(record.measuredAt);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${formattedDate} 측정 기록`}
      size="lg"
      closeOnBackdrop={state === 'view' && !isProcessing}
      position="bottom"
      enableSwipe={state === 'view' && !isProcessing}
      headerAction={
        state === 'view' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleConfirmDelete}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              aria-label="삭제"
            >
              <DeleteIcon size="md" className="text-muted-foreground hover:text-destructive transition-colors" />
            </button>
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="수정"
            >
              <PencilSimpleIcon size={20} className="text-muted-foreground" />
            </button>
          </div>
        ) : undefined
      }
    >
      <ModalBody className="relative p-6">
        {/* 저장/삭제 중 오버레이 */}
        {isProcessing && (
          <LoadingOverlay
            message={isDeleting ? '삭제 중...' : '저장 중...'}
            variant={isDeleting ? 'destructive' : 'default'}
          />
        )}

        {/* 삭제 확인 */}
        {state === 'confirmDelete' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <ErrorIcon size="2xl" className="text-destructive" />
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-card-foreground">
                정말 삭제하시겠습니까?
              </p>
              <p className="text-sm text-muted-foreground">
                {formattedDate} 측정 기록이 영구적으로 삭제돼요.
              </p>
            </div>
          </div>
        )}

        {/* 조회/수정 모드 */}
        {(state === 'view' || state === 'edit') && (
          <>
            <InBodyPreview
              data={
                state === 'edit' && editData
                  ? {
                      measuredAt: editData.measuredAt || record.measuredAt,
                      weight: editData.weight || record.weight,
                      skeletalMuscleMass:
                        editData.skeletalMuscleMass || record.skeletalMuscleMass,
                      bodyFatPercentage:
                        editData.bodyFatPercentage || record.bodyFatPercentage,
                      bmi: editData.bmi,
                      inbodyScore: editData.inbodyScore,
                      totalBodyWater: editData.totalBodyWater,
                      protein: editData.protein,
                      minerals: editData.minerals,
                      bodyFatMass: editData.bodyFatMass,
                      rightArmMuscle: editData.rightArmMuscle,
                      leftArmMuscle: editData.leftArmMuscle,
                      trunkMuscle: editData.trunkMuscle,
                      rightLegMuscle: editData.rightLegMuscle,
                      leftLegMuscle: editData.leftLegMuscle,
                      rightArmFat: editData.rightArmFat,
                      leftArmFat: editData.leftArmFat,
                      trunkFat: editData.trunkFat,
                      rightLegFat: editData.rightLegFat,
                      leftLegFat: editData.leftLegFat,
                    }
                  : {
                      measuredAt: record.measuredAt,
                      weight: record.weight,
                      skeletalMuscleMass: record.skeletalMuscleMass,
                      bodyFatPercentage: record.bodyFatPercentage,
                      bmi: record.bmi,
                      inbodyScore: record.inbodyScore,
                      totalBodyWater: record.totalBodyWater,
                      protein: record.protein,
                      minerals: record.minerals,
                      bodyFatMass: record.bodyFatMass,
                      rightArmMuscle: record.rightArmMuscle,
                      leftArmMuscle: record.leftArmMuscle,
                      trunkMuscle: record.trunkMuscle,
                      rightLegMuscle: record.rightLegMuscle,
                      leftLegMuscle: record.leftLegMuscle,
                      rightArmFat: record.rightArmFat,
                      leftArmFat: record.leftArmFat,
                      trunkFat: record.trunkFat,
                      rightLegFat: record.rightLegFat,
                      leftLegFat: record.leftLegFat,
                    }
              }
              onChange={(newData) => setEditData(newData)}
              readOnly={state === 'view'}
              initialEditing={state === 'edit'}
            />

            {error && (
              <p className="mt-4 text-sm text-center text-destructive">{error}</p>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        {state === 'view' && (
          <Button variant="outline" onClick={handleClose} className="flex-1">
            닫기
          </Button>
        )}

        {state === 'edit' && (
          <>
            <Button variant="outline" onClick={handleCancelEdit} className="flex-1" disabled={isProcessing}>
              취소
            </Button>
            <Button onClick={handleSave} className="flex-1" isLoading={isSaving}>
              저장
            </Button>
          </>
        )}

        {state === 'confirmDelete' && (
          <>
            <Button
              variant="outline"
              onClick={() => setState('view')}
              className="flex-1"
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              isLoading={isDeleting}
            >
              삭제
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
