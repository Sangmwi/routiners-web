'use client';

import { useState } from 'react';
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import { WheelPicker } from '@/components/ui/WheelPicker';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import { BIG3_WEIGHT_OPTIONS, BIG3_REPS_OPTIONS, BIG3_RPE_OPTIONS } from '@/components/big3/constants';
import { useUpdateBig3, useDeleteBig3 } from '@/hooks/big3';
import { useConfirmDialog } from '@/lib/stores';
import type { Big3Record, Big3UpdateData } from '@/lib/types/big3';

const LIFT_LABEL_MAP = Object.fromEntries(
  BIG3_LIFT_CONFIG.map(({ key, label }) => [key, label]),
) as Record<string, string>;

type ViewState = 'view' | 'edit';

interface Big3DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Big3Record;
}

export default function Big3DetailModal({ isOpen, onClose, record }: Big3DetailModalProps) {
  const [viewState, setViewState] = useState<ViewState>('view');
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editRpe, setEditRpe] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const updateBig3 = useUpdateBig3();
  const deleteBig3 = useDeleteBig3();
  const confirmDialog = useConfirmDialog();

  if (!record) return null;

  const liftLabel = LIFT_LABEL_MAP[record.liftType] ?? record.liftType;
  const dateStr = record.recordedAt;

  const handleStartEdit = () => {
    setEditWeight(String(record.weight));
    setEditReps(record.reps ? String(record.reps) : '');
    setEditRpe(record.rpe ? String(record.rpe) : '');
    setEditNotes(record.notes ?? '');
    setViewState('edit');
  };

  const handleSaveEdit = () => {
    const data: Big3UpdateData = {};
    const newWeight = parseFloat(editWeight);
    if (!isNaN(newWeight) && newWeight > 0) data.weight = newWeight;
    const newReps = editReps ? parseInt(editReps) : NaN;
    if (!isNaN(newReps) && newReps > 0) data.reps = newReps;
    const newRpe = editRpe ? parseFloat(editRpe) : NaN;
    if (!isNaN(newRpe) && newRpe >= 1 && newRpe <= 10) data.rpe = newRpe;
    if (editNotes.trim()) data.notes = editNotes.trim();

    updateBig3.mutate(
      { id: record.id, data },
      {
        onSuccess: () => {
          setViewState('view');
          onClose();
        },
      },
    );
  };

  const handleDeleteClick = () => {
    confirmDialog({
      title: '기록 삭제',
      message: `${dateStr} ${liftLabel} ${record.weight}kg 기록을 삭제할까요?\n삭제된 기록은 복구할 수 없어요.`,
      variant: 'danger',
      confirmText: '삭제',
      onConfirm: () => {
        deleteBig3.mutate(record.id, {
          onSuccess: () => {
            setViewState('view');
            onClose();
          },
        });
      },
    });
  };

  const handleClose = () => {
    setViewState('view');
    onClose();
  };

  // ============================================================
  // Edit View
  // ============================================================
  if (viewState === 'edit') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="기록 수정"
        position="bottom"
        height="auto"
        stickyFooter={
          <GradientFooter variant="sheet" className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              취소
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveEdit}
              isLoading={updateBig3.isPending}
            >
              저장
            </Button>
          </GradientFooter>
        }
      >
        <ModalBody className="p-6 space-y-4">
          {/* 중량 · 횟수 · RPE */}
          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground text-center mb-1">중량</p>
                <WheelPicker
                  options={BIG3_WEIGHT_OPTIONS}
                  value={editWeight}
                  onChange={setEditWeight}
                  itemHeight={40}
                  visibleItems={3}
                />
              </div>
              <div className="w-20">
                <p className="text-xs text-muted-foreground text-center mb-1">횟수</p>
                <WheelPicker
                  options={BIG3_REPS_OPTIONS}
                  value={editReps}
                  onChange={setEditReps}
                  itemHeight={40}
                  visibleItems={3}
                />
              </div>
              <div className="w-20">
                <p className="text-xs text-muted-foreground text-center mb-1">RPE</p>
                <WheelPicker
                  options={BIG3_RPE_OPTIONS}
                  value={editRpe}
                  onChange={setEditRpe}
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
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground resize-none"
              rows={2}
              placeholder="선택"
            />
          </div>
        </ModalBody>
      </Modal>
    );
  }

  // ============================================================
  // View (Detail)
  // ============================================================
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${liftLabel} 기록`}
      position="bottom"
      height="auto"
      enableSwipe
      headerAction={
        <div className="flex gap-1">
          <button onClick={handleStartEdit} className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground" aria-label="수정">
            <PencilSimpleIcon size={20} />
          </button>
          <button onClick={handleDeleteClick} className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground" aria-label="삭제">
            <TrashIcon size={20} />
          </button>
        </div>
      }
    >
      <ModalBody className="p-6 space-y-4">
        <div className="bg-surface-hover rounded-xl p-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <DetailItem label="날짜" value={dateStr} />
            <DetailItem label="종목" value={liftLabel} />
            <DetailItem label="중량" value={`${record.weight}kg`} />
            <DetailItem label="횟수" value={record.reps ? `${record.reps}회` : '-'} />
            <DetailItem label="RPE" value={record.rpe ? `${record.rpe}` : '-'} />
            <DetailItem label="출처" value={record.source === 'auto' ? '자동 기록' : '수동 입력'} />
          </div>
        </div>
        {record.notes && (
          <div>
            <span className="text-xs text-muted-foreground">메모</span>
            <p className="text-sm text-foreground mt-1">{record.notes}</p>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
