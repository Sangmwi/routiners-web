'use client';

import { useState } from 'react';
import type { WorkoutSet } from '@/lib/types/routine';

interface SetValuePickerState {
  pickerSetIndex: number | null;
  pickerSet: WorkoutSet | null;
  openPicker: (index: number) => void;
  closePicker: () => void;
}

export function useSetValuePicker(sets: WorkoutSet[]): SetValuePickerState {
  const [pickerSetIndex, setPickerSetIndex] = useState<number | null>(null);

  const pickerSet = pickerSetIndex !== null ? sets[pickerSetIndex] ?? null : null;
  const openPicker = (index: number) => setPickerSetIndex(index);
  const closePicker = () => setPickerSetIndex(null);

  return { pickerSetIndex, pickerSet, openPicker, closePicker };
}
