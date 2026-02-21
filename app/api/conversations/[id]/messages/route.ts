import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import { DbChatMessage, transformDbMessage } from '@/lib/types/chat';
import { getConversationOr404 } from '@/app/api/_shared/conversation-repo';
import { jsonError, parseJsonBody, validateBody } from '@/app/api/_shared/route-helpers';

const MessageCreateSchema = z.object({
  content: z.string().min(1, '메시지를 입력해주세요.'),
  contentType: z
    .enum(['text', 'image', 'file', 'audio', 'video', 'location', 'call'])
    .default('text'),
  mediaUrl: z.string().url().optional(),
  replyToId: z.string().uuid().optional(),
});

export const GET = withAuth(async (request: NextRequest, { supabase, params }) => {
  const { id: conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const cursor = searchParams.get('cursor');

  const found = await getConversationOr404(supabase, {
    id: conversationId,
    select: 'id',
  });
  if (!found.ok) {
    return found.response;
  }

  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Messages GET] Error:', error);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '메시지 목록 조회에 실패했습니다.',
    });
  }

  const messages = data as DbChatMessage[];
  const hasMore = messages.length > limit;
  const resultMessages = hasMore ? messages.slice(0, limit) : messages;
  const sortedMessages = resultMessages.reverse().map(transformDbMessage);

  return NextResponse.json({
    messages: sortedMessages,
    hasMore,
    nextCursor: hasMore ? resultMessages[resultMessages.length - 1].created_at : undefined,
  });
});

export const POST = withAuth(async (request: NextRequest, { supabase, params }) => {
  const { id: conversationId } = await params;

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const validated = validateBody(MessageCreateSchema, parsed.data);
  if (!validated.ok) {
    return validated.response;
  }

  const { content, contentType, mediaUrl, replyToId } = validated.data;

  const found = await getConversationOr404(supabase, {
    id: conversationId,
    select: 'id',
  });
  if (!found.ok) {
    return found.response;
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content,
      content_type: contentType,
      media_url: mediaUrl || null,
      reply_to_id: replyToId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Messages POST] Error:', error);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '메시지 전송에 실패했습니다.',
    });
  }

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return NextResponse.json(transformDbMessage(data as DbChatMessage), { status: 201 });
});
