'use client';

import { useState } from 'react';
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SheetFooterAction from '@/components/ui/SheetFooterAction';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import { useUpdateBig3, useDeleteBig3 } from '@/hooks/big3';
import type { Big3Record, Big3UpdateData } from '@/lib/types/big3';

const LIFT_LABEL_MAP = Object.fromEntries(
  BIG3_LIFT_CONFIG.map(({ key, label }) => [key, label]),
) as Record<string, string>;

type ViewState = 'view' | 'edit' | 'confirm-delete';

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

  if (!record) return null;

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
    const newReps = parseInt(editReps);
    if (!isNaN(newReps) && newReps > 0) data.reps = newReps;
    const newRpe = parseFloat(editRpe);
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

  const handleConfirmDelete = () => {
    deleteBig3.mutate(record.id, {
      onSuccess: () => {
        setViewState('view');
        onClose();
      },
    });
  };

  const handleClose = () => {
    setViewState('view');
    onClose();
  };

  const liftLabel = LIFT_LABEL_MAP[record.liftType] ?? record.liftType;
  const dateStr = record.recordedAt;

  // ============================================================
  // Confirm Delete View
  // ============================================================
  if (viewState === 'confirm-delete') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="기록 삭제"
        position="bottom"
        height="auto"
        enableSwipe
        stickyFooter={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setViewState('view')}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={deleteBig3.isPending}
              className="flex-1"
            >
              삭제
            </Button>
          </div>
        }
      >
        <ModalBody className="py-6 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {dateStr} {liftLabel} {record.weight}kg 기록을 삭제할까요?
          </p>
          <p className="text-xs text-hint mt-1">삭제된 기록은 복구할 수 없어요</p>
        </ModalBody>
      </Modal>
    );
  }

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
        enableSwipe
        stickyFooter={
          <SheetFooterAction
            onClick={handleSaveEdit}
            isLoading={updateBig3.isPending}
            label="저장"
            pendingLabel="저장 중..."
          />
        }
      >
        <ModalBody className="p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">중량 (kg)</label>
            <input
              type="number"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground"
              step="0.5"
              min="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">횟수</label>
              <input
                type="number"
                value={editReps}
                onChange={(e) => setEditReps(e.target.value)}
                className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground"
                min="1"
                placeholder="선택"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">RPE</label>
              <input
                type="number"
                value={editRpe}
                onChange={(e) => setEditRpe(e.target.value)}
                className="w-full rounded-xl border border-edge-subtle bg-surface-secondary px-4 py-3 text-sm text-foreground"
                min="1"
                max="10"
                step="0.5"
                placeholder="선택"
              />
            </div>
          </div>
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
          <button onClick={() => setViewState('confirm-delete')} className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground" aria-label="삭제">
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
