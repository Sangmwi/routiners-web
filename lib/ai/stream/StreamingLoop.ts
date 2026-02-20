/**
 * StreamingLoop - OpenAI Responses API 스트리밍 오케스트레이터
 *
 * route.ts에서 SRP 준수를 위해 추출.
 * OpenAI 스트리밍 호출, 이벤트 파싱, 진행률 추적, 도구 실행을 담당.
 */

import OpenAI from 'openai';
import { AI_CHAT_LIMITS, AI_MODEL } from '@/lib/constants/aiChat';
import type { SSEWriter } from './SSEWriter';
import { ProgressTracker } from './ProgressTracker';
import {
  saveAiTextMessage,
  saveToolCallMessage,
  saveToolResultMessage,
  type ToolCallData,
} from './MessagePersistence';
import {
  handleToolCall,
  type ToolHandlerContext,
  type FunctionCallInfo,
} from '@/lib/ai/chat-handlers';
import type { AIToolName } from '@/lib/types/fitness';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

export interface StreamingLoopParams {
  openai: OpenAI;
  systemPrompt: string;
  input: OpenAI.Responses.ResponseInputItem[];
  tools: OpenAI.Responses.Tool[];
  writer: SSEWriter;
  supabase: SupabaseClient;
  conversationId: string;
  userId: string;
  /** 현재 활성 프로세스 타입 (옵션 텍스트 패턴 감지용) */
  activePurposeType?: string;
}

export interface StreamingLoopResult {
  fullContent: string;
  savedTextLength: number;
}

interface FunctionCallAccumulator {
  id: string;
  callId: string;
  name: string;
  arguments: string;
}

// =============================================================================
// Main Streaming Loop
// =============================================================================

/**
 * OpenAI 스트리밍 루프 실행
 *
 * While 루프 패턴:
 * 1. OpenAI 스트리밍 호출
 * 2. 텍스트 청크 → SSE로 클라이언트에 전송
 * 3. 함수 호출 발견 → 함수 실행 → 결과를 input에 추가
 * 4. 함수가 있었으면 다시 OpenAI 호출 (루프 계속)
 * 5. 함수가 없으면 루프 종료
 */
