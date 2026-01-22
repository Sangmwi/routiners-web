import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, DbChatMessage } from '@/lib/types/chat';
import { AI_TRAINER_TOOLS, type AIToolDefinition } from '@/lib/ai/tools';
import { AI_MEAL_TOOLS } from '@/lib/ai/meal-tools';
import {
  handleToolCall,
  clearMetadataKeys,
  type ToolHandlerContext,
  type FunctionCallInfo,
} from '@/lib/ai/chat-handlers';
import {
  AI_CHAT_LIMITS,
  AI_MODEL,
  isSystemMessage,
  INITIAL_GREETINGS,
} from '@/lib/constants/aiChat';
import { SYSTEM_PROMPTS } from '@/lib/ai/system-prompts';
import type { AIToolName } from '@/lib/types/fitness';
import { z } from 'zod';
import {
  checkRateLimit,
  AI_RATE_LIMIT,
  rateLimitExceeded,
} from '@/lib/utils/rateLimiter';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 *
 * ⚠️ Tool handlers는 userId를 사용하므로 conversation.created_by에서 가져옴
 */
export const POST = withAuth<Response>(
  async (request: NextRequest, { authUser, supabase, params }) => {
    const { id: conversationId } = await params;

    // Rate Limiting (분당 10회)
    const rateLimitResult = checkRateLimit(`ai-conversation:${authUser.id}`, AI_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(rateLimitExceeded(rateLimitResult), { status: 429 });
    }

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

    // RLS가 권한 필터링을 처리
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

    // Tool handlers에서 사용할 userId (conversation 소유자)
    const userId = conv.created_by;

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
      // 일반 사용자 메시지 저장 - sender_id는 DB DEFAULT가 처리
      const { data: userMsg, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
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
      await clearMetadataKeys(supabase, conversationId, [
        'pending_profile_confirmation',
        'pending_input',
      ]);
    }

    // SSE 스트리밍 응답
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false;

        // ✅ sendEvent에 에러 핸들링 추가 - 컨트롤러 닫힘 상태 대응
        const sendEvent = (event: string, data: unknown) => {
          if (controllerClosed) return; // 이미 닫힌 경우 무시

          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch (error) {
            // Controller가 닫힌 경우 (클라이언트 연결 종료 등)
            if ((error as Error)?.message?.includes('Controller is already closed')) {
              controllerClosed = true;
              console.warn('[SSE] Controller closed, skipping event:', event);
            } else {
              throw error; // 다른 에러는 re-throw
            }
          }
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
              model: AI_MODEL.DEFAULT,
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

                  // generate_meal_plan_preview 진행률 전송
                  if (fc.name === 'generate_meal_plan_preview') {
                    // 예상 토큰: ~2000 (2주 × 7일 × 3끼)
                    // 글자 수 기준 진행률 계산 (대략 4글자 = 1토큰)
                    const estimatedChars = 8000; // ~2000 tokens × 4 chars
                    const progress = Math.min(95, Math.round((fc.arguments.length / estimatedChars) * 100));

                    // 5% 단위로만 이벤트 전송 (너무 자주 보내지 않도록)
                    const progressStep = Math.floor(progress / 5) * 5;
                    const lastProgress = (fc as unknown as { lastProgress?: number }).lastProgress ?? 0;

                    if (progressStep > lastProgress) {
                      (fc as unknown as { lastProgress: number }).lastProgress = progressStep;
                      sendEvent('meal_plan_progress', {
                        progress: progressStep,
                        stage: progress < 30 ? '식단 요구사항 분석 중...' :
                               progress < 50 ? '영양소 계산 중...' :
                               progress < 70 ? '식단 구성 중...' :
                               progress < 90 ? '최적화 중...' : '거의 완료!',
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
              // ✅ call_id 일관성 보장: call_id가 없으면 id를 fallback으로 사용
              const formattedToolCalls: Array<{
                id: string;
                call_id: string;
                name: string;
                arguments: string;
              }> = Array.from(functionCalls.values()).map((fc) => ({
                id: fc.id,
                call_id: fc.callId || fc.id,
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

              // Tool Handler Context 생성
              const toolHandlerCtx: ToolHandlerContext = {
                userId,
                supabase,
                conversationId,
                sendEvent,
              };

              // 각 function call 실행
              for (const fc of functionCalls.values()) {
                const toolName = fc.name as AIToolName;
                let args: Record<string, unknown> = {};

                try {
                  args = JSON.parse(fc.arguments || '{}');
                } catch {
                  args = {};
                }

                // ✅ call_id 일관성 보장: call_id가 없으면 id를 fallback으로 사용
              // (buildConversationInput에서 tool_call 읽을 때도 동일한 로직 사용)
              const effectiveCallId = fc.callId || fc.id;

              // FunctionCallInfo 생성
              const fcInfo: FunctionCallInfo = {
                id: fc.id,
                callId: effectiveCallId,
                name: fc.name,
                arguments: fc.arguments,
              };

              // Handler 호출
              const { toolResult, continueLoop: shouldContinue } = await handleToolCall(
                fcInfo,
                toolName,
                args,
                toolHandlerCtx
              );

              // continueLoop 업데이트
              if (!shouldContinue) {
                continueLoop = false;
              }

              // Tool result DB 저장
              await supabase.from('chat_messages').insert({
                conversation_id: conversationId,
                sender_id: null,
                role: 'assistant',
                content: toolResult,
                content_type: 'tool_result',
                metadata: { tool_call_id: effectiveCallId, tool_name: toolName },
              });

                // 다음 루프를 위해 input에 function_call과 output 추가
                // ✅ effectiveCallId 사용으로 일관성 보장
                input.push({
                  type: 'function_call',
                  id: fc.id,
                  call_id: effectiveCallId,
                  name: fc.name,
                  arguments: fc.arguments,
                });

                input.push({
                  type: 'function_call_output',
                  call_id: effectiveCallId,
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
          controllerClosed = true;
          controller.close();
        } catch (error) {
          console.error('[AI Chat Stream] Error:', error);

          sendEvent('error', {
            error: 'AI 응답 생성 중 오류가 발생했습니다.',
          });
          controllerClosed = true;
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
