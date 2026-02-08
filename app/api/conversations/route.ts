import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, transformDbConversation } from '@/lib/types/chat';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Phase 18: aiPurpose 제거 (AI 대화는 항상 coach)
 */
const ConversationCreateSchema = z.object({
  type: z.enum(['ai', 'direct', 'group']),
  title: z.string().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// GET /api/conversations - 대화 목록 조회
// ============================================================================

/**
 * Phase 18: aiPurpose, aiStatus 필터 제거 (레거시)
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('conversations')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Conversations GET] Error:', error);
    return NextResponse.json(
      { error: '대화 목록을 불러오는데 실패했어요.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const conversations = (data as DbConversation[]).map(transformDbConversation);
  return NextResponse.json(conversations);
});

// ============================================================================
// POST /api/conversations - 새 대화 생성
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식이에요.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const validation = ConversationCreateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: '입력값이 유효하지 않아요.',
        code: 'VALIDATION_ERROR',
        details: validation.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { type, title } = validation.data;

  // Phase 18: ai_purpose, ai_status 컬럼 제거됨

  // 대화방 생성
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      type,
      ai_result_applied: false,
      title: title || null,
    })
    .select()
    .single();

  if (convError) {
    console.error('[Conversations POST] Error:', convError);
    return NextResponse.json(
      { error: '대화방 생성에 실패했어요.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const conv = conversation as DbConversation;

  // 참여자 추가 (owner) - user_id는 DB DEFAULT가 처리
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conv.id,
      role: 'owner',
    });

  if (participantError) {
    console.error('[Conversations POST] Participant Error:', participantError);
    // 롤백: 대화방 삭제
    await supabase.from('conversations').delete().eq('id', conv.id);
    return NextResponse.json(
      { error: '참여자 추가에 실패했어요.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  // Phase 18: toAISessionCompat 제거 - 모든 대화는 Conversation 타입으로 반환
  return NextResponse.json(transformDbConversation(conv), { status: 201 });
});
