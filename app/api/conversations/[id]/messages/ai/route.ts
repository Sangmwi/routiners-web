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
 * 스트리밍 루프 상세는 StreamingLoop.ts 참조.
 * 진행률 추적 상세는 ProgressTracker.ts 참조.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation } from '@/lib/types/chat';
import { AI_TRAINER_TOOLS } from '@/lib/ai/tools';
import { clearMetadataKeys } from '@/lib/ai/chat-handlers';
import { AI_CHAT_LIMITS, isSystemMessage, getActionContent } from '@/lib/constants/aiChat';
import { composeCoachPrompt } from '@/lib/ai/system-prompts';
import type { CoachConversationMetadata } from '@/lib/types/coach';
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
  fetchAiMessagesForComplete,
  updateConversationTimestamp,
  runStreamingLoop,
  type SavedUserMessage,
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
    .max(
      AI_CHAT_LIMITS.MAX_MESSAGE_LENGTH,
      `메시지는 ${AI_CHAT_LIMITS.MAX_MESSAGE_LENGTH}자 이내여야 합니다.`
    ),
});

// =============================================================================
// OpenAI Responses API 도구 포맷 변환
// =============================================================================

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
    const userId = conv.created_by;

    // =========================================================================
    // STEP 2: 대화 컨텍스트 준비
    // =========================================================================

    const dbMessages = await fetchMessagesForAI(supabase, {
      conversationId,
      summarizedUntil: conv.summarized_until,
    });

    const metadata = conv.metadata as CoachConversationMetadata | null;
    const processType = metadata?.activePurpose?.type;
    const systemPrompt = composeCoachPrompt(processType, conv.context_summary);

    // =========================================================================
    // STEP 3: 유저 메시지 저장
    // =========================================================================

    const isSystem = isSystemMessage(message);
    const actionContent = getActionContent(message);
    let savedUserMessage: SavedUserMessage | null = null;

    if (isSystem) {
      await saveGreetingMessage(supabase, conversationId, !!processType);
    } else if (actionContent) {
      // Action message: 유저 메시지 저장 없이 pending 정리만
      await clearMetadataKeys(supabase, conversationId, [
        'pending_profile_confirmation',
        'pending_input',
      ]);
    } else {
      savedUserMessage = await saveUserMessage(supabase, conversationId, message);
      if (!savedUserMessage) {
        return NextResponse.json(
          { error: '메시지 저장에 실패했습니다.', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      await clearMetadataKeys(supabase, conversationId, [
        'pending_profile_confirmation',
        'pending_input',
      ]);
    }

    // =========================================================================
    // STEP 4: SSE 스트리밍 응답 생성
    // =========================================================================

    const stream = new ReadableStream({
      async start(controller) {
        const writer = new SSEWriter(controller);

        try {
          const input = buildConversationInput(dbMessages, actionContent || message);
          const tools = formatToolsForResponsesAPI();

          // 스트리밍 루프 실행 (StreamingLoop.ts)
          const { fullContent, savedTextLength } = await runStreamingLoop({
            openai,
            systemPrompt,
            input,
            tools,
            writer,
            supabase,
            conversationId,
            userId,
          });

          // =================================================================
          // STEP 5: 최종 처리 및 complete 이벤트
          // =================================================================

          const unsavedContent = fullContent.slice(savedTextLength);
          if (unsavedContent.trim()) {
            await saveAiTextMessage(supabase, conversationId, unsavedContent);
          }

          await updateConversationTimestamp(supabase, conversationId);

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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
);
