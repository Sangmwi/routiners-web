'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TIMING } from '@/lib/constants/timing';

interface UseSheetAddFlowOptions<TOption extends string, TStep extends string> {
  /** AI 상담 이동 경로 (default: '/routine/counselor') */
  aiPath?: string;
  /** 선택된 옵션 → 다음 step 결정 (null이면 AI 라우팅) */
  getNextStep: (option: TOption) => TStep | null;
}

interface SheetAddFlow<TOption extends string, TStep extends string> {
  step: 'closed' | 'options' | TStep;
  open: () => void;
  close: () => void;
  handleOption: (option: TOption) => void;
}

/**
 * 바텀시트 추가 플로우 공통 step 상태 머신
 *
 * WorkoutAddFlow / MealAddFlow의 공통 로직:
 * - closed → (open) → options → (선택) → [next step]
 * - AI 선택 시 aiPath로 라우팅
 * - SHEET_CLOSE 딜레이 후 다음 step 전환
 */
export function useSheetAddFlow<TOption extends string, TStep extends string>({
  aiPath = '/routine/counselor',
  getNextStep,
}: UseSheetAddFlowOptions<TOption, TStep>): SheetAddFlow<TOption, TStep> {
  const router = useRouter();
  const [step, setStep] = useState<'closed' | 'options' | TStep>('closed');

  const open = () => setStep('options');
  const close = () => setStep('closed');

  const handleOption = (option: TOption) => {
    const nextStep = getNextStep(option);
    setStep('closed');
    if (nextStep === null) {
      router.push(aiPath);
      return;
    }
    setTimeout(() => setStep(nextStep), TIMING.UI.SHEET_CLOSE);
  };

  return { step, open, close, handleOption };
}
