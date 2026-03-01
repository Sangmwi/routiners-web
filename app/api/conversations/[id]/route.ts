import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, transformDbConversation } from '@/lib/types/chat';
import { getConversationOr404 } from '@/app/api/_shared/conversation-repo';
import { internalError, validateRequest } from '@/lib/utils/apiResponse';

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

  const result = await validateRequest(request, ConversationUpdateSchema);
  if (!result.success) return result.response;

  const { title, aiResultApplied } = result.data;
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
    return internalError('대화 업데이트에 실패했습니다.');
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
    return internalError('대화 삭제에 실패했습니다.');
  }

  return NextResponse.json({ success: true });
});
