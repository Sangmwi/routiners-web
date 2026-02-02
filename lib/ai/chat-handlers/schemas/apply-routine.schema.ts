/**
 * apply_routine 도구 인자 스키마
 */

import { z } from 'zod';

export const ApplyRoutineArgsSchema = z.object({
  preview_id: z.string().min(1, 'preview_id는 필수입니다'),
});

export type ApplyRoutineArgs = z.infer<typeof ApplyRoutineArgsSchema>;
