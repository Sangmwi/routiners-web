'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import WorkoutAddSheet, { type WorkoutAddOption } from '@/components/routine/workout/WorkoutAddSheet';
import WorkoutCreateDrawer from '@/components/routine/sheets/WorkoutCreateDrawer';

type WorkoutFlowStep = 'closed' | 'options' | 'create';

const CLOSE_DELAY = 250;

interface UseWorkoutAddFlowOptions {
  date: string;
  onCreated?: () => void;
}

interface WorkoutAddFlow {
  open: () => void;
  element: ReactNode;
}

/**
 * 운동 추가 플로우 훅
 *
 * step-based state machine:
 *   closed → (open) → options → (직접 추가) → create
 *                            → (AI 상담) → /routine/counselor
 */
export function useWorkoutAddFlow({ date, onCreated }: UseWorkoutAddFlowOptions): WorkoutAddFlow {
  const router = useRouter();
  const [step, setStep] = useState<WorkoutFlowStep>('closed');

  const open = () => setStep('options');
  const close = () => setStep('closed');

  const handleOption = (option: WorkoutAddOption) => {
    setStep('closed');
    if (option === 'ai') {
      router.push('/routine/counselor');
      return;
    }
    setTimeout(() => setStep('create'), CLOSE_DELAY);
  };

  const element = (
    <>
      <WorkoutAddSheet
        isOpen={step === 'options'}
        onClose={close}
        onSelect={handleOption}
      />
      <WorkoutCreateDrawer
        isOpen={step === 'create'}
        onClose={close}
        date={date}
        onCreated={onCreated}
      />
    </>
  );

  return { open, element };
}
