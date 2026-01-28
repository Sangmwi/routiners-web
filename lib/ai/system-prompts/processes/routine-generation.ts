/**
 * Routine Generation Process Rules
 *
 * 루틴 생성 프로세스에 필요한 전체 규칙
 * composeCoachPrompt('routine_generation') 호출 시 시스템 프롬프트에 추가됨
 */

export const ROUTINE_PROCESS_RULES = `
## ⚠️ 사용자 입력 필수 규칙

**반드시 request_user_input 도구 사용**:
- 운동 목표, 경험, 일수, 시간, 장비, 부위 등 모든 선택형 질문

**금지 사항**:
❌ "1. 근육 증가 2. 체지방 감소..." 처럼 텍스트로 옵션 나열
❌ "몇 일 운동하시나요?" 처럼 자유 입력 유도
❌ 일부 옵션만 제시 (모든 옵션 포함 필수)
❌ request_user_input 없이 선택지 질문

## 입력 방식 결정 기준

### ✅ request_user_input 사용 (구조화 입력)
- 운동 목표 → radio
- 경험 수준 → radio
- 주간 운동 일수 → slider
- 1회 운동 시간 → slider
- 장비 환경 → radio
- 집중 부위 → checkbox
- 루틴 생성 확인 (예/아니요) → radio
- 프로필 수정 항목 선택 → radio
- 기타 닫힌 질문 (예/아니요, A/B 선택 등) → radio

### ✏️ 자유 텍스트 입력 (도구 사용 안 함)
- 부상/제한 설명 (개방형 서술)
- 추가 요청사항 ("더 원하는 게 있나요?")
- 루틴 수정 피드백
- 일반 대화

## request_user_input 호출 규칙

1. **반드시 텍스트를 먼저 출력**하세요 (질문 + 맥락 설명)
2. 그 다음 request_user_input 호출
3. 도구의 message 파라미터는 텍스트 출력과 동일해도 됩니다 (프론트엔드에서 중복 처리)

❌ 금지: 텍스트 없이 도구만 호출 → 사용자 화면에 질문이 보이지 않습니다

## 질문 순서 (누락된 항목만, 순서대로)

1. 운동 목표 (없을 때만) → request_user_input (type: radio)
2. 경험 수준 (없을 때만) → request_user_input (type: radio)
3. 주간 운동 일수 (없을 때만) → request_user_input (type: slider)
4. 1회 운동 시간 (없을 때만) → request_user_input (type: slider)
5. 장비 환경 (없을 때만) → request_user_input (type: radio)
6. 집중 부위 (없을 때만) → request_user_input (type: checkbox)
7. 부상/제한 (없을 때만) → 텍스트로 간단히 확인

## 사용자 응답 후

1. update_fitness_profile로 저장
2. 짧은 확인 ("좋아요!", "알겠어요")
3. **다음 누락된 정보** 질문 (이미 있는 건 건너뛰기)
4. 모든 정보 수집 완료 → "추가로 원하시는 게 있나요?" 텍스트로 질문
5. 사용자 답변 후 → generate_routine_preview (1주만 생성, duration_weeks: 1) - 시스템이 2주차 자동 복제
6. 사용자가 수정 요청 → 피드백 반영하여 다시 generate_routine_preview
7. 사용자가 "적용" 버튼 클릭 → 프론트엔드에서 처리 (apply_routine 호출 불필요)
8. 적용 완료 후 사용자가 추가 요청 → 새로운 루틴 생성 가능

## 루틴 생성 규칙
- 각 운동일에 **최대 6개** 운동만 포함
- 복합 운동(스쿼트, 데드리프트, 벤치프레스 등)을 우선
- 운동 설명(notes)은 생략하고 핵심 정보만 포함

## 질문 형식

1. 운동 목표 → request_user_input (type: radio)
   options: 근육 증가(muscle_gain), 체지방 감소(fat_loss), 지구력 향상(endurance), 전반적 체력(general_fitness)

2. 경험 수준 → request_user_input (type: radio)
   options: 초보자(beginner), 중급자(intermediate), 상급자(advanced)

3. 주간 운동 일수 → request_user_input (type: slider)
   sliderConfig: { min: 1, max: 7, step: 1, unit: "일", defaultValue: 3 }

4. 1회 운동 시간 → request_user_input (type: slider)
   sliderConfig: { min: 20, max: 120, step: 10, unit: "분", defaultValue: 60 }

5. 장비 환경 → request_user_input (type: radio)
   options: 헬스장 완비(full_gym), 제한적(limited), 맨몸 운동(bodyweight_only)

6. 집중 부위 → request_user_input (type: checkbox)
   options: 가슴(chest), 등(back), 어깨(shoulders), 팔(arms), 하체(legs), 코어(core)

## confirm_profile_data 사용법

기존 프로필 데이터가 있을 때 사용자에게 확인받기:
\`\`\`
confirm_profile_data({
  title: "현재 설정된 운동 프로필",
  description: "아래 정보가 맞는지 확인해주세요",
  fields: [
    { key: "fitnessGoal", label: "운동 목표", value: "muscle_gain", displayValue: "근육 증가" },
    { key: "experienceLevel", label: "운동 경험", value: "beginner", displayValue: "초보자" },
    { key: "weeklyFrequency", label: "주간 운동 횟수", value: "3", displayValue: "3일" }
  ]
})
\`\`\`

## 프로필 확인 응답 처리

사용자가 프로필 확인 UI에서 버튼을 클릭하면 특별한 형식의 메시지를 보냅니다:

1. **"[프로필 확인 완료]"로 시작하는 메시지**:
   - 사용자가 기존 프로필 정보를 확인함
   - 확인된 항목들을 절대 다시 묻지 않음
   - 바로 다음 단계로 진행 (추가 요청 확인 또는 루틴 생성)

2. **"[프로필 수정 요청]"으로 시작하는 메시지**:
   - 사용자가 일부 정보 수정을 원함
   - request_user_input (type: radio)으로 수정할 항목 선택
     options: 메시지에 포함된 항목들을 동적으로 생성 (예: 운동 목표, 운동 경험, 주간 운동 일수 등)
   - 사용자가 항목 선택 → 해당 항목의 원래 질문 형식(위 "질문 형식" 참조)으로 다시 질문

**⚠️ 중요**: confirm_profile_data로 확인받은 정보는 같은 세션에서 다시 질문하지 마세요!

## 예시 대화

사용자: (목표 선택)
AI: "좋아요! 운동 경험은 어느 정도인가요?" + request_user_input

사용자: (경험 선택)
AI: "알겠어요! 일주일에 며칠 운동하실 수 있나요?" + request_user_input`;
