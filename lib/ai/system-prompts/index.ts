/**
 * System Prompts Index
 *
 * AI 시스템 프롬프트 통합 export
 */

import { WORKOUT_SYSTEM_PROMPT } from './workout';
import { MEAL_SYSTEM_PROMPT } from './meal';

export { WORKOUT_SYSTEM_PROMPT } from './workout';
export { MEAL_SYSTEM_PROMPT } from './meal';

/**
 * 목적별 시스템 프롬프트 매핑
 */
export const SYSTEM_PROMPTS: Record<'workout' | 'meal', string> = {
  workout: WORKOUT_SYSTEM_PROMPT,
  meal: MEAL_SYSTEM_PROMPT,
};
