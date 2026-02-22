import type { AIToolDefinition } from './types';

/**
 * 11. 현재 루틴 조회
 * - 사용자의 활성 루틴 (있는 경우)
 */
export const GET_CURRENT_ROUTINE: AIToolDefinition = {
  type: 'function',
  name: 'get_current_routine',
  description:
    '사용자의 현재 운동 루틴 이벤트를 조회합니다. 향후 예정(scheduled)된 이벤트와 최근 2주간 완료(completed) 이벤트를 포함합니다. 각 이벤트에 id(편집 도구용)와 운동별 id, 이름, 세트 수가 포함됩니다. 루틴 수정/조회 시 반드시 먼저 호출하세요.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

// ============================================================================
// Workout Editing Tools (기존 루틴 수정용)
// workoutDataOperations.ts 순수 함수와 공유
// ============================================================================

/**
 * 11-a. 운동 추가
 */
export const ADD_EXERCISE_TO_WORKOUT: AIToolDefinition = {
  type: 'function',
  name: 'add_exercise_to_workout',
  description:
    '기존 루틴 이벤트에 운동을 추가합니다. get_current_routine으로 조회한 이벤트 ID를 사용하세요.',
  parameters: {
    type: 'object',
    properties: {
      routine_event_id: {
        type: 'string',
        description: '대상 루틴 이벤트 ID (get_current_routine 결과의 id)',
      },
      exercise: {
        type: 'object',
        description: '추가할 운동 정보',
        properties: {
          name: { type: 'string', description: '운동명 (예: 벤치프레스)' },
          category: { type: 'string', description: '카테고리 (예: 가슴)' },
          targetMuscle: { type: 'string', description: '타겟 근육' },
          sets: {
            type: 'array',
            description: '세트 정보',
            items: {
              type: 'object',
              properties: {
                setNumber: { type: 'number' },
                targetReps: { type: 'number' },
                targetWeight: { type: 'number' },
                restSeconds: { type: 'number' },
              },
            },
          },
          restSeconds: { type: 'number', description: '세트 간 휴식 시간 (초)' },
        },
        required: ['name', 'sets'],
      },
    },
    required: ['routine_event_id', 'exercise'],
  },
};

/**
 * 11-b. 운동 삭제
 */
export const REMOVE_EXERCISE_FROM_WORKOUT: AIToolDefinition = {
  type: 'function',
  name: 'remove_exercise_from_workout',
  description:
    '루틴 이벤트에서 특정 운동을 삭제합니다. 최소 1개 운동은 남아야 합니다.',
  parameters: {
    type: 'object',
    properties: {
      routine_event_id: {
        type: 'string',
        description: '대상 루틴 이벤트 ID',
      },
      exercise_id: {
        type: 'string',
        description: '삭제할 운동 ID (get_current_routine 결과의 exercises[].id)',
      },
    },
    required: ['routine_event_id', 'exercise_id'],
  },
};

/**
 * 11-c. 운동 순서 변경
 */
export const REORDER_WORKOUT_EXERCISES: AIToolDefinition = {
  type: 'function',
  name: 'reorder_workout_exercises',
  description:
    '루틴 이벤트 내 운동 순서를 변경합니다. 모든 운동 ID를 새 순서대로 나열하세요.',
  parameters: {
    type: 'object',
    properties: {
      routine_event_id: {
        type: 'string',
        description: '대상 루틴 이벤트 ID',
      },
      ordered_exercise_ids: {
        type: 'array',
        items: { type: 'string' },
        description: '새 순서의 운동 ID 배열 (모든 운동 ID 포함)',
      },
    },
    required: ['routine_event_id', 'ordered_exercise_ids'],
  },
};

/**
 * 11-d. 세트 수정
 */
export const UPDATE_EXERCISE_SETS: AIToolDefinition = {
  type: 'function',
  name: 'update_exercise_sets',
  description:
    '특정 운동의 세트 정보를 교체합니다. 기존 세트를 새 세트로 완전히 대체합니다.',
  parameters: {
    type: 'object',
    properties: {
      routine_event_id: {
        type: 'string',
        description: '대상 루틴 이벤트 ID',
      },
      exercise_id: {
        type: 'string',
        description: '수정할 운동 ID',
      },
      sets: {
        type: 'array',
        description: '새 세트 정보 (기존 세트를 완전히 대체)',
        items: {
          type: 'object',
          properties: {
            setNumber: { type: 'number' },
            targetReps: { type: 'number' },
            targetWeight: { type: 'number' },
            restSeconds: { type: 'number' },
          },
        },
      },
    },
    required: ['routine_event_id', 'exercise_id', 'sets'],
  },
};

/**
 * 12. 루틴 초안 저장 (deprecated - generate_routine_preview 사용 권장)
 * - 대화 중 생성한 루틴을 임시 저장
 */
export const SAVE_ROUTINE_DRAFT: AIToolDefinition = {
  type: 'function',
  name: 'save_routine_draft',
  description:
    '[deprecated] 이 도구 대신 generate_routine_preview를 사용하세요. 미리보기 후 사용자가 확인하면 apply_routine으로 저장합니다.',
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

/**
 * 15. 루틴 미리보기 생성
 * - DB에 저장하지 않고 미리보기 UI만 표시
 * - 사용자가 확인 후 프론트엔드에서 apply API 호출
 * - 1주 단위 생성 후 시스템이 4주로 자동 확장 (토큰 75% 절약)
 *
 * Phase 21-D: AI 프롬프트 강화
 */
export const GENERATE_ROUTINE_PREVIEW: AIToolDefinition = {
  type: 'function',
  name: 'generate_routine_preview',
  description:
    '1주 운동 루틴 미리보기를 생성합니다. 사용자가 적용 시 1~4주 중 선택합니다.\n\n⚠️ 필수 조건:\n- duration_weeks는 반드시 1로 설정\n- weeks 배열은 정확히 1개만 포함\n- 각 week의 days 배열 길이는 days_per_week와 일치해야 함\n- 각 day는 최소 1개 이상의 exercise 포함 필수\n- exercise는 name(문자열), sets(숫자), reps(문자열 "8-12"), rest(문자열 "90초") 모두 필수\n\n수정 요청이 오면 피드백을 반영하여 다시 이 도구를 호출하세요.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '루틴 제목 (예: "2주 근력 강화 프로그램")',
      },
      description: {
        type: 'string',
        description: '루틴에 대한 간단한 설명',
      },
      duration_weeks: {
        type: 'integer',
        description: '루틴 기간 (항상 1로 설정).',
      },
      days_per_week: {
        type: 'integer',
        description: '주간 운동 일수',
      },
      weeks: {
        type: 'array',
        description: '주차별 운동 계획',
        items: {
          type: 'object',
          properties: {
            weekNumber: { type: 'integer', description: '주차 번호 (1부터 시작)' },
            days: {
              type: 'array',
              description: '해당 주의 운동 일정',
              items: {
                type: 'object',
                properties: {
                  dayOfWeek: { type: 'integer', description: '요일 (1=월요일, 7=일요일)' },
                  title: { type: 'string', description: '운동 제목 (예: 가슴+삼두)' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '운동 이름' },
                        sets: { type: 'integer', description: '세트 수' },
                        reps: { type: 'string', description: '반복 횟수 (예: "8-12", "10")' },
                        rest: { type: 'string', description: '휴식 시간 (예: "90초", "2분")' },
                        weight: { type: 'number', description: '목표 중량 (kg). 맨몸 운동은 0, 웨이트 운동은 사용자 수준에 맞는 적절한 중량을 설정하세요.' },
                        category: { type: 'string', description: '운동 카테고리: strength, cardio, compound, isolation, flexibility 중 하나' },
                        distance: { type: 'number', description: '유산소 운동의 거리 (km). 러닝, 사이클링 등 유산소 운동에만 적용' },
                      },
                      required: ['name', 'sets', 'reps', 'rest'],
                    },
                  },
                  estimatedDuration: { type: 'integer', description: '예상 소요 시간 (분)' },
                  estimatedCaloriesBurned: { type: 'integer', description: '예상 소모 칼로리 (kcal). 운동 강도, 시간, 종류를 고려하여 추정' },
                },
                required: ['dayOfWeek', 'title', 'exercises'],
              },
            },
          },
          required: ['weekNumber', 'days'],
        },
      },
    },
    required: ['title', 'description', 'duration_weeks', 'days_per_week', 'weeks'],
  },
};

