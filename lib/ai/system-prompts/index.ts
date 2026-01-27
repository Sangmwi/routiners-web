/**
 * System Prompts Index
 *
 * AI 시스템 프롬프트 통합 export
 */

import { COACH_SYSTEM_PROMPT, WORKOUT_SYSTEM_PROMPT } from './coach';

export { COACH_SYSTEM_PROMPT, WORKOUT_SYSTEM_PROMPT } from './coach';

/**
 * 목적별 시스템 프롬프트 매핑
 * - 'workout': 루틴 생성 전용 (바로 프로세스 시작)
 * - 'coach': 범용 코치 AI (일반 대화 + 필요시 루틴 생성)
 */
export const SYSTEM_PROMPTS: Record<'workout' | 'coach', string> = {
  workout: WORKOUT_SYSTEM_PROMPT,
  coach: COACH_SYSTEM_PROMPT,
};
