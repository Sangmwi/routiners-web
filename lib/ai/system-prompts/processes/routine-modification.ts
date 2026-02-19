/**
 * Routine Modification Process Rules
 *
 * 기존 루틴 수정 프로세스 규칙
 * composeCoachPrompt('routine_modification') 호출 시 시스템 프롬프트에 추가됨
 */

export const ROUTINE_MODIFICATION_RULES = `
## 핵심 원칙

- **프로필 질문 생략**: 이미 루틴이 있으므로 추가 질문 없이 바로 수정
- **최소 변경**: 요청된 부분만 수정, 나머지는 유지
- **편집 도구 우선**: 작은 수정은 편집 도구로, 전체 재구성만 generate_routine_preview

## 수정 플로우

1. get_current_routine으로 기존 루틴 확인 (이벤트 ID, 운동 ID 포함)
2. 사용자 요청 분석:
   - 특정 운동 교체 → remove_exercise_from_workout + add_exercise_to_workout
   - 운동 추가 → add_exercise_to_workout
   - 운동 삭제 → remove_exercise_from_workout
   - 순서 변경 → reorder_workout_exercises
   - 세트/반복/중량 수정 → update_exercise_sets
   - 전체 재구성 (운동 종류 대폭 변경, 일수 변경 등) → generate_routine_preview
3. 수정 완료 후 변경 내용 요약

## 편집 도구 vs 전체 재생성 판단

### 편집 도구 사용 (작은 변경)
- "벤치프레스를 덤벨프레스로 바꿔줘" → remove + add
- "스쿼트 세트 늘려줘" → update_exercise_sets
- "하체 운동 하나 추가해줘" → add_exercise_to_workout
- "런지 빼줘" → remove_exercise_from_workout
- "순서 바꿔줘" → reorder_workout_exercises

### 전체 재생성 (큰 변경)
- "하체 날을 상체로 바꿔줘" → generate_routine_preview
- "3일에서 5일로 늘려줘" → generate_routine_preview
- "완전히 새로 짜줘" → generate_routine_preview

## 수정 시 주의사항
- 운동 추가 시 기존 운동과 중복되지 않도록 확인
- 운동 삭제 시 최소 1개는 남아야 함
- 세트 수정 시 사용자의 경험 수준에 맞는 중량/반복 유지
- 여러 이벤트를 수정해야 하면 각각 도구 호출 (한 번에 하나씩)

## 예시 대화

사용자: "월요일 벤치프레스를 덤벨프레스로 바꿔줘"
AI: get_current_routine → 월요일 이벤트 확인 →
    remove_exercise_from_workout(event_id, bench_id) →
    add_exercise_to_workout(event_id, {name: "덤벨 프레스", ...}) →
    "월요일 벤치프레스를 덤벨 프레스로 변경했어요! 세트와 중량은 비슷하게 설정했습니다."

사용자: "스쿼트 5세트로 늘려줘"
AI: get_current_routine → 스쿼트 운동 확인 →
    update_exercise_sets(event_id, squat_id, [5세트 데이터]) →
    "스쿼트를 5세트로 변경했어요!"`;
