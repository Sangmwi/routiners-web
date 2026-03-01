import type { Big3LiftType } from '@/lib/data/exercises';

export const BIG3_LIFT_CONFIG: readonly { key: Big3LiftType; label: string }[] = [
  { key: 'squat', label: '스쿼트' },
  { key: 'bench', label: '벤치' },
  { key: 'deadlift', label: '데드' },
] as const;

export const LIFT_LABEL_MAP = Object.fromEntries(
  BIG3_LIFT_CONFIG.map(({ key, label }) => [key, label]),
) as Record<Big3LiftType, string>;


