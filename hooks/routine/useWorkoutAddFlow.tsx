'use client';

import { type ReactNode } from 'react';
import WorkoutAddSheet, { type WorkoutAddOption } from '@/components/routine/workout/WorkoutAddSheet';
import WorkoutCreateDrawer from '@/components/routine/sheets/WorkoutCreateDrawer';
import { useSheetAddFlow } from './useSheetAddFlow';

type WorkoutFlowStep = 'create';

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
  const { step, open, close, handleOption } = useSheetAddFlow<WorkoutAddOption, WorkoutFlowStep>({
    getNextStep: (option) => (option === 'ai' ? null : 'create'),
  });

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