/**
 * 15. 루틴 적용 (미리보기 확정)
 * - 미리보기 데이터를 실제 DB에 저장
 * - 사용자가 "적용하기" 버튼을 클릭하면 호출됨
 *
 * Phase 21-C: strict: true 적용
 */
export const APPLY_ROUTINE: AIToolDefinition = {
  type: 'function',
  name: 'apply_routine',
  strict: true,
  description:
    '미리보기 중인 루틴을 실제로 적용합니다. 이 도구는 사용자가 루틴 미리보기에서 "적용하기" 버튼을 클릭했을 때만 호출됩니다. preview_id는 generate_routine_preview에서 생성된 미리보기 ID입니다.',
  parameters: {
    type: 'object',
    properties: {
      preview_id: {
        type: 'string',
        description: '적용할 루틴 미리보기 ID',
      },
    },
    required: ['preview_id'],
    additionalProperties: false,
  },
};

export const ROUTINE_TOOL_DEFINITIONS: AIToolDefinition[] = [
  GET_CURRENT_ROUTINE,
  ADD_EXERCISE_TO_WORKOUT,
  REMOVE_EXERCISE_FROM_WORKOUT,
  REORDER_WORKOUT_EXERCISES,
  UPDATE_EXERCISE_SETS,
  SAVE_ROUTINE_DRAFT,
  GENERATE_ROUTINE_PREVIEW,
  APPLY_ROUTINE,
];