export async function runStreamingLoop(
  params: StreamingLoopParams
): Promise<StreamingLoopResult> {
  const { openai, systemPrompt, input, tools, writer, supabase, conversationId, userId, activePurposeType } = params;

  let continueLoop = true;
  let fullContent = '';
  let totalToolCalls = 0;
  let savedTextLength = 0;
  let retryCount = 0;
  const MAX_OPTION_RETRIES = 1;
  const progressTracker = new ProgressTracker();

  while (continueLoop && totalToolCalls < AI_CHAT_LIMITS.MAX_TOOL_CALLS_PER_RESPONSE) {
    const openaiStream = await openai.responses.create({
      model: AI_MODEL.DEFAULT,
      instructions: systemPrompt,
      input,
      tools,
      stream: true,
    });

    const functionCalls = new Map<string, FunctionCallAccumulator>();
    let contentBuffer = '';
    let hasToolCalls = false;

    // ----- 스트리밍 이벤트 파싱 -----
    for await (const event of openaiStream) {
      // 텍스트 델타 → 즉시 SSE 전송
      if (event.type === 'response.output_text.delta') {
        contentBuffer += event.delta;
        fullContent += event.delta;
        writer.send('content', { content: event.delta });
      }

      // 함수 호출 시작
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
          writer.send('tool_start', { toolCallId: item.id, name: item.name });
        }
      }

      // 함수 인자 스트리밍 + 진행률 추적 (OCP: ProgressTracker에 위임)
      if (event.type === 'response.function_call_arguments.delta') {
        const fc = functionCalls.get(event.item_id);
        if (fc) {
          fc.arguments += event.delta;

          const progressEvent = progressTracker.onArgumentsDelta(
            event.item_id,
            fc.name,
            fc.arguments,
            event.delta
          );
          if (progressEvent) {
            writer.send('routine_progress', progressEvent);
          }
        }
      }

      // 함수 인자 완료
      if (event.type === 'response.function_call_arguments.done') {
        const fc = functionCalls.get(event.item_id);
        if (fc) {
          fc.arguments = event.arguments;
        }
      }
    }

    // ----- 도구 실행 -----
    if (hasToolCalls && functionCalls.size > 0) {
      totalToolCalls += functionCalls.size;

      // 도구 호출 전 텍스트가 있으면 먼저 저장
      if (contentBuffer.trim()) {
        await saveAiTextMessage(supabase, conversationId, contentBuffer);
        savedTextLength += contentBuffer.length;
      }

      // 도구 호출 메타데이터 DB 저장
      const formattedToolCalls: ToolCallData[] = Array.from(functionCalls.values()).map((fc) => ({
        id: fc.id,
        call_id: fc.callId || fc.id,
        name: fc.name,
        arguments: fc.arguments,
      }));
      await saveToolCallMessage(supabase, conversationId, formattedToolCalls);

      const toolHandlerCtx: ToolHandlerContext = {
        userId,
        supabase,
        conversationId,
        sendEvent: (event, data) => writer.send(event, data),
      };

      // 도구 실행 + continueLoop 판단
      let anyShouldStop = false;

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

        const { toolResult, continueLoop: shouldContinue } = await handleToolCall(
          fcInfo,
          toolName,
          args,
          toolHandlerCtx
        );

        if (!shouldContinue) {
          anyShouldStop = true;
        }

        await saveToolResultMessage(supabase, conversationId, effectiveCallId, toolName, toolResult);

        // 다음 OpenAI 호출을 위해 input에 추가
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

      continueLoop = !anyShouldStop;
    } else {
      // 옵션 텍스트 패턴 감지: 프로세스 활성 중 도구 호출 없이 옵션을 텍스트로 나열한 경우
      if (
        activePurposeType &&
        retryCount < MAX_OPTION_RETRIES &&
        contentBuffer.trim() &&
        containsOptionPattern(contentBuffer)
      ) {
        retryCount++;
        console.warn(
          `[StreamingLoop] 옵션 텍스트 패턴 감지 (retry ${retryCount}/${MAX_OPTION_RETRIES}):`,
          contentBuffer.slice(0, 100)
        );

        // AI 응답을 input에 추가 후 보정 메시지 주입
        input.push({
          type: 'message',
          role: 'assistant',
          content: contentBuffer,
        });
        input.push({
          type: 'message',
          role: 'user',
          content: '[시스템] 위 응답에서 옵션을 텍스트로 나열했습니다. 텍스트의 옵션 부분을 제거하고 request_user_input 도구를 호출하여 선택지를 UI로 표시해주세요.',
        });

        // 텍스트 버퍼 저장 (이미 전송됨)
        if (contentBuffer.trim()) {
          await saveAiTextMessage(supabase, conversationId, contentBuffer);
          savedTextLength += contentBuffer.length;
        }

        continue; // 루프 재시도
      }

      continueLoop = false;
    }
  }

  return { fullContent, savedTextLength };
}

// =============================================================================
// Option Text Pattern Detection
// =============================================================================

/**
 * AI 응답에서 옵션을 텍스트로 나열한 패턴 감지
 *
 * 감지 대상:
 * - 번호 리스트 (1. xxx 2. xxx)
 * - 불릿 리스트 (- xxx, • xxx)
 * - 볼드 옵션 나열 (**초보자**, **중급자**)
 */
function containsOptionPattern(text: string): boolean {
  // 연속된 번호 리스트 (최소 2개): "1. xxx 2. xxx" 또는 "1) xxx 2) xxx"
  const numberedList = /(?:^|\n)\s*[1-9][.)]\s*.+(?:\n\s*[2-9][.)]\s*.+)/m;

  // 연속된 불릿 리스트 (최소 2개): "- xxx\n- xxx" 또는 "• xxx\n• xxx"
  const bulletList = /(?:^|\n)\s*[-•]\s*.+(?:\n\s*[-•]\s*.+)/m;

  // 볼드 옵션 나열 (최소 2개): **A**, **B**
  const boldOptions = /\*\*[^*]+\*\*.*\*\*[^*]+\*\*/;

  return numberedList.test(text) || bulletList.test(text) || boldOptions.test(text);
}
