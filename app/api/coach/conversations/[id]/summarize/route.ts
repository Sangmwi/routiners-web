/**
 * Coach Context Summarization API
 *
 * POST /api/coach/conversations/[id]/summarize - 컨텍스트 요약 트리거
 * GET  /api/coach/conversations/[id]/summarize/status - 요약 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbChatMessage } from '@/lib/types/chat';
import { CoachConversationMetadata } from '@/lib/types/coach';
import OpenAI from 'openai';

const SUMMARIZATION_THRESHOLD = 15;

// ============================================================================
// POST /api/coach/conversations/[id]/summarize
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
      .eq('ai_purpose', 'coach')
      .is('deleted_at', null)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Coach Summarize POST] Conv Error:', convError);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 요약 대상 메시지 조회 (summarized_until 이후 메시지)
    let messageQuery = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', id)
      .eq('content_type', 'text')
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
      console.error('[Coach Summarize POST] Message Error:', msgError);
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 요약 대상 메시지가 threshold 미만이면 스킵
    if (!messages || messages.length < SUMMARIZATION_THRESHOLD) {
      return NextResponse.json({
        success: false,
        message: `요약 대상 메시지가 ${SUMMARIZATION_THRESHOLD}개 미만입니다.`,
        messageCount: messages?.length ?? 0,
      });
    }

    // OpenAI로 요약 생성
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 기존 요약이 있으면 포함
    const existingSummary = conversation.context_summary
      ? `[기존 대화 요약]\n${conversation.context_summary}\n\n[새로운 대화]\n`
      : '';

    const messagesToSummarize = (messages as DbChatMessage[])
      .map((m) => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n');

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 대화 요약 전문가입니다. 피트니스 코치와 사용자 간의 대화를 요약합니다.
요약 규칙:
1. 핵심 정보만 추출 (운동 목표, 경험, 제약사항, 선호도 등)
2. 사용자 결정사항 명시
3. 진행 중인 프로세스 상태 포함
4. 한국어로 작성
5. 500자 이내로 간결하게`,
          },
          {
            role: 'user',
            content: `${existingSummary}${messagesToSummarize}\n\n위 대화를 요약해주세요.`,
          },
        ],
        max_tokens: 800,
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
        console.error('[Coach Summarize POST] Update Error:', updateError);
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
      console.error('[Coach Summarize POST] OpenAI Error:', error);
      return NextResponse.json(
        { error: '요약 생성에 실패했습니다.', code: 'SUMMARIZATION_FAILED' },
        { status: 500 }
      );
    }
  }
);

// ============================================================================
// GET /api/coach/conversations/[id]/summarize
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
      .eq('ai_purpose', 'coach')
      .is('deleted_at', null)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Coach Summarize GET] Conv Error:', convError);
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
      console.error('[Coach Summarize GET] Count Error:', countError);
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
