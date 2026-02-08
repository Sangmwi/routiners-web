'use client';

import { useState, useMemo } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { WheelPicker } from '@/components/ui/WheelPicker';
import Button from '@/components/ui/Button';

// ============================================================================
// Types
// ============================================================================

interface SetValuePickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 타이틀 (예: "3세트") */
  title: string;
  /** 초기 중량값 */
  weight: number;
  /** 초기 횟수값 */
  reps: number;
  /** 확인 시 콜백 */
  onConfirm: (weight: number, reps: number) => void;
}

// ============================================================================
// Options (module-level)
// ============================================================================

const WEIGHT_OPTIONS = Array.from({ length: 201 }, (_, i) => ({
  value: String(i),
  label: `${i}kg`,
}));

const REPS_OPTIONS = Array.from({ length: 100 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}회`,
}));

// ============================================================================
// Component
// ============================================================================

/**
 * 중량/횟수 선택 바텀시트
 *
 * 듀얼 WheelPicker로 중량(0~200kg, 1kg 단위)과 횟수(1~100)를 선택.
 * ExerciseCard 편집 및 ActiveWorkout SetRow에서 공통 사용.
 */
export default function SetValuePicker({
  isOpen,
  onClose,
  title,
  weight,
  reps,
  onConfirm,
}: SetValuePickerProps) {
  const [selectedWeight, setSelectedWeight] = useState(String(weight));
  const [selectedReps, setSelectedReps] = useState(String(reps));

  // props 변경 시 내부 상태 동기화
  const weightKey = String(weight);
  const repsKey = String(reps);

  useMemo(() => {
    setSelectedWeight(weightKey);
  }, [weightKey]);

  useMemo(() => {
    setSelectedReps(repsKey);
  }, [repsKey]);

  const handleConfirm = () => {
    onConfirm(parseFloat(selectedWeight) || 0, parseInt(selectedReps, 10) || 1);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      size="sm"
      showCloseButton={false}
    >
      <ModalBody className="p-4 pb-2">
        {/* 타이틀 */}
        <h3 className="text-lg font-bold text-foreground text-center mb-4">
          {title}
        </h3>

        {/* 듀얼 WheelPicker */}
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground text-center mb-2">
              중량
            </p>
            <WheelPicker
              options={WEIGHT_OPTIONS}
              value={selectedWeight}
              onChange={setSelectedWeight}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground text-center mb-2">
              횟수
            </p>
            <WheelPicker
              options={REPS_OPTIONS}
              value={selectedReps}
              onChange={setSelectedReps}
            />
          </div>
        </div>

        {/* 확인 버튼 */}
        <div className="mt-4">
          <Button variant="primary" fullWidth size="lg" onClick={handleConfirm}>
            확인
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
