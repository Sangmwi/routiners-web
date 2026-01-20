/**
 * Meal AI Tools Definition
 *
 * 식단 AI용 Function Calling 도구 정의
 * 운동 AI (tools.ts)와 병렬 구조
 *
 * 공유 도구:
 * - get_user_basic_info: 사용자 기본 정보
 * - get_user_body_metrics: 신체 정보 (TDEE 계산용)
 * - get_fitness_profile: 운동 목표 (식단 연계)
 * - request_user_input: 객관식 UI
 */

import type { AIToolDefinition } from './tools';

// ============================================================================
// 식단 전용 도구 정의
// ============================================================================

/**
 * 1. 식단 프로필 조회
 * - 식단 목표, 음식 제한, 이용 가능한 출처 등
 */
export const GET_DIETARY_PROFILE: AIToolDefinition = {
  type: 'function',
  name: 'get_dietary_profile',
  description:
    '사용자의 식단 프로필을 조회합니다. 반환값: dietaryGoal(식단 목표), dietType(식단 유형), targetCalories(목표 칼로리), targetProtein(목표 단백질), mealsPerDay(하루 식사 횟수), foodRestrictions(음식 제한사항), availableSources(이용 가능한 음식 출처: 부대식당/PX/외식), eatingHabits(식습관), budgetPerMonth(월 식비 예산), preferences(선호사항).',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 2. 식단 프로필 업데이트
 * - 대화 중 수집한 식단 관련 정보 저장
 */
export const UPDATE_DIETARY_PROFILE: AIToolDefinition = {
  type: 'function',
  name: 'update_dietary_profile',
  description:
    '사용자와의 대화에서 수집한 식단 관련 정보를 프로필에 저장합니다. null 값을 전달하면 해당 필드는 업데이트하지 않습니다.',
  parameters: {
    type: 'object',
    properties: {
      dietary_goal: {
        type: 'string',
        enum: ['muscle_gain', 'fat_loss', 'maintenance', 'health', 'performance'],
        description: '식단 목표: muscle_gain(근육 증가), fat_loss(체지방 감소), maintenance(유지), health(건강), performance(퍼포먼스)',
      },
      diet_type: {
        type: 'string',
        enum: ['regular', 'high_protein', 'low_carb', 'balanced', 'bulking', 'cutting'],
        description: '식단 유형: regular(일반), high_protein(고단백), low_carb(저탄수화물), balanced(균형), bulking(벌크업), cutting(커팅)',
      },
      target_calories: {
        type: 'integer',
        description: '일일 목표 칼로리 (1000-5000 kcal)',
      },
      target_protein: {
        type: 'integer',
        description: '일일 목표 단백질 (30-400g)',
      },
      meals_per_day: {
        type: 'integer',
        description: '하루 식사 횟수 (2-6회)',
      },
      food_restrictions: {
        type: 'array',
        items: { type: 'string' },
        description: '음식 제한사항: none, dairy(유제품), seafood(해산물), nuts(견과류), gluten, egg, pork, beef, spicy(매운음식)',
      },
      available_sources: {
        type: 'array',
        items: { type: 'string' },
        description: '이용 가능한 음식 출처: canteen(부대식당), px(PX), outside(외출/외박 외식), delivery(배달)',
      },
      eating_habits: {
        type: 'array',
        items: { type: 'string' },
        description: '식습관: regular(규칙적), late_night(야식), eating_out(외식), snacking(간식), skipping_meals(식사 거르기), overeating(과식), fast_eating(빨리먹기)',
      },
      budget_per_month: {
        type: 'integer',
        description: '월 식비 예산 (원, 30000-500000)',
      },
      preferences: {
        type: 'array',
        items: { type: 'string' },
        description: '음식 선호사항 (자유 형식)',
      },
      ai_notes: {
        type: 'object',
        description: 'AI가 기록하는 추가 메모',
      },
    },
  },
};

/**
 * 3. 일일 영양 필요량 계산
 * - TDEE 및 목표에 따른 매크로 계산
 * - 신체정보는 대화에서 수집하거나 DB에서 조회 (하이브리드)
 */
export const CALCULATE_DAILY_NEEDS: AIToolDefinition = {
  type: 'function',
  name: 'calculate_daily_needs',
  description:
    '사용자의 신체 정보와 활동 수준을 기반으로 일일 영양 필요량(TDEE, 목표 칼로리, 단백질, 탄수화물, 지방)을 계산합니다. 식단 계획 전에 반드시 호출하세요. 신체정보(키, 몸무게, 나이, 성별)는 대화에서 수집한 값을 전달하거나, 생략하면 DB에서 조회합니다.',
  parameters: {
    type: 'object',
    properties: {
      activity_level: {
        type: 'string',
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
        description: '활동 수준: sedentary(거의 운동 안함), light(주 1-2회), moderate(주 3-4회), active(주 5-6회), very_active(매일 고강도)',
      },
      goal: {
        type: 'string',
        enum: ['muscle_gain', 'fat_loss', 'maintenance'],
        description: '목표: muscle_gain(근육 증가, +300-500kcal), fat_loss(체지방 감소, -300-500kcal), maintenance(유지)',
      },
      // 선택적 신체정보 - 대화에서 수집 시 전달 (없으면 DB에서 조회)
      height_cm: {
        type: 'number',
        description: '키 (cm). 대화에서 수집했으면 전달, 없으면 DB에서 조회',
      },
      weight_kg: {
        type: 'number',
        description: '몸무게 (kg). 대화에서 수집했으면 전달, 없으면 DB에서 조회',
      },
      birth_year: {
        type: 'integer',
        description: '출생연도 (예: 1995). 대화에서 수집했으면 전달, 없으면 DB에서 조회',
      },
      gender: {
        type: 'string',
        enum: ['male', 'female'],
        description: '성별. 대화에서 수집했으면 전달, 없으면 DB에서 조회',
      },
    },
    required: ['activity_level', 'goal'],
  },
};

/**
 * 4. 식단 미리보기 생성
 * - 1주 단위로 생성 후 시스템이 2주로 자동 확장
 * - 생성 시간 단축을 위해 간소화된 스키마 사용
 */
export const GENERATE_MEAL_PLAN_PREVIEW: AIToolDefinition = {
  type: 'function',
  name: 'generate_meal_plan_preview',
  description:
    '1주 식단 미리보기를 생성합니다. duration_weeks는 반드시 1로 설정하세요. 시스템이 1주차 데이터를 2주차로 자동 복제하여 2주 식단을 완성합니다. 이 도구는 식단을 DB에 저장하지 않고 사용자에게 미리보기 UI만 표시합니다. 사용자가 "적용하기" 버튼을 클릭하면 프론트엔드에서 자동으로 저장 처리됩니다. 수정 요청이 오면 피드백을 반영하여 다시 이 도구를 호출하세요.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '식단 제목 (예: "2주 벌크업 식단")',
      },
      description: {
        type: 'string',
        description: '식단에 대한 간단한 설명',
      },
      duration_weeks: {
        type: 'integer',
        description: '식단 기간 (항상 1로 설정). 시스템이 2주로 자동 확장합니다.',
      },
      target_calories: {
        type: 'integer',
        description: '일일 목표 칼로리 (kcal)',
      },
      target_protein: {
        type: 'integer',
        description: '일일 목표 단백질 (g)',
      },
      weeks: {
        type: 'array',
        description: '주차별 식단 계획 (1주만 생성)',
        items: {
          type: 'object',
          properties: {
            weekNumber: { type: 'integer', description: '주차 번호 (1로 고정)' },
            days: {
              type: 'array',
              description: '해당 주의 식단 일정 (7일)',
              items: {
                type: 'object',
                properties: {
                  dayOfWeek: { type: 'integer', description: '요일 (1=월요일, 7=일요일)' },
                  meals: {
                    type: 'array',
                    description: '하루 식사 목록',
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
                              name: { type: 'string', description: '음식 이름' },
                              portion: { type: 'string', description: '분량 (예: "1공기", "200g")' },
                              calories: { type: 'integer', description: '칼로리 (kcal)' },
                            },
                            required: ['name', 'portion'],
                          },
                        },
                        totalCalories: { type: 'integer', description: '식사 총 칼로리' },
                      },
                      required: ['type', 'foods'],
                    },
                  },
                  totalCalories: { type: 'integer', description: '하루 총 칼로리' },
                  notes: { type: 'string', description: '하루 식단 메모' },
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
 * 5. 식단 적용 (미리보기 확정)
 * - 미리보기 데이터를 실제 DB에 저장
 */
export const APPLY_MEAL_PLAN: AIToolDefinition = {
  type: 'function',
  name: 'apply_meal_plan',
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
  },
};

// ============================================================================
// Export All Meal Tools
// ============================================================================

/**
 * 식단 AI 전용 도구 목록
 * (공유 도구는 tools.ts에서 import해서 합쳐서 사용)
 */
export const AI_MEAL_TOOLS: AIToolDefinition[] = [
  GET_DIETARY_PROFILE,
  UPDATE_DIETARY_PROFILE,
  CALCULATE_DAILY_NEEDS,
  GENERATE_MEAL_PLAN_PREVIEW,
  APPLY_MEAL_PLAN,
];

/**
 * 식단 AI에서 사용하는 도구 이름 목록
 */
export const MEAL_TOOL_NAMES = [
  'get_dietary_profile',
  'update_dietary_profile',
  'calculate_daily_needs',
  'generate_meal_plan_preview',
  'apply_meal_plan',
] as const;

export type MealToolName = (typeof MEAL_TOOL_NAMES)[number];
