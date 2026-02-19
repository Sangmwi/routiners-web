/**
 * Process Rules Registry
 *
 * 프로세스별 규칙 레지스트리
 * 새 프로세스 추가 시 여기에 등록
 */

import { ROUTINE_PROCESS_RULES } from './routine-generation';
import { ROUTINE_MODIFICATION_RULES } from './routine-modification';
import { QUICK_ROUTINE_RULES } from './quick-routine';

export const PROCESS_RULES: Record<string, string> = {
  routine_generation: ROUTINE_PROCESS_RULES,
  routine_modification: ROUTINE_MODIFICATION_RULES,
  quick_routine: QUICK_ROUTINE_RULES,
};
