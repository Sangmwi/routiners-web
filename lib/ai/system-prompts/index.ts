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
 * Phase 16.5: contextSummary 파라미터 추가 (OCP: 기존 호출 영향 없음)
 *
 * @param processType - 활성 프로세스 타입 (예: 'routine_generation')
 * @param contextSummary - 이전 대화 요약 (토큰 절감용)
 * @returns 구성된 시스템 프롬프트
 */
export function composeCoachPrompt(
  processType?: string,
  contextSummary?: string | null
): string {
  let prompt = COACH_BASE_PROMPT;

  // Phase 16.5: 이전 대화 요약 포함 (토큰 50% 절감)
  if (contextSummary) {
    prompt += `\n\n---\n\n# 이전 대화 요약\n${contextSummary}`;
  }

  if (processType && PROCESS_RULES[processType]) {
    const PROCESS_HEADERS: Record<string, string> = {
      routine_generation: '루틴 생성 프로세스',
      routine_modification: '루틴 수정 프로세스',
      quick_routine: '빠른 루틴 생성 프로세스',
    };
    const header = PROCESS_HEADERS[processType] ?? processType;
    prompt += `\n\n---\n\n# ${header}\n${PROCESS_RULES[processType]}`;
  }

  return prompt;
}

export { COACH_BASE_PROMPT } from './coach-base';
export { PROCESS_RULES } from './processes';
