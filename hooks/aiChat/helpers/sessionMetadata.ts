/**
 * Session Metadata Helpers
 *
 * AISessionCompat.metadata에서 타입 안전하게 데이터를 추출하는 유틸리티
 * Phase K: 4회 반복되는 unsafe cast 제거
 */

import type {
  AISessionMetadata,
  ProfileConfirmationRequest,
  AppliedRoutineMetadata,
} from '@/lib/types/chat';
import type { RoutinePreviewData, InputRequest } from '@/lib/types/fitness';

// =============================================================================
// Types
// =============================================================================

/**
 * 세션 메타데이터에서 추출된 상태들
 * useAIChat의 상태 복원에 사용
 */
export interface ExtractedSessionMetadata {
  /** 대기 중인 루틴 미리보기 */
  pendingRoutinePreview: RoutinePreviewData | null;
  /** 적용된 루틴 정보 */
  appliedRoutine: AppliedRoutineMetadata | null;
  /** 대기 중인 프로필 확인 요청 */
  pendingProfileConfirmation: ProfileConfirmationRequest | null;
  /** 대기 중인 입력 요청 */
  pendingInput: InputRequest | null;
}

// =============================================================================
// Type Guards
// =============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRoutinePreviewData(value: unknown): value is RoutinePreviewData {
  return isObject(value) && typeof value.id === 'string' && typeof value.title === 'string';
}

function isAppliedRoutineMetadata(value: unknown): value is AppliedRoutineMetadata {
  return (
    isObject(value) &&
    typeof value.previewId === 'string' &&
    typeof value.eventsCreated === 'number' &&
    typeof value.startDate === 'string'
  );
}

function isProfileConfirmationRequest(value: unknown): value is ProfileConfirmationRequest {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    Array.isArray(value.fields)
  );
}

function isInputRequest(value: unknown): value is InputRequest {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string'
  );
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * 세션 메타데이터에서 상태 데이터를 타입 안전하게 추출
 *
 * @param metadata - AISessionCompat.metadata (unknown 타입일 수 있음)
 * @returns 추출된 메타데이터 (null 값은 명시적으로 null)
 *
 * @example
 * ```ts
 * const extracted = extractSessionMetadata(session.metadata);
 * setState({
 *   pendingRoutinePreview: extracted.pendingRoutinePreview,
 *   appliedRoutine: extracted.appliedRoutine,
 *   // ...
 * });
 * ```
 */
export function extractSessionMetadata(
  metadata: AISessionMetadata | Record<string, unknown> | null | undefined
): ExtractedSessionMetadata {
  // null 또는 undefined인 경우
  if (!metadata || !isObject(metadata)) {
    return {
      pendingRoutinePreview: null,
      appliedRoutine: null,
      pendingProfileConfirmation: null,
      pendingInput: null,
    };
  }

  // 각 필드를 타입 가드로 안전하게 추출
  return {
    pendingRoutinePreview: isRoutinePreviewData(metadata.pending_preview)
      ? metadata.pending_preview
      : null,
    appliedRoutine: isAppliedRoutineMetadata(metadata.applied_routine)
      ? metadata.applied_routine
      : null,
    pendingProfileConfirmation: isProfileConfirmationRequest(metadata.pending_profile_confirmation)
      ? metadata.pending_profile_confirmation
      : null,
    pendingInput: isInputRequest(metadata.pending_input)
      ? metadata.pending_input
      : null,
  };
}
