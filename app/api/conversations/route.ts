import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbConversation,
  transformDbConversation,
  toAISessionCompat,
} from '@/lib/types/chat';
import { z } from 'zod';

// ============================================================================
// AI 초기 메시지 - 더 이상 사용하지 않음
// 세션 생성 후 프론트엔드에서 자동으로 __START__ 메시지를 전송하여
// AI가 직접 첫 질문 UI를 표시합니다.
// ============================================================================

// ============================================================================
// Validation Schema
// ============================================================================

const ConversationCreateSchema = z.object({
  type: z.enum(['ai', 'direct', 'group']),
  aiPurpose: z.enum(['workout', 'meal']).optional(),
  title: z.string().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// GET /api/conversations - 대화 목록 조회
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const aiPurpose = searchParams.get('aiPurpose');
  const aiStatus = searchParams.get('aiStatus');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('conversations')
    .select('*')
    .eq('created_by', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('type', type);
  }
  if (aiPurpose) {
    query = query.eq('ai_purpose', aiPurpose);
  }
  if (aiStatus) {
    query = query.eq('ai_status', aiStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Conversations GET] Error:', error);
    return NextResponse.json(
      { error: '대화 목록을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const conversations = (data as DbConversation[]).map(transformDbConversation);
  return NextResponse.json(conversations);
});

// ============================================================================
// POST /api/conversations - 새 대화 생성
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { userId, supabase }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const validation = ConversationCreateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: '입력값이 유효하지 않습니다.',
        code: 'VALIDATION_ERROR',
        details: validation.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { type, aiPurpose, title } = validation.data;

  // AI 대화인 경우: 이미 활성 세션이 있는지 확인
  if (type === 'ai' && aiPurpose) {
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('created_by', userId)
      .eq('type', 'ai')
      .eq('ai_purpose', aiPurpose)
      .eq('ai_status', 'active')
      .is('deleted_at', null)
      .single();

    if (existingConv) {
      return NextResponse.json(
        { error: '이미 진행 중인 세션이 있습니다.', code: 'ALREADY_EXISTS' },
        { status: 409 }
      );
    }
  }

  // 대화방 생성
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      type,
      ai_purpose: type === 'ai' ? aiPurpose : null,
      ai_status: type === 'ai' ? 'active' : null,
      ai_result_applied: false,
      title: title || null,
      created_by: userId,
    })
    .select()
    .single();

  if (convError) {
    console.error('[Conversations POST] Error:', convError);
    return NextResponse.json(
      { error: '대화방 생성에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const conv = conversation as DbConversation;

  // 참여자 추가 (owner)
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conv.id,
      user_id: userId,
      role: 'owner',
    });

  if (participantError) {
    console.error('[Conversations POST] Participant Error:', participantError);
    // 롤백: 대화방 삭제
    await supabase.from('conversations').delete().eq('id', conv.id);
    return NextResponse.json(
      { error: '참여자 추가에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  // AI 대화인 경우: AISessionCompat 형태로 반환 (기존 코드 호환)
  // 초기 메시지 없이 빈 세션 반환 - 프론트엔드에서 자동으로 AI 시작 트리거
  if (type === 'ai') {
    const result = toAISessionCompat(transformDbConversation(conv), []);
    return NextResponse.json(result, { status: 201 });
  }

  return NextResponse.json(transformDbConversation(conv), { status: 201 });
});
