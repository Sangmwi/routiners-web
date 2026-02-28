'use client';

import { useState, useEffect, useRef } from 'react';
import { DeleteIcon } from '@/components/ui/icons';
import { CheckIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { isApiError } from '@/lib/types';
import { InBodyRecord, InBodyUpdateData, InBodyFormSchema, InBodyFormErrors } from '@/lib/types/inbody';
import { validateForm } from '@/lib/utils/formValidation';
import { useShowError } from '@/lib/stores/errorStore';
import { useUpdateInBody, useDeleteInBody } from '@/hooks/inbody';
import { useConfirmDialog } from '@/lib/stores';
import InBodyPreview from './InBodyPreview';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import type { BaseModalProps } from '@/lib/types/modal';

interface InBodyDetailModalProps extends BaseModalProps {
  record: InBodyRecord | null;
}

export default function InBodyDetailModal({
  isOpen,
  onClose,
  record,
}: InBodyDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<InBodyUpdateData | null>(null);
  const [formErrors, setFormErrors] = useState<InBodyFormErrors>({});
  const [isSaved, setIsSaved] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateInBody = useUpdateInBody();
  const deleteInBody = useDeleteInBody();
  const confirmDialog = useConfirmDialog();
  const showError = useShowError();

  const isSaving = updateInBody.isPending;

  // view → edit 전환 중 부모 onClose 전파 차단용 ref
  const isTransitioningToEditRef = useRef(false);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => { if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current); };
  }, []);

  // 모달 닫힐 때 편집 모드 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setEditData(null);
      setFormErrors({});
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!record) return null;

  const formattedDate = formatKoreanDate(record.measuredAt);

  const recordData = {
    measuredAt: record.measuredAt,
    height: record.height,
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
  };

  // view 모달의 onClose: edit 전환 중에는 부모 onClose 차단
  const handleViewModalClose = () => {
    if (isTransitioningToEditRef.current) {
      isTransitioningToEditRef.current = false;
      return;
    }
    onClose();
  };

  // 수정 모드 진입
  const handleEdit = () => {
    isTransitioningToEditRef.current = true;
    setEditData(recordData);
    setIsEditMode(true);
  };

  // 수정 저장
  const handleSave = () => {
    if (!editData) return;

    if (!validateForm<keyof InBodyFormErrors>(InBodyFormSchema, {
      measuredAt: editData.measuredAt ?? record.measuredAt,
      weight: editData.weight ?? record.weight,
      height: editData.height ?? record.height,
      skeletalMuscleMass: editData.skeletalMuscleMass ?? record.skeletalMuscleMass,
      bodyFatPercentage: editData.bodyFatPercentage ?? record.bodyFatPercentage,
    }, setFormErrors)) return;

    updateInBody.mutate(
      { id: record.id, data: editData },
      {
        onSuccess: () => {
          setIsSaved(true);
          closeTimerRef.current = setTimeout(() => {
            setEditData(null);
            onClose();
          }, 500);
        },
        onError: (err) => {
          if (isApiError(err) && err.code === 'CONFLICT') {
            setFormErrors({ measuredAt: '이 날짜에 이미 기록이 있어요' });
          } else {
            showError('수정에 실패했어요');
          }
        },
      }
    );
  };

  // 수정 취소
  const handleCancelEdit = () => {
    if (isSaving) return;
    setEditData(null);
    setFormErrors({});
    onClose();
  };

  // 삭제
  const handleDeleteClick = () => {
    confirmDialog({
      title: '기록 삭제',
      message: `${formattedDate} 측정 기록을 삭제할까요?\n삭제된 기록은 복구할 수 없어요.`,
      variant: 'danger',
      confirmText: '삭제',
      onConfirm: () => {
        deleteInBody.mutate(record.id, {
          onSuccess: () => onClose(),
          onError: () => {
            showError('삭제에 실패했어요');
          },
        });
      },
    });
  };

  return (
    <>
      {/* ① 읽기 Modal (하단 드로어) */}
      <Modal
        isOpen={isOpen && !isEditMode}
        onClose={handleViewModalClose}
        title={`${formattedDate} 측정 기록`}
        position="bottom"
        enableSwipe
        headerAction={
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg hover:bg-surface-danger transition-colors"
            aria-label="삭제"
          >
            <DeleteIcon size="md" className="text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        }
        stickyFooter={
          <GradientFooter variant="sheet" className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              닫기
            </Button>
            <Button variant="primary" onClick={handleEdit} className="flex-1">
              수정
            </Button>
          </GradientFooter>
        }
      >
        <ModalBody className="p-6">
          <InBodyPreview
            data={recordData}
            onChange={() => {}}
            readOnly={true}
            initialEditing={false}
          />
        </ModalBody>
      </Modal>

      {/* ② 수정 Modal (하단 바텀시트) */}
      <Modal
        isOpen={isOpen && isEditMode}
        onClose={handleCancelEdit}
        title="측정 기록 수정"
        position="bottom"
        height="auto"
        closeOnBackdrop={!isSaving && !isSaved}
        stickyFooter={
          <GradientFooter variant="sheet" className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancelEdit}
              disabled={isSaving || isSaved}
            >
              취소
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || isSaved}
            >
              {isSaved ? <><CheckIcon size={16} className="mr-1" />완료</> : '저장'}
            </Button>
          </GradientFooter>
        }
      >
        <ModalBody className="relative p-6">
          {isSaving && (
            <LoadingOverlay message="저장 중..." variant="default" />
          )}
          {editData && (
            <InBodyPreview
              fieldErrors={formErrors}
              data={{
                measuredAt: editData.measuredAt || record.measuredAt,
                height: editData.height ?? record.height,
                weight: editData.weight ?? record.weight,
                skeletalMuscleMass: editData.skeletalMuscleMass ?? record.skeletalMuscleMass,
                bodyFatPercentage: editData.bodyFatPercentage ?? record.bodyFatPercentage,
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
              }}
              onChange={(newData) => setEditData(newData)}
              readOnly={false}
              initialEditing={true}
            />
          )}
        </ModalBody>
      </Modal>
    </>
  );
}
