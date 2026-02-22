/**
 * Meal Plan Executors
 *
 * 식단 미리보기, 적용 관련 실행 함수
 * routine.ts와 병렬 구조
 */

import type { AIToolResult } from '@/lib/types';
import type {
  MealPlanPreviewData,
  MealPreviewWeek,
  MealPreviewDay,
  MealPreviewMeal,
  MealPreviewFoodItem,
  MealPlanConflict,
  MealPlanApplyResult,
  MealData,
  Meal,
  FoodItem,
  MealType,
} from '@/lib/types/meal';
import type { EventType } from '@/lib/types/routine';
import { formatDate, checkEventDateConflicts, getRoutineStartDate, getMondayOfWeek } from '../tool-utils';
import { insertEventsWithConflictCheck, updateConversationApplied, type EventInsertData } from '../event-factory';
import type { ToolExecutorContext } from './types';

// ============================================================================
// Helper Functions
// ============================================================================

/** 기본 식사 시간 */
const DEFAULT_MEAL_TIMES: Record<MealType, string> = {
  breakfast: '07:00',
  lunch: '12:00',
  dinner: '18:00',
  snack: '15:00',
};

const MEAL_PREVIEW_LOOKUP_LIMIT = 50;

export interface MealPreviewMessageLookup {
  messageId: string;
  metadata: { status?: string } | null;
  previewData: MealPlanPreviewData;
}

export interface AppliedMealMetadataParams {
  previewId: string;
  messageId: string;
  eventsCreated?: number;
  startDate?: string;
  appliedAt: string;
}

/**
 * chat_messages metadata에서 상태를 안전하게 읽습니다.
 */
export function getMealPreviewStatus(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const status = (metadata as { status?: unknown }).status;
  return typeof status === 'string' ? status : undefined;
}

/**
 * conversation metadata에 meal 적용 결과를 누적합니다.
 */
export function buildAppliedMealConversationMetadata(
  existingMetadata: Record<string, unknown> | null | undefined,
  params: AppliedMealMetadataParams,
): Record<string, unknown> {
  return {
    ...(existingMetadata ?? {}),
    activePurpose: null,
    applied_meal_plan: {
      previewId: params.previewId,
      messageId: params.messageId,
      eventsCreated: params.eventsCreated,
      startDate: params.startDate,
      appliedAt: params.appliedAt,
    },
  };
}

/**
 * preview_id와 일치하는 meal_preview 메시지를 최근순으로 탐색합니다.
 */
export async function findMealPreviewMessageById(
  supabase: ToolExecutorContext['supabase'],
  conversationId: string,
  previewId: string,
): Promise<AIToolResult<MealPreviewMessageLookup>> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, content, metadata, created_at')
    .eq('conversation_id', conversationId)
    .eq('content_type', 'meal_preview')
    .order('created_at', { ascending: false })
    .limit(MEAL_PREVIEW_LOOKUP_LIMIT);

  if (error || !data || data.length === 0) {
    return {
      success: false,
      error: '식단 미리보기 데이터를 찾을 수 없습니다. 다시 식단을 생성해 주세요.',
    };
  }

  for (const message of data as Array<{ id: string; content: string; metadata: unknown }>) {
    try {
      const previewData = JSON.parse(message.content) as MealPlanPreviewData;
      if (previewData.id === previewId) {
        return {
          success: true,
          data: {
            messageId: message.id,
            metadata:
              message.metadata && typeof message.metadata === 'object'
                ? (message.metadata as { status?: string })
                : null,
            previewData,
          },
        };
      }
    } catch {
      // Ignore broken rows and keep scanning recent previews.
    }
  }

  return {
    success: false,
    error: '미리보기 ID가 일치하지 않습니다.',
  };
}

/**
 * MealPreviewFoodItem → FoodItem 변환
 */
function convertPreviewFood(food: MealPreviewFoodItem, index: number): FoodItem {
  return {
    id: `food-${index}`,
    name: food.name,
    portion: food.portion,
    calories: food.calories,
  };
}

/**
 * MealPreviewMeal → Meal 변환
 */
function convertPreviewMeal(previewMeal: MealPreviewMeal): Meal {
  return {
    type: previewMeal.type,
    time: DEFAULT_MEAL_TIMES[previewMeal.type],
    foods: previewMeal.foods.map((f, i) => convertPreviewFood(f, i)),
    totalCalories: previewMeal.totalCalories,
  };
}

/**
 * 식단 미리보기를 routine_events INSERT 데이터로 변환
 */
