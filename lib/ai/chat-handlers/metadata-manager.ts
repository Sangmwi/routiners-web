/**
 * Metadata Manager
 *
 * Conversation metadata CRUD 작업 추상화
 * 중복되는 metadata 읽기-수정-쓰기 패턴을 통합
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { ConversationMetadata } from './types';

/**
 * Conversation metadata 조회
 */
export async function getMetadata(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ConversationMetadata> {
  const { data } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  return (data?.metadata as ConversationMetadata) ?? {};
}

/**
 * Conversation metadata 업데이트 (기존 값 유지하며 병합)
 */
export async function updateMetadata(
  supabase: SupabaseClient,
  conversationId: string,
  updates: Partial<ConversationMetadata>
): Promise<{ error: Error | null }> {
  const existing = await getMetadata(supabase, conversationId);

  const { error } = await supabase
    .from('conversations')
    .update({
      metadata: {
        ...existing,
        ...updates,
      },
    })
    .eq('id', conversationId);

  if (error) {
    console.error('[MetadataManager] Update failed:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Conversation metadata에서 특정 키 삭제
 */
export async function clearMetadataKeys(
  supabase: SupabaseClient,
  conversationId: string,
  keys: (keyof ConversationMetadata)[]
): Promise<{ error: Error | null }> {
  const existing = await getMetadata(supabase, conversationId);

  const updated = { ...existing };
  for (const key of keys) {
    delete updated[key];
  }

  const { error } = await supabase
    .from('conversations')
    .update({ metadata: updated })
    .eq('id', conversationId);

  if (error) {
    console.error('[MetadataManager] Clear keys failed:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Pending state 업데이트 후 applied state로 전환
 * (pending_preview → applied_routine 등)
 */
export async function transitionToApplied(
  supabase: SupabaseClient,
  conversationId: string,
  pendingKey: 'pending_preview' | 'pending_meal_preview',
  appliedKey: 'applied_routine' | 'applied_meal_plan',
  appliedData: {
    previewId: string;
    eventsCreated: number;
    startDate: string;
  }
): Promise<{ error: Error | null }> {
  const existing = await getMetadata(supabase, conversationId);

  const { [pendingKey]: _removed, ...rest } = existing;

  const { error } = await supabase
    .from('conversations')
    .update({
      metadata: {
        ...rest,
        [appliedKey]: appliedData,
      },
    })
    .eq('id', conversationId);

  if (error) {
    console.error('[MetadataManager] Transition failed:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}
