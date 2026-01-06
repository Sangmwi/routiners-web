import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, DbChatMessage, transformDbMessage } from '@/lib/types/chat';
import { AI_TRAINER_TOOLS } from '@/lib/ai/tools';
import { executeTool, ToolExecutorContext } from '@/lib/ai/tool-executor';
import type { AIToolName } from '@/lib/types/fitness';
import { z } from 'zod';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 시스템 프롬프트 (Function Calling 지원)
const SYSTEM_PROMPTS: Record<'workout' | 'meal', string> = {
  workout: `당신은 "루티너스"라는 한국 군인 대상 피트니스 앱의 AI 트레이너입니다.
사용자와 대화하며 그들의 운동 목표, 현재 체력 수준, 가용 시간 등을 파악하고 맞춤형 4주 운동 루틴을 제안합니다.

## 역할
1. 친근하고 전문적인 트레이너로서 대화
2. 사용자의 운동 경험, 목표, 제약사항 파악
3. 군대 환경(제한된 장비, 시간, 공간)을 고려한 실용적인 조언
4. 4주 운동 계획 수립 및 제안

## 도구 사용 가이드
- 도구는 **정보가 필요할 때만** 호출하세요. 불필요한 중복 호출을 피하세요.
- **첫 메시지에서만** get_user_basic_info, get_fitness_goal, get_experience_level을 호출하여 기존 정보를 확인하세요.
- 이미 조회한 정보는 대화 내역에 있으므로 **다시 조회하지 마세요**.
- 한 번에 필요한 여러 도구를 병렬로 호출할 수 있습니다.
- 도구에서 가져온 정보를 기반으로 더 정확한 조언을 제공하세요.
- 대화 중 새로 수집한 정보는 update_fitness_profile로 저장하세요.
- 루틴 저장(save_routine_draft)은 사용자가 동의한 후에만 호출하세요.

## 사용 가능한 도구
- 사용자 정보: get_user_basic_info, get_user_military_info, get_user_body_metrics
- 인바디: get_latest_inbody, get_inbody_history
- 피트니스 프로필: get_fitness_goal, get_experience_level, get_training_preferences, get_injuries_restrictions
- 프로필 업데이트: update_fitness_profile
- 루틴: get_current_routine, save_routine_draft

## 대화 흐름
1. [도구 호출] 기본 정보, 운동 목표, 경험 수준 확인
2. 인사와 함께 확인된 정보 바탕으로 대화 시작
3. [도구 호출] 부상/제한사항 확인 (매우 중요!)
4. 추가 정보 수집 (장비 접근성, 운동 시간 등)
5. [도구 호출] 인바디 데이터 확인 (있는 경우)
6. 맞춤형 4주 운동 계획 제안
7. [도구 호출] 수집한 정보 저장 및 루틴 초안 저장

## 운동 계획 형식
운동 계획을 제안할 때는 다음 정보를 포함하세요:
- 운동명
- 세트 수와 반복 횟수
- 권장 중량 (초보자/중급자/고급자 기준)
- 세트 간 휴식 시간
- 운동 팁이나 주의사항

## 제약사항
- 한국어로 대화
- 군대 문화와 환경을 이해하고 존중
- 안전을 최우선으로 (부상 이력 반드시 확인!)
- 현실적이고 실행 가능한 계획 제안
- 과도한 운동량 지양`,

  meal: `당신은 "루티너스"라는 한국 군인 대상 피트니스 앱의 AI 영양사입니다.
사용자와 대화하며 그들의 식단 목표, 현재 식습관, 제약사항 등을 파악하고 맞춤형 식단을 제안합니다.

## 역할
1. 친근하고 전문적인 영양사로서 대화
2. 사용자의 식단 목표, 제약사항 파악
3. 군대 환경(군식당, 제한된 선택지)을 고려한 실용적인 조언
4. 맞춤형 식단 계획 수립 및 제안

## 도구 사용 가이드
- 대화 시작 시 먼저 get_user_basic_info, get_user_body_metrics를 호출하여 기존 정보를 확인하세요.
- 도구에서 가져온 정보를 기반으로 더 정확한 조언을 제공하세요.

## 대화 흐름
1. [도구 호출] 기본 정보, 신체 정보 확인
2. 인사 및 식단 목표 파악 (체중 감량, 근육량 증가, 건강 관리 등)
3. 현재 식습관 및 알레르기/기피 음식 확인
4. 군식당 이용 여부 및 간식 섭취 패턴 파악
5. 영양 목표 설정 (칼로리, 단백질 등)
6. 식단 계획 제안

## 식단 계획 형식
식단을 제안할 때는 다음 정보를 포함하세요:
- 식사 시간대 (아침, 점심, 저녁, 간식)
- 음식 구성
- 대략적인 칼로리와 영양소
- 실천 팁

## 제약사항
- 한국어로 대화
- 군대 환경과 문화 이해
- 현실적이고 실천 가능한 식단 제안
- 극단적인 다이어트 지양
- 영양 균형 중시`,
};

