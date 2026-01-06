import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * DELETE /api/routine/events/by-session/[sessionId]
 * AI 세션과 연결된 이벤트들 삭제
 */
export const DELETE = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { sessionId } = await (request as unknown as RouteParams).params;

  // 대화(conversation) 소유권 확인
  const { data: session, error: sessionError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', sessionId)
    .eq('type', 'ai')
    .eq('created_by', userId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'AI 세션을 찾을 수 없습니다.', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // 해당 세션의 이벤트들 삭제
  const { error, count } = await supabase
    .from('routine_events')
    .delete({ count: 'exact' })
    .eq('ai_session_id', sessionId)
    .eq('user_id', userId);

  if (error) {
    console.error('[Routine Events by-session DELETE] Error:', error);
    return NextResponse.json(
      { error: '이벤트 삭제에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  // AI 대화의 ai_result_applied 플래그 초기화
  await supabase
    .from('conversations')
    .update({
      ai_result_applied: false,
      ai_result_applied_at: null,
    })
    .eq('id', sessionId);

  return NextResponse.json({ count: count || 0 });
});
