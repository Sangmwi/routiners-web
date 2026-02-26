import type { AIToolDefinition } from './types';

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
 * 3. 사용자 인바디 정보 조회
 * - 체성분 데이터(키, 몸무게, 골격근량, 체지방률)는 최신 인바디 기록에서 조회
 * - TDEE 계산에 필요한 필드: 키, 몸무게, 생년월일, 성별
 * - 인바디 상세 데이터는 get_latest_inbody 사용
 */
export const GET_USER_BODY_METRICS: AIToolDefinition = {
  type: 'function',
  name: 'get_user_body_metrics',
  description:
    '사용자의 인바디 정보를 조회합니다. 체성분 데이터(키, 몸무게, 골격근량, 체지방률)는 최신 인바디 기록에서 가져옵니다. 반환값: height_cm(키, cm), weight_kg(몸무게, kg), birth_date(생년월일, ISO 형식), gender(성별, "male" 또는 "female"), muscleMass(골격근량, kg), bodyFatPercentage(체지방률, %). 인바디 기록이 없으면 체성분 필드가 null이며, 이 경우 사용자에게 인바디 기록 등록을 안내하세요.',
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
        minimum: 1,
        maximum: 7,
        description: '주간 선호 운동 일수 (1-7)',
      },
      session_duration_minutes: {
        type: 'integer',
        minimum: 10,
        maximum: 180,
        description: '세션당 운동 시간 (분, 10-180)',
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

// ============================================================================
// Dietary Profile Tools (식단 프로필 관련)
// ============================================================================

/**
 * 7. 식단 프로필 조회
 * - 식단 목표, 유형, 제한사항, 식습관 등
 */
export const GET_DIETARY_PROFILE: AIToolDefinition = {
  type: 'function',
  name: 'get_dietary_profile',
  description:
    '사용자의 식단 프로필을 조회합니다. 반환값: dietaryGoal(식단 목표), dietType(식단 유형), targetCalories(목표 칼로리), targetProtein(목표 단백질), mealsPerDay(하루 식사 횟수), foodRestrictions(음식 제한사항), availableSources(이용 가능 식단 출처), eatingHabits(식습관), budgetPerMonth(월 예산), preferences(선호사항). 식단 관련 상담 시 먼저 호출하세요.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 8. 식단 프로필 업데이트
 * - 대화 중 수집한 식단 관련 정보를 저장
 */
export const UPDATE_DIETARY_PROFILE: AIToolDefinition = {
  type: 'function',
  name: 'update_dietary_profile',
  description:
    '사용자와의 대화에서 수집한 식단 관련 정보를 식단 프로필에 저장합니다. null 값을 전달하면 해당 필드는 업데이트하지 않습니다.',
  parameters: {
    type: 'object',
    properties: {
      dietary_goal: {
        type: 'string',
        enum: ['muscle_gain', 'fat_loss', 'maintenance', 'health', 'performance'],
        description: '식단 목표 (근육 증가, 체지방 감소, 체중 유지, 건강 유지, 퍼포먼스)',
      },
      diet_type: {
        type: 'string',
        enum: ['regular', 'high_protein', 'low_carb', 'balanced', 'bulking', 'cutting'],
        description: '식단 유형 (일반, 고단백, 저탄수화물, 균형, 벌크업, 커팅)',
      },
      target_calories: {
        type: 'integer',
        description: '목표 칼로리 (kcal). calculate_daily_needs 결과를 기반으로 설정.',
      },
      target_protein: {
        type: 'integer',
        description: '목표 단백질 (g)',
      },
      meals_per_day: {
        type: 'integer',
        minimum: 1,
        maximum: 6,
        description: '하루 식사 횟수 (1-6)',
      },
      food_restrictions: {
        type: 'array',
        items: { type: 'string' },
        description: '음식 제한사항 (예: dairy, seafood, nuts, gluten, egg, pork, beef, spicy)',
      },
      available_sources: {
        type: 'array',
        items: { type: 'string' },
        description: '이용 가능한 음식 출처 (canteen, px, outside, delivery)',
      },
      eating_habits: {
        type: 'array',
        items: { type: 'string' },
        description: '식습관 (regular, late_night, eating_out, snacking, skipping_meals, overeating, fast_eating)',
      },
      budget_per_month: {
        type: 'integer',
        description: '월 식단 예산 (원)',
      },
      preferences: {
        type: 'array',
        items: { type: 'string' },
        description: '식단 선호사항 (자유 텍스트)',
      },
      ai_notes: {
        type: 'object',
        description: 'AI가 기록하는 추가 메모 (summary, recommendations, observations 등)',
      },
    },
  },
};

/**
 * 9. 일일 영양 필요량 계산 (TDEE 기반)
 * - 인바디 기록의 키/몸무게 + 식단 프로필 → 자동 계산
 * - 인바디 기록(키, 몸무게), 생년월일, 성별이 필수
 */
export const CALCULATE_DAILY_NEEDS: AIToolDefinition = {
  type: 'function',
  name: 'calculate_daily_needs',
  description:
    '사용자의 신체정보(인바디 기록의 키/몸무게)와 식단 프로필을 기반으로 일일 영양 필요량을 계산합니다. Mifflin-St Jeor 공식으로 TDEE를 산출하고, 식단 목표에 맞는 칼로리/단백질/탄수화물/지방 목표를 반환합니다. 인바디 기록에 키/몸무게가 없으면 에러가 반환되며, 이 경우 사용자에게 인바디 기록 등록을 안내하세요. 식단 생성 전 반드시 호출하여 기준값을 확보하세요.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

/**
 * 13. 사용자 입력 요청
 * - 객관식 선택, 슬라이더 등 UI를 통한 사용자 입력 요청
 * - 사용자가 직접 타이핑하지 않고 버튼/슬라이더로 쉽게 답변 가능
 * - 중요: 텍스트로 옵션을 나열하지 말고 반드시 이 도구를 사용할 것
 *
 * Phase 20: Structured Outputs 강화
 * - strict: true로 스키마 강제 준수
 * - C. 프롬프트에 필수 조건 명시
 */
export const REQUEST_USER_INPUT: AIToolDefinition = {
  type: 'function',
  name: 'request_user_input',
  strict: true,
  description:
    '사용자에게 선택형 질문을 할 때 반드시 이 도구를 사용하세요. 절대로 텍스트로 "1. 근육증가 2. 체지방감소" 같이 나열하지 마세요. 이 도구를 호출하면 사용자 화면에 클릭 가능한 버튼이나 슬라이더가 표시됩니다.\n\n⚠️ 필수 조건:\n- type이 "radio" 또는 "checkbox"면 반드시 options 배열을 포함해야 합니다 (최소 2개 이상)\n- type이 "slider"면 반드시 sliderConfig 객체를 포함해야 합니다\n- options 없이 radio/checkbox를 호출하면 UI가 표시되지 않습니다!',
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
          'UI 타입. radio: 단일 선택 (options 필수), checkbox: 다중 선택 (options 필수), slider: 숫자 범위 선택 (sliderConfig 필수)',
      },
      options: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            value: { type: 'string', description: '선택 시 전송될 값' },
            label: { type: 'string', description: '화면에 표시될 텍스트' },
          },
          required: ['value', 'label'],
          additionalProperties: false,
        },
        description: '⚠️ radio/checkbox 타입에서 필수! 최소 2개 이상의 선택지를 포함해야 합니다.',
      },
      sliderConfig: {
        type: ['object', 'null'],
        properties: {
          min: { type: 'number', description: '최소값' },
          max: { type: 'number', description: '최대값' },
          step: { type: 'number', description: '증가 단위' },
          unit: { type: 'string', description: '단위 (예: 일, 분, kg)' },
          defaultValue: { type: 'number', description: '기본값' },
        },
        required: ['min', 'max', 'step', 'unit', 'defaultValue'],
        additionalProperties: false,
        description: '⚠️ slider 타입에서 필수! 슬라이더 설정을 포함해야 합니다.',
      },
    },
    required: ['message', 'type', 'options', 'sliderConfig'],
    additionalProperties: false,
  },
};

