/**
 * =============================================================================
 * POST /api/conversations/[id]/messages/ai
 * =============================================================================
 *
 * AI 코치 채팅 API - SSE 스트리밍 + OpenAI Function Calling
 *
 * ## 전체 흐름 요약
 * ```
 * 클라이언트                     서버 (이 파일)                    OpenAI
 *    |                              |                              |
 *    |--- POST 메시지 전송 -------->|                              |
 *    |                              |--- 유저 메시지 DB 저장        |
 *    |                              |                              |
 *    |                              |--- 스트리밍 요청 ------------>|
 *    |                              |                              |
 *    |<-- SSE: content (텍스트) ----|<--- 텍스트 청크 -------------|
 *    |<-- SSE: content (텍스트) ----|<--- 텍스트 청크 -------------|
 *    |                              |                              |
 *    |<-- SSE: tool_start ---------|<--- 함수 호출 시작 ----------|
 *    |                              |--- 함수 실행 (프로필 조회 등) |
 *    |<-- SSE: profile_confirm ----|                              |
 *    |                              |--- 결과를 OpenAI에 전달 ---->|
 *    |                              |                              |
 *    |<-- SSE: content (텍스트) ----|<--- 추가 응답 ---------------|
 *    |                              |                              |
 *    |                              |--- AI 메시지 DB 저장         |
 *    |<-- SSE: complete ------------|                              |
 *    |    (유저메시지 + AI메시지)   |                              |
 * ```
 *
 * ## 핵심 개념
 *
 * ### 1. SSE (Server-Sent Events)
 * - HTTP 연결을 유지하면서 서버 → 클라이언트로 실시간 이벤트 전송
 * - 이벤트 타입: content, tool_start, tool_done, routine_progress, complete, error
 *
 * ### 2. Function Calling (Tool Use)
 * - OpenAI가 특정 작업이 필요하다고 판단하면 함수 호출 요청
 * - 예: generate_routine_preview, request_profile_confirmation
 * - 서버에서 함수 실행 후 결과를 다시 OpenAI에 전달 → 추가 응답 생성
 *
 * ### 3. While 루프 패턴
 * - OpenAI 호출 → 응답 처리 → 함수 있으면 실행 → 다시 OpenAI 호출
 * - 함수가 없거나 최대 호출 수 초과 시 루프 종료
 *
 * ## 데이터 흐름
 *
 * ### 입력 데이터
 * - message: 사용자 입력 텍스트
 * - conversationId: 대화 ID (URL 파라미터)
 *
 * ### DB 저장 순서
 * 1. 유저 메시지 저장 (savedUserMessage)
 * 2. [루프 중] AI 텍스트 응답 저장 (tool 호출 전)
 * 3. [루프 중] Tool call 메타데이터 저장
 * 4. [루프 중] Tool result 저장
 * 5. 최종 텍스트 응답 저장 (tool 호출 후 남은 텍스트)
 *
 * ### SSE 출력
 * - content: 실시간 텍스트 청크 (스트리밍 UI용)
 * - tool_start/tool_done: 도구 실행 상태
 * - routine_progress: 루틴 생성 진행률
 * - complete: 모든 처리 완료 + DB에 저장된 메시지 데이터
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation } from '@/lib/types/chat';
import { AI_TRAINER_TOOLS } from '@/lib/ai/tools';
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
} from '@/lib/constants/aiChat';
import { composeCoachPrompt } from '@/lib/ai/system-prompts';
import type { CoachConversationMetadata } from '@/lib/types/coach';
import type { AIToolName } from '@/lib/types/fitness';
import { z } from 'zod';
import {
  checkRateLimit,
  AI_RATE_LIMIT,
  rateLimitExceeded,
} from '@/lib/utils/rateLimiter';

import {
  SSEWriter,
  fetchMessagesForAI,
  buildConversationInput,
  saveUserMessage,
  saveAiTextMessage,
  saveGreetingMessage,
  saveToolCallMessage,
  saveToolResultMessage,
  fetchAiMessagesForComplete,
  updateConversationTimestamp,
  type SavedUserMessage,
  type ToolCallData,
} from '@/lib/ai/stream';

// =============================================================================
// OpenAI 클라이언트 초기화
// =============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 입력 검증 스키마
const MessageSchema = z.object({
  message: z
    .string()
    .min(AI_CHAT_LIMITS.MIN_MESSAGE_LENGTH, '메시지를 입력해주세요.')
    .max(AI_CHAT_LIMITS.MAX_MESSAGE_LENGTH, `메시지는 ${AI_CHAT_LIMITS.MAX_MESSAGE_LENGTH}자 이내여야 합니다.`),
});

// =============================================================================
// OpenAI Responses API 도구 포맷 변환
// =============================================================================

/**
 * AI_TRAINER_TOOLS를 OpenAI Responses API 형식으로 변환
 *
 * OpenAI Responses API는 기존 Chat Completions API와 다른 도구 형식 사용:
 * - type: 'function'
 * - name, description, parameters 필드
 */
