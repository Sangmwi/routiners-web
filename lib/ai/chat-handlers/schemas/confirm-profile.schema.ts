/**
 * confirm_profile_data 도구 인자 스키마
 *
 * Phase 21-B: 필드 검증 강화
 */

import { z } from 'zod';

const ProfileFieldSchema = z.object({
  key: z.string().min(1, 'key는 필수입니다'),
  label: z.string().min(1, 'label은 필수입니다'),
  value: z.string(),
  displayValue: z.string().min(1, 'displayValue는 필수입니다'),
});

export const ConfirmProfileArgsSchema = z.object({
  title: z.string().min(1, 'title은 필수입니다'),
  description: z.string().optional(),
  fields: z.array(ProfileFieldSchema).min(1, 'fields는 최소 1개 이상 필요합니다'),
});

export type ConfirmProfileArgs = z.infer<typeof ConfirmProfileArgsSchema>;
