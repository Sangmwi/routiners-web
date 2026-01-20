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
 * - 닉네임(사용자가 설정한 이름), 나이, 성별, 관심 운동, 흡연 여부
 * - 주의: 이름은 사용자가 직접 설정한 닉네임(nickname)이며, 공식 실명(real_name)과 다를 수 있음
 */
export const GET_USER_BASIC_INFO: AIToolDefinition = {
  type: 'function',
  name: 'get_user_basic_info',
  description:
    '사용자의 기본 프로필 정보를 조회합니다. 반환값: name(사용자가 설정한 닉네임), age(나이), gender(성별), interestedExercises(관심 운동 종류 배열), isSmoker(흡연 여부). 사용자를 부를 때는 반드시 name 필드를 사용하세요.',
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
 * - TDEE 계산에 필요한 4개 필드: 키, 몸무게, 생년월일, 성별
 * - 추가: 골격근량, 체지방률
 * - 인바디 상세 데이터는 get_latest_inbody 사용
 */
export const GET_USER_BODY_METRICS: AIToolDefinition = {
  type: 'function',
  name: 'get_user_body_metrics',
  description:
    '사용자의 신체 정보를 조회합니다. TDEE 계산에 필요한 필수 정보가 포함됩니다. 반환값: height_cm(키, cm), weight_kg(몸무게, kg), birth_date(생년월일, ISO 형식), gender(성별, "male" 또는 "female"), muscleMass(골격근량, kg), bodyFatPercentage(체지방률, %). 모든 필드는 null일 수 있으며, null인 필드는 사용자에게 질문해야 합니다.',
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
 * 6. 피트니스 프로필 통합 조회 (권장)
 * - 운동 목표, 경험 수준, 선호도, 부상/제한 사항을 한 번에 조회
 * - 성능 최적화: 4개 개별 쿼리 → 1개 통합 쿼리
 */
export const GET_FITNESS_PROFILE: AIToolDefinition = {
  type: 'function',
  name: 'get_fitness_profile',
  description:
    '사용자의 피트니스 프로필을 한 번에 조회합니다. 운동 목표(fitnessGoal), 경험 수준(experienceLevel), 선호도(preferredDaysPerWeek, sessionDurationMinutes, equipmentAccess, focusAreas, preferences), 부상/제한 사항(injuries, restrictions)을 모두 반환합니다. 개별 도구(get_fitness_goal, get_experience_level 등) 대신 이 도구를 사용하세요.',
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
 * 13. 사용자 입력 요청
 * - 객관식 선택, 슬라이더 등 UI를 통한 사용자 입력 요청
 * - 사용자가 직접 타이핑하지 않고 버튼/슬라이더로 쉽게 답변 가능
 * - 중요: 텍스트로 옵션을 나열하지 말고 반드시 이 도구를 사용할 것
 */
export const REQUEST_USER_INPUT: AIToolDefinition = {
  type: 'function',
  name: 'request_user_input',
  description:
    '사용자에게 선택형 질문을 할 때 반드시 이 도구를 사용하세요. 절대로 텍스트로 "1. 근육증가 2. 체지방감소" 같이 나열하지 마세요. 이 도구를 호출하면 사용자 화면에 클릭 가능한 버튼이나 슬라이더가 표시됩니다. message 파라미터에 사용자에게 보여줄 질문 메시지를 반드시 포함하세요.',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description:
          '사용자에게 보여줄 질문 메시지. 예: "운동 경험은 어느 정도인가요?", "좋습니다! 주간 운동 일수를 선택해주세요."',
      },
      type: {
        type: 'string',
        enum: ['radio', 'checkbox', 'slider'],
        description:
          'UI 타입. radio: 단일 선택, checkbox: 다중 선택, slider: 숫자 범위 선택',
      },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string', description: '선택 시 전송될 값' },
            label: { type: 'string', description: '화면에 표시될 텍스트' },
          },
          required: ['value', 'label'],
        },
        description: 'radio, checkbox 타입에서 사용할 선택지 목록',
      },
      sliderConfig: {
        type: 'object',
        properties: {
          min: { type: 'number', description: '최소값' },
          max: { type: 'number', description: '최대값' },
          step: { type: 'number', description: '증가 단위' },
          unit: { type: 'string', description: '단위 (예: 일, 분, kg)' },
          defaultValue: { type: 'number', description: '기본값' },
        },
        required: ['min', 'max', 'step', 'unit'],
        description: 'slider 타입에서 사용할 설정',
      },
    },
    required: ['message', 'type'],
  },
};

