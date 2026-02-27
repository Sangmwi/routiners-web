'use client';

import { useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { WheelPicker } from '@/components/ui/WheelPicker';
import Button from '@/components/ui/Button';

interface SetValuePickerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  weight: number;
  reps: number;
  onConfirm: (weight: number, reps: number) => void;
}

const WEIGHT_OPTIONS = Array.from({ length: 201 }, (_, i) => ({
  value: String(i),
  label: `${i}kg`,
}));

const REPS_OPTIONS = Array.from({ length: 100 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}회`,
}));

interface SetValuePickerContentProps {
  title: string;
  initialWeight: number;
  initialReps: number;
  onClose: () => void;
  onConfirm: (weight: number, reps: number) => void;
}

function SetValuePickerContent({
  title,
  initialWeight,
  initialReps,
  onClose,
  onConfirm,
}: SetValuePickerContentProps) {
  const [selectedWeight, setSelectedWeight] = useState(String(initialWeight));
  const [selectedReps, setSelectedReps] = useState(String(initialReps));

  const handleConfirm = () => {
    onConfirm(parseFloat(selectedWeight) || 0, parseInt(selectedReps, 10) || 1);
    onClose();
  };

  return (
    <ModalBody className="p-4 pb-2">
      <div className="flex gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground text-center mb-2">중량</p>
          <WheelPicker
            options={WEIGHT_OPTIONS}
            value={selectedWeight}
            onChange={setSelectedWeight}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground text-center mb-2">횟수</p>
          <WheelPicker options={REPS_OPTIONS} value={selectedReps} onChange={setSelectedReps} />
        </div>
      </div>

      <div className="mt-4">
        <Button variant="primary" fullWidth size="lg" onClick={handleConfirm}>
          확인
        </Button>
      </div>
    </ModalBody>
  );
}

export default function SetValuePicker({
  isOpen,
  onClose,
  title,
  weight,
  reps,
  onConfirm,
}: SetValuePickerProps) {
  const stateKey = `${weight}-${reps}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      position="bottom"
      height="auto"
    >
      <SetValuePickerContent
        key={stateKey}
        title={title}
        initialWeight={weight}
        initialReps={reps}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  );
}
