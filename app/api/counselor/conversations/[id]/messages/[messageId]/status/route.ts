import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import { ensureAICounselorConversation } from '@/app/api/_shared/conversation-repo';
import { jsonError, parseJsonBody, validateBody } from '@/app/api/_shared/route-helpers';

const StatusUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'edited',
    'applied',
    'cancelled',
    'submitted',
    'answered_via_text',
  ]),
  submittedValue: z.string().optional(),
});

export const PATCH = withAuth(async (request: NextRequest, { supabase, params }) => {
  const { id: conversationId, messageId } = await params;

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const validated = validateBody(StatusUpdateSchema, parsed.data);
  if (!validated.ok) {
    return validated.response;
  }

  const found = await ensureAICounselorConversation(supabase, conversationId, 'id');
  if (!found.ok) {
    return found.response;
  }

  const { data: message, error: msgError } = await supabase
    .from('chat_messages')
    .select('id, content_type, metadata')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .single();

  if (msgError || !message) {
    return jsonError({
      status: 404,
      code: 'NOT_FOUND',
      error: '메시지를 찾을 수 없습니다.',
    });
  }

  const validContentTypes = ['profile_confirmation', 'routine_preview', 'input_request'];
  if (!validContentTypes.includes(message.content_type)) {
    return jsonError({
      status: 400,
      code: 'BAD_REQUEST',
      error: '상태를 업데이트할 수 없는 메시지입니다.',
    });
  }

  const { status, submittedValue } = validated.data;
  const currentMetadata = (message.metadata as Record<string, unknown>) || {};
  const newMetadata = {
    ...currentMetadata,
    status,
    updatedAt: new Date().toISOString(),
    ...(submittedValue !== undefined ? { submittedValue } : {}),
  };

  const { error: updateError } = await supabase
    .from('chat_messages')
    .update({ metadata: newMetadata })
    .eq('id', messageId)
    .eq('conversation_id', conversationId);

  if (updateError) {
    console.error('[Message Status API] Update Error:', {
      error: updateError,
      messageId,
      conversationId,
      newMetadata,
    });
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '메시지 상태 업데이트에 실패했습니다.',
      details: updateError.message,
    });
  }

  return NextResponse.json({ success: true, status, messageId });
});
