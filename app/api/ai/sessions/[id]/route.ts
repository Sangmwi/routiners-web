import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbAISession, transformDbSessionToSession } from '@/lib/types/routine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai/sessions/[id]
 * 특정 세션 상세 조회
 */
export const GET = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { id } = await (request as unknown as RouteParams).params;

  const { data, error } = await supabase
    .from('ai_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[AI Session GET] Error:', error);
    return NextResponse.json(
      { error: '세션을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const session = transformDbSessionToSession(data as DbAISession);
  return NextResponse.json(session);
});

/**
 * DELETE /api/ai/sessions/[id]
 * 세션 삭제
 */
export const DELETE = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { id } = await (request as unknown as RouteParams).params;

  const { error } = await supabase
    .from('ai_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[AI Session DELETE] Error:', error);
    return NextResponse.json(
      { error: '세션 삭제에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});