function formatToolsForResponsesAPI(): OpenAI.Responses.Tool[] {
  return AI_TRAINER_TOOLS.map((tool) => ({
    type: 'function' as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as Record<string, unknown>,
    strict: tool.strict ?? null,
  }));
}

// =============================================================================
// 메인 라우트 핸들러
// =============================================================================

export const POST = withAuth<Response>(
  async (request: NextRequest, { authUser, supabase, params }) => {
    const { id: conversationId } = await params;

    // =========================================================================
    // STEP 1: 사전 검증 (Rate Limit, 입력 검증, 대화 존재 확인)
    // =========================================================================

    // Rate Limiting: 분당 최대 요청 수 제한
    const rateLimitResult = checkRateLimit(`ai-conversation:${authUser.id}`, AI_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(rateLimitExceeded(rateLimitResult), { status: 429 });
    }

    // JSON 파싱
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Zod 스키마로 입력 검증
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

    // 대화 존재 및 권한 확인 (RLS가 권한 필터링 처리)
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
    const userId = conv.created_by; // Tool handler에서 사용할 유저 ID

    // Phase 18: ai_status 체크 제거 (범용 대화로 완료 개념 없음)

    // =========================================================================
    // STEP 2: 대화 컨텍스트 준비
    // =========================================================================

    /**
     * 기존 메시지 조회 (OpenAI에 전달할 대화 히스토리)
     *
     * Phase 16.5: summarized_until 필터링
     * - 요약이 있으면 요약 이후 메시지만 조회 (토큰 50% 절감)
     * - 요약 내용은 system prompt에 포함
     */
    const dbMessages = await fetchMessagesForAI(supabase, {
      conversationId,
      summarizedUntil: conv.summarized_until,
    });

    /**
     * 시스템 프롬프트 구성
     *
     * 구성 요소:
     * 1. COACH_BASE_PROMPT: 기본 코치 역할 정의
     * 2. context_summary: 이전 대화 요약 (있는 경우)
     * 3. PROCESS_RULES: 활성 프로세스 규칙 (예: 루틴 생성 단계)
     */
    const metadata = conv.metadata as CoachConversationMetadata | null;
    const processType = metadata?.activePurpose?.type;
    const systemPrompt = composeCoachPrompt(processType, conv.context_summary);

    // =========================================================================
    // STEP 3: 유저 메시지 저장
    // =========================================================================

    /**
     * 메시지 타입 판별:
     * - __START__: 대화 시작 시스템 메시지 → AI 인사말 저장
     * - 일반 메시지: 유저 메시지 DB 저장
     */
    const isSystem = isSystemMessage(message);
    let savedUserMessage: SavedUserMessage | null = null;

    if (isSystem) {
      // 시스템 메시지: AI 인사말만 저장 (유저 메시지 없음)
      await saveGreetingMessage(supabase, conversationId, !!processType);
    } else {
      // 일반 메시지: 유저 메시지 저장
      savedUserMessage = await saveUserMessage(supabase, conversationId, message);
      if (!savedUserMessage) {
        return NextResponse.json(
          { error: '메시지 저장에 실패했습니다.', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      // 이전 pending 상태 정리 (유저가 응답했으므로)
      await clearMetadataKeys(supabase, conversationId, [
        'pending_profile_confirmation',
        'pending_input',
      ]);
    }

    // =========================================================================
    // STEP 4: SSE 스트리밍 응답 생성
    // =========================================================================

    /**
     * ReadableStream + SSEWriter로 실시간 스트리밍 구현
     *
     * SSE 이벤트 형식:
     * ```
     * event: content
     * data: {"content": "안녕"}
     *
     * event: tool_start
     * data: {"toolCallId": "...", "name": "generate_routine_preview"}
     *
     * event: complete
     * data: {"userMessage": {...}, "aiMessages": [...]}
     * ```
     */
    const stream = new ReadableStream({
      async start(controller) {
        const writer = new SSEWriter(controller);

        try {
          // =================================================================
          // STEP 4-1: OpenAI 입력 준비
          // =================================================================

          /**
           * 대화 히스토리를 OpenAI Responses API 형식으로 변환
           *
           * 형식:
           * - { type: 'message', role: 'user', content: '...' }
           * - { type: 'message', role: 'assistant', content: '...' }
           * - { type: 'function_call', id: '...', name: '...', arguments: '...' }
           * - { type: 'function_call_output', call_id: '...', output: '...' }
           */
          const input = buildConversationInput(dbMessages, message);
          const tools = formatToolsForResponsesAPI();

          // =================================================================
          // STEP 4-2: OpenAI 스트리밍 루프
          // =================================================================

          /**
           * While 루프 패턴:
           *
           * 1. OpenAI 스트리밍 호출
           * 2. 텍스트 청크 → SSE로 클라이언트에 전송
           * 3. 함수 호출 발견 → 함수 실행 → 결과를 input에 추가
           * 4. 함수가 있었으면 다시 OpenAI 호출 (루프 계속)
           * 5. 함수가 없으면 루프 종료
           *
           * 예시 시나리오:
           * - 1차 호출: "루틴을 만들어드릴게요" + generate_routine_preview 함수 호출
           * - 함수 실행: 루틴 미리보기 데이터 생성
           * - 2차 호출: "위 루틴 어떠세요?" (함수 결과 기반 추가 응답)
           */
          let continueLoop = true;
          let fullContent = '';        // 전체 텍스트 누적 (DB 저장용)
          let totalToolCalls = 0;      // 총 함수 호출 수 (무한루프 방지)
          let savedTextLength = 0;     // 이미 DB에 저장된 텍스트 길이

          while (continueLoop && totalToolCalls < AI_CHAT_LIMITS.MAX_TOOL_CALLS_PER_RESPONSE) {
            // OpenAI Responses API 스트리밍 호출
            const openaiStream = await openai.responses.create({
              model: AI_MODEL.DEFAULT,
              instructions: systemPrompt,
              input,
              tools,
              stream: true,
            });

            /**
             * 현재 루프에서 발견된 함수 호출들
             * - key: 함수 호출 ID
             * - value: 함수 정보 (이름, 인자 등)
             */
            const functionCalls: Map<string, {
              id: string;
              callId: string;
              name: string;
              arguments: string;
              lastProgress?: number;
            }> = new Map();

            let contentBuffer = '';   // 현재 루프의 텍스트 버퍼
            let hasToolCalls = false; // 현재 루프에서 함수 호출 발생 여부

            // =============================================================
            // STEP 4-3: 스트리밍 이벤트 처리
            // =============================================================

            for await (const event of openaiStream) {
              /**
               * 텍스트 델타 이벤트
               * - OpenAI가 텍스트를 청크 단위로 전송
               * - 즉시 클라이언트에 SSE로 전달 (실시간 타이핑 효과)
               */
              if (event.type === 'response.output_text.delta') {
                contentBuffer += event.delta;
                fullContent += event.delta;
                writer.send('content', { content: event.delta });
              }

              /**
               * 함수 호출 시작 이벤트
               * - OpenAI가 특정 도구 사용을 결정
               * - 예: "프로필을 확인해볼게요" → request_profile_confirmation
               */
              if (event.type === 'response.output_item.added') {
                const item = event.item;
                if (item.type === 'function_call' && item.id) {
                  hasToolCalls = true;
                  functionCalls.set(item.id, {
                    id: item.id,
                    callId: item.call_id,
                    name: item.name,
                    arguments: '',
                  });
                  // 클라이언트에 도구 실행 시작 알림 (로딩 UI 표시용)
                  writer.send('tool_start', { toolCallId: item.id, name: item.name });
                }
              }

              /**
               * 함수 인자 스트리밍 이벤트
               * - 함수 호출의 JSON 인자가 청크 단위로 전송
               * - generate_routine_preview의 경우 진행률 UI 표시
               */
              if (event.type === 'response.function_call_arguments.delta') {
                const fc = functionCalls.get(event.item_id);
                if (fc) {
                  fc.arguments += event.delta;

                  // 루틴 생성 함수의 경우 진행률 전송 (큰 JSON이라 시간 소요)
                  if (fc.name === 'generate_routine_preview') {
                    const estimatedChars = 2000; // 예상 총 문자 수
                    const progress = Math.min(95, Math.round((fc.arguments.length / estimatedChars) * 100));
                    const progressStep = Math.floor(progress / 5) * 5; // 5% 단위

                    if (progressStep > (fc.lastProgress ?? 0)) {
                      fc.lastProgress = progressStep;
                      writer.send('routine_progress', {
                        progress: progressStep,
                        stage: progress < 30 ? '운동 목록 구성 중...' :
                               progress < 60 ? '세트/반복 설정 중...' :
                               progress < 90 ? '마무리 중...' : '거의 완료!',
                      });
                    }
                  }
                }
              }

              /**
               * 함수 인자 완료 이벤트
               * - 전체 JSON 인자가 완성됨
               */
              if (event.type === 'response.function_call_arguments.done') {
                const fc = functionCalls.get(event.item_id);
                if (fc) {
                  fc.arguments = event.arguments;
                }
              }
            }

            // =============================================================
            // STEP 4-4: 함수 실행 및 다음 루프 준비
            // =============================================================

            if (hasToolCalls && functionCalls.size > 0) {
              totalToolCalls += functionCalls.size;

              /**
               * 텍스트 응답 먼저 저장
               * - 함수 호출 전에 생성된 텍스트가 있으면 별도 저장
               * - tool_call 메시지에 포함하면 클라이언트에서 표시 안됨
               */
              if (contentBuffer.trim()) {
                await saveAiTextMessage(supabase, conversationId, contentBuffer);
                savedTextLength += contentBuffer.length;
              }

              /**
               * 함수 호출 메타데이터 DB 저장
               * - 나중에 대화 히스토리 복원 시 필요
               */
              const formattedToolCalls: ToolCallData[] = Array.from(functionCalls.values()).map((fc) => ({
                id: fc.id,
                call_id: fc.callId || fc.id,
                name: fc.name,
                arguments: fc.arguments,
              }));
              await saveToolCallMessage(supabase, conversationId, formattedToolCalls);

              /**
               * Tool Handler Context
               * - 각 도구 핸들러에 전달할 컨텍스트
               * - sendEvent: SSE 이벤트 전송 함수 (도구가 직접 클라이언트에 알림)
               */
              const toolHandlerCtx: ToolHandlerContext = {
                userId,
                supabase,
                conversationId,
                sendEvent: (event, data) => writer.send(event, data),
              };

              /**
               * 각 함수 실행
               * - handleToolCall: 함수 이름에 따라 적절한 핸들러 호출
               * - 결과를 input에 추가하여 다음 OpenAI 호출에 포함
               */
              for (const fc of functionCalls.values()) {
                const toolName = fc.name as AIToolName;
                let args: Record<string, unknown> = {};
                try {
                  args = JSON.parse(fc.arguments || '{}');
                } catch {
                  args = {};
                }

                const effectiveCallId = fc.callId || fc.id;
                const fcInfo: FunctionCallInfo = {
                  id: fc.id,
                  callId: effectiveCallId,
                  name: fc.name,
                  arguments: fc.arguments,
                };

                /**
                 * 도구 실행
                 * - toolResult: 도구 실행 결과 (OpenAI에 전달)
                 * - continueLoop: 추가 OpenAI 호출 필요 여부
                 *   - true: 결과 기반으로 추가 응답 생성
                 *   - false: 여기서 대화 종료 (예: 유저 입력 대기)
                 */
                const { toolResult, continueLoop: shouldContinue } = await handleToolCall(
                  fcInfo,
                  toolName,
                  args,
                  toolHandlerCtx
                );

                if (!shouldContinue) {
                  continueLoop = false;
                }

                // 도구 결과 DB 저장
                await saveToolResultMessage(supabase, conversationId, effectiveCallId, toolName, toolResult);

                /**
                 * 다음 OpenAI 호출을 위해 input에 추가
                 * - function_call: AI가 요청한 함수 호출
                 * - function_call_output: 서버에서 실행한 결과
                 */
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

              // 도구 실행 후에도 루프 계속 (shouldContinue가 false가 아니면)
              if (continueLoop !== false) {
                continueLoop = true;
              }
            } else {
              // 함수 호출이 없으면 루프 종료
              continueLoop = false;
            }
          }

          // =================================================================
          // STEP 5: 최종 처리 및 complete 이벤트
          // =================================================================

          /**
           * 최종 텍스트 저장
           * - 마지막 루프에서 함수 호출 없이 끝난 경우
           * - 이미 저장된 부분(savedTextLength)을 제외한 나머지 저장
           */
          const unsavedContent = fullContent.slice(savedTextLength);
          if (unsavedContent.trim()) {
            await saveAiTextMessage(supabase, conversationId, unsavedContent);
          }

          // 대화 updated_at 갱신
          await updateConversationTimestamp(supabase, conversationId);

          /**
           * Phase 16: complete 이벤트용 AI 메시지 조회
           *
           * 왜 DB에서 다시 조회하는가?
           * - 도구 핸들러가 직접 저장한 메시지 포함 (예: profile_confirmation)
           * - 모든 AI 메시지를 한번에 클라이언트에 전달
           * - 클라이언트는 이 데이터로 캐시 업데이트 (refetch 불필요)
           */
          let allAiMessages: Array<{
            id: string;
            content: string;
            contentType: string;
            createdAt: string;
          }> = [];

          if (savedUserMessage) {
            allAiMessages = await fetchAiMessagesForComplete(
              supabase,
              conversationId,
              savedUserMessage.createdAt
            );
          }

          /**
           * complete 이벤트 전송
           *
           * 포함 데이터:
           * - userMessage: DB에 저장된 유저 메시지 (id, content, createdAt)
           * - aiMessages: 이 요청에서 생성된 모든 AI 메시지
           *
           * 클라이언트에서:
           * - optimistic 유저 메시지를 실제 메시지로 교체
           * - AI 메시지를 캐시에 추가
           * - 네트워크 refetch 불필요 (Phase 16 최적화)
           */
          writer.send('complete', {
            userMessage: savedUserMessage,
            aiMessages: allAiMessages,
          });
          writer.close();
        } catch (error) {
          console.error('[AI Chat Stream] Error:', error);
          writer.send('error', { error: 'AI 응답 생성 중 오류가 발생했습니다.' });
          writer.close();
        }
      },
    });

    // SSE 응답 헤더 설정
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
);
