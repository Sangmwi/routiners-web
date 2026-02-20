/**
 * Tool Registry
 *
 * 확장 가능한 도구 레지스트리 시스템
 * - 도구 정의 등록 및 조회
 * - 목적/컨텍스트별 도구 필터링
 * - 타입 안전한 도구 핸들러 맵핑
 */

import type { AIToolName, AIToolResult } from '@/lib/types/fitness';
import type { ActivePurpose } from '@/lib/types/counselor';
import { AI_TRAINER_TOOLS, type AIToolDefinition } from './tools';

// ============================================================================
// Types
// ============================================================================

/**
 * 도구 실행 컨텍스트
 */
export interface ToolExecutionContext {
  userId: string;
  conversationId: string;
  activePurpose?: ActivePurpose | null;
}

/**
 * 도구 메타데이터 (확장용)
 */
export interface ToolMetadata {
  /** 이 도구가 필요로 하는 활성 목적 (없으면 항상 사용 가능) */
  requiresPurpose?: string[];
  /** 도구 카테고리 */
  category?: 'user_info' | 'fitness' | 'routine' | 'interaction' | 'general';
  /** 특별 처리 필요 여부 (API route에서 직접 처리) */
  specialHandling?: boolean;
}

/**
 * 확장된 도구 정의
 */
export interface ExtendedToolDefinition extends AIToolDefinition {
  metadata?: ToolMetadata;
}

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * 도구 레지스트리 (싱글톤 패턴)
 */
class ToolRegistry {
  private tools: Map<AIToolName, ExtendedToolDefinition> = new Map();

  constructor() {
    this.initializeDefaultTools();
  }

  /**
   * 기본 도구 초기화
   */
  private initializeDefaultTools(): void {
    // 기존 AI_TRAINER_TOOLS에서 도구 등록
    for (const tool of AI_TRAINER_TOOLS) {
      this.registerTool({
        ...tool,
        metadata: this.getToolMetadata(tool.name),
      });
    }
  }

  /**
   * 도구 메타데이터 생성
   */
  private getToolMetadata(name: AIToolName): ToolMetadata {
    const metadataMap: Partial<Record<AIToolName, ToolMetadata>> = {
      // 사용자 정보 도구
      get_user_basic_info: { category: 'user_info' },
      get_user_military_info: { category: 'user_info' },
      get_user_body_metrics: { category: 'user_info' },
      get_latest_inbody: { category: 'user_info' },
      get_inbody_history: { category: 'user_info' },

      // 피트니스 프로필 도구
      get_fitness_profile: { category: 'fitness' },
      update_fitness_profile: { category: 'fitness' },

      // 루틴 관련 도구
      get_current_routine: { category: 'routine' },
      save_routine_draft: { category: 'routine' },
      generate_routine_preview: { category: 'routine', specialHandling: true },
      apply_routine: { category: 'routine', specialHandling: true },

      // 사용자 상호작용 도구
      request_user_input: { category: 'interaction', specialHandling: true },
      confirm_profile_data: { category: 'interaction', specialHandling: true },

      // 프로세스 관리 도구
      set_active_purpose: { category: 'general', specialHandling: true },
      clear_active_purpose: { category: 'general', specialHandling: true },
    };

    return metadataMap[name] ?? { category: 'general' };
  }

  /**
   * 도구 등록
   */
  registerTool(tool: ExtendedToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 도구 조회
   */
  getTool(name: AIToolName): ExtendedToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * 모든 도구 목록 반환
   */
  getAllTools(): ExtendedToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * 컨텍스트에 따라 사용 가능한 도구 목록 반환
   *
   * @param context - 실행 컨텍스트 (선택사항)
   * @returns 사용 가능한 도구 정의 목록
   */
  getAvailableTools(context?: ToolExecutionContext): ExtendedToolDefinition[] {
    const allTools = this.getAllTools();

    // 컨텍스트가 없으면 모든 도구 반환
    if (!context) {
      return allTools;
    }

    // 활성 목적에 따른 필터링
    return allTools.filter((tool) => {
      const metadata = tool.metadata;

      // 특정 목적이 필요한 도구 체크
      if (metadata?.requiresPurpose?.length) {
        if (!context.activePurpose) return false;
        return metadata.requiresPurpose.includes(context.activePurpose.type);
      }

      return true;
    });
  }

  /**
   * 카테고리별 도구 목록 반환
   */
  getToolsByCategory(category: ToolMetadata['category']): ExtendedToolDefinition[] {
    return this.getAllTools().filter((tool) => tool.metadata?.category === category);
  }

  /**
   * 특별 처리가 필요한 도구인지 확인
   */
  requiresSpecialHandling(name: AIToolName): boolean {
    const tool = this.getTool(name);
    return tool?.metadata?.specialHandling ?? false;
  }

  /**
   * OpenAI API 포맷으로 도구 목록 변환
   */
  getToolsForOpenAI(context?: ToolExecutionContext): Array<{
    type: 'function';
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean | null;
  }> {
    const tools = this.getAvailableTools(context);

    return tools.map((tool) => ({
      type: 'function' as const,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters as Record<string, unknown>,
      strict: tool.strict ?? null,
    }));
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * 전역 도구 레지스트리 인스턴스
 */
export const toolRegistry = new ToolRegistry();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * 도구 정의 조회 (레거시 호환)
 */
export function getToolDefinition(name: AIToolName): ExtendedToolDefinition | undefined {
  return toolRegistry.getTool(name);
}

/**
 * 사용 가능한 도구 목록 조회
 */
export function getAvailableTools(context?: ToolExecutionContext): ExtendedToolDefinition[] {
  return toolRegistry.getAvailableTools(context);
}

/**
 * OpenAI API 포맷 도구 목록 조회
 */
export function getToolsForOpenAI(context?: ToolExecutionContext) {
  return toolRegistry.getToolsForOpenAI(context);
}

/**
 * 특별 처리 필요 여부 확인
 */
export function requiresSpecialHandling(name: AIToolName): boolean {
  return toolRegistry.requiresSpecialHandling(name);
}
