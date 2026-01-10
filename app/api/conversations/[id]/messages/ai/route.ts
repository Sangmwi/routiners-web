import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, DbChatMessage } from '@/lib/types/chat';
import { AI_TRAINER_TOOLS, type AIToolDefinition } from '@/lib/ai/tools';
import { AI_MEAL_TOOLS } from '@/lib/ai/meal-tools';
import { executeTool, executeRequestUserInput, executeGenerateRoutinePreview, executeApplyRoutine, checkDateConflicts, ToolExecutorContext } from '@/lib/ai/tool-executor';
import {
  executeMealTool,
  executeGenerateMealPlanPreview,
  executeApplyMealPlan,
  checkMealDateConflicts,
  type MealToolExecutorContext,
} from '@/lib/ai/meal-tool-executor';
import type { RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import {
  AI_CHAT_LIMITS,
  isSystemMessage,
  INITIAL_GREETINGS,
} from '@/lib/constants/aiChat';
import type { AIToolName, InputRequestType, InputRequestOption, InputRequestSliderConfig } from '@/lib/types/fitness';
import { z } from 'zod';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 시스템 프롬프트
const SYSTEM_PROMPTS: Record<'workout' | 'meal', string> = {
  workout: `당신은 "루티너스" 앱의 AI 트레이너입니다. 한국 군인을 위한 맞춤형 2주 운동 루틴을 만듭니다.

## 핵심 규칙

1. **한 번에 하나씩만** - 한 응답에 질문 하나만 하세요.
2. **짧고 친근하게** - 설명은 1-2문장으로.
3. **기존 정보는 확인받기** - 조회해서 값이 있으면 confirm_profile_data로 사용자에게 확인받고 건너뛰기.
4. **선택형 질문은 request_user_input** - 텍스트로 옵션 나열 금지.
5. **2주 단위 루틴** - 루틴은 항상 2주 단위로 생성. 더 긴 기간 요청 시에도 2주씩 생성 후 연장.

## 대화 시작 (__START__ 수신 시)

**모든 정보를 한번에 조회 (2개 호출만):**
1. get_user_basic_info → 이름 확인
2. get_fitness_profile → 목표, 경험, 선호도, 부상/제한 모두 조회

**조회 결과 분석 후:**
- 프로필 정보가 이미 있으면 → confirm_profile_data로 확인 UI 표시 (사용자가 확인/수정 선택)
- 누락된 정보가 있으면 → 첫 번째 누락된 정보에 대해서만 질문
- 모든 정보가 있고 사용자가 확인하면 → 바로 루틴 생성 제안

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
5. 사용자 답변 후 → generate_routine_preview (2주 미리보기 생성, duration_weeks: 2)
6. 사용자가 수정 요청 → 피드백 반영하여 다시 generate_routine_preview
7. 사용자가 "적용" 버튼 클릭 → 프론트엔드에서 처리 (apply_routine 호출 불필요)

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

## 사용자 응답 처리

- 프로필 확인 UI에서 "확인" 클릭 → 다음 단계로 진행
- 프로필 확인 UI에서 "수정" 클릭 → 해당 정보 다시 질문
- 사용자가 선택 → update_fitness_profile로 저장
- 저장 완료 → 짧은 확인 + 다음 질문
- 모든 정보 수집 완료 → "추가로 원하시는 게 있나요?" 질문
- 추가 요청사항 확인 후 → generate_routine_preview로 2주 미리보기 생성
- 수정 요청 시 → 피드백 반영하여 다시 generate_routine_preview
- 적용 완료 후 사용자가 추가 요청 → 새로운 2주 루틴 생성 가능

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

## 예시 대화

사용자: (목표 선택)
AI: "좋아요! 운동 경험은 어느 정도인가요?" + request_user_input

사용자: (경험 선택)
AI: "알겠어요! 일주일에 며칠 운동하실 수 있나요?" + request_user_input

한국어로 자연스럽게 대화하세요. 친구처럼 편하게!`,

  meal: `당신은 "루티너스" 앱의 AI 영양사입니다. 한국 군인을 위한 맞춤형 2주 식단을 만듭니다.

## 핵심 규칙

1. **한 번에 하나씩만** - 한 응답에 질문 하나만 하세요.
2. **짧고 친근하게** - 설명은 1-2문장으로.
3. **기존 정보는 확인받기** - 조회해서 값이 있으면 confirm_profile_data로 사용자에게 확인받고 건너뛰기.
4. **선택형 질문은 request_user_input** - 텍스트로 옵션 나열 금지.
5. **2주 단위 식단** - 식단은 항상 2주 단위로 생성. 더 긴 기간 요청 시에도 2주씩 생성 후 연장.

## 대화 시작 (__START__ 수신 시)

**모든 정보를 한번에 조회 (4개 호출만):**
1. get_user_basic_info → 이름 확인
2. get_user_body_metrics → 신체 정보 (TDEE 계산용)
3. get_fitness_profile → 운동 목표 (식단 연계)
4. get_dietary_profile → 식단 프로필 조회

**조회 결과 분석 후:**
- 프로필 정보가 이미 있으면 → confirm_profile_data로 확인 UI 표시 (사용자가 확인/수정 선택)
- 누락된 정보가 있으면 → 첫 번째 누락된 정보에 대해서만 질문
- 모든 정보가 있고 사용자가 확인하면 → 바로 식단 생성 제안

## 질문 순서 (누락된 항목만, 순서대로)

1. 식단 목표 (없을 때만) → request_user_input (type: radio)
   - fitnessProfile.fitnessGoal이 있으면 연동 (muscle_gain→벌크업, fat_loss→커팅)
   options: 근육 증가(muscle_gain), 체지방 감소(fat_loss), 체중 유지(maintenance), 건강 유지(health), 운동 퍼포먼스(performance)

2. 활동 수준 → request_user_input (type: radio)
   → 답변 후 바로 calculate_daily_needs 호출하여 TDEE/매크로 계산
   options: 거의 운동 안함(sedentary), 가벼운 활동(light), 보통 활동(moderate), 활발한 활동(active), 매우 활발(very_active)

3. 음식 제한사항 (없을 때만) → request_user_input (type: checkbox)
   options: 없음(none), 유제품(dairy), 해산물(seafood), 견과류(nuts), 글루텐(gluten), 계란(egg), 돼지고기(pork), 소고기(beef), 매운음식(spicy)

4. 음식 출처 (없을 때만) → request_user_input (type: checkbox)
   options: 부대 식당(canteen), PX(px), 외출/외박 외식(outside), 배달(delivery)

5. 하루 식사 횟수 (없을 때만) → request_user_input (type: slider)
   sliderConfig: { min: 2, max: 6, step: 1, unit: "끼", defaultValue: 3 }

6. 월 식비 예산 (없을 때만) → request_user_input (type: slider)
   sliderConfig: { min: 30000, max: 500000, step: 10000, unit: "원", defaultValue: 150000 }

7. 추가 요청사항 확인 → 텍스트로 간단히 질문

## 사용자 응답 후

1. update_dietary_profile로 저장
2. 짧은 확인 ("좋아요!", "알겠어요")
3. **다음 누락된 정보** 질문 (이미 있는 건 건너뛰기)
4. 모든 정보 수집 완료 → "추가로 원하시는 게 있나요?" 텍스트로 질문
5. 사용자 답변 후 → generate_meal_plan_preview (2주 미리보기 생성, duration_weeks: 2)
6. 사용자가 수정 요청 → 피드백 반영하여 다시 generate_meal_plan_preview
7. 사용자가 "적용" 버튼 클릭 → 프론트엔드에서 처리 (apply_meal_plan 호출 불필요)

## PX 추천 음식 (고단백 간식)
- **단백질**: 닭가슴살, 삶은 계란, 두부, 프로틴 바, 그릭 요거트
- **탄수화물**: 귀리, 고구마, 바나나, 통밀빵
- **간식**: 아몬드, 프로틴 음료, 무가당 우유

## 식단 생성 규칙
- 각 식사에 **탄단지 균형** 맞추기
- 부대 식당 기반 + PX 간식 보충 패턴
- 예산 범위 내에서 구성
- 단백질 섭취량은 calculate_daily_needs 결과 기반

## 예시 대화

사용자: (목표 선택)
AI: "좋아요! 평소 활동량은 어느 정도인가요?" + request_user_input

사용자: (활동 수준 선택)
AI: (calculate_daily_needs 호출 후) "하루 약 2,400kcal, 단백질 120g 정도가 적당해요! 못 먹는 음식이 있나요?" + request_user_input

한국어로 자연스럽게 대화하세요. 친구처럼 편하게!`,
};

const MessageSchema = z.object({
  message: z
    .string()
    .min(AI_CHAT_LIMITS.MIN_MESSAGE_LENGTH, '메시지를 입력해주세요.')
    .max(AI_CHAT_LIMITS.MAX_MESSAGE_LENGTH, `메시지는 ${AI_CHAT_LIMITS.MAX_MESSAGE_LENGTH}자 이내여야 합니다.`),
});

/**
 * 공유 도구 목록 (운동/식단 AI 공통)
 * - 사용자 정보 조회 도구들
 * - 사용자 입력 요청 도구
 */
const SHARED_TOOL_NAMES = [
  'get_user_basic_info',
  'get_user_military_info',
  'get_user_body_metrics',
  'get_latest_inbody',
  'get_inbody_history',
  'get_fitness_profile',
  'request_user_input',
  'confirm_profile_data', // 프로필 확인 UI (운동/식단 AI 공통)
] as const;

/**
 * purpose에 따라 적절한 도구 목록 반환
 */
function getToolsForPurpose(purpose: 'workout' | 'meal'): AIToolDefinition[] {
  if (purpose === 'meal') {
    // 식단 AI: 공유 도구 + 식단 전용 도구
    const sharedTools = AI_TRAINER_TOOLS.filter(
      (tool) => SHARED_TOOL_NAMES.includes(tool.name as typeof SHARED_TOOL_NAMES[number])
    );
    return [...sharedTools, ...AI_MEAL_TOOLS];
  } else {
    // 운동 AI: 기존 운동 도구 전체
    return AI_TRAINER_TOOLS;
  }
}

// Responses API용 도구 포맷 변환
function formatToolsForResponsesAPI(purpose: 'workout' | 'meal'): OpenAI.Responses.Tool[] {
  const tools = getToolsForPurpose(purpose);
  return tools.map((tool) => ({
    type: 'function' as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as Record<string, unknown>,
    strict: tool.strict ?? null,
  }));
}

// DB 메시지를 Responses API input 형식으로 변환
function buildConversationInput(
  existingMessages: DbChatMessage[],
  newMessage: string
): OpenAI.Responses.ResponseInputItem[] {
  const input: OpenAI.Responses.ResponseInputItem[] = [];

  for (const m of existingMessages) {
    if (m.content_type === 'tool_call' && m.metadata?.tool_calls) {
      // Function call 출력 (이전 AI 응답)
      const toolCalls = m.metadata.tool_calls as Array<{
        id: string;
        name: string;
        arguments: string;
        call_id?: string;
      }>;
      for (const tc of toolCalls) {
        input.push({
          type: 'function_call',
          id: tc.id,
          call_id: tc.call_id || tc.id,
          name: tc.name,
          arguments: tc.arguments,
        });
      }
    } else if (m.content_type === 'tool_result' && m.metadata?.tool_call_id) {
      // Function call 결과
      input.push({
        type: 'function_call_output',
        call_id: m.metadata.tool_call_id as string,
        output: m.content,
      });
    } else if (m.role === 'user') {
      input.push({
        type: 'message',
        role: 'user',
        content: m.content,
      });
    } else if (m.role === 'assistant' && m.content_type === 'text' && m.content) {
      input.push({
        type: 'message',
        role: 'assistant',
        content: m.content,
      });
    }
  }

  // 새 사용자 메시지 추가
  input.push({
    type: 'message',
    role: 'user',
    content: newMessage,
  });

  return input;
}

/**
 * POST /api/conversations/[id]/messages/ai
 * AI 채팅 메시지 전송 (SSE 스트리밍 + Function Calling with Responses API)
 */
export const POST = withAuth<Response>(
  async (request: NextRequest, { userId, supabase, params }) => {
    const { id: conversationId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const validation = MessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: '입력값이 유효하지 않습니다.',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { message } = validation.data;

    // 대화 조회 및 권한 확인
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('type', 'ai')
      .is('deleted_at', null)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const conv = conversation as DbConversation;

    if (conv.created_by !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (conv.ai_status !== 'active') {
      return NextResponse.json(
        { error: '이미 종료된 대화입니다.', code: 'SESSION_CLOSED' },
        { status: 400 }
      );
    }

    // 기존 메시지 조회
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    const dbMessages = (existingMessages as DbChatMessage[]) || [];

    const purpose = conv.ai_purpose as 'workout' | 'meal';
    const isSystem = isSystemMessage(message);
    let userMsgId: string | null = null;

    // __START__ 메시지인 경우: 인사말을 DB에 저장 (세션 복귀 시에도 유지)
    if (isSystem) {
      const greeting = INITIAL_GREETINGS[purpose];
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: null,
          role: 'assistant',
          content: greeting,
          content_type: 'text',
        });
    } else {
      // 일반 사용자 메시지 저장
      const { data: userMsg, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          role: 'user',
          content: message,
          content_type: 'text',
        })
        .select()
        .single();

      if (userMsgError) {
        console.error('[AI Chat] User Message Error:', userMsgError);
        return NextResponse.json(
          { error: '메시지 저장에 실패했습니다.', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }
      userMsgId = userMsg.id;

      // 사용자가 응답하면 pending_profile_confirmation, pending_input 정리
      // (확인/수정 버튼 클릭 후 또는 선택 버튼 클릭 후)
      const { data: convForClear } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      const existingMeta = convForClear?.metadata as Record<string, unknown> | null;
      if (existingMeta && (existingMeta.pending_profile_confirmation || existingMeta.pending_input)) {
        const updatedMetadata = { ...existingMeta };
        delete updatedMetadata.pending_profile_confirmation;
        delete updatedMetadata.pending_input;
        await supabase
          .from('conversations')
          .update({ metadata: updatedMetadata })
          .eq('id', conversationId);
      }
    }

    // Tool executor 컨텍스트
    const toolCtx: ToolExecutorContext = {
      userId,
      supabase,
      conversationId,
    };

    // SSE 스트리밍 응답
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Responses API용 input 구성
          const input = buildConversationInput(dbMessages, message);
          const tools = formatToolsForResponsesAPI(purpose);

          let continueLoop = true;
          let fullContent = '';
          let totalToolCalls = 0;
          let savedTextLength = 0; // tool과 함께 이미 저장된 텍스트 길이 추적

          while (continueLoop && totalToolCalls < AI_CHAT_LIMITS.MAX_TOOL_CALLS_PER_RESPONSE) {
            // Responses API 호출 (스트리밍)
            const stream = await openai.responses.create({
              model: 'gpt-5.1',
              instructions: SYSTEM_PROMPTS[purpose],
              input,
              tools,
              stream: true,
            });

            // Function call 추적용
            const functionCalls: Map<string, {
              id: string;
              callId: string;
              name: string;
              arguments: string;
            }> = new Map();

            let contentBuffer = '';
            let hasToolCalls = false;

            for await (const event of stream) {
              // 텍스트 델타
              if (event.type === 'response.output_text.delta') {
                const delta = event.delta;
                contentBuffer += delta;
                fullContent += delta;
                sendEvent('content', { content: delta });
              }

              // Function call 시작
              if (event.type === 'response.output_item.added') {
                const item = event.item;
                if (item.type === 'function_call' && item.id) {
                  hasToolCalls = true;
                  const itemId = item.id;
                  functionCalls.set(itemId, {
                    id: itemId,
                    callId: item.call_id,
                    name: item.name,
                    arguments: '',
                  });

                  // tool_start 이벤트 전송
                  sendEvent('tool_start', {
                    toolCallId: itemId,
                    name: item.name,
                  });
                }
              }

              // Function call arguments 델타
              if (event.type === 'response.function_call_arguments.delta') {
                const itemId = event.item_id;
                const fc = functionCalls.get(itemId);
                if (fc) {
                  fc.arguments += event.delta;

                  // generate_routine_preview 진행률 전송
                  if (fc.name === 'generate_routine_preview') {
                    // 예상 토큰: ~1500 (2주 × 4일 × 6운동)
                    // 글자 수 기준 진행률 계산 (대략 4글자 = 1토큰)
                    const estimatedChars = 6000; // ~1500 tokens × 4 chars
                    const progress = Math.min(95, Math.round((fc.arguments.length / estimatedChars) * 100));

                    // 5% 단위로만 이벤트 전송 (너무 자주 보내지 않도록)
                    const progressStep = Math.floor(progress / 5) * 5;
                    const lastProgress = (fc as unknown as { lastProgress?: number }).lastProgress ?? 0;

                    if (progressStep > lastProgress) {
                      (fc as unknown as { lastProgress: number }).lastProgress = progressStep;
                      sendEvent('routine_progress', {
                        progress: progressStep,
                        stage: progress < 30 ? '운동 목록 구성 중...' :
                               progress < 60 ? '세트/반복 설정 중...' :
                               progress < 90 ? '마무리 중...' : '거의 완료!',
                      });
                    }
                  }
                }
              }

              // Function call arguments 완료
              if (event.type === 'response.function_call_arguments.done') {
                const itemId = event.item_id;
                const fc = functionCalls.get(itemId);
                if (fc) {
                  fc.arguments = event.arguments;
                }
              }
            }

            // Tool calls가 있으면 실행
            if (hasToolCalls && functionCalls.size > 0) {
              totalToolCalls += functionCalls.size;

              // ✅ 텍스트 응답이 있으면 먼저 text 메시지로 별도 저장
              // (tool_call에 저장하면 클라이언트에서 필터링되어 표시 안됨)
              if (contentBuffer.trim()) {
                await supabase.from('chat_messages').insert({
                  conversation_id: conversationId,
                  sender_id: null,
                  role: 'assistant',
                  content: contentBuffer,
                  content_type: 'text',
                });
                savedTextLength += contentBuffer.length; // 저장된 길이 추적
              }

              // Tool calls를 DB에 저장
              const formattedToolCalls: Array<{
                id: string;
                call_id: string;
                name: string;
                arguments: string;
              }> = Array.from(functionCalls.values()).map((fc) => ({
                id: fc.id,
                call_id: fc.callId,
                name: fc.name,
                arguments: fc.arguments,
              }));

              // tool_call 메시지 삽입 (텍스트는 위에서 별도 저장했으므로 비움)
              await supabase.from('chat_messages').insert({
                conversation_id: conversationId,
                sender_id: null,
                role: 'assistant',
                content: '',
                content_type: 'tool_call',
                metadata: { tool_calls: formattedToolCalls },
              });

              // 각 function call 실행
              for (const fc of functionCalls.values()) {
                const toolName = fc.name as AIToolName;
                let args: Record<string, unknown> = {};

                try {
                  args = JSON.parse(fc.arguments || '{}');
                } catch {
                  args = {};
                }

                let toolResult: string;

                // request_user_input 특별 처리
                if (toolName === 'request_user_input') {
                  const inputArgs = args as {
                    message?: string;
                    type: InputRequestType;
                    options?: InputRequestOption[];
                    sliderConfig?: InputRequestSliderConfig;
                  };

                  const inputResult = executeRequestUserInput(inputArgs, fc.id);

                  if (inputResult.success && inputResult.data) {
                    sendEvent('input_request', inputResult.data);
                  }

                  // ✅ message가 있으면 별도 text 메시지로 저장 (새로고침 후에도 표시되도록)
                  if (inputArgs.message?.trim()) {
                    await supabase.from('chat_messages').insert({
                      conversation_id: conversationId,
                      sender_id: null,
                      role: 'assistant',
                      content: inputArgs.message,
                      content_type: 'text',
                    });
                  }

                  // ✅ pending_input을 metadata에 저장 (새로고침 후에도 버튼 UI 표시)
                  if (inputResult.success && inputResult.data) {
                    const { data: existingConvForInput } = await supabase
                      .from('conversations')
                      .select('metadata')
                      .eq('id', conversationId)
                      .single();

                    const existingMetadataForInput = (existingConvForInput?.metadata as Record<string, unknown>) ?? {};
                    await supabase
                      .from('conversations')
                      .update({
                        metadata: {
                          ...existingMetadataForInput,
                          pending_input: inputResult.data,
                        },
                      })
                      .eq('id', conversationId);
                  }

                  sendEvent('tool_done', {
                    toolCallId: fc.id,
                    name: toolName,
                    success: inputResult.success,
                    data: inputResult.data,
                    error: inputResult.error,
                  });

                  toolResult = JSON.stringify({
                    success: true,
                    waiting_for_user: true,
                    message: '사용자 입력 대기 중',
                  });

                  // ✅ request_user_input 후에는 루프 종료
                  // 사용자가 버튼 클릭하면 새 API 요청으로 다음 질문 진행
                  continueLoop = false;
                } else if (toolName === 'confirm_profile_data') {
                  // confirm_profile_data 특별 처리 (프로필 확인 UI)
                  const { title, description, fields } = args as {
                    title: string;
                    description?: string;
                    fields: Array<{
                      key: string;
                      label: string;
                      value: string;
                      displayValue: string;
                    }>;
                  };

                  const confirmationRequest = {
                    id: fc.id,
                    title,
                    description,
                    fields,
                  };

                  // profile_confirmation SSE 이벤트 전송
                  sendEvent('profile_confirmation', confirmationRequest);

                  // 프로필 확인 데이터를 conversation.metadata에 저장 (페이지 이탈 후 복귀 시 복원용)
                  // 기존 metadata를 읽어서 병합
                  const { data: existingConv } = await supabase
                    .from('conversations')
                    .select('metadata')
                    .eq('id', conversationId)
                    .single();

                  const existingMetadata = (existingConv?.metadata as Record<string, unknown>) ?? {};
                  const { error: updateError } = await supabase
                    .from('conversations')
                    .update({
                      metadata: {
                        ...existingMetadata,
                        pending_profile_confirmation: confirmationRequest,
                      },
                    })
                    .eq('id', conversationId);

                  if (updateError) {
                    console.error('[confirm_profile_data] Failed to save confirmation:', updateError);
                  }

                  sendEvent('tool_done', {
                    toolCallId: fc.id,
                    name: toolName,
                    success: true,
                    data: confirmationRequest,
                  });

                  toolResult = JSON.stringify({
                    success: true,
                    waiting_for_confirmation: true,
                    message: '프로필 확인 UI가 표시되었습니다. 사용자가 "확인" 또는 "수정" 버튼을 클릭할 때까지 기다리세요.',
                  });

                  // ✅ confirm_profile_data 후에는 루프 종료
                  // 사용자가 버튼 클릭하면 새 API 요청으로 다음 단계 진행
                  continueLoop = false;
                } else if (toolName === 'generate_routine_preview') {
                  // generate_routine_preview 특별 처리
                  const previewResult = executeGenerateRoutinePreview(
                    args as Parameters<typeof executeGenerateRoutinePreview>[0],
                    fc.id
                  );

                  if (previewResult.success && previewResult.data) {
                    // 충돌 체크 수행
                    const conflicts = await checkDateConflicts(toolCtx, previewResult.data);
                    if (conflicts.length > 0) {
                      previewResult.data.conflicts = conflicts;
                    }

                    // routine_preview SSE 이벤트 전송
                    sendEvent('routine_preview', previewResult.data);

                    // 미리보기 데이터를 conversation.metadata에 저장 (기존 metadata 병합)
                    const { data: existingConvForRoutine } = await supabase
                      .from('conversations')
                      .select('metadata')
                      .eq('id', conversationId)
                      .single();

                    const existingMetadataForRoutine = (existingConvForRoutine?.metadata as Record<string, unknown>) ?? {};
                    const { error: updateError } = await supabase
                      .from('conversations')
                      .update({
                        metadata: {
                          ...existingMetadataForRoutine,
                          pending_preview: previewResult.data,
                        },
                      })
                      .eq('id', conversationId);

                    if (updateError) {
                      console.error('[generate_routine_preview] Failed to save preview_data:', updateError);
                    }
                  }

                  sendEvent('tool_done', {
                    toolCallId: fc.id,
                    name: toolName,
                    success: previewResult.success,
                    data: { previewId: previewResult.data?.id },
                    error: previewResult.error,
                  });

                  toolResult = JSON.stringify({
                    success: true,
                    waiting_for_confirmation: true,
                    message: '루틴 미리보기가 표시되었습니다. 사용자가 "적용하기" 또는 수정 요청을 할 때까지 기다리세요.',
                    preview_id: previewResult.data?.id,
                  });

                  // 미리보기 표시 후 루프 종료 (사용자 확인 대기)
                  continueLoop = false;
                } else if (toolName === 'apply_routine') {
                  // apply_routine 특별 처리
                  const previewId = args.preview_id as string;

                  // conversation.metadata에서 pending_preview 가져오기
                  const { data: conversation } = await supabase
                    .from('conversations')
                    .select('metadata')
                    .eq('id', conversationId)
                    .single();

                  const convMetadata = conversation?.metadata as { pending_preview?: RoutinePreviewData } | null;
                  const previewData = convMetadata?.pending_preview ?? null;

                  // previewId가 일치하는지 확인 (보안 검증)
                  if (!previewData || previewData.id !== previewId) {
                    toolResult = JSON.stringify({
                      success: false,
                      error: '미리보기 데이터를 찾을 수 없습니다. 다시 루틴을 생성해주세요.',
                    });
                  } else {
                    const applyResult = await executeApplyRoutine(toolCtx, previewData);

                    sendEvent('tool_done', {
                      toolCallId: fc.id,
                      name: toolName,
                      success: applyResult.success,
                      data: applyResult.data,
                      error: applyResult.error,
                    });

                    if (applyResult.success) {
                      // 루틴 적용 성공 이벤트
                      sendEvent('routine_applied', {
                        previewId,
                        eventsCreated: applyResult.data?.eventsCreated,
                        startDate: applyResult.data?.startDate,
                      });

                      // 적용 완료 후 pending_preview 제거하고 applied_routine 저장 (기존 metadata 유지)
                      const { pending_preview: _removed, ...restRoutineMetadata } = convMetadata as Record<string, unknown>;
                      await supabase
                        .from('conversations')
                        .update({
                          metadata: {
                            ...restRoutineMetadata,
                            applied_routine: {
                              previewId,
                              eventsCreated: applyResult.data?.eventsCreated,
                              startDate: applyResult.data?.startDate,
                            },
                          },
                        })
                        .eq('id', conversationId);
                    }

                    toolResult = JSON.stringify(applyResult);
                  }

                  // ✅ apply_routine 후에는 루프 종료 (성공/실패 모두)
                  continueLoop = false;
                } else if (toolName === 'generate_meal_plan_preview') {
                  // generate_meal_plan_preview 특별 처리 (식단)
                  const previewResult = executeGenerateMealPlanPreview(
                    args as Parameters<typeof executeGenerateMealPlanPreview>[0],
                    fc.id
                  );

                  if (previewResult.success && previewResult.data) {
                    // 충돌 체크 수행
                    const mealCtx: MealToolExecutorContext = {
                      userId,
                      supabase,
                      conversationId,
                    };
                    const conflicts = await checkMealDateConflicts(mealCtx, previewResult.data);
                    if (conflicts.length > 0) {
                      previewResult.data.conflicts = conflicts;
                    }

                    // meal_plan_preview SSE 이벤트 전송
                    sendEvent('meal_plan_preview', previewResult.data);

                    // 미리보기 데이터를 conversation.metadata에 저장 (기존 metadata 병합)
                    const { data: existingConvForMeal } = await supabase
                      .from('conversations')
                      .select('metadata')
                      .eq('id', conversationId)
                      .single();

                    const existingMetadataForMeal = (existingConvForMeal?.metadata as Record<string, unknown>) ?? {};
                    const { error: updateError } = await supabase
                      .from('conversations')
                      .update({
                        metadata: {
                          ...existingMetadataForMeal,
                          pending_meal_preview: previewResult.data,
                        },
                      })
                      .eq('id', conversationId);

                    if (updateError) {
                      console.error('[generate_meal_plan_preview] Failed to save preview_data:', updateError);
                    }
                  }

                  sendEvent('tool_done', {
                    toolCallId: fc.id,
                    name: toolName,
                    success: previewResult.success,
                    data: { previewId: previewResult.data?.id },
                    error: previewResult.error,
                  });

                  toolResult = JSON.stringify({
                    success: true,
                    waiting_for_confirmation: true,
                    message: '식단 미리보기가 표시되었습니다. 사용자가 "적용하기" 또는 수정 요청을 할 때까지 기다리세요.',
                    preview_id: previewResult.data?.id,
                  });

                  // 미리보기 표시 후 루프 종료 (사용자 확인 대기)
                  continueLoop = false;
                } else if (toolName === 'apply_meal_plan') {
                  // apply_meal_plan 특별 처리 (식단)
                  const previewId = args.preview_id as string;

                  // conversation.metadata에서 pending_meal_preview 가져오기
                  const { data: conversationData } = await supabase
                    .from('conversations')
                    .select('metadata')
                    .eq('id', conversationId)
                    .single();

                  const convMetadata = conversationData?.metadata as { pending_meal_preview?: MealPlanPreviewData } | null;
                  const mealPreviewData = convMetadata?.pending_meal_preview ?? null;

                  // previewId가 일치하는지 확인 (보안 검증)
                  if (!mealPreviewData || mealPreviewData.id !== previewId) {
                    toolResult = JSON.stringify({
                      success: false,
                      error: '미리보기 데이터를 찾을 수 없습니다. 다시 식단을 생성해주세요.',
                    });
                  } else {
                    const mealCtx: MealToolExecutorContext = {
                      userId,
                      supabase,
                      conversationId,
                    };
                    const applyResult = await executeApplyMealPlan(mealCtx, mealPreviewData);

                    sendEvent('tool_done', {
                      toolCallId: fc.id,
                      name: toolName,
                      success: applyResult.success,
                      data: applyResult.data,
                      error: applyResult.error,
                    });

                    if (applyResult.success) {
                      // 식단 적용 성공 이벤트
                      sendEvent('meal_plan_applied', {
                        previewId,
                        eventsCreated: applyResult.data?.eventsCreated,
                        startDate: applyResult.data?.startDate,
                      });

                      // 적용 완료 후 pending_meal_preview 제거하고 applied_meal_plan 저장 (기존 metadata 유지)
                      const { pending_meal_preview: _removed, ...restMealMetadata } = convMetadata as Record<string, unknown>;
                      await supabase
                        .from('conversations')
                        .update({
                          metadata: {
                            ...restMealMetadata,
                            applied_meal_plan: {
                              previewId,
                              eventsCreated: applyResult.data?.eventsCreated,
                              startDate: applyResult.data?.startDate,
                            },
                          },
                        })
                        .eq('id', conversationId);
                    }

                    toolResult = JSON.stringify(applyResult);
                  }

                  // ✅ apply_meal_plan 후에는 루프 종료 (성공/실패 모두)
                  continueLoop = false;
                } else if (['get_dietary_profile', 'update_dietary_profile', 'calculate_daily_needs'].includes(toolName)) {
                  // 식단 전용 도구 실행
                  const mealCtx: MealToolExecutorContext = {
                    userId,
                    supabase,
                    conversationId,
                  };
                  const result = await executeMealTool(toolName, args, mealCtx);

                  sendEvent('tool_done', {
                    toolCallId: fc.id,
                    name: toolName,
                    success: result.success,
                    data: result.data,
                    error: result.error,
                  });

                  toolResult = JSON.stringify(result);
                } else {
                  // 일반 도구 실행 (운동 AI 도구)
                  const result = await executeTool(toolName, args, toolCtx);

                  sendEvent('tool_done', {
                    toolCallId: fc.id,
                    name: toolName,
                    success: result.success,
                    data: result.data,
                    error: result.error,
                  });

                  toolResult = JSON.stringify(result);
                }

                // Tool result DB 저장
                await supabase.from('chat_messages').insert({
                  conversation_id: conversationId,
                  sender_id: null,
                  role: 'assistant',
                  content: toolResult,
                  content_type: 'tool_result',
                  metadata: { tool_call_id: fc.callId, tool_name: toolName },
                });

                // 다음 루프를 위해 input에 function_call과 output 추가
                input.push({
                  type: 'function_call',
                  id: fc.id,
                  call_id: fc.callId,
                  name: fc.name,
                  arguments: fc.arguments,
                });

                input.push({
                  type: 'function_call_output',
                  call_id: fc.callId,
                  output: toolResult,
                });
              }

              // 도구 실행 후 계속 여부 결정
              // request_user_input이 실행된 경우 continueLoop가 이미 false로 설정됨
              // 그 외의 경우에만 true로 설정하여 AI가 추가 응답 생성
              if (continueLoop !== false) {
                continueLoop = true;
              }
            } else {
              // Tool calls가 없으면 루프 종료
              continueLoop = false;
            }
          }

          // 최종 텍스트 응답 저장 (tool_call과 함께 이미 저장된 부분 제외)
          // savedTextLength: tool 호출 시 이미 저장된 텍스트 길이
          const unsavedContent = fullContent.slice(savedTextLength);
          if (unsavedContent.trim()) {
            await supabase.from('chat_messages').insert({
              conversation_id: conversationId,
              sender_id: null,
              role: 'assistant',
              content: unsavedContent,
              content_type: 'text',
            });
          }

          // 대화 업데이트 시간 갱신
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

          sendEvent('done', { messageId: userMsgId });
          controller.close();
        } catch (error) {
          console.error('[AI Chat Stream] Error:', error);

          sendEvent('error', {
            error: 'AI 응답 생성 중 오류가 발생했습니다.',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
);
