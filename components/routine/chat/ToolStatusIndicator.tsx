'use client';

import { AIToolStatus, AIToolName } from '@/lib/types/fitness';
import { AI_TOOL_LABELS } from '@/lib/types/fitness';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface ToolStatusIndicatorProps {
  /** 현재 실행 중인 도구 상태 목록 */
  activeTools: AIToolStatus[];
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
function getErrorMessage(toolName: AIToolName, error?: string): string {
  // 서버/네트워크 에러
  if (error?.includes('fetch') || error?.includes('network') || error?.includes('timeout')) {
    return '서버 연결 오류';
  }

  // 권한 에러
  if (error?.includes('unauthorized') || error?.includes('permission') || error?.includes('403')) {
    return '접근 권한 없음';
  }

  // 데이터 없음 에러 (도구별 맞춤 메시지)
  if (error?.includes('not found') || error?.includes('없') || error?.includes('null')) {
    switch (toolName) {
      case 'get_user_basic_info':
        return '기본 정보 미등록';
      case 'get_user_military_info':
        return '군 정보 미등록';
      case 'get_user_body_metrics':
        return '신체 정보 미등록';
      case 'get_latest_inbody':
      case 'get_inbody_history':
        return '인바디 기록 없음';
      case 'get_fitness_goal':
        return '운동 목표 미설정';
      case 'get_experience_level':
        return '운동 경험 미설정';
      case 'get_training_preferences':
        return '운동 선호도 미설정';
      case 'get_injuries_restrictions':
        return '부상/제한 정보 없음';
      case 'get_current_routine':
        return '현재 루틴 없음';
      default:
        return '정보 없음';
    }
  }

  // 기본 에러 메시지
  return error || '처리 중 오류 발생';
}

/**
 * 도구 이름의 동작형 레이블 (진행 중 상태용)
 */
function getToolActionLabel(toolName: AIToolName): string {
  const labels: Partial<Record<AIToolName, string>> = {
    get_user_basic_info: '기본 정보 확인',
    get_user_military_info: '군 정보 확인',
    get_user_body_metrics: '신체 정보 확인',
    get_latest_inbody: '최근 인바디 확인',
    get_inbody_history: '인바디 이력 확인',
    get_fitness_goal: '운동 목표 확인',
    get_experience_level: '운동 경험 확인',
    get_training_preferences: '운동 선호도 확인',
    get_injuries_restrictions: '부상/제한 사항 확인',
    update_fitness_profile: '프로필 업데이트',
    get_current_routine: '현재 루틴 확인',
    save_routine_draft: '루틴 초안 저장',
  };
  return labels[toolName] || AI_TOOL_LABELS[toolName] || toolName;
}

/**
 * AI 도구 실행 상태 표시 컴포넌트
 *
 * AI가 사용자 정보를 조회하거나 데이터를 저장할 때
 * 로딩 상태를 사용자에게 보여줍니다.
 *
 * 애니메이션: fade-in으로 부드럽게 등장
 */
export default function ToolStatusIndicator({ activeTools }: ToolStatusIndicatorProps) {
  if (activeTools.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 bg-muted/30 rounded-xl border border-border/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {activeTools.map((tool, index) => (
        <div
          key={tool.toolCallId}
          className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-300"
          style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
        >
          {/* 상태 아이콘 */}
          {tool.status === 'running' && (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
          )}
          {tool.status === 'completed' && (
            <Check className="w-4 h-4 shrink-0 text-green-500 animate-in zoom-in duration-200" />
          )}
          {tool.status === 'error' && (
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          )}

          {/* 도구 이름 + 상태 */}
          <span
            className={`
              transition-colors duration-200
              ${tool.status === 'running' ? 'text-muted-foreground' : ''}
              ${tool.status === 'completed' ? 'text-foreground/70' : ''}
              ${tool.status === 'error' ? 'text-amber-600' : ''}
            `}
          >
            {getToolActionLabel(tool.name)}
            {tool.status === 'running' && ' 중...'}
            {tool.status === 'completed' && ' 완료'}
            {tool.status === 'error' && (
              <span className="text-xs ml-1 text-amber-500">
                ({getErrorMessage(tool.name, tool.error)})
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
