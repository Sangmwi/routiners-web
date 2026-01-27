/**
 * Shared Executors
 *
 * InBody 기록, 현재 루틴 등 공통 도구
 */

import type { AIToolResult } from '@/lib/types';
import { toInBodyRecord, DbInBodyRecord, InBodyRecord } from '@/lib/types/inbody';
import type { ToolExecutorContext } from './types';

// ============================================================================
// Executors
// ============================================================================

/**
 * get_latest_inbody
 */
export async function executeGetLatestInbody(
  ctx: ToolExecutorContext
): Promise<AIToolResult<InBodyRecord | null>> {
  const { data, error } = await ctx.supabase
    .from('inbody_records')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    return { success: false, error: '인바디 기록을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: toInBodyRecord(data as DbInBodyRecord),
  };
}

/**
 * get_inbody_history
 */
export async function executeGetInbodyHistory(
  ctx: ToolExecutorContext,
  args: { limit: number | null }
): Promise<AIToolResult<InBodyRecord[]>> {
  const limit = args.limit ?? 5;

  const { data, error } = await ctx.supabase
    .from('inbody_records')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: '인바디 이력을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: (data as DbInBodyRecord[]).map(toInBodyRecord),
  };
}

/**
 * get_current_routine
 */
export async function executeGetCurrentRoutine(
  ctx: ToolExecutorContext
): Promise<AIToolResult<unknown | null>> {
  // TODO: routines 테이블 구현 후 활성화
  // 현재는 null 반환
  return {
    success: true,
    data: null,
  };
}
