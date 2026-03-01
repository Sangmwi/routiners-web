'use client';

import { useState, useEffect, useRef } from 'react';
import { isApiError } from '@/lib/types';
import { InBodyRecord, InBodyUpdateData, InBodyFormSchema, InBodyFormErrors } from '@/lib/types/inbody';
import { validateForm } from '@/lib/utils/formValidation';
import { useSaveAnimation, useConfirmDelete } from '@/hooks/common';
import { useShowError } from '@/lib/stores/errorStore';
import { useUpdateInBody, useDeleteInBody } from '@/hooks/inbody/mutations';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

export function useInBodyDetailEdit(
  record: InBodyRecord | null,
  isOpen: boolean,
  onClose: () => void,
) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<InBodyUpdateData | null>(null);
  const [formErrors, setFormErrors] = useState<InBodyFormErrors>({});

  const updateInBody = useUpdateInBody();
  const deleteInBody = useDeleteInBody();
  const confirmDelete = useConfirmDelete();
  const showError = useShowError();
  const { isSaved, triggerSave, resetSaved } = useSaveAnimation(() => { setEditData(null); onClose(); });

  const isSaving = updateInBody.isPending;

  // view → edit 전환 중 부모 onClose 전파 차단용 ref
  const isTransitioningToEditRef = useRef(false);

  // 모달 닫힐 때 편집 모드 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setEditData(null);
      setFormErrors({});
      resetSaved();
    }
  }, [isOpen]);

  const formattedDate = record ? formatKoreanDate(record.measuredAt) : '';

  // view 모달의 onClose: edit 전환 중에는 부모 onClose 차단
  const handleViewModalClose = () => {
    if (isTransitioningToEditRef.current) {
      isTransitioningToEditRef.current = false;
      return;
    }
    onClose();
  };

  // 수정 모드 진입
  const handleEdit = (recordData: InBodyUpdateData) => {
    isTransitioningToEditRef.current = true;
    setEditData(recordData);
    setIsEditMode(true);
  };

  // 수정 저장
  const handleSave = () => {
    if (!editData || !record) return;

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
        onSuccess: () => { triggerSave(); },
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
    confirmDelete({
      title: '기록 삭제',
      message: `${formattedDate} 측정 기록을 삭제할까요?\n삭제된 기록은 복구할 수 없어요.`,
      onConfirm: () => {
        if (!record) return;
        deleteInBody.mutate(record.id, {
          onSuccess: () => onClose(),
          onError: () => { showError('삭제에 실패했어요'); },
        });
      },
    });
  };

  return {
    isEditMode,
    editData,
    setEditData,
    formErrors,
    isSaved,
    isSaving,
    handleViewModalClose,
    handleEdit,
    handleSave,
    handleCancelEdit,
    handleDeleteClick,
  };
}
