/**
 * AI Trainer Tools Definition
 *
 * OpenAI Responses API용 Function Calling 도구 정의
 *
 * strict: false 사용 - 유연한 object 구조 허용
 * 대신 tool-executor에서 Zod 스키마로 런타임 검증
 * 이렇게 하면 타입 안전성과 확장성을 모두 확보할 수 있음
 */

import type { AIToolName } from '@/lib/types/fitness';

// ============================================================================
// Tool Definition Type
// ============================================================================

export interface AIToolDefinition {
  type: 'function';
  name: AIToolName;
  description: string;
  strict?: boolean; // optional, defaults to false
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

// ============================================================================
// Tool Definitions (12개 세분화된 도구)
// ============================================================================

/**
 * 1. 사용자 기본 정보 조회
 * - 이름, 나이, 성별
 */
export const GET_USER_BASIC_INFO: AIToolDefinition = {
  type: 'function',
  name: 'get_user_basic_info',
  description:
    '사용자의 기본 정보(이름, 나이, 성별)를 조회합니다. 운동 프로그램 설계 시 기본적인 개인화에 사용됩니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 2. 사용자 군 정보 조회
 * - 계급, 부대, 입대월
 */
export const GET_USER_MILITARY_INFO: AIToolDefinition = {
  type: 'function',
  name: 'get_user_military_info',
  description:
    '사용자의 군 복무 정보(계급, 부대, 복무 기간)를 조회합니다. 군 생활 패턴에 맞는 운동 일정 설계에 활용됩니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 3. 사용자 신체 정보 조회
 * - 키, 몸무게 (프로필에 저장된 값)
 */
export const GET_USER_BODY_METRICS: AIToolDefinition = {
  type: 'function',
  name: 'get_user_body_metrics',
  description:
    '사용자의 기본 신체 정보(키, 몸무게)를 조회합니다. 운동 강도 및 칼로리 계산에 사용됩니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 4. 최신 인바디 기록 조회
 * - 가장 최근 인바디 측정 결과
 */
export const GET_LATEST_INBODY: AIToolDefinition = {
  type: 'function',
  name: 'get_latest_inbody',
  description:
    '사용자의 가장 최근 인바디(체성분 분석) 측정 결과를 조회합니다. 골격근량, 체지방률, BMI 등 상세 지표를 확인할 수 있습니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 5. 인바디 이력 조회
 * - 최근 N개 또는 기간별 인바디 기록
 */
export const GET_INBODY_HISTORY: AIToolDefinition = {
  type: 'function',
  name: 'get_inbody_history',
  description:
    '사용자의 인바디 측정 이력을 조회합니다. 체성분 변화 추이를 분석하여 운동 효과를 평가할 수 있습니다.',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        description: '조회할 최대 기록 수 (기본값: 5)',
      },
    },
  },
};

/**
 * 6. 운동 목표 조회
 * - fitness_profiles.fitness_goal
 */
export const GET_FITNESS_GOAL: AIToolDefinition = {
  type: 'function',
  name: 'get_fitness_goal',
  description:
    '사용자의 운동 목표(근육 증가, 체지방 감소, 지구력 향상 등)를 조회합니다. 목표에 맞는 운동 프로그램 설계에 핵심적입니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 7. 운동 경험 수준 조회
 * - fitness_profiles.experience_level
 */
export const GET_EXPERIENCE_LEVEL: AIToolDefinition = {
  type: 'function',
  name: 'get_experience_level',
  description:
    '사용자의 운동 경험 수준(초보자, 중급자, 상급자)을 조회합니다. 적절한 운동 난이도와 볼륨 설정에 사용됩니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 8. 운동 선호도 조회
 * - 주간 운동 일수, 세션 시간, 장비 접근성, 집중 부위
 */
export const GET_TRAINING_PREFERENCES: AIToolDefinition = {
  type: 'function',
  name: 'get_training_preferences',
  description:
    '사용자의 운동 선호도(주간 운동 일수, 세션당 시간, 사용 가능 장비, 집중하고 싶은 부위)를 조회합니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 9. 부상/제한 사항 조회
 * - injuries, restrictions 배열
 */
export const GET_INJURIES_RESTRICTIONS: AIToolDefinition = {
  type: 'function',
  name: 'get_injuries_restrictions',
  description:
    '사용자의 부상 이력과 운동 제한 사항을 조회합니다. 안전한 운동 프로그램 설계를 위해 반드시 확인해야 합니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 10. 피트니스 프로필 업데이트
 * - 대화 중 수집한 정보를 저장
 */
export const UPDATE_FITNESS_PROFILE: AIToolDefinition = {
  type: 'function',
  name: 'update_fitness_profile',
  description:
    '사용자와의 대화에서 수집한 운동 관련 정보를 피트니스 프로필에 저장합니다. 다음 세션에서 활용됩니다. null 값을 전달하면 해당 필드는 업데이트하지 않습니다.',
  parameters: {
    type: 'object',
    properties: {
      fitness_goal: {
        type: 'string',
        enum: ['muscle_gain', 'fat_loss', 'endurance', 'general_fitness', 'strength'],
        description: '운동 목표',
      },
      experience_level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: '운동 경험 수준',
      },
      preferred_days_per_week: {
        type: 'integer',
        description: '주간 선호 운동 일수 (1-7)',
      },
      session_duration_minutes: {
        type: 'integer',
        description: '세션당 운동 시간 (분)',
      },
      equipment_access: {
        type: 'string',
        enum: ['full_gym', 'limited', 'bodyweight_only', 'none', 'basic', 'home_gym'],
        description: '장비 접근성',
      },
      focus_areas: {
        type: 'array',
        items: { type: 'string' },
        description: '집중 부위 목록 (예: chest, back, shoulders, arms, legs, core, full_body)',
      },
      injuries: {
        type: 'array',
        items: { type: 'string' },
        description: '부상 이력',
      },
      preferences: {
        type: 'array',
        items: { type: 'string' },
        description: '운동 선호 사항',
      },
      restrictions: {
        type: 'array',
        items: { type: 'string' },
        description: '운동 제한 사항',
      },
      ai_notes: {
        type: 'object',
        description: 'AI가 기록하는 추가 메모 (summary, recommendations, observations 등)',
      },
    },
  },
};

/**
 * 11. 현재 루틴 조회
 * - 사용자의 활성 루틴 (있는 경우)
 */
export const GET_CURRENT_ROUTINE: AIToolDefinition = {
  type: 'function',
  name: 'get_current_routine',
  description:
    '사용자의 현재 적용 중인 운동 루틴을 조회합니다. 기존 루틴이 있다면 이를 기반으로 개선 제안을 할 수 있습니다.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 12. 루틴 초안 저장
 * - 대화 중 생성한 루틴을 임시 저장
 */
export const SAVE_ROUTINE_DRAFT: AIToolDefinition = {
  type: 'function',
  name: 'save_routine_draft',
  description:
    '생성한 운동 루틴 초안을 대화에 연결하여 저장합니다. 사용자가 "적용하기"를 선택하면 정식 루틴으로 변환됩니다.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '루틴 제목 (예: "4주 근력 강화 프로그램")',
      },
      description: {
        type: 'string',
        description: '루틴에 대한 간단한 설명',
      },
      duration_weeks: {
        type: 'integer',
        description: '루틴 기간 (주 단위)',
      },
      days_per_week: {
        type: 'integer',
        description: '주간 운동 일수',
      },
      routine_data: {
        type: 'object',
        description: '루틴 상세 데이터. weeks 배열 안에 각 주의 days 배열이 있고, 각 day에는 dayOfWeek(1-7), title, workoutType, exercises 배열 등이 포함됩니다.',
        properties: {
          weeks: {
            type: 'array',
            description: '주차별 운동 계획',
            items: {
              type: 'object',
              properties: {
                weekNumber: { type: 'integer', description: '주차 번호' },
                days: {
                  type: 'array',
                  description: '해당 주의 운동 일정',
                  items: {
                    type: 'object',
                    properties: {
                      dayOfWeek: { type: 'integer', description: '요일 (1=월요일, 7=일요일)' },
                      title: { type: 'string', description: '운동 제목' },
                      workoutType: { type: 'string', description: 'push, pull, legs, upper, lower, full 등' },
                      exercises: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', description: '운동 이름' },
                            category: { type: 'string', description: 'compound, isolation, cardio 등' },
                            targetMuscle: { type: 'string', description: '대상 근육' },
                            sets: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  targetReps: { type: 'integer', description: '목표 반복 횟수' },
                                  targetWeight: { type: 'number', description: '목표 중량 (kg)' },
                                },
                              },
                            },
                            restSeconds: { type: 'integer', description: '세트 간 휴식 시간 (초)' },
                          },
                        },
                      },
                      estimatedDuration: { type: 'integer', description: '예상 소요 시간 (분)' },
                      intensity: { type: 'integer', description: '강도 (1-10 RPE)' },
                      warmup: { type: 'string', description: '워밍업 설명' },
                      cooldown: { type: 'string', description: '쿨다운 설명' },
                      tips: { type: 'array', items: { type: 'string' }, description: '운동 팁' },
                      notes: { type: 'string', description: '메모' },
                      rationale: { type: 'string', description: '이 운동을 선택한 이유' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    required: ['title', 'description', 'duration_weeks', 'days_per_week', 'routine_data'],
  },
};

// ============================================================================
// All Tools Export
// ============================================================================

export const AI_TRAINER_TOOLS: AIToolDefinition[] = [
  GET_USER_BASIC_INFO,
  GET_USER_MILITARY_INFO,
  GET_USER_BODY_METRICS,
  GET_LATEST_INBODY,
  GET_INBODY_HISTORY,
  GET_FITNESS_GOAL,
  GET_EXPERIENCE_LEVEL,
  GET_TRAINING_PREFERENCES,
  GET_INJURIES_RESTRICTIONS,
  UPDATE_FITNESS_PROFILE,
  GET_CURRENT_ROUTINE,
  SAVE_ROUTINE_DRAFT,
];

/**
 * 도구 이름으로 정의 찾기
 */
export function getToolDefinition(name: AIToolName): AIToolDefinition | undefined {
  return AI_TRAINER_TOOLS.find((tool) => tool.name === name);
}
