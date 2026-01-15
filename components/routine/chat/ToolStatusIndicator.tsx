'use client';

import { AIToolStatus, AIToolName } from '@/lib/types/fitness';
import { AI_TOOL_LABELS } from '@/lib/types/fitness';
import { Loader2, Check, X } from 'lucide-react';

interface ToolStatusIndicatorProps {
  /** 도구 상태 목록 */
  tools: AIToolStatus[];
}

/**
 * 에러 메시지를 짧게 변환
 */
function getShortErrorMessage(toolName: AIToolName, error?: string): string {
  if (error?.includes('not found') || error?.includes('없') || error?.includes('null')) {
    return '없음';
  }
  if (error?.includes('fetch') || error?.includes('network')) {
    return '연결 실패';
  }
  return '오류';
}

/**
 * 도구 이름의 짧은 레이블
 */
function getShortToolLabel(toolName: AIToolName): string {
  const labels: Partial<Record<AIToolName, string>> = {
    get_user_basic_info: '기본정보',
    get_user_military_info: '군정보',
    get_user_body_metrics: '신체정보',
    get_latest_inbody: '인바디',
    get_inbody_history: '인바디이력',
    get_fitness_profile: '피트니스',
    update_fitness_profile: '프로필저장',
    get_current_routine: '현재루틴',
    save_routine_draft: '루틴저장',
  };
  return labels[toolName] || AI_TOOL_LABELS[toolName] || toolName;
}

/**
 * AI 도구 실행 상태 표시 (미니멀 인라인)
 *
 * - 작은 폰트, 박스 없음
 * - 애니메이션 없음
 * - 결과 영구 표시
 */
export default function ToolStatusIndicator({ tools }: ToolStatusIndicatorProps) {
  if (tools.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
      {tools.map((tool) => (
        <span key={tool.toolCallId} className="inline-flex items-center gap-1">
          {/* 상태 아이콘 */}
          {tool.status === 'running' && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {tool.status === 'completed' && (
            <Check className="w-3 h-3 text-success/70" />
          )}
          {tool.status === 'error' && (
            <X className="w-3 h-3 text-amber-500/70" />
          )}

          {/* 도구명 + 결과 */}
          <span>
            {getShortToolLabel(tool.name)}
            {tool.status === 'error' && (
              <span className="text-amber-500/70 ml-0.5">
                ({getShortErrorMessage(tool.name, tool.error)})
              </span>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
