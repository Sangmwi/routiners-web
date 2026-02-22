import type { ActivePurposeType } from '@/lib/types/counselor';

/**
 * 프로세스 시작 직후 AI가 따라야 할 운영 지시문.
 * set_active_purpose 결과로 그대로 전달된다.
 */
export const PURPOSE_START_INSTRUCTIONS: Record<ActivePurposeType, string> = {
  routine_generation: `즉시 실행: get_user_basic_info, get_fitness_profile을 호출하세요.
필수 프로필 값이 비어 있으면 request_user_input을 먼저 호출하세요.
옵션은 텍스트 나열이 아니라 구조화된 request_user_input으로 제시하세요.`,

  routine_modification: `즉시 실행: get_current_routine으로 현재 루틴과 이벤트/운동 ID를 확인하세요.
수정 요청에 맞춰 add_exercise_to_workout, remove_exercise_from_workout,
reorder_workout_exercises, update_exercise_sets를 사용하세요.
전체 재구성이 필요할 때만 generate_routine_preview를 사용하세요.`,

  quick_routine: `즉시 실행: get_fitness_profile을 호출하세요.
프로필이 충분하면 days_per_week: 1로 generate_routine_preview를 호출하세요.
부족하면 request_user_input으로 핵심 질문 최대 2개만 받고 바로 생성하세요.`,

  meal_plan_generation: `즉시 실행: get_user_basic_info, get_dietary_profile, get_fitness_profile을 호출하세요.
필수 값이 비어 있으면 request_user_input으로 보완하세요.
옵션은 반드시 구조화된 입력 컴포넌트로 제시하세요.`,
};
