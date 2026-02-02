/**
 * generate_routine_preview 도구 인자 스키마
 *
 * Phase 21-A: 복잡한 nested 구조 검증
 */

import { z } from 'zod';

/** 운동 스키마 */
const ExerciseSchema = z.object({
  name: z.string().min(1, '운동 이름은 필수입니다'),
  sets: z.number().int().min(1, 'sets는 1 이상이어야 합니다'),
  reps: z.string().min(1, 'reps는 필수입니다'),
  rest: z.string().min(1, 'rest는 필수입니다'),
  notes: z.string().optional(),
});

/** 운동일 스키마 */
const DaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7, 'dayOfWeek는 1-7 범위여야 합니다'),
  title: z.string().min(1, '운동일 제목은 필수입니다'),
  exercises: z.array(ExerciseSchema).min(1, '운동은 최소 1개 필요합니다'),
  estimatedDuration: z.number().int().positive().optional(),
});

/** 주차 스키마 */
const WeekSchema = z.object({
  weekNumber: z.number().int().positive('weekNumber는 양수여야 합니다'),
  days: z.array(DaySchema).min(1, 'days는 최소 1개 필요합니다'),
});

export const GenerateRoutinePreviewArgsSchema = z
  .object({
    title: z.string().min(1, '루틴 제목은 필수입니다'),
    description: z.string().min(1, '루틴 설명은 필수입니다'),
    duration_weeks: z.number().int().min(1).max(4, 'duration_weeks는 1-4 범위여야 합니다'),
    days_per_week: z.number().int().min(1).max(7, 'days_per_week는 1-7 범위여야 합니다'),
    weeks: z.array(WeekSchema).min(1, 'weeks는 최소 1개 필요합니다'),
  })
  .superRefine((data, ctx) => {
    // weeks는 1개여야 함 (시스템이 4주로 확장)
    if (data.weeks.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `weeks 배열은 정확히 1개여야 합니다 (현재: ${data.weeks.length}). 시스템이 자동으로 4주로 확장합니다.`,
        path: ['weeks'],
      });
    }
    // days_per_week와 days 배열 길이 일치 검증
    data.weeks.forEach((week, idx) => {
      if (week.days.length !== data.days_per_week) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `days_per_week(${data.days_per_week})와 week ${idx + 1}의 days 길이(${week.days.length})가 일치하지 않습니다`,
          path: ['weeks', idx, 'days'],
        });
      }
    });
  });

export type GenerateRoutinePreviewArgs = z.infer<typeof GenerateRoutinePreviewArgsSchema>;
