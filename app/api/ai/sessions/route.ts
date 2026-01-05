import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbAISession,
  ChatMessage,
  SessionPurpose,
  transformDbSessionToSession,
  transformSessionToSummary,
} from '@/lib/types/routine';
import { AISessionCreateSchema } from '@/lib/schemas/routine.schema';

// ============================================================================
// AI 초기 메시지 (purpose별)
// ============================================================================

const INITIAL_MESSAGES: Record<SessionPurpose, string> = {
  workout: `안녕하세요! 저는 AI 트레이너입니다. 💪

맞춤형 4주 운동 루틴을 만들어 드릴게요. 몇 가지 질문에 답해주시면 됩니다.

먼저, **운동 목표**가 무엇인가요?
- 근력 향상
- 체중 감량
- 체력 증진
- 근육량 증가

원하는 목표를 알려주세요!`,

  meal: `안녕하세요! 저는 AI 영양사입니다. 🥗

맞춤형 식단을 만들어 드릴게요. 몇 가지 질문에 답해주시면 됩니다.

먼저, **식단 목표**가 무엇인가요?
- 체중 감량
- 근육량 증가
- 건강 관리
- 체중 유지

원하는 목표를 알려주세요!`,
};

/**
 * GET /api/ai/sessions
 * AI 세션 목록 조회
 */
export const GET = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const purpose = searchParams.get('purpose');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('ai_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (purpose) {
    query = query.eq('purpose', purpose);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AI Sessions GET] Error:', error);
    return NextResponse.json(
      { error: '세션 목록을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const sessions = (data as DbAISession[])
    .map(transformDbSessionToSession)
    .map(transformSessionToSummary);

  return NextResponse.json(sessions);
});

/**
 * POST /api/ai/sessions
 * 새 AI 세션 생성
 */
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

  // 유효성 검사
  const validation = AISessionCreateSchema.safeParse(body);
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

  const { purpose, title } = validation.data;

  // 이미 활성 세션이 있는지 확인
  const { data: existingSession } = await supabase
    .from('ai_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .eq('status', 'active')
    .single();

  if (existingSession) {
    return NextResponse.json(
      { error: '이미 진행 중인 세션이 있습니다.', code: 'ALREADY_EXISTS' },
      { status: 409 }
    );
  }

  // 초기 메시지 생성
  const initialMessage: ChatMessage = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: INITIAL_MESSAGES[purpose],
    createdAt: new Date().toISOString(),
  };

  // 새 세션 생성 (초기 메시지 포함)
  const { data, error } = await supabase
    .from('ai_sessions')
    .insert({
      user_id: userId,
      purpose,
      title: title || null,
      status: 'active',
      messages: [initialMessage],
      result_applied: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[AI Sessions POST] Error:', error);
    return NextResponse.json(
      { error: '세션 생성에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const session = transformDbSessionToSession(data as DbAISession);
  return NextResponse.json(session, { status: 201 });
});
