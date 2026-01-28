/**
 * System Prompts — Dynamic Composition
 *
 * 프로세스 타입에 따라 시스템 프롬프트를 동적으로 구성
 * - 기본: COACH_BASE_PROMPT (범용 코치)
 * - 프로세스 활성화 시: COACH_BASE_PROMPT + PROCESS_RULES[processType]
 */

import { COACH_BASE_PROMPT } from './coach-base';
import { PROCESS_RULES } from './processes';

/**
 * 코치 시스템 프롬프트 동적 구성
 *
 * @param processType - 활성 프로세스 타입 (예: 'routine_generation')
 * @returns 구성된 시스템 프롬프트
 */
export function composeCoachPrompt(processType?: string): string {
  let prompt = COACH_BASE_PROMPT;

  if (processType && PROCESS_RULES[processType]) {
    prompt += `\n\n---\n\n# 루틴 생성 프로세스\n${PROCESS_RULES[processType]}`;
  }

  return prompt;
}

export { COACH_BASE_PROMPT } from './coach-base';
export { PROCESS_RULES } from './processes';