const MessageSchema = z.object({
  message: z.string().min(1, '메시지를 입력해주세요.').max(2000, '메시지는 2000자 이내여야 합니다.'),
});

/**
 * POST /api/conversations/[id]/messages/ai
 * AI 채팅 메시지 전송 (SSE 스트리밍 + Function Calling)
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

    const chatHistory = (existingMessages as DbChatMessage[] || []).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // 사용자 메시지 저장
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

    const purpose = conv.ai_purpose as 'workout' | 'meal';

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
          // OpenAI API 호출 (Function Calling 포함)
          let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPTS[purpose] },
            ...chatHistory,
            { role: 'user', content: message },
          ];

          let continueLoop = true;
          let fullContent = '';
          let totalToolCalls = 0;
          const maxToolCalls = 15; // 무한 루프 방지

          while (continueLoop && totalToolCalls < maxToolCalls) {
            const response = await openai.chat.completions.create({
              model: 'gpt-4.1-mini',
              messages,
              tools: AI_TRAINER_TOOLS.map((tool) => ({
                type: 'function' as const,
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters,
                  strict: tool.strict,
                },
              })),
              tool_choice: 'auto',
              stream: true,
            });

            let currentToolCalls: {
              id: string;
              name: string;
              arguments: string;
            }[] = [];
            let contentBuffer = '';

            for await (const chunk of response) {
              const choice = chunk.choices[0];
              if (!choice) continue;

              // 텍스트 컨텐츠 스트리밍
              if (choice.delta?.content) {
                contentBuffer += choice.delta.content;
                fullContent += choice.delta.content;
                sendEvent('content', { content: choice.delta.content });
              }

              // Tool call 수집
              if (choice.delta?.tool_calls) {
                for (const tc of choice.delta.tool_calls) {
                  const index = tc.index;
                  if (!currentToolCalls[index]) {
                    currentToolCalls[index] = {
                      id: tc.id || '',
                      name: tc.function?.name || '',
                      arguments: '',
                    };
                  }
                  if (tc.id) currentToolCalls[index].id = tc.id;
                  if (tc.function?.name) currentToolCalls[index].name = tc.function.name;
                  if (tc.function?.arguments) currentToolCalls[index].arguments += tc.function.arguments;
                }
              }

              // 종료 조건 확인
              if (choice.finish_reason === 'stop') {
                continueLoop = false;
              } else if (choice.finish_reason === 'tool_calls') {
                // Tool calls 처리 필요
                continueLoop = true;
              }
            }

            // Tool calls가 있으면 실행
            if (currentToolCalls.length > 0) {
              totalToolCalls += currentToolCalls.length;

              // Assistant 메시지 추가 (tool_calls 포함)
              const assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
                role: 'assistant',
                content: contentBuffer || null,
                tool_calls: currentToolCalls.map((tc) => ({
                  id: tc.id,
                  type: 'function' as const,
                  function: {
                    name: tc.name,
                    arguments: tc.arguments,
                  },
                })),
              };
              messages.push(assistantMessage);

              // 각 tool call 실행
              for (const tc of currentToolCalls) {
                const toolName = tc.name as AIToolName;
                let args: Record<string, unknown> = {};

                try {
                  args = JSON.parse(tc.arguments || '{}');
                } catch {
                  args = {};
                }

                // tool_start 이벤트 전송
                sendEvent('tool_start', {
                  toolCallId: tc.id,
                  name: toolName,
                });

                // 도구 실행
                const result = await executeTool(toolName, args, toolCtx);

                // tool_done 이벤트 전송
                sendEvent('tool_done', {
                  toolCallId: tc.id,
                  name: toolName,
                  success: result.success,
                  data: result.data,
                  error: result.error,
                });

                // Tool 결과 메시지 추가
                const toolResultMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
                  role: 'tool',
                  tool_call_id: tc.id,
                  content: JSON.stringify(result),
                };
                messages.push(toolResultMessage);
              }
            } else {
              // Tool calls가 없으면 루프 종료
              continueLoop = false;
            }
          }

          // AI 응답 메시지 저장
          if (fullContent.trim()) {
            await supabase.from('chat_messages').insert({
              conversation_id: conversationId,
              sender_id: null,
              role: 'assistant',
              content: fullContent,
              content_type: 'text',
            });
          }

          // 대화 업데이트 시간 갱신
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

          sendEvent('done', { messageId: userMsg.id });
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
