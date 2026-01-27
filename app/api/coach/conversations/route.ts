/**
 * Coach Conversations API
 *
 * GET  /api/coach/conversations - 코치 대화 목록 조회
 * POST /api/coach/conversations - 새 코치 대화 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbCoachConversation,
  transformDbCoachConversation,
  CoachConversationsResponse,
  CoachConversationListItem,
} from '@/lib/types/coach';
import { DbChatMessage, transformDbMessage } from '@/lib/types/chat';
import { z } from 'zod';

// ============================================================================
// Validation
// ============================================================================

const CreateConversationSchema = z.object({
  activePurpose: z.object({
    type: z.literal('routine_generation'),
    stage: z.enum(['init', 'collecting_info', 'generating', 'reviewing', 'applying']),
    collectedData: z.record(z.unknown()).default({}),
    startedAt: z.string().optional(),
  }).optional(),
});

// ============================================================================
// GET /api/coach/conversations
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  // 코치 대화만 조회 (최근 순, 삭제 제외)
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('type', 'ai')
    .eq('ai_purpose', 'coach')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Coach Conversations GET] Error:', error);
    return NextResponse.json(
      { error: '대화 목록을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  // 각 대화의 마지막 메시지 조회
  const conversationIds = conversations.map((c) => c.id);
  let lastMessagesMap: Record<string, DbChatMessage> = {};

  if (conversationIds.length > 0) {
    // 각 대화별 최신 메시지 1개씩 조회
    const { data: lastMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (lastMessages) {
      // 각 대화별 첫 번째(최신) 메시지만 유지
      for (const msg of lastMessages as DbChatMessage[]) {
        if (!lastMessagesMap[msg.conversation_id]) {
          lastMessagesMap[msg.conversation_id] = msg;
        }
      }
    }
  }

  // 활성 대화 ID 찾기
  const activeConversation = conversations.find((c) => c.ai_status === 'active');

  // 응답 구성
  const items: CoachConversationListItem[] = (conversations as DbCoachConversation[]).map((conv) => ({
    conversation: transformDbCoachConversation(conv),
    lastMessage: lastMessagesMap[conv.id]
      ? transformDbMessage(lastMessagesMap[conv.id])
      : undefined,
    hasActivePurpose: !!conv.metadata?.activePurpose,
  }));

  const response: CoachConversationsResponse = {
    conversations: items,
    activeConversationId: activeConversation?.id,
  };

  return NextResponse.json(response);
});

// ============================================================================
// POST /api/coach/conversations
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  let body = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const validation = CreateConversationSchema.safeParse(body);
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

  const { activePurpose } = validation.data;

  // 기존 활성 코치 세션 자동 완료 처리
  const { error: completeError } = await supabase
    .from('conversations')
    .update({
      ai_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('type', 'ai')
    .eq('ai_purpose', 'coach')
    .eq('ai_status', 'active')
    .is('deleted_at', null);

  if (completeError) {
    console.error('[Coach POST] Complete existing error:', completeError);
    return NextResponse.json(
      { error: '기존 세션 종료에 실패했습니다.', code: 'SESSION_CLEANUP_FAILED' },
      { status: 500 }
    );
  }

  // 메타데이터 구성
  const metadata = activePurpose
    ? {
        activePurpose: {
          ...activePurpose,
          startedAt: activePurpose.startedAt || new Date().toISOString(),
        },
        messageCount: 0,
      }
    : { messageCount: 0 };

  // 새 코치 대화 생성
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'ai',
      ai_purpose: 'coach',
      ai_status: 'active',
      ai_result_applied: false,
      metadata,
    })
    .select()
    .single();

  if (convError) {
    console.error('[Coach POST] Error:', convError);
    return NextResponse.json(
      { error: '대화 생성에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  // 참여자 추가
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversation.id,
      role: 'owner',
    });

  if (participantError) {
    console.error('[Coach POST] Participant Error:', participantError);
    await supabase.from('conversations').delete().eq('id', conversation.id);
    return NextResponse.json(
      { error: '참여자 추가에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    transformDbCoachConversation(conversation as DbCoachConversation),
    { status: 201 }
  );
});
