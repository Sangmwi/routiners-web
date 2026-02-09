'use client';

import { useState, useCallback } from 'react';
import type { WorkoutSet } from '@/lib/types/routine';

interface SetValuePickerState {
  /** 현재 선택된 세트 인덱스 (null이면 닫힘) */
  pickerSetIndex: number | null;
  /** 현재 선택된 세트 (null이면 닫힘) */
  pickerSet: WorkoutSet | null;
  /** 피커 열기 */
  openPicker: (index: number) => void;
  /** 피커 닫기 */
  closePicker: () => void;
}

/**
 * SetValuePicker 상태 관리 훅
 *
 * ExerciseCard와 ActiveExerciseView에서 공통으로 사용하는
 * 피커 open/close + 현재 세트 계산 로직을 추출.
 */
export function useSetValuePicker(sets: WorkoutSet[]): SetValuePickerState {
  const [pickerSetIndex, setPickerSetIndex] = useState<number | null>(null);

  const pickerSet = pickerSetIndex !== null ? sets[pickerSetIndex] ?? null : null;
  const openPicker = useCallback((index: number) => setPickerSetIndex(index), []);
  const closePicker = useCallback(() => setPickerSetIndex(null), []);

  return { pickerSetIndex, pickerSet, openPicker, closePicker };
}
