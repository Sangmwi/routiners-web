'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import SheetFooterAction from '@/components/ui/SheetFooterAction';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import { useCreateBig3 } from '@/hooks/big3';
import type { Big3LiftType } from '@/lib/types/big3';

const LIFT_OPTIONS = BIG3_LIFT_CONFIG.map(({ key, label }) => ({
  key,
  label,
}));

interface Big3CreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 필터에서 선택된 종목으로 기본값 설정 */
  defaultLiftType?: Big3LiftType;
}

export default function Big3CreateDrawer({
  isOpen,
  onClose,
  defaultLiftType,
}: Big3CreateDrawerProps) {
  const [liftType, setLiftType] = useState<Big3LiftType>(defaultLiftType ?? 'squat');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const createBig3 = useCreateBig3();

  const handleSubmit = () => {
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    const parsedReps = parseInt(reps);
    const parsedRpe = parseFloat(rpe);

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
      },
    );
  };

  const resetForm = () => {
    setWeight('');
    setReps('');
    setRpe('');
    setNotes('');
    setRecordedAt(new Date().toISOString().split('T')[0]);
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
      enableSwipe
      stickyFooter={
        <SheetFooterAction
          onClick={handleSubmit}
          disabled={!isValid}
          isLoading={createBig3.isPending}
          label="저장"
          pendingLabel="저장 중..."
        />
      }
    >
      <div className="space-y-5 py-2">
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
          <input
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground"
          />
        </div>

        {/* 중량 (필수) */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            중량 (kg) <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground"
            step="0.5"
            min="0"
            placeholder="0"
            autoFocus
          />
        </div>

        {/* 횟수 + RPE */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">횟수</label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground"
              min="1"
              placeholder="선택"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">RPE</label>
            <input
              type="number"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground"
              min="1"
              max="10"
              step="0.5"
              placeholder="선택"
            />
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
      </div>
    </Modal>
  );
}
