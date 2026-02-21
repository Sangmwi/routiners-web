import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import {
  CounselorConversationListItem,
  CounselorConversationsResponse,
  DbCounselorConversation,
  transformDbCounselorConversation,
} from '@/lib/types/counselor';
import { DbChatMessage, transformDbMessage } from '@/lib/types/chat';
import { jsonError, parseJsonBody, validateBody } from '@/app/api/_shared/route-helpers';

const CreateConversationSchema = z.object({
  activePurpose: z
    .object({
      type: z.enum(['routine_generation', 'routine_modification', 'quick_routine']),
      stage: z.enum(['init', 'collecting_info', 'generating', 'reviewing', 'applying']),
      collectedData: z.record(z.unknown()).default({}),
      startedAt: z.string().optional(),
    })
    .optional(),
});

export const GET = withAuth(async (_request: NextRequest, { supabase }) => {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('type', 'ai')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[CounselorConversations GET] Error:', error);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '상담 대화 목록 조회에 실패했습니다.',
    });
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const lastMessagesMap: Record<string, DbChatMessage> = {};

  if (conversationIds.length > 0) {
    const { data: lastMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (lastMessages) {
      for (const message of lastMessages as DbChatMessage[]) {
        if (!lastMessagesMap[message.conversation_id]) {
          lastMessagesMap[message.conversation_id] = message;
        }
      }
    }
  }

  const activeConversation = conversations[0];
  const items: CounselorConversationListItem[] = (
    conversations as DbCounselorConversation[]
  ).map((conversation) => ({
    conversation: transformDbCounselorConversation(conversation),
    lastMessage: lastMessagesMap[conversation.id]
      ? transformDbMessage(lastMessagesMap[conversation.id])
      : undefined,
    hasActivePurpose: !!conversation.metadata?.activePurpose,
  }));

  const response: CounselorConversationsResponse = {
    conversations: items,
    activeConversationId: activeConversation?.id,
  };

  return NextResponse.json(response);
});

export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const parsed = await parseJsonBody(request, { allowEmpty: true });
  if (!parsed.ok) {
    return parsed.response;
  }

  const validated = validateBody(CreateConversationSchema, parsed.data);
  if (!validated.ok) {
    return validated.response;
  }

  const { activePurpose } = validated.data;
  const metadata = activePurpose
    ? {
        activePurpose: {
          ...activePurpose,
          startedAt: activePurpose.startedAt || new Date().toISOString(),
        },
        messageCount: 0,
      }
    : { messageCount: 0 };

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'ai',
      ai_result_applied: false,
      metadata,
    })
    .select()
    .single();

  if (convError) {
    console.error('[Counselor POST] Create Error:', convError);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '상담 대화 생성에 실패했습니다.',
    });
  }

  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversation.id,
      role: 'owner',
    });

  if (participantError) {
    console.error('[Counselor POST] Participant Error:', participantError);
    await supabase.from('conversations').delete().eq('id', conversation.id);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '참여자 추가에 실패했습니다.',
    });
  }

  return NextResponse.json(
    transformDbCounselorConversation(conversation as DbCounselorConversation),
    { status: 201 },
  );
});
