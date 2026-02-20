/**
 * Counselor Context Summarization API
 *
 * POST /api/counselor/conversations/[id]/summarize - 컨텍스트 요약 트리거
 * GET  /api/counselor/conversations/[id]/summarize/status - 요약 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbChatMessage } from '@/lib/types/chat';
import { AI_MODEL } from '@/lib/constants/aiChat';
import OpenAI from 'openai';

const SUMMARIZATION_THRESHOLD = 15;

// ============================================================================
// POST /api/counselor/conversations/[id]/summarize
// ============================================================================

export const POST = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    // 대화 정보 조회
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('metadata, context_summary, summarized_until')
      .eq('id', id)
      .eq('type', 'ai')
            .is('deleted_at', null)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Counselor Summarize POST] Conv Error:', convError);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 요약 대상 메시지 조회 (summarized_until 이후, text + tool_result 포함)
    let messageQuery = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', id)
      .in('content_type', ['text', 'tool_result'])
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (conversation.summarized_until) {
      // 이전 요약 이후 메시지만 조회
      const { data: lastSummarized } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('id', conversation.summarized_until)
        .single();

      if (lastSummarized) {
        messageQuery = messageQuery.gt('created_at', lastSummarized.created_at);
      }
    }

    const { data: messages, error: msgError } = await messageQuery;

    if (msgError) {
      console.error('[Counselor Summarize POST] Message Error:', msgError);
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // text 메시지만 기준으로 threshold 체크
    const textMessages = (messages || []).filter((m: DbChatMessage) => m.content_type === 'text');
    if (textMessages.length < SUMMARIZATION_THRESHOLD) {
      return NextResponse.json({
        success: false,
        message: `요약 대상 메시지가 ${SUMMARIZATION_THRESHOLD}개 미만입니다.`,
        messageCount: textMessages.length,
      });
    }

    // OpenAI로 요약 생성
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 기존 요약이 있으면 포함
    const existingSummary = conversation.context_summary
      ? `[기존 대화 요약]\n${conversation.context_summary}\n\n[새로운 대화]\n`
      : '';

    const messagesToSummarize = (messages as DbChatMessage[])
      .map((m) => {
        if (m.content_type === 'tool_result') {
          const toolName = (m.metadata as Record<string, unknown>)?.tool_name as string | undefined;
          return `[도구 결과: ${toolName || '알 수 없음'}] ${m.content}`;
        }
        return `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`;
      })
      .join('\n');

    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL.DEFAULT,
        messages: [
          {
            role: 'system',
            content: `당신은 피트니스 상담 대화 요약 전문가입니다. AI 상담사와 사용자 간의 대화를 요약합니다.

요약 시 반드시 포함할 정보:
1. 사용자 운동 프로필 — 목표, 경험 수준, 주간 빈도, 1회 시간, 장비 환경, 집중 부위, 부상/제한
2. 사용자가 내린 모든 선택과 결정 (도구 결과에서 확인 가능)
3. 프로세스 진행 상태 — 어떤 프로세스가 활성화되었고, 어디까지 진행했는지
4. 생성/적용/수정된 루틴 정보 (있는 경우)
5. 사용자가 의견을 바꾼 경우 최종 결정만 기록

요약 형식:
- 한국어로 작성
- 800자 이내
- 핵심 데이터는 "키: 값" 형태로 명확하게
- 도구 결과([도구 결과: ...])에 포함된 프로필 데이터나 루틴 정보는 반드시 요약에 반영`,
          },
          {
            role: 'user',
            content: `${existingSummary}${messagesToSummarize}\n\n위 대화를 요약해주세요.`,
          },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      });

      const summary = completion.choices[0]?.message?.content;

      if (!summary) {
        throw new Error('요약 생성 실패');
      }

      // 마지막 메시지 ID
      const lastMessageId = messages[messages.length - 1].id;

      // 대화 업데이트
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          context_summary: summary,
          summarized_until: lastMessageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('[Counselor Summarize POST] Update Error:', updateError);
        return NextResponse.json(
          { error: '요약 저장에 실패했습니다.', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        summary,
        summarizedMessageCount: messages.length,
      });
    } catch (error) {
      console.error('[Counselor Summarize POST] OpenAI Error:', error);
      return NextResponse.json(
        { error: '요약 생성에 실패했습니다.', code: 'SUMMARIZATION_FAILED' },
        { status: 500 }
      );
    }
  }
);

// ============================================================================
// GET /api/counselor/conversations/[id]/summarize
// (status 조회 - /status 경로 대신 GET 메서드로 처리)
// ============================================================================

export const GET = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    // 대화 정보 조회
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('context_summary, summarized_until')
      .eq('id', id)
      .eq('type', 'ai')
            .is('deleted_at', null)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Counselor Summarize GET] Conv Error:', convError);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 메시지 개수 조회
    const { count, error: countError } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', id)
      .eq('content_type', 'text')
      .is('deleted_at', null);

    if (countError) {
      console.error('[Counselor Summarize GET] Count Error:', countError);
      return NextResponse.json(
        { error: '메시지 개수 조회에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasSummary: !!conversation.context_summary,
      summarizedUntil: conversation.summarized_until ?? undefined,
      messageCount: count ?? 0,
    });
  }
);
