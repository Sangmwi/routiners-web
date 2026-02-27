'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import MealAddSheet, { type MealAddOption } from '@/components/routine/meal/MealAddSheet';
import MealCreateDrawer from '@/components/routine/sheets/MealCreateDrawer';
import UnitMealImportDrawer from '@/components/routine/sheets/UnitMealImportDrawer';
import type { RoutineEvent } from '@/lib/types/routine';

type MealFlowStep = 'closed' | 'options' | 'create' | 'import';

const CLOSE_DELAY = 250;

interface UseMealAddFlowOptions {
  date: string;
  /** 전달 시 append 모드: MealAddSheet.isAppending + MealCreateDrawer.existingEvent */
  existingEvent?: RoutineEvent;
  onCreated?: () => void;
}

interface MealAddFlow {
  open: () => void;
  element: ReactNode;
}

/**
 * 식단 추가 플로우 훅
 *
 * step-based state machine:
 *   closed → (open) → options → (직접 입력) → create
 *                            → (부대 식단) → import
 *                            → (AI 추천) → /routine/counselor
 */
export function useMealAddFlow({ date, existingEvent, onCreated }: UseMealAddFlowOptions): MealAddFlow {
  const router = useRouter();
  const [step, setStep] = useState<MealFlowStep>('closed');

  const open = () => setStep('options');
  const close = () => setStep('closed');

  const handleOption = (option: MealAddOption) => {
    setStep('closed');
    if (option === 'ai') {
      router.push('/routine/counselor');
      return;
    }
    setTimeout(() => setStep(option === 'direct' ? 'create' : 'import'), CLOSE_DELAY);
  };

  const element = (
    <>
      <MealAddSheet
        isOpen={step === 'options'}
        onClose={close}
        onSelect={handleOption}
        isAppending={!!existingEvent}
      />
      <MealCreateDrawer
        isOpen={step === 'create'}
        onClose={close}
        date={date}
        existingEvent={existingEvent}
        onCreated={onCreated}
      />
      <UnitMealImportDrawer
        isOpen={step === 'import'}
        onClose={close}
        date={date}
        onCreated={onCreated}
      />
    </>
  );

  return { open, element };
}
