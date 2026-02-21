import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import {
  CounselorConversationMetadata,
  DbCounselorConversation,
  transformDbCounselorConversation,
} from '@/lib/types/counselor';
import { ensureAICounselorConversation } from '@/app/api/_shared/conversation-repo';
import { jsonError, parseJsonBody, validateBody } from '@/app/api/_shared/route-helpers';

const ActivePurposeSchema = z.object({
  activePurpose: z
    .object({
      type: z.enum(['routine_generation', 'routine_modification', 'quick_routine']),
      stage: z.enum(['init', 'collecting_info', 'generating', 'reviewing', 'applying']),
      collectedData: z.record(z.unknown()).default({}),
      startedAt: z.string().optional(),
    })
    .nullable(),
});

export const GET = withAuth(async (_request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const found = await ensureAICounselorConversation<{ metadata: CounselorConversationMetadata | null }>(
    supabase,
    id,
    'metadata',
  );
  if (!found.ok) {
    return found.response;
  }

  return NextResponse.json({
    activePurpose: found.conversation.metadata?.activePurpose ?? null,
  });
});

export const POST = withAuth(async (request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const validated = validateBody(ActivePurposeSchema, parsed.data);
  if (!validated.ok) {
    return validated.response;
  }

  const current = await ensureAICounselorConversation<{ metadata: CounselorConversationMetadata | null }>(
    supabase,
    id,
    'metadata',
  );
  if (!current.ok) {
    return current.response;
  }

  const { activePurpose } = validated.data;
  const currentMetadata = current.conversation.metadata || {};
  const newMetadata: CounselorConversationMetadata = {
    ...currentMetadata,
    activePurpose: activePurpose
      ? {
          ...activePurpose,
          startedAt: activePurpose.startedAt || new Date().toISOString(),
        }
      : null,
  };

  const { data: updated, error: updateError } = await supabase
    .from('conversations')
    .update({
      metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[Counselor Purpose POST] Update Error:', updateError);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '목적 업데이트에 실패했습니다.',
    });
  }

  return NextResponse.json(
    transformDbCounselorConversation(updated as DbCounselorConversation),
  );
});

export const DELETE = withAuth(async (_request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const current = await ensureAICounselorConversation<{ metadata: CounselorConversationMetadata | null }>(
    supabase,
    id,
    'metadata',
  );
  if (!current.ok) {
    return current.response;
  }

  const currentMetadata =
    (current.conversation.metadata as CounselorConversationMetadata & {
      pending_preview?: unknown;
    }) || {};
  const restMetadata = { ...currentMetadata };
  delete restMetadata.activePurpose;
  delete restMetadata.pending_preview;

  const { data: updated, error: updateError } = await supabase
    .from('conversations')
    .update({
      metadata: { ...restMetadata, activePurpose: null, pending_preview: null },
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[Counselor Purpose DELETE] Update Error:', updateError);
    return jsonError({
      status: 500,
      code: 'DATABASE_ERROR',
      error: '목적 삭제에 실패했습니다.',
    });
  }

  return NextResponse.json(
    transformDbCounselorConversation(updated as DbCounselorConversation),
  );
});
