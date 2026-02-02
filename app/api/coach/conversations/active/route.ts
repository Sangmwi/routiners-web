/**
 * Active Coach Conversation API
 *
 * GET /api/coach/conversations/active - 활성 코치 대화 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbCoachConversation,
  transformDbCoachConversation,
} from '@/lib/types/coach';

// ============================================================================
// GET /api/coach/conversations/active
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  // 코치 대화는 범용이므로 가장 최근 대화를 반환
  // Phase 18: ai_purpose 필터 제거 (모든 AI 대화가 코치 대화)
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('type', 'ai')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Coach Active GET] Error:', error);
    return NextResponse.json(
      { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  // 대화가 없으면 null 반환
  if (!conversation) {
    return NextResponse.json(null);
  }

  return NextResponse.json(
    transformDbCoachConversation(conversation as DbCoachConversation)
  );
});
