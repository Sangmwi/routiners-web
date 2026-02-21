import { jsonError } from './route-helpers';

type ConversationType = 'ai' | 'direct' | 'group' | string;

interface ConversationQuery {
  select: (columns: string) => ConversationQuery;
  eq: (column: string, value: unknown) => ConversationQuery;
  is: (column: string, value: unknown) => ConversationQuery;
  single: () => Promise<{
    data: unknown;
    error: { code?: string } | null;
  }>;
}

interface ConversationClient {
  from: (table: 'conversations') => ConversationQuery;
}

interface GetConversationOptions {
  id: string;
  select?: string;
  type?: ConversationType;
}

export async function getConversationOr404<TConversation = unknown>(
  supabase: unknown,
  { id, select = '*', type }: GetConversationOptions,
) {
  const conversationClient = supabase as ConversationClient;

  let query = conversationClient
    .from('conversations')
    .select(select)
    .eq('id', id)
    .is('deleted_at', null);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        ok: false as const,
        response: jsonError({
          status: 404,
          code: 'NOT_FOUND',
          error: '대화를 찾을 수 없습니다.',
        }),
      };
    }

    return {
      ok: false as const,
      response: jsonError({
        status: 500,
        code: 'DATABASE_ERROR',
        error: '대화 조회에 실패했습니다.',
      }),
    };
  }

  return {
    ok: true as const,
    conversation: data as TConversation,
  };
}

export async function ensureAICounselorConversation<TConversation = unknown>(
  supabase: unknown,
  id: string,
  select = '*',
) {
  return getConversationOr404<TConversation>(supabase, {
    id,
    select,
    type: 'ai',
  });
}