function convertMealPlanToEvents(
  previewData: MealPlanPreviewData,
  userId: string,
  conversationId: string,
  weekCount?: number
): Array<{
  user_id: string;
  type: EventType;
  date: string;
  title: string;
  data: MealData;
  rationale: string | null;
  status: 'scheduled';
  source: 'ai';
  ai_session_id: string;
}> {
  const events: Array<{
    user_id: string;
    type: EventType;
    date: string;
    title: string;
    data: MealData;
    rationale: string | null;
    status: 'scheduled';
    source: 'ai';
    ai_session_id: string;
  }> = [];

  // 적용할 주차: 1주 데이터를 weekCount번 복제
  let weeksToApply: MealPreviewWeek[];
  if (previewData.weeks.length === 1) {
    const baseWeek = previewData.weeks[0];
    const count = weekCount || 1;
    weeksToApply = Array.from({ length: count }, (_, i) => ({
      ...baseWeek,
      weekNumber: i + 1,
      days: baseWeek.days.map(day => ({ ...day })),
    }));
  } else {
    weeksToApply = weekCount
      ? previewData.weeks.slice(0, weekCount)
      : previewData.weeks;
  }

  if (weeksToApply.length === 0) return events;

  // 7일 식단이므로 모든 요일이 target
  const targetDays = weeksToApply[0].days.map(d => d.dayOfWeek);
  const routineStartDate = getRoutineStartDate(targetDays);
  const baseMonday = getMondayOfWeek(routineStartDate);

  weeksToApply.forEach((week, weekIndex) => {
    week.days.forEach((day) => {
      const dayOffset = (day.dayOfWeek - 1) + (weekIndex * 7);
      const eventDate = new Date(baseMonday);
      eventDate.setDate(baseMonday.getDate() + dayOffset);

      // 오늘 이전 날짜는 건너뛰기
      if (eventDate < routineStartDate) return;

      const mealData: MealData = {
        meals: day.meals.map(convertPreviewMeal),
        targetCalories: previewData.targetCalories,
        targetProtein: previewData.targetProtein,
        estimatedTotalCalories: day.totalCalories,
      };

      events.push({
        user_id: userId,
        type: 'meal',
        date: formatDate(eventDate),
        title: day.title || `${previewData.title} - ${day.dayOfWeek}일`,
        data: mealData,
        rationale: day.notes || null,
        status: 'scheduled',
        source: 'ai',
        ai_session_id: conversationId,
      });
    });
  });

  return events;
}

// ============================================================================
// Executors
// ============================================================================

/**
 * generate_meal_plan_preview
 *
 * AI가 생성한 식단 미리보기 데이터 생성 (DB 저장 없음)
 * 프론트엔드에서 meal_preview SSE 이벤트로 UI 표시
 */
export function executeGenerateMealPlanPreview(
  args: {
    title: string;
    description: string;
    duration_weeks: number;
    target_calories: number;
    target_protein: number;
    weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayOfWeek: number;
        title?: string;
        meals: Array<{
          type: MealType;
          foods: Array<{
            name: string;
            portion: string;
            calories?: number;
          }>;
          totalCalories?: number;
        }>;
        totalCalories?: number;
        notes?: string;
      }>;
    }>;
  },
  toolCallId: string
): AIToolResult<MealPlanPreviewData> {
  const previewId = `meal-preview-${toolCallId}`;

  const weeks: MealPreviewWeek[] = args.weeks.map((week) => ({
    weekNumber: week.weekNumber,
    days: week.days.map((day): MealPreviewDay => ({
      dayOfWeek: day.dayOfWeek,
      title: day.title,
      meals: day.meals.map((meal): MealPreviewMeal => ({
        type: meal.type,
        foods: meal.foods.map((food): MealPreviewFoodItem => ({
          name: food.name,
          portion: food.portion,
          calories: food.calories,
        })),
        totalCalories: meal.totalCalories,
      })),
      totalCalories: day.totalCalories,
      notes: day.notes,
    })),
  }));

  const previewData: MealPlanPreviewData = {
    id: previewId,
    title: args.title,
    description: args.description,
    durationWeeks: 1,
    targetCalories: args.target_calories,
    targetProtein: args.target_protein,
    weeks,
    rawMealData: {
      title: args.title,
      description: args.description,
      duration_weeks: 1,
      target_calories: args.target_calories,
      target_protein: args.target_protein,
      weeks: args.weeks,
    },
  };

  return { success: true, data: previewData };
}

/**
 * 식단 날짜 충돌 체크
 */
export async function checkMealDateConflicts(
  ctx: ToolExecutorContext,
  previewData: MealPlanPreviewData
): Promise<MealPlanConflict[]> {
  return checkEventDateConflicts(ctx, previewData, 'meal');
}

/**
 * apply_meal_plan
 *
 * 미리보기 데이터를 실제 DB에 저장
 */
export async function executeApplyMealPlan(
  ctx: ToolExecutorContext,
  previewData: MealPlanPreviewData,
  weekCount?: number,
  conflictStrategy?: 'error' | 'overwrite'
): Promise<AIToolResult<MealPlanApplyResult>> {
  try {
    const events = convertMealPlanToEvents(
      previewData,
      ctx.userId,
      ctx.conversationId,
      weekCount
    );

    if (events.length === 0) {
      return { success: false, error: '생성할 식단 이벤트가 없습니다.' };
    }

    const insertResult = await insertEventsWithConflictCheck(
      ctx,
      events as EventInsertData[],
      'meal',
      conflictStrategy || 'overwrite'
    );

    if (!insertResult.success) {
      return { success: false, error: insertResult.error };
    }

    await updateConversationApplied(ctx.supabase, ctx.conversationId);

    return {
      success: true,
      data: {
        saved: true,
        eventsCreated: insertResult.eventsCreated!,
        startDate: insertResult.startDate!,
      },
    };
  } catch (err) {
    console.error('[apply_meal_plan] Unexpected error:', err);
    return { success: false, error: '식단 적용 중 오류가 발생했습니다.' };
  }
}
