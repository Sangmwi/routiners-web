import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, transformDbConversation } from '@/lib/types/chat';
import { internalError, validateRequest } from '@/lib/utils/apiResponse';

const ConversationCreateSchema = z.object({
  type: z.enum(['ai', 'direct', 'group']),
  title: z.string().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
});

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
    return internalError('대화 목록 조회에 실패했습니다.');
  }

  const conversations = (data as DbConversation[]).map(transformDbConversation);
  return NextResponse.json(conversations);
});

export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await validateRequest(request, ConversationCreateSchema);
  if (!result.success) return result.response;

  const { type, title } = result.data;

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
    return internalError('대화 생성에 실패했습니다.');
  }

  const conv = conversation as DbConversation;
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conv.id,
      role: 'owner',
    });

  if (participantError) {
    console.error('[Conversations POST] Participant Error:', participantError);
    await supabase.from('conversations').delete().eq('id', conv.id);
    return internalError('참여자 추가에 실패했습니다.');
  }

  return NextResponse.json(transformDbConversation(conv), { status: 201 });
});
