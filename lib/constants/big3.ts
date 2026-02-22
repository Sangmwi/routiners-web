export const BIG3_LIFT_CONFIG = [
  { key: 'squat', label: '스쿼트' },
  { key: 'bench', label: '벤치프레스' },
  { key: 'deadlift', label: '데드리프트' },
] as const;

export type Big3LiftKey = (typeof BIG3_LIFT_CONFIG)[number]['key'];

