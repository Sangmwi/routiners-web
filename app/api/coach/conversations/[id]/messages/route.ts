/**
 * Coach Messages API
 *
 * GET /api/coach/conversations/[id]/messages - 메시지 조회 (무한스크롤)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbCoachConversation,
  transformDbCoachConversation,
  CoachMessagePage,
} from '@/lib/types/coach';
import { DbChatMessage, transformDbMessage } from '@/lib/types/chat';

// ============================================================================
// GET /api/coach/conversations/[id]/messages
// ============================================================================

export const GET = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const cursor = searchParams.get('cursor'); // created_at 기준

    // 대화 정보 조회 (메타데이터 포함)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
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
      console.error('[Coach Messages GET] Conv Error:', convError);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 메시지 조회 (최신순 → 역정렬하여 반환)
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', id)
      .is('deleted_at', null)
      .in('content_type', ['text'])
      .order('created_at', { ascending: false })
      .limit(limit + 1); // +1 for hasMore check

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
      console.error('[Coach Messages GET] Msg Error:', msgError);
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const dbMessages = messages as DbChatMessage[];

    // DEV: 메시지 내역 디버깅 로그
    console.log(`[Coach Messages] conv=${id}, total=${dbMessages.length}, cursor=${cursor ?? 'none'}`);
    dbMessages.forEach((m, i) => {
      console.log(`  [${i}] role=${m.role} type=${m.content_type} content=${m.content?.slice(0, 80)}${(m.content?.length ?? 0) > 80 ? '...' : ''}`);
    });

    const hasMore = dbMessages.length > limit;
    const resultMessages = hasMore ? dbMessages.slice(0, limit) : dbMessages;

    // 오래된 순으로 정렬해서 반환
    const sortedMessages = resultMessages.reverse().map(transformDbMessage);

    const response: CoachMessagePage = {
      messages: sortedMessages,
      conversation: transformDbCoachConversation(conversation as DbCoachConversation),
      hasMore,
      nextCursor: hasMore
        ? resultMessages[resultMessages.length - 1].created_at
        : undefined,
    };

    return NextResponse.json(response);
  }
);
