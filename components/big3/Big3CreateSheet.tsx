'use client';

import { useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { WheelPicker, DatePicker } from '@/components/ui/WheelPicker';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import { BIG3_WEIGHT_OPTIONS, BIG3_REPS_OPTIONS, BIG3_RPE_OPTIONS } from '@/components/big3/constants';
import { useCreateBig3 } from '@/hooks/big3';
import { useShowError } from '@/lib/stores/errorStore';
import { isApiError } from '@/lib/types';
import type { Big3LiftType } from '@/lib/types/big3';

const LIFT_OPTIONS = BIG3_LIFT_CONFIG.map(({ key, label }) => ({ key, label }));
const LIFT_LABEL_MAP = Object.fromEntries(
  BIG3_LIFT_CONFIG.map(({ key, label }) => [key, label]),
) as Record<string, string>;

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

interface Big3CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 필터에서 선택된 종목으로 기본값 설정 */
  defaultLiftType?: Big3LiftType;
}

export default function Big3CreateSheet({
  isOpen,
  onClose,
  defaultLiftType,
}: Big3CreateSheetProps) {
  const [liftType, setLiftType] = useState<Big3LiftType>(defaultLiftType ?? 'squat');
  const [recordedAt, setRecordedAt] = useState(getToday);
  const [weight, setWeight] = useState('0');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');

  const createBig3 = useCreateBig3();
  const showError = useShowError();

  const handleSubmit = () => {
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    const parsedReps = reps ? parseInt(reps) : NaN;
    const parsedRpe = rpe ? parseFloat(rpe) : NaN;

    createBig3.mutate(
      {
        recordedAt,
        liftType,
        weight: parsedWeight,
        reps: !isNaN(parsedReps) && parsedReps > 0 ? parsedReps : undefined,
        rpe: !isNaN(parsedRpe) && parsedRpe >= 1 && parsedRpe <= 10 ? parsedRpe : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
        onError: (err) => {
          if (isApiError(err) && err.code === 'CONFLICT') {
            showError(`이 날짜에 이미 ${LIFT_LABEL_MAP[liftType]} 기록이 있어요`);
          } else {
            showError('기록 저장에 실패했어요');
          }
        },
      },
    );
  };

  const resetForm = () => {
    setWeight('0');
    setReps('');
    setRpe('');
    setNotes('');
    setRecordedAt(getToday());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValid = parseFloat(weight) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 기록 추가"
      position="bottom"
      height="auto"
      stickyFooter={
        <GradientFooter variant="sheet">
          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={!isValid}
            isLoading={createBig3.isPending}
          >
            저장
          </Button>
        </GradientFooter>
      }
    >
      <ModalBody className="p-6 space-y-5">
        {/* 종목 선택 */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">종목</label>
          <SegmentedControl
            options={LIFT_OPTIONS}
            value={liftType}
            onChange={setLiftType}
            size="md"
          />
        </div>

        {/* 날짜 */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">날짜</label>
          <DatePicker
            value={recordedAt}
            onChange={setRecordedAt}
            minDate="2020-01-01"
            maxDate={getToday()}
            showLabels={false}
          />
        </div>

        {/* 중량 · 횟수 · RPE */}
        <div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground text-center mb-1">중량</p>
              <WheelPicker
                options={BIG3_WEIGHT_OPTIONS}
                value={weight}
                onChange={setWeight}
                itemHeight={40}
                visibleItems={3}
              />
            </div>
            <div className="w-20">
              <p className="text-xs text-muted-foreground text-center mb-1">횟수</p>
              <WheelPicker
                options={BIG3_REPS_OPTIONS}
                value={reps}
                onChange={setReps}
                itemHeight={40}
                visibleItems={3}
              />
            </div>
            <div className="w-20">
              <p className="text-xs text-muted-foreground text-center mb-1">RPE</p>
              <WheelPicker
                options={BIG3_RPE_OPTIONS}
                value={rpe}
                onChange={setRpe}
                itemHeight={40}
                visibleItems={3}
              />
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">메모</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground resize-none"
            rows={2}
            placeholder="선택"
          />
        </div>
      </ModalBody>
    </Modal>
  );
}