/**
 * 14. 프로필 데이터 확인 요청
 * - 기존 저장된 프로필 데이터를 사용자에게 확인받음
 * - 자동 스킵 대신 확인 UI 표시
 */
export const CONFIRM_PROFILE_DATA: AIToolDefinition = {
  type: 'function',
  name: 'confirm_profile_data',
  description:
    '기존 저장된 프로필 데이터를 사용자에게 확인받습니다. 프로필 정보(운동 목표, 경험 수준 등)가 이미 있을 때, 자동으로 넘어가지 않고 이 도구를 사용해 사용자에게 현재 값을 보여주고 "확인" 또는 "수정" 선택권을 줍니다. 사용자가 확인하면 다음 단계로, 수정을 원하면 해당 정보를 다시 질문합니다.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '확인 카드 제목 (예: "현재 설정된 운동 프로필")',
      },
      description: {
        type: 'string',
        description: '확인 안내 메시지 (예: "아래 정보가 맞는지 확인해주세요")',
      },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string', description: '필드 키 (예: fitnessGoal)' },
            label: { type: 'string', description: '표시 라벨 (예: 운동 목표)' },
            value: { type: 'string', description: '저장된 값 (예: muscle_gain)' },
            displayValue: { type: 'string', description: '표시용 값 - 한국어 (예: 근육 증가)' },
          },
          required: ['key', 'label', 'value', 'displayValue'],
        },
        description: '확인할 필드 목록',
      },
    },
    required: ['title', 'fields'],
  },
};

/**
 * 15. 루틴 미리보기 생성
 * - DB에 저장하지 않고 미리보기 UI만 표시
 * - 사용자가 확인 후 프론트엔드에서 apply API 호출
 * - 1주 단위 생성 후 시스템이 2주로 자동 확장 (토큰 50% 절약, 응답 속도 2배 향상)
 */
export const GENERATE_ROUTINE_PREVIEW: AIToolDefinition = {
  type: 'function',
  name: 'generate_routine_preview',
  description:
    '1주 운동 루틴 미리보기를 생성합니다. duration_weeks는 반드시 1로 설정하세요. 시스템이 1주차 데이터를 2주차로 자동 복제하여 2주 루틴을 완성합니다. 이 도구는 루틴을 DB에 저장하지 않고 사용자에게 미리보기 UI만 표시합니다. 사용자가 "적용하기" 버튼을 클릭하면 프론트엔드에서 자동으로 저장 처리됩니다. 수정 요청이 오면 피드백을 반영하여 다시 이 도구를 호출하세요.',
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
        description: '루틴 기간 (항상 1로 설정). 시스템이 2주로 자동 확장합니다.',
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
                      },
                      required: ['name', 'sets', 'reps', 'rest'],
                    },
                  },
                  estimatedDuration: { type: 'integer', description: '예상 소요 시간 (분)' },
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
 */
export const APPLY_ROUTINE: AIToolDefinition = {
  type: 'function',
  name: 'apply_routine',
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
  },
};

// ============================================================================
// All Tools Export
// ============================================================================

export const AI_TRAINER_TOOLS: AIToolDefinition[] = [
  // 사용자 기본 정보
  GET_USER_BASIC_INFO,
  GET_USER_MILITARY_INFO,
  GET_USER_BODY_METRICS,
  GET_LATEST_INBODY,
  GET_INBODY_HISTORY,
  // 피트니스 프로필
  GET_FITNESS_PROFILE,
  UPDATE_FITNESS_PROFILE,
  // 루틴 관련
  GET_CURRENT_ROUTINE,
  SAVE_ROUTINE_DRAFT,
  // 사용자 입력 요청
  REQUEST_USER_INPUT,
  // 프로필 확인 요청
  CONFIRM_PROFILE_DATA,
  // 루틴 미리보기/적용
  GENERATE_ROUTINE_PREVIEW,
  APPLY_ROUTINE,
];

/**
 * 도구 이름으로 정의 찾기
 */
export function getToolDefinition(name: AIToolName): AIToolDefinition | undefined {
  return AI_TRAINER_TOOLS.find((tool) => tool.name === name);
}
