import type { ToolExecutorContext } from '@/lib/ai/executors';
import type { ToolHandlerContext } from './types';

export function createToolExecutorContext(
  ctx: ToolHandlerContext
): ToolExecutorContext {
  return {
    userId: ctx.userId,
    supabase: ctx.supabase,
    conversationId: ctx.conversationId,
  };
}
