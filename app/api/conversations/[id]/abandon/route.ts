import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, transformDbConversation } from '@/lib/types/chat';

/**
 * POST /api/conversations/[id]/abandon
 * AI 대화 포기 처리
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { userId, supabase, params }
  ) => {
    const { id } = await params;

    // 대화 조회 및 권한 확인
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const conv = existing as DbConversation;

    if (conv.created_by !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (conv.type !== 'ai') {
      return NextResponse.json(
        { error: 'AI 대화만 포기 처리할 수 있습니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (conv.ai_status !== 'active') {
      return NextResponse.json(
        { error: '이미 종료된 대화입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // 포기 처리
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ai_status: 'abandoned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Conversation Abandon] Error:', error);
      return NextResponse.json(
        { error: '포기 처리에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(transformDbConversation(data as DbConversation));
  }
);
