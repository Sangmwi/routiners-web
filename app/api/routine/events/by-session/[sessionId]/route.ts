import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { notFound, internalError } from '@/lib/utils/apiResponse';

/**
 * DELETE /api/routine/events/by-session/[sessionId]
 * AI 세션과 연결된 이벤트들 삭제
 */
export const DELETE = withAuth<NextResponse, { sessionId: string }>(
  async (_request: NextRequest, { supabase, params }) => {
    const { sessionId } = await params;

    // 대화(conversation) 소유권 확인 (RLS가 자동으로 권한 필터링)
    const { data: session, error: sessionError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', sessionId)
      .eq('type', 'ai')
      .single();

    if (sessionError || !session) {
      return notFound('AI 세션을 찾을 수 없습니다.');
    }

    // 해당 세션의 이벤트들 삭제 (RLS가 자동으로 권한 필터링)
    const { error, count } = await supabase
      .from('routine_events')
      .delete({ count: 'exact' })
      .eq('ai_session_id', sessionId);

    if (error) {
      console.error('[Routine Events by-session DELETE] Error:', error);
      return internalError('이벤트 삭제에 실패했습니다.');
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
  }
);
