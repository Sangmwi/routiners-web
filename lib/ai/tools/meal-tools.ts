import type { AIToolDefinition } from './types';

// ============================================================================
// Meal Plan Tools (식단 미리보기/적용)
// ============================================================================

/**
 * 18. 식단 미리보기 생성
 * - DB에 저장하지 않고 미리보기 UI만 표시
 * - 사용자가 확인 후 프론트엔드에서 apply_meal_plan API 호출
 * - 1주 단위 생성 (토큰 절약)
 */
export const GENERATE_MEAL_PLAN_PREVIEW: AIToolDefinition = {
  type: 'function',
  name: 'generate_meal_plan_preview',
  description:
    '1주 식단 미리보기를 생성합니다. 사용자가 적용 시 1~4주 중 선택합니다.\n\n⚠️ 필수 조건:\n- duration_weeks는 반드시 1로 설정\n- weeks 배열은 정확히 1개만 포함\n- 각 week의 days 배열은 7일 포함 (월~일)\n- 각 day는 mealsPerDay에 맞는 수의 meal 포함 필수\n- 각 meal의 foods에 음식 최소 2개 이상\n- 각 food에 name(문자열), portion(분량 문자열), calories(숫자) 포함 필수\n\n수정 요청이 오면 피드백을 반영하여 다시 이 도구를 호출하세요.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '식단 제목 (예: "1주 고단백 벌크업 식단")',
      },
      description: {
        type: 'string',
        description: '식단에 대한 간단한 설명',
      },
      duration_weeks: {
        type: 'integer',
        description: '식단 기간 (항상 1로 설정)',
      },
      target_calories: {
        type: 'integer',
        description: '일일 목표 칼로리 (kcal). calculate_daily_needs 결과 활용.',
      },
      target_protein: {
        type: 'integer',
        description: '일일 목표 단백질 (g)',
      },
      weeks: {
        type: 'array',
        description: '주차별 식단 계획 (정확히 1개)',
        items: {
          type: 'object',
          properties: {
            weekNumber: { type: 'integer', description: '주차 번호 (항상 1)' },
            days: {
              type: 'array',
              description: '해당 주의 7일 식단',
              items: {
                type: 'object',
                properties: {
                  dayOfWeek: { type: 'integer', description: '요일 (1=월요일, 7=일요일)' },
                  title: { type: 'string', description: '하루 식단 제목 (예: "고단백 식단 - 월요일")' },
                  meals: {
                    type: 'array',
                    description: '식사 목록',
                    items: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
                          description: '식사 타입',
                        },
                        foods: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string', description: '음식명 (한국어)' },
                              portion: { type: 'string', description: '분량 (예: "1공기", "200g", "1개")' },
                              calories: { type: 'integer', description: '칼로리 (kcal)' },
                            },
                            required: ['name', 'portion'],
                          },
                        },
                        totalCalories: { type: 'integer', description: '이 식사의 총 칼로리' },
                      },
                      required: ['type', 'foods'],
                    },
                  },
                  totalCalories: { type: 'integer', description: '하루 총 칼로리' },
                  notes: { type: 'string', description: '하루 식단 메모/팁' },
                },
                required: ['dayOfWeek', 'meals'],
              },
            },
          },
          required: ['weekNumber', 'days'],
        },
      },
    },
    required: ['title', 'description', 'duration_weeks', 'target_calories', 'target_protein', 'weeks'],
  },
};

/**
 * 19. 식단 적용 (미리보기 확정)
 * - 미리보기 데이터를 실제 DB에 저장
 * - 사용자가 "적용하기" 버튼을 클릭하면 호출됨
 */
export const APPLY_MEAL_PLAN: AIToolDefinition = {
  type: 'function',
  name: 'apply_meal_plan',
  strict: true,
  description:
    '미리보기 중인 식단을 실제로 적용합니다. 이 도구는 사용자가 식단 미리보기에서 "적용하기" 버튼을 클릭했을 때만 호출됩니다. preview_id는 generate_meal_plan_preview에서 생성된 미리보기 ID입니다.',
  parameters: {
    type: 'object',
    properties: {
      preview_id: {
        type: 'string',
        description: '적용할 식단 미리보기 ID',
      },
    },
    required: ['preview_id'],
    additionalProperties: false,
  },
};

export const MEAL_TOOL_DEFINITIONS: AIToolDefinition[] = [
  GENERATE_MEAL_PLAN_PREVIEW,
  APPLY_MEAL_PLAN,
];