/**
 * 14. 프로필 데이터 확인 요청
 * - 기존 저장된 프로필 데이터를 사용자에게 확인받음
 * - 자동 스킵 대신 확인 UI 표시
 *
 * Phase 21-D: AI 프롬프트 강화
 */
export const CONFIRM_PROFILE_DATA: AIToolDefinition = {
  type: 'function',
  name: 'confirm_profile_data',
  description:
    '기존 저장된 프로필 데이터를 사용자에게 확인받습니다. 프로필 정보(운동 목표, 경험 수준 등)가 이미 있을 때, 자동으로 넘어가지 않고 이 도구를 사용해 사용자에게 현재 값을 보여주고 "확인" 또는 "수정" 선택권을 줍니다.\n\n⚠️ 필수 조건:\n- fields 배열은 최소 1개 이상의 필드를 포함해야 합니다\n- 각 필드는 key, label, value, displayValue가 모두 있어야 합니다\n- displayValue는 사용자에게 보여줄 한국어 값입니다 (예: "muscle_gain" → "근육 증가")',
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

export const PROFILE_TOOL_DEFINITIONS: AIToolDefinition[] = [
  GET_USER_BASIC_INFO,
  GET_USER_MILITARY_INFO,
  GET_USER_BODY_METRICS,
  GET_LATEST_INBODY,
  GET_INBODY_HISTORY,
  GET_FITNESS_PROFILE,
  UPDATE_FITNESS_PROFILE,
  GET_DIETARY_PROFILE,
  UPDATE_DIETARY_PROFILE,
  CALCULATE_DAILY_NEEDS,
  REQUEST_USER_INPUT,
  CONFIRM_PROFILE_DATA,
];
