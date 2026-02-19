/**
 * set_active_purpose 도구 인자 스키마
 *
 * Phase 21-B: 신규 추가
 */

import { z } from 'zod';

export const SetActivePurposeArgsSchema = z.object({
  purposeType: z.enum(['routine_generation', 'routine_modification', 'quick_routine']),
});

export type SetActivePurposeArgs = z.infer<typeof SetActivePurposeArgsSchema>;
