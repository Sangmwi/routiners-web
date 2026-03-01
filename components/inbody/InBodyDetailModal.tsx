'use client';

import { CheckIcon } from '@phosphor-icons/react';
import { DeleteIcon } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useInBodyDetailEdit } from '@/hooks/inbody';
import InBodyPreview from './InBodyPreview';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import type { InBodyRecord } from '@/lib/types/inbody';
import type { BaseModalProps } from '@/lib/types/modal';

interface InBodyDetailModalProps extends BaseModalProps {
  record: InBodyRecord | null;
}

export default function InBodyDetailModal({
  isOpen,
  onClose,
  record,
}: InBodyDetailModalProps) {
  const {
    isEditMode, editData, setEditData, formErrors,
    isSaved, isSaving,
    handleViewModalClose, handleEdit, handleSave, handleCancelEdit, handleDeleteClick,
  } = useInBodyDetailEdit(record, isOpen, onClose);

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
            <Button variant="primary" onClick={() => handleEdit(recordData)} className="flex-1">
              수정
            </Button>
          </GradientFooter>
        }
      >
        <ModalBody className="p-6">
          <InBodyPreview
            data={recordData}
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
          {isSaving && <LoadingOverlay message="저장 중..." variant="default" />}
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
