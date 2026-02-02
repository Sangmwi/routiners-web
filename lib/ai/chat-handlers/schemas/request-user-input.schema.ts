/**
 * request_user_input 도구 인자 스키마
 *
 * Phase 20: superRefine으로 조건부 검증
 */

import { z } from 'zod';

const InputRequestOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const SliderConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number(),
  unit: z.string(),
  defaultValue: z.number().optional(),
});

export const RequestUserInputArgsSchema = z
  .object({
    message: z.string().optional(),
    type: z.enum(['radio', 'checkbox', 'slider']),
    options: z.array(InputRequestOptionSchema).nullable().optional(),
    sliderConfig: SliderConfigSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // radio/checkbox는 options 필수
    if (
      (data.type === 'radio' || data.type === 'checkbox') &&
      (!data.options || data.options.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `type이 "${data.type}"일 때 options 배열은 필수입니다`,
        path: ['options'],
      });
    }
    // slider는 sliderConfig 필수
    if (data.type === 'slider' && !data.sliderConfig) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'type이 "slider"일 때 sliderConfig는 필수입니다',
        path: ['sliderConfig'],
      });
    }
  });

export type RequestUserInputArgs = z.infer<typeof RequestUserInputArgsSchema>;
