import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbConversation,
  DbChatMessage,
  transformDbConversation,
  transformDbMessage,
  toAISessionCompat,
} from '@/lib/types/chat';

/**
 * GET /api/conversations/ai/active
 * 현재 활성 AI 대화 조회 (purpose별로 1개만 존재)
 */
export const GET = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const purpose = searchParams.get('purpose');

  if (!purpose || !['workout', 'meal'].includes(purpose)) {
    return NextResponse.json(
      { error: 'purpose 파라미터가 필요합니다. (workout | meal)', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // 활성 대화 조회
  console.log('[Conversations Active GET] Query params:', { userId, purpose });

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('created_by', userId)
    .eq('type', 'ai')
    .eq('ai_purpose', purpose)
    .eq('ai_status', 'active')
    .is('deleted_at', null)
    .single();

  if (convError) {
    if (convError.code === 'PGRST116') {
      // 활성 세션 없음 - 디버깅을 위해 모든 세션 조회
      const { data: allSessions } = await supabase
        .from('conversations')
        .select('id, ai_purpose, ai_status, deleted_at, created_at')
        .eq('created_by', userId)
        .eq('type', 'ai')
        .eq('ai_purpose', purpose)
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('[Conversations Active GET] No active session found. Recent sessions:', allSessions);

      return NextResponse.json(null, { status: 200 });
    }
    console.error('[Conversations Active GET] Error:', convError);
    return NextResponse.json(
      { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  console.log('[Conversations Active GET] Found session:', conversation.id, 'status:', conversation.ai_status);

  const conv = conversation as DbConversation;

  // 메시지 조회
  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conv.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('[Conversations Active GET] Messages Error:', msgError);
    return NextResponse.json(
      { error: '메시지를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const chatMessages = (messages as DbChatMessage[]).map(transformDbMessage);
  const result = toAISessionCompat(transformDbConversation(conv), chatMessages);

  return NextResponse.json(result);
});
