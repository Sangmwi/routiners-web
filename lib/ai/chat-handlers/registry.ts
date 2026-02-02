/**
 * Tool Handler Registry
 *
 * Phase 21-E: OCP 준수를 위한 핸들러 레지스트리
 * - 새 도구 추가 시 switch문 수정 불필요
 * - 각 핸들러 파일에서 자동 등록
 */

import type { z } from 'zod';
import type { AIToolName } from '@/lib/types/fitness';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';

/**
 * 핸들러 함수 타입
 */
export type ToolHandler<TArgs = unknown> = (
  fc: FunctionCallInfo,
  args: TArgs,
  ctx: ToolHandlerContext
) => Promise<ToolHandlerResult>;

/**
 * 등록된 핸들러 정보
 */
interface RegisteredHandler<TArgs = unknown> {
  schema: z.ZodSchema<TArgs>;
  handler: ToolHandler<TArgs>;
}

/**
 * 검증 실패 결과 생성
 */
function createValidationError(toolName: string, error: string): ToolHandlerResult {
  return {
    toolResult: JSON.stringify({
      success: false,
      error: `[${toolName}] 인자 검증 실패: ${error}`,
    }),
    continueLoop: true,
  };
}

/**
 * Tool Handler Registry
 *
 * OCP(Open-Closed Principle) 준수:
 * - 확장에는 열려있음: register()로 새 핸들러 추가
 * - 수정에는 닫혀있음: 기존 코드 변경 없이 확장
 */
class ToolHandlerRegistry {
  private handlers = new Map<AIToolName, RegisteredHandler>();

  /**
   * 핸들러 등록
   */
  register<TArgs>(
    name: AIToolName,
    schema: z.ZodSchema<TArgs>,
    handler: ToolHandler<TArgs>
  ): void {
    this.handlers.set(name, { schema, handler } as RegisteredHandler);
  }

  /**
   * 핸들러 실행 (Zod 검증 포함)
   *
   * @returns 처리 결과 또는 null (미등록 핸들러)
   */
  async execute(
    name: AIToolName,
    fc: FunctionCallInfo,
    args: Record<string, unknown>,
    ctx: ToolHandlerContext
  ): Promise<ToolHandlerResult | null> {
    const registered = this.handlers.get(name);
    if (!registered) return null;

    // Zod 스키마로 검증
    const parsed = registered.schema.safeParse(args);
    if (!parsed.success) {
      return createValidationError(name, parsed.error.message);
    }

    // 핸들러 실행
    return registered.handler(fc, parsed.data, ctx);
  }

  /**
   * 핸들러 등록 여부 확인
   */
  has(name: AIToolName): boolean {
    return this.handlers.has(name);
  }

  /**
   * 등록된 모든 도구 이름 반환
   */
  getRegisteredTools(): AIToolName[] {
    return Array.from(this.handlers.keys());
  }
}

/** 싱글톤 레지스트리 인스턴스 */
export const toolRegistry = new ToolHandlerRegistry();
