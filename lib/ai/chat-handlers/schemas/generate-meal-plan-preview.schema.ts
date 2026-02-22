/**
 * Args schema for generate_meal_plan_preview
 *
 * Contract enforced:
 * - 1 week preview only
 * - Each week has exactly 7 days
 * - dayOfWeek covers 1..7 exactly once
 * - Each meal has at least 2 foods
 * - Each food requires calories
 */

import { z } from 'zod';

const MealPreviewFoodSchema = z.object({
  name: z.string().min(1),
  portion: z.string().min(1),
  calories: z.number().int().nonnegative(),
});

const MealPreviewMealSchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foods: z.array(MealPreviewFoodSchema).min(2),
  totalCalories: z.number().int().optional(),
});

const MealPreviewDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  title: z.string().optional(),
  meals: z.array(MealPreviewMealSchema).min(1),
  totalCalories: z.number().int().optional(),
  notes: z.string().optional(),
});

const MealPreviewWeekSchema = z.object({
  weekNumber: z.number().int().min(1),
  days: z.array(MealPreviewDaySchema).length(7),
});

export const GenerateMealPlanPreviewArgsSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    duration_weeks: z.literal(1),
    target_calories: z.number().int().positive(),
    target_protein: z.number().int().positive(),
    weeks: z.array(MealPreviewWeekSchema).length(1),
  })
  .superRefine((data, ctx) => {
    const daySet = new Set(data.weeks[0]?.days.map((day) => day.dayOfWeek) ?? []);
    const allDaysCovered = [1, 2, 3, 4, 5, 6, 7].every((dayOfWeek) => daySet.has(dayOfWeek));

    if (daySet.size !== 7 || !allDaysCovered) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'days must include each dayOfWeek value from 1 to 7 exactly once in the single preview week.',
        path: ['weeks', 0, 'days'],
      });
    }
  });

export type GenerateMealPlanPreviewArgs = z.infer<typeof GenerateMealPlanPreviewArgsSchema>;

