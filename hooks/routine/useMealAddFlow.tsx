'use client';

import { type ReactNode } from 'react';
import MealAddSheet, { type MealAddOption } from '@/components/routine/meal/MealAddSheet';
import MealCreateDrawer from '@/components/routine/sheets/MealCreateDrawer';
import UnitMealImportDrawer from '@/components/routine/sheets/UnitMealImportDrawer';
import type { RoutineEvent } from '@/lib/types/routine';
import { useSheetAddFlow } from './useSheetAddFlow';

type MealFlowStep = 'create' | 'import';

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
  const { step, open, close, handleOption } = useSheetAddFlow<MealAddOption, MealFlowStep>({
    getNextStep: (option) => {
      if (option === 'ai') return null;
      return option === 'direct' ? 'create' : 'import';
    },
  });

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
