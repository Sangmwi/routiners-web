'use client';

import { useState } from 'react';
import type { Big3UpdateData } from '@/lib/types/big3';

interface Big3FormValues {
  weight?: string;
  reps?: string;
  rpe?: string;
  notes?: string;
}

export function useBig3Form(initial?: Big3FormValues) {
  const [weight, setWeight] = useState(initial?.weight ?? '0');
  const [reps, setReps] = useState(initial?.reps ?? '');
  const [rpe, setRpe] = useState(initial?.rpe ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const reset = (next?: Big3FormValues) => {
    setWeight(next?.weight ?? '0');
    setReps(next?.reps ?? '');
    setRpe(next?.rpe ?? '');
    setNotes(next?.notes ?? '');
  };

  const buildUpdateData = (): Big3UpdateData => {
    const data: Big3UpdateData = {};
    const parsedWeight = parseFloat(weight);
    if (!isNaN(parsedWeight) && parsedWeight > 0) data.weight = parsedWeight;
    const parsedReps = reps ? parseInt(reps) : NaN;
    if (!isNaN(parsedReps) && parsedReps > 0) data.reps = parsedReps;
    const parsedRpe = rpe ? parseFloat(rpe) : NaN;
    if (!isNaN(parsedRpe) && parsedRpe >= 1 && parsedRpe <= 10) data.rpe = parsedRpe;
    if (notes.trim()) data.notes = notes.trim();
    return data;
  };

  const isValid = parseFloat(weight) > 0;

  return { weight, reps, rpe, notes, setWeight, setReps, setRpe, setNotes, reset, buildUpdateData, isValid };
}
