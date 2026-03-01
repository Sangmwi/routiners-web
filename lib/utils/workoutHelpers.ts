export { REST_OPTIONS } from '@/lib/constants/workout';

export function formatRestSeconds(seconds: number): string {
  if (seconds === 0) return '없음';
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
}
