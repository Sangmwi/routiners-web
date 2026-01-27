/**
 * Metadata Manager
 *
 * Conversation metadata CRUD 작업 추상화
 * 중복되는 metadata 읽기-수정-쓰기 패턴을 통합
 *
 * Active Purpose 관리:
 * - setActivePurpose() / clearActivePurpose()
 * - updateActivePurposeStage()
 *
 * Preview 관리:
 * - setPendingPreview() / clearPendingPreview()
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { ConversationMetadata } from './types';
import type { ActivePurpose, ActivePurposeType, RoutineGenerationStage } from '@/lib/types/coach';
import type { RoutinePreviewData } from '@/lib/types/fitness';

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
 * (pending_preview → applied_routine)
 */
export async function transitionToApplied(
  supabase: SupabaseClient,
  conversationId: string,
  pendingKey: 'pending_preview',
  appliedKey: 'applied_routine',
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

// ============================================================================
// Active Purpose Management
// ============================================================================

/**
 * 활성 목적 설정
 *
 * 구조화된 프로세스 시작 시 호출
 * @param supabase - Supabase 클라이언트
 * @param conversationId - 대화 ID
 * @param purposeType - 목적 타입 ('routine_generation')
 * @param initialData - 초기 수집 데이터 (선택사항)
 */
export async function setActivePurpose(
  supabase: SupabaseClient,
  conversationId: string,
  purposeType: ActivePurposeType,
  initialData: Record<string, unknown> = {}
): Promise<{ error: Error | null }> {
  const activePurpose: ActivePurpose = {
    type: purposeType,
    stage: 'init',
    collectedData: initialData,
    startedAt: new Date().toISOString(),
  };

  return updateMetadata(supabase, conversationId, { activePurpose });
}

/**
 * 활성 목적 단계 업데이트
 *
 * @param supabase - Supabase 클라이언트
 * @param conversationId - 대화 ID
 * @param stage - 새 단계
 * @param additionalData - 추가 수집 데이터 (기존 데이터에 병합)
 */
export async function updateActivePurposeStage(
  supabase: SupabaseClient,
  conversationId: string,
  stage: RoutineGenerationStage,
  additionalData?: Record<string, unknown>
): Promise<{ error: Error | null }> {
  const existing = await getMetadata(supabase, conversationId);
  const currentPurpose = existing.activePurpose as ActivePurpose | undefined;

  if (!currentPurpose) {
    return { error: new Error('활성 목적이 설정되지 않았습니다.') };
  }

  const updatedPurpose: ActivePurpose = {
    ...currentPurpose,
    stage,
    collectedData: additionalData
      ? { ...currentPurpose.collectedData, ...additionalData }
      : currentPurpose.collectedData,
  };

  return updateMetadata(supabase, conversationId, { activePurpose: updatedPurpose });
}

/**
 * 활성 목적 해제
 *
 * 프로세스 완료 또는 취소 시 호출
 */
export async function clearActivePurpose(
  supabase: SupabaseClient,
  conversationId: string
): Promise<{ error: Error | null }> {
  return updateMetadata(supabase, conversationId, { activePurpose: null });
}

/**
 * 현재 활성 목적 조회
 */
export async function getActivePurpose(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ActivePurpose | null> {
  const metadata = await getMetadata(supabase, conversationId);
  return (metadata.activePurpose as ActivePurpose) ?? null;
}

// ============================================================================
// Preview Management
// ============================================================================

/**
 * 대기 중인 루틴 미리보기 설정
 */
export async function setPendingPreview(
  supabase: SupabaseClient,
  conversationId: string,
  preview: RoutinePreviewData
): Promise<{ error: Error | null }> {
  return updateMetadata(supabase, conversationId, { pending_preview: preview });
}

/**
 * 대기 중인 루틴 미리보기 해제
 */
export async function clearPendingPreview(
  supabase: SupabaseClient,
  conversationId: string
): Promise<{ error: Error | null }> {
  const existing = await getMetadata(supabase, conversationId);
  const { pending_preview: _, ...rest } = existing;

  const { error } = await supabase
    .from('conversations')
    .update({ metadata: rest })
    .eq('id', conversationId);

  if (error) {
    console.error('[MetadataManager] Clear preview failed:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * 대기 중인 루틴 미리보기 조회
 */
export async function getPendingPreview(
  supabase: SupabaseClient,
  conversationId: string
): Promise<RoutinePreviewData | null> {
  const metadata = await getMetadata(supabase, conversationId);
  return (metadata.pending_preview as RoutinePreviewData) ?? null;
}
