import type { AIToolDefinition } from './types';

/**
 * 16. 프로세스 활성화
 * - 구조화된 프로세스(루틴 생성 등)를 활성화
 * - 자연 대화 중 사용자 의도 감지 시 호출
 *
 * Phase 21-C: strict: true 적용
 */
export const SET_ACTIVE_PURPOSE: AIToolDefinition = {
  type: 'function',
  name: 'set_active_purpose',
  strict: true,
  description:
    '구조화된 프로세스를 활성화합니다. routine_generation: 새 루틴 생성 ("루틴 짜줘", "운동 계획 세워줘"). routine_modification: 기존 루틴 수정 ("수정해줘", "바꿔줘"). quick_routine: 빠른 생성 ("오늘만 만들어줘", "1회분만"). meal_plan_generation: 식단 생성 ("식단 짜줘", "식단 계획 세워줘"). 활성화 후 도구 결과의 시작 절차를 따르세요.',
  parameters: {
    type: 'object',
    properties: {
      purposeType: {
        type: 'string',
        enum: ['routine_generation', 'routine_modification', 'quick_routine', 'meal_plan_generation'],
        description: '활성화할 프로세스 타입',
      },
    },
    required: ['purposeType'],
    additionalProperties: false,
  },
};

/**
 * 17. 프로세스 취소
 * - 활성화된 구조화된 프로세스를 종료
 * - 사용자가 "취소해줘", "그만하자", "다음에 할게" 등 종료 의사 표현 시 호출
 */
export const CLEAR_ACTIVE_PURPOSE: AIToolDefinition = {
  type: 'function',
  name: 'clear_active_purpose',
  description:
    '활성화된 프로세스를 취소합니다. 사용자가 "취소해줘", "그만", "다음에 할게", "안 할래" 등 현재 진행 중인 루틴 생성 프로세스를 종료하고 싶다는 의사를 표현하면 호출하세요. 호출 후 일반 대화 모드로 돌아갑니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export const PURPOSE_TOOL_DEFINITIONS: AIToolDefinition[] = [
  SET_ACTIVE_PURPOSE,
  CLEAR_ACTIVE_PURPOSE,
];
