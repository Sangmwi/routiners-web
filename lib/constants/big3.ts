import type { Big3LiftType } from '@/lib/data/exercises';

export const BIG3_LIFT_CONFIG: readonly { key: Big3LiftType; label: string }[] = [
  { key: 'squat', label: '스쿼트' },
  { key: 'bench', label: '벤치' },
  { key: 'deadlift', label: '데드' },
] as const;

/** @deprecated Big3LiftType from '@/lib/data/exercises' 사용 */
export type Big3LiftKey = Big3LiftType;

