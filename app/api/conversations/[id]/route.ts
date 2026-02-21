import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, transformDbConversation } from '@/lib/types/chat';
import { getConversationOr404 } from '@/app/api/_shared/conversation-repo';
import { jsonError, parseJsonBody, validateBody } from '@/app/api/_shared/route-helpers';

const ConversationUpdateSchema = z.object({
  title: z.string().optional(),
  aiResultApplied: z.boolean().optional(),
});

export const GET = withAuth(async (_request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const found = await getConversationOr404<DbConversation>(supabase, { id });
  if (!found.ok) {
    return found.response;
  }

  return NextResponse.json(transformDbConversation(found.conversation));
});

export const PATCH = withAuth(async (request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const validated = validateBody(ConversationUpdateSchema, parsed.data);
  if (!validated.ok) {
    return validated.response;
  }

  const { title, aiResultApplied } = validated.data;
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (aiResultApplied !== undefined) {
    updateData.ai_result_applied = aiResultApplied;
    if (aiResultApplied) {
      updateData.ai_result_applied_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Conversation PATCH] Error:', error);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '대화 업데이트에 실패했습니다.',
    });
  }

  return NextResponse.json(transformDbConversation(data as DbConversation));
});

export const DELETE = withAuth(async (_request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const { error } = await supabase
    .from('conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[Conversation DELETE] Error:', error);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '대화 삭제에 실패했습니다.',
    });
  }

  return NextResponse.json({ success: true });
});
