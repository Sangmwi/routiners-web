import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import { ensureAICounselorConversation } from '@/app/api/_shared/conversation-repo';
import { jsonError, parseJsonBody, validateBody } from '@/app/api/_shared/route-helpers';

const SystemMessageSchema = z.object({
  content: z.string().min(1, '메시지 내용이 필요합니다.'),
  metadata: z.record(z.unknown()).optional(),
});

export const POST = withAuth(async (request: NextRequest, { supabase, params }) => {
  const { id: conversationId } = await params;

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const validated = validateBody(SystemMessageSchema, parsed.data);
  if (!validated.ok) {
    return validated.response;
  }

  const found = await ensureAICounselorConversation(supabase, conversationId, 'id');
  if (!found.ok) {
    return found.response;
  }

  const { content, metadata } = validated.data;
  const { error: insertError } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content,
    content_type: 'system_log',
    metadata: metadata || null,
  });

  if (insertError) {
    console.error('[System Message API] Insert Error:', insertError);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '시스템 메시지 추가에 실패했습니다.',
    });
  }

  return NextResponse.json({ success: true });
});
