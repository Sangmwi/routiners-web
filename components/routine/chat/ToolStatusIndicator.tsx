'use client';

import type { AIToolStatus, AIToolName, AIToolErrorType } from '@/lib/types/fitness';
import { AI_TOOL_LABELS } from '@/lib/types/fitness';
import { CheckIcon, XIcon, InfoIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';

// =============================================================================
// 도구 레이블
// =============================================================================

/** 개별 도구의 짧은 레이블 */
const SHORT_TOOL_LABELS: Partial<Record<AIToolName, string>> = {
  get_user_basic_info: '기본정보',
  get_user_military_info: '군정보',
  get_user_body_metrics: '신체정보',
  get_latest_inbody: '인바디',
  get_inbody_history: '인바디이력',
  get_fitness_profile: '피트니스',
  get_current_routine: '현재루틴',
  get_dietary_profile: '식단프로필',
  update_fitness_profile: '프로필저장',
  update_dietary_profile: '식단프로필저장',
  calculate_daily_needs: '영양계산',
  save_routine_draft: '루틴저장',
  generate_routine_preview: '미리보기생성',
  apply_routine: '루틴적용',
  add_exercise_to_workout: '운동추가',
  remove_exercise_from_workout: '운동삭제',
  reorder_workout_exercises: '순서변경',
  update_exercise_sets: '세트수정',
  generate_meal_plan_preview: '식단미리보기',
  apply_meal_plan: '식단적용',
};

function getShortToolLabel(toolName: AIToolName): string {
  return SHORT_TOOL_LABELS[toolName] || AI_TOOL_LABELS[toolName] || toolName;
}

// =============================================================================
// 에러 유형별 메시지 및 스타일
// =============================================================================

/** 에러 유형별 짧은 안내 메시지 */
const ERROR_TYPE_MESSAGES: Record<AIToolErrorType, string> = {
  missing_data: '정보 필요',
  not_found: '없음',
  system: '오류',
};

/** 에러 메시지 기반 폴백 분류 (errorType 없을 때) */
function getShortErrorMessage(error?: string): string {
  if (error?.includes('not found') || error?.includes('없') || error?.includes('null')) {
    return '없음';
  }
  if (error?.includes('fetch') || error?.includes('network')) {
    return '연결 실패';
  }
  return '오류';
}

/** errorType 기반 또는 에러 메시지 폴백으로 표시 텍스트 결정 */
function getErrorDisplayText(tool: AIToolStatus): string {
  if (tool.errorType) return ERROR_TYPE_MESSAGES[tool.errorType];
  return getShortErrorMessage(tool.error);
}

/** 시스템 오류인지 여부 (주황 경고 표시 대상) */
function isSystemError(tool: AIToolStatus): boolean {
  if (tool.errorType) return tool.errorType === 'system';
  // errorType 없는 경우 에러 메시지 패턴으로 폴백 판단
  const err = tool.error ?? '';
  return !(/찾을 수 없|없는 |기록이 없|not found|null|필요한 정보/.test(err));
}

// =============================================================================
// Component
// =============================================================================

interface ToolStatusIndicatorProps {
  /** 도구 상태 목록 */
  tools: AIToolStatus[];
}

/**
 * AI 도구 실행 상태 표시 (미니멀 인라인)
 *
 * - 짧은 레이블로 전체 표시
 * - 줄바꿈 허용 (잘림 방지)
 * - 개수 제한 없음
 * - 에러 유형 구분: 데이터 누락/없음은 안내, 시스템 오류는 경고
 */
export default function ToolStatusIndicator({ tools }: ToolStatusIndicatorProps) {
  if (tools.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-hint-strong">
      {tools.map((tool) => {
        const isError = tool.status === 'error';
        const isSysError = isError && isSystemError(tool);

        return (
          <span key={tool.toolCallId} className="inline-flex items-center gap-1">
            {/* 상태 아이콘 */}
            {tool.status === 'running' && (
              <LoadingSpinner size="xs" variant="current" />
            )}
            {tool.status === 'completed' && (
              <CheckIcon size={12} className="text-success/70" />
            )}
            {isError && isSysError && (
              <XIcon size={12} className="text-amber-500/70" />
            )}
            {isError && !isSysError && (
              <InfoIcon size={12} className="text-hint" />
            )}

            {/* 도구명 + 에러 */}
            <span>
              {getShortToolLabel(tool.name)}
              {isError && (
                <span className={`ml-0.5 ${isSysError ? 'text-amber-500/70' : 'text-hint'}`}>
                  ({getErrorDisplayText(tool)})
                </span>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
