/**
 * Coach Conversation Complete API
 *
 * POST /api/coach/conversations/[id]/complete - 대화 완료 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbCoachConversation,
  transformDbCoachConversation,
  CoachConversationMetadata,
} from '@/lib/types/coach';

// ============================================================================
// POST /api/coach/conversations/[id]/complete
// ============================================================================

export const POST = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    // 현재 메타데이터 조회
    const { data: current, error: fetchError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', id)
      .eq('type', 'ai')
      .eq('ai_purpose', 'coach')
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Coach Complete POST] Fetch Error:', fetchError);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // activePurpose 해제 및 상태 완료 처리
    const currentMetadata = (current.metadata as CoachConversationMetadata) || {};
    const { activePurpose: _, ...restMetadata } = currentMetadata;

    const { data: updated, error: updateError } = await supabase
      .from('conversations')
      .update({
        ai_status: 'completed',
        metadata: { ...restMetadata, activePurpose: null },
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Coach Complete POST] Update Error:', updateError);
      return NextResponse.json(
        { error: '완료 처리에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      transformDbCoachConversation(updated as DbCoachConversation)
    );
  }
);
